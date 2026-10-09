import { describe, expect, it } from 'vitest';
import { buildSummary, handoffLinks, makeRef, submitRequest } from './request';

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
  const ok = (async () => new Response('{}', { status: 200 })) as typeof fetch;
  const bad = (async () => new Response('no', { status: 500 })) as typeof fetch;
  const down = (async () => { throw new TypeError('network'); }) as typeof fetch;

  it('is honest when no endpoint is configured', async () => {
    expect(await submitRequest('contact', 'R1', [...fields], 't', { endpoint: '' })).toEqual({ status: 'unconfigured', ref: 'R1' });
  });
  it('reports sent only on 2xx', async () => {
    expect((await submitRequest('quote', 'R2', [...fields], 't', { endpoint: 'https://x.test', fetchImpl: ok })).status).toBe('sent');
    expect((await submitRequest('quote', 'R3', [...fields], 't', { endpoint: 'https://x.test', fetchImpl: bad })).status).toBe('failed');
    expect((await submitRequest('quote', 'R4', [...fields], 't', { endpoint: 'https://x.test', fetchImpl: down })).status).toBe('failed');
  });
});
