import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { buildSummary, handoffLinks, makeRef, normalizeRef, submitRequest } from './request';

const fields = [['ชื่อ', 'สมชาย'], ['เบอร์โทร', '081-234-5678'], ['หมายเหตุ', '  ']] as const;

describe('makeRef', () => {
  it('uses the Buddhist-era date in Bangkok time', () => {
    // 2026-10-08 20:30 UTC = 2026-10-09 03:30 in Bangkok → 691009
    expect(makeRef(new Date('2026-10-08T20:30:00Z'))).toMatch(/^SBP-691009-[0-9A-Z]{4}$/);
  });
});

describe('buildSummary', () => {
  it('skips empty fields and keeps the reference on top', () => {
    const t = buildSummary('contact', 'SBP-691009-AAAA', [...fields]);
    expect(t.split('\n')[1]).toBe('เลขอ้างอิง SBP-691009-AAAA');
    expect(t).toContain('ชื่อ: สมชาย');
    expect(t).not.toContain('หมายเหตุ');
  });
});

describe('handoffLinks', () => {
  it('builds LINE and e-mail links with the summary', () => {
    const l = handoffLinks('quote', 'SBP-1', 'สวัสดี');
    expect(l.line).toContain('oaMessage');
    expect(l.mail).toContain(encodeURIComponent('ขอใบเสนอราคา SBP-1'));
    expect(l.tel).toBe('tel:024593299');
  });
});

describe('submitRequest', () => {
  const URL = 'https://forms.example.test/submit';
  const SCRIPT = 'https://script.google.com/macros/s/AKfy-test/exec';
  /** fetch that answers with this body and status, recording what was sent. */
  const answer = (body: string, status = 200) => {
    const calls: { url: string; init: RequestInit }[] = [];
    const impl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;
    return { impl, calls };
  };
  const send = (fetchImpl: typeof fetch, endpoint = URL, timeoutMs?: number) =>
    submitRequest('quote', 'SBP-691009-AB12', [...fields], 'สรุป', { endpoint, fetchImpl, timeoutMs });

  it('is honest when no endpoint is configured', async () => {
    expect(await submitRequest('contact', 'R1', [...fields], 't', { endpoint: '' })).toEqual({ status: 'unconfigured', ref: 'R1' });
  });

  it('posts the request as a CORS simple request (text/plain JSON) with the agreed shape', async () => {
    const { impl, calls } = answer('{"ok":true,"ref":"SBP-691009-AB12"}');
    await send(impl);
    expect(calls).toHaveLength(1);
    const { url, init } = calls[0];
    expect(url).toBe(URL);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('text/plain;charset=utf-8');
    expect(JSON.parse(String(init.body))).toEqual({
      kind: 'quote',
      ref: 'SBP-691009-AB12',
      fields: { ชื่อ: 'สมชาย', เบอร์โทร: '081-234-5678', หมายเหตุ: '  ' },
      text: 'สรุป',
      _subject: 'ขอใบเสนอราคา SBP-691009-AB12',
    });
  });

  it('reports sent for JSON {ok:true}', async () => {
    expect(await send(answer('{"ok":true,"ref":"SBP-691009-AB12"}').impl)).toEqual({ status: 'sent', ref: 'SBP-691009-AB12' });
    expect((await send(answer('{"ok":true}').impl)).status).toBe('sent'); // other form services do not echo the ref
    expect((await send(answer('{"ok":true,"ref":"SBP-691009-AB12","duplicate":true}').impl, SCRIPT)).status).toBe('sent');
  });

  it('from Apps Script, needs {ok:true} naming this ref (the doGet health check or another ref is no proof)', async () => {
    for (const body of ['{"ok":true}', '{"ok":true,"service":"sbp-requests","version":"1.0.0"}', '{"ok":true,"ref":"SBP-691009-ZZZZ"}']) {
      const r = await send(answer(body).impl, SCRIPT);
      expect(r).toEqual({ status: 'failed', ref: 'SBP-691009-AB12', reason: 'ระบบรับคำขอตอบกลับในรูปแบบที่อ่านไม่ได้' });
    }
  });

  it('reports failed with the endpoint message for JSON {ok:false} (Apps Script answers 200 for errors)', async () => {
    const r = await send(answer('{"ok":false,"error":"เลขอ้างอิงไม่ถูกต้อง"}').impl, SCRIPT);
    expect(r).toEqual({ status: 'failed', ref: 'SBP-691009-AB12', reason: 'เลขอ้างอิงไม่ถูกต้อง' });
    // no message → a plain fallback, never an empty reason
    const r2 = await send(answer('{"ok":false}').impl);
    expect(r2.status).toBe('failed');
    expect(r2.status === 'failed' && r2.reason).toBeTruthy();
  });

  it('accepts a non-JSON or ok-less 2xx from other form services', async () => {
    expect((await send(answer('Thank you!').impl)).status).toBe('sent');
    expect((await send(answer('').impl)).status).toBe('sent');
    expect((await send(answer('{}').impl)).status).toBe('sent');
  });

  it('does not trust a non-JSON 2xx from Apps Script (sign-in or error page)', async () => {
    const r = await send(answer('<!doctype html><title>Sign in</title>').impl, SCRIPT);
    expect(r.status).toBe('failed');
    expect((await send(answer('{}').impl, SCRIPT)).status).toBe('failed');
  });

  it('keeps the Apps Script rule however the URL was pasted, or when the answer came from Google', async () => {
    const page = '<!doctype html><title>Sign in</title>';
    // a repository variable pasted with a space or a line break, or written in capitals (fetch still reaches Google)
    for (const endpoint of [` ${SCRIPT}`, `${SCRIPT}\n`, SCRIPT.toUpperCase().replace('/MACROS/S/AKFY-TEST/EXEC', '/macros/s/AKfy-test/exec')]) {
      expect((await send(answer(page).impl, endpoint)).status).toBe('failed');
    }
    // a page that Google answered through another address (proxy, custom domain): the final URL tells
    const viaGoogle = (async () => {
      const res = new Response(page, { status: 200 });
      Object.defineProperty(res, 'url', { value: 'https://script.googleusercontent.com/macros/echo?user_content_key=x' });
      return res;
    }) as unknown as typeof fetch;
    expect((await send(viaGoogle)).status).toBe('failed');
  });

  it('follows the Apps Script redirect: POST /exec → 302 → GET the answer (real fetch, local server)', async () => {
    const seen: string[] = [];
    const server = createServer((req, res) => {
      seen.push(`${req.method} ${req.url}`);
      if (req.url === '/macros/s/X/exec') {
        req.resume();
        res.writeHead(302, { Location: '/macros/echo?user_content_key=k' }).end();
      } else res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"ok":true,"ref":"SBP-691009-AB12"}');
    });
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    try {
      const { port } = server.address() as AddressInfo;
      const r = await submitRequest('quote', 'SBP-691009-AB12', [...fields], 'สรุป', { endpoint: `http://127.0.0.1:${port}/macros/s/X/exec` });
      expect(r).toEqual({ status: 'sent', ref: 'SBP-691009-AB12' });
      expect(seen).toEqual(['POST /macros/s/X/exec', 'GET /macros/echo?user_content_key=k']);
    } finally {
      await new Promise(done => server.close(done));
    }
  });

  it('reports failed on a non-2xx answer', async () => {
    const r = await send(answer('no', 500).impl);
    expect(r).toEqual({ status: 'failed', ref: 'SBP-691009-AB12', reason: 'ระบบรับคำขอตอบกลับไม่สำเร็จ (500)' });
    expect((await send(answer('{"ok":true}', 404).impl)).status).toBe('failed');
  });

  it('reports failed when the network is down', async () => {
    const down = (async () => {
      throw new TypeError('network');
    }) as typeof fetch;
    expect(await send(down)).toEqual({ status: 'failed', ref: 'SBP-691009-AB12', reason: 'เชื่อมต่อระบบรับคำขอไม่ได้' });
  });

  it('gives up after the timeout and says so', async () => {
    // a fetch that never answers, but stops when the request is aborted (as a real fetch does)
    const hang = ((_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      })) as unknown as typeof fetch;
    expect(await send(hang, URL, 20)).toEqual({ status: 'failed', ref: 'SBP-691009-AB12', reason: 'ระบบรับคำขอไม่ตอบกลับในเวลาที่กำหนด' });
  });
});

describe('normalizeRef', () => {
  it('reads a reference typed loosely and rejects anything else', () => {
    expect(normalizeRef(' sbp-691011-k7q2 ')).toBe('SBP-691011-K7Q2');
    expect(normalizeRef('SBP 691011 K7Q2')).toBe('SBP-691011-K7Q2');
    expect(normalizeRef('SBP–691011–K7Q2')).toBe('SBP-691011-K7Q2');
    expect(normalizeRef('691011-K7Q2')).toBe('');
    expect(normalizeRef('')).toBe('');
  });
});
