// Parity fixtures: run the REFERENCE prototype's business modules in node and record their outputs for a broad grid of
// inputs → src/lib/domain/__fixtures__/parity.json. The vitest suite (src/lib/domain/parity.test.ts) asserts that the
// TypeScript port in src/lib/domain reproduces every value exactly.
//
//   node scripts/ref-parity.mjs [path/to/sbp-aircare/assets]
//
// The reference folder is read-only (never edited). Its modules load the Pricebook / address book from
// globalThis.__SBP_DATA / __SBP_ADDR (single-file build hook), so we set both from data/ before importing.
// Parts of the reference that only exist inside DOM closures (quickclean.js `lines()` / drawSum) are reproduced here with
// the reference's own exported functions and constants (LEVEL_TH / TYPES_QC are read from its source text).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REF = resolve(process.argv[2] || '/home/user/sahaburapaofficial-cmyk/sahaburapa-project/sbp-aircare/assets');
const OUT = resolve(ROOT, 'src/lib/domain/__fixtures__/parity.json');

/* ---------- minimal browser stubs ---------- */
globalThis.__SBP_DATA = JSON.parse(readFileSync(resolve(ROOT, 'data/pricebook.json'), 'utf8'));
globalThis.__SBP_ADDR = JSON.parse(readFileSync(resolve(ROOT, 'data/th-address.json'), 'utf8'));
const mem = {};
globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
globalThis.location = { pathname: '/a.html', hash: '', hostname: 'localhost' };
globalThis.Image = class { set src(v) {} };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

const imp = m => import(resolve(REF, m));
const core = await imp('sbp-core.js');
await core.loadData();
const R = await imp('rates.js');
const Q = await imp('queue.js');
const C = await imp('commerce.js');
const QC = await imp('quickclean.js');
const COSTS = await imp('costs.js');
const TI = await imp('tradein.js');
const SM = await imp('studio-model.js');
const D = core.DATA;

// constants that the reference keeps inside module scope — read from its source text, never retyped
const qcSrc = readFileSync(resolve(REF, 'quickclean.js'), 'utf8');
const lit = (src, name) => {
  const m = new RegExp(`const ${name} = ([\\[{][\\s\\S]*?[\\]}]);\\n`).exec(src);
  if (!m) throw new Error(`cannot read ${name}`);
  return (0, eval)('(' + m[1] + ')');
};
const LEVEL_TH = lit(qcSrc, 'LEVEL_TH');
const TYPES_QC = lit(qcSrc, 'TYPES_QC');

/* ---------- helpers ---------- */
// long texts are stored as a digest to keep the fixture small (the test digests the port's text the same way)
const T = s => (typeof s === 'string' && s.length > 60 ? 'sha1:' + createHash('sha1').update(s).digest('hex').slice(0, 20) : s);
const clone = x => JSON.parse(JSON.stringify(x, (k, v) => (v === Infinity ? 'Infinity' : v instanceof RegExp ? v.source : v)));
const out = { meta: { by: 'scripts/ref-parity.mjs', ref: 'sbp-aircare/assets (Rev.28)', pricebook: D.version, minBill: D.minBill } };

/* ---------- constants ---------- */
out.constants = clone({
  VAT: core.VAT, EX_TH: core.EX_TH, TYPES: core.TYPES.map(t => Object.fromEntries(Object.entries(t).filter(([k]) => k !== 'color'))), TRAVEL: core.TRAVEL, TIER_TH: core.TIER_TH, HQ: core.HQ,
  QUEUE_RULES: core.QUEUE_RULES, VOLUME_HINT: core.VOLUME_HINT, VOLUME_LEVELS: core.VOLUME_LEVELS, PRICING: core.PRICING, PRESETS: core.PRESETS,
  CLEAN_PKGS: core.CLEAN_PKGS, SIZE_BANDS: core.SIZE_BANDS, JOB_TIME: core.JOB_TIME, TIME_NOTE: core.TIME_NOTE, VRF_NOTE: core.VRF_NOTE,
  CONTACT_TOPICS: core.CONTACT_TOPICS, PROCESS: core.PROCESS, SERVICES: core.SERVICES, PRICE_BANDS: core.PRICE_BANDS, BTU_BANDS: core.BTU_BANDS,
  COMPANY: core.COMPANY,
  DECIDED: R.DECIDED, MOVE: R.MOVE, MOVE_TH: R.MOVE_TH, MOVE_REPLACES: R.MOVE_REPLACES, SMALL_VISIT: R.SMALL_VISIT, RATE_SOURCES: R.RATE_SOURCES, RATE_DATE: R.RATE_DATE,
  SLOTS: Q.SLOTS, LEAD_DAYS: Q.LEAD_DAYS, RUSH_FEE_EX: Q.RUSH_FEE_EX, DAY_FROM: Q.DAY_FROM, DAY_TO: Q.DAY_TO, DAY_MIN: Q.DAY_MIN,
  PKG_TH: QC.PKG_TH, LEVEL_TH, TYPES_QC, PKG_INFO: C.PKG_INFO, METHOD_INFO: C.METHOD_INFO, MAT_ROWS: C.MAT_ROWS,
  TRADE_IN: TI.TRADE_IN, ISSUES: TI.ISSUES,
  STUDIO: { ORIENT: SM.ORIENT, GLASS: SM.GLASS, ROOF_F: SM.ROOF_F, CLOSED_F: SM.CLOSED_F, TYPE_RULES: SM.TYPE_RULES, STD_SIZES: SM.STD_SIZES },
});

/* ---------- Pricebook as loaded ---------- */
out.catalog = {
  skuCount: core.DEMO.skuCount,
  series: core.DEMO.models.map(m => ({
    id: m.id, code: m.code, brand: m.brand, type: m.type, inverter: m.inverter, label: m.label, series: m.series,
    skus: m.skus.map(s => [s.sku, s.btu, s.px, s.price, s.installStdEx]),
    spec: m.skus.map(s => T(JSON.stringify([s.d.series, s.d.system, s.d.refrigerant, s.d.pipeLiquid, s.d.pipeGas, s.d.indoorDim, s.d.indoorKg, s.d.outdoorDim, s.d.outdoorKg, s.d.power, s.d.compressor, s.d.warranty, s.d.lead, s.d.outdoorModel, s.d.maxPipe, s.d.maxLift, s.d.approved]))),
  })),
};
out.brands = core.BRANDS.map(b => [b.id, b.name, b.n, !!b.own]);
out.inst = D.inst.map(i => [i.code, i.cat, i.name, i.unit, i.ex, i.inc, i.exc, i.warranty, i.survey, i.decided ?? null].map(T));
out.clean = D.clean.map(r => [r.pkg, r.level, r.ty, r.type, r.range, r.unit, r.rate.s, r.rate.pb, r.warranty, r.care, r.doc, r.inc, r.exc, r.status, r.name].map(T));
out.rep = D.rep.map(r => [r.cat, r.name, r.unit, r.rate.s, r.rate.pb, r.warranty, r.inc, r.exc, r.status].map(T));
out.headline = { cleanFrom: QC.cleanFrom(), services: core.SERVICES.map(s => ({ id: s.id, from: s.from })) };

/* ---------- product page: install options, add-ons, materials, pipe bundle ---------- */
const TYPE_IDS = core.TYPES.map(t => t.id);
const BTUS = [7000, 9000, 9500, 12000, 13000, 15000, 17000, 18000, 20000, 24000, 25000, 30000, 33000, 36000, 40000, 48000, 55000, 60000, 61000, 80000];
out.installOptions = [];
out.addonsFor = [];
out.materialMatrix = [];
out.pipeBundle = [];
const BTUS_FEW = [9000, 12000, 18000, 24000, 36000, 48000, 60000, 80000];
for (const t of TYPE_IDS) for (const btu of BTUS) {
  out.installOptions.push({ type: t, btu, out: core.installOptions(t, btu).map(o => [o.key, o.th, o.note, o.item.code, o.item.ex]) });
  if (!BTUS_FEW.includes(btu)) continue;
  out.addonsFor.push({ type: t, btu, out: core.addonsFor(t, btu).map(g => ({ group: g.group, items: g.items.map(a => ({ codes: (a.choose || [a.item]).map(x => x && x.code), qty: a.qty, note: a.note ?? null })) })) });
  out.materialMatrix.push({ type: t, btu, out: C.materialMatrix(t, btu).map(c => ({ key: c.key, th: c.th, code: c.item.code, cell: T(JSON.stringify(c.cell)) })) });
}
for (const btu of BTUS) {
  const pb = COSTS.pipeBundle(COSTS.pipeItemFor('wall', btu));
  out.pipeBundle.push({ btu, out: pb && { code: pb.item.code, parts: pb.parts, sum: pb.sum ?? null } });
}
out.packageParts = D.inst.filter(i => /^INS-/.test(i.code)).map(i => [i.code, T(JSON.stringify(COSTS.packageParts(i)))]);
out.optionNote = D.inst.map(i => [i.code, COSTS.optionNote(i.code)]).filter(([, n]) => n);

/* ---------- catalog queries ---------- */
const F = o => ({ ...core.emptyFilter(), ...o, type: new Set(o.type || []), brand: new Set(o.brand || []), btu: new Set(o.btu || []), price: new Set(o.price || []) });
const FILTERS = [
  {}, { sort: 'price-asc' }, { sort: 'price-desc' }, { sort: 'btu' },
  { q: 'daikin' }, { q: '12000' }, { q: '12,000' }, { q: 'inverter' }, { q: 'ติดผนัง' }, { q: 'r32' }, { q: 'ftkq' }, { q: 'carrier' }, { q: 'x' }, { q: 'zzzz' },
  { q: 'mitsubishi' }, { q: '9000' }, { q: 'ply-m' }, { q: 'สี่ทิศทาง' }, { q: 'Fixed' }, { q: '36000', sort: 'price-asc' },
  { type: ['wall'] }, { type: ['ceiling', 'cassette'] }, { type: ['floor'], sort: 'price-desc' }, { type: ['duct'] },
  { brand: ['daikin'] }, { brand: ['carrier', 'lg'], sort: 'btu' }, { brand: ['fujiva'] },
  { btu: ['b1'] }, { btu: ['b2', 'b3'] }, { btu: ['b5'], sort: 'price-asc' },
  { price: ['p1'] }, { price: ['p2', 'p3'], sort: 'price-asc' }, { price: ['p5'] },
  { inverter: 'inv' }, { inverter: 'fix', sort: 'price-asc' },
  { type: ['wall'], brand: ['daikin'], btu: ['b1'], price: ['p2'], inverter: 'inv' },
  { q: 'daikin', type: ['wall'], sort: 'price-asc' }, { q: '18000', price: ['p2'], sort: 'price-desc' },
  { type: ['wall'], price: ['p1', 'p2'], inverter: 'inv', sort: 'btu' }, { brand: ['mitsubishi-electric'], btu: ['b4'] },
];
out.queries = FILTERS.map(o => {
  const f = F(o), r = core.queryCatalog(f);
  return { f: o, ids: r.list.map(m => m.id), skuTotal: r.skuTotal, visible: r.list.map(m => r.visibleSkus(m).length), facets: core.facetCounts(f), params: core.filterToParams(f) };
});

/* ---------- address book, zones, travel ---------- */
const A = core.ADDR;
const picks = [];
const step = Math.max(1, Math.floor(A.list.length / 45));
for (let i = 0; i < A.list.length; i += step) { const r = A.list[i]; picks.push({ p: r.p, d: r.d, s: r.s, z: r.z }); }
const dists = [...new Set(A.list.map(r => r.p + '|' + r.d))];
for (let i = 0; i < dists.length; i += Math.max(1, Math.floor(dists.length / 20))) { const [p, d] = dists[i].split('|'); picks.push({ p, d }); }
[...new Set(A.list.map(r => r.p))].forEach(p => picks.push({ p }));
A.other.slice(0, 8).forEach(p => picks.push({ p }));
picks.push({ p: 'กรุงเทพมหานคร', d: 'จอมทอง', s: 'บางมด', z: '10150' }, { p: 'กรุงเทพมหานคร', d: 'ไม่มีเขตนี้' }, { p: 'ไม่มีจังหวัดนี้' }, { p: 'กรุงเทพมหานคร', d: 'จอมทอง', s: 'บางมด', z: '99999' });
out.zones = picks.map(a => ({ pick: a, zone: core.zoneOf(a), th: core.addrTh(a) }));
out.zoneTiers = out.zones.reduce((n, z) => ((n[z.zone ? z.zone.tier : 'null'] = (n[z.zone ? z.zone.tier : 'null'] || 0) + 1), n), {});
const QUERIES = ['บางมด', 'จอมทอง', 'กทม', 'กรุงเทพ', 'กรุงเทพฯ', '10150', '101', '10', 'นนทบุรี', 'เมือง', 'ปากเกร็ด', 'แขวงบางมด', 'เขตจอมทอง', 'ต.บางพูด', 'อ.เมือง', 'สมุทร', 'ชลบุรี', 'เชียงใหม่', 'บาง', 'ลาด', 'x', '', 'abc', '20000', 'บางกะปิ', 'พระนคร'];
out.addrSearch = QUERIES.flatMap(q => [8, 3].map(n => ({ q, n, out: core.addrSearch(q, n) })));
out.checkZone = [...QUERIES, 'ไม่มีที่นี่เลย', 'ก'].map(q => ({ input: q, zone: core.checkZone(q) }));
out.travelFee = [];
for (let km = 0; km <= 200; km += 3) out.travelFee.push([km, core.travelFee(km)]);
[29, 30, 31, 39, 40, 41, 149, 150, 151].forEach(km => out.travelFee.push([km, core.travelFee(km)]));
out.roadKm = [[13.664, 100.44], [13.7563, 100.5018], [13.9, 100.5], [13.5, 100.2], [14.35, 100.57], [12.93, 100.88], [18.79, 98.98], [13.36, 100.98]].map(([la, lo]) => [la, lo, core.roadKm(la, lo)]);
const zCore = out.zones.find(z => z.zone && z.zone.tier === 'core').zone;
const zExt = out.zones.find(z => z.zone && z.zone.tier === 'extended').zone;
const zOut = out.zones.find(z => z.zone && z.zone.tier === 'out').zone;
const zUnk = out.zones.find(z => z.zone && z.zone.tier === 'unknown').zone;
const ZONES = { none: null, core: zCore, ext: zExt, out: zOut, unknown: zUnk };
out.sampleZones = ZONES;
out.jobTravel = [];
for (const [zk, z] of Object.entries(ZONES)) for (const ex of [0, 700, 1400, 4400, 4499, 4500, 9000]) out.jobTravel.push({ zone: zk, cleanEx: ex, out: core.jobTravel(z, ex) });
out.travelNote = Object.entries(ZONES).map(([zk, z]) => ({ zone: zk, out: core.travelNote(z) }));

/* ---------- quotation totals ---------- */
const I = c => D.instByCode[c];
const cl = (key, ex, qty = 1) => ({ kind: 'service', group: 'clean', key, name: key, unitEx: ex, qty });
const add = (code, qty = 1) => ({ kind: I(code).ex == null ? 'survey' : 'addon', group: 'addon', key: `A-${code}`, name: I(code).name, unitEx: I(code).ex, qty });
const ins = (code, qty = 1) => ({ kind: 'service', group: 'install', key: `I-${code}`, name: I(code).name, unitEx: I(code).ex, qty });
const prod = (px, qty = 1) => ({ kind: 'product', group: 'product', key: 'P-x', name: 'แอร์', unitEx: px, qty });
const rep = (name, qty = 1) => { const r = D.rep.find(x => x.name === name); return { kind: r.rate.s == null ? 'survey' : 'service', group: 'repair', key: `R-${name}`, name, unitEx: r.rate.s, qty }; };
const repName = D.rep.find(r => r.cat === 'ตรวจวินิจฉัย').name, repNull = D.rep.find(r => r.rate.s == null).name;
const contract = (ex, units) => ({ kind: 'service', group: 'contract', key: 'K-x', name: 'สัญญา', unitEx: ex, qty: 1, units });
const survey = () => ({ kind: 'survey', group: 'install', key: 'S-INS-VRF-IDU-SURVEY', name: 'สำรวจ', unitEx: null, qty: 1 });
const rush = () => ({ kind: 'service', group: 'rush', src: 'qc', fixed: true, key: 'QC-RUSH', name: 'คิวด่วน', unitEx: Q.RUSH_FEE_EX, qty: 1 });
const CARTS = {
  empty: [],
  oneWall: [cl('QC-Basic Clean-C1-wall-0', 700)],
  fiveWall: [cl('QC-Basic Clean-C1-wall-0', 700, 5)],
  sixWall: [cl('QC-Basic Clean-C1-wall-0', 900, 5)],
  atMin: [cl('QC-Standard Care-C1-wall-0', 900, 5)],
  mixedClean: [cl('QC-Basic Clean-C1-wall-0', 700, 2), cl('QC-Basic Clean-C2-cassette-1', 2400, 1), rush()],
  bigClean: [cl('QC-Corporate Control-C2-ceiling-2', 3000, 4)],
  disposeOnly: [add('DISPOSE')],
  remK: [add('REM-K')],
  smallMix: [add('DISPOSE'), add('CIV-CORE')],
  smallSurvey: [add('ACC-HEIGHT')],
  cleanPlusSmall: [cl('QC-Basic Clean-C1-wall-0', 700), add('DISPOSE')],
  product: [prod(15900)],
  productInstall: [prod(15900, 2), ins('INS-W-9000-12000-STANDARD', 2), add('PIP-PKG-1438', 6), { ...add('LOG-NIGHT'), kind: 'survey', unitEx: null }],
  repair: [rep(repName)],
  repairNull: [rep(repNull), rep(repName)],
  contract: [contract(120000, 30)],
  contractSurvey: [contract(50000, 10), survey()],
  contractClean: [contract(50000, 10), cl('QC-Basic Clean-C1-wall-0', 700)],
  surveyOnly: [survey()],
  rushOnly: [rush()],
  unitsField: [{ ...cl('C-x', 800), units: 3 }, prod(10000, 2), ins('INS-K-18000-24000-PREMIUM', 2)],
};
out.carts = CARTS;
out.quoteTotals = [];
for (const [ck, lines] of Object.entries(CARTS)) for (const [zk, z] of Object.entries(ZONES)) {
  const t = C.quoteTotals(lines, z);
  out.quoteTotals.push({ cart: ck, zone: zk, out: t, units: C.quoteUnits(lines) });
}
out.breakdown = Object.entries(CARTS).map(([ck, lines]) => ({ cart: ck, out: COSTS.breakdown(lines) }));
out.visitLines = Object.entries(CARTS).map(([ck, lines]) => ({ cart: ck, out: C.visitLines(lines) }));

/* ---------- annual contract ---------- */
const ctab = { none: null, core: zCore, ext: zExt };
out.contracts = [];
for (const p of core.PRESETS) for (const pkg of core.CLEAN_PKGS.map(x => x.id)) for (const size of [0, 2, 3]) for (const deep of [true, false]) for (const [zk, z] of Object.entries(ctab)) for (const visits of [1, 3, 4]) {
  const e = core.estimateContract({ units: p.units, visits, zone: z, pkg, size, deep });
  out.contracts.push([`${p.id}|${pkg}|${size}|${deep ? 1 : 0}|${zk}|${visits}`, e.annualEx, e.vat, e.annualInc, e.perVisitC1, e.perVisitC2, e.travel, e.travelLabel, e.minBillApplied, e.perUnitYear, e.teamDaysPerVisit, e.count, visits === 1 && zk === 'none' && deep ? e.lines : null]);
}
const CUSTOM = [
  { units: { wall: 2 }, visits: 3 }, { units: { wall: 1, ceiling: 1 }, visits: 2, pkg: 'Basic Clean' }, { units: { duct: 3, floor: 2 }, visits: 4, size: 1 },
  { units: {}, visits: 3 }, { units: { wall: 0 }, visits: 3 }, { units: { wall: 5 }, visits: 1, deep: true }, { units: { cassette: 12 }, visits: 12, size: 3, pkg: 'Corporate Control' },
  { units: { wall: '3', ceiling: '2' }, visits: 3 }, { units: { wall: 4 }, visits: 3, size: 9 }, { units: { wall: 10 }, visits: 3, high: true },
];
out.contractsCustom = [];
for (const o of CUSTOM) for (const [zk, z] of Object.entries(ctab)) out.contractsCustom.push({ o, zone: zk, out: clone(core.estimateContract({ ...o, zone: z })) });

/* ---------- queue ---------- */
const INSTANTS = ['2026-10-09T00:00:00Z', '2026-10-09T16:59:00Z', '2026-10-09T17:00:00Z', '2026-10-10T01:30:00Z', '2026-10-11T05:00:00Z', '2026-12-31T17:30:00Z', '2027-02-27T23:59:00Z', '2028-02-28T18:00:00Z'];
out.bkkNow = INSTANTS.map(iso => [iso, Q.bkkNow(new Date(iso))]);
out.earliest = [];
for (let i = 0; i < 35; i++) { const d = Q.addDays('2026-10-01', i); out.earliest.push([d, Q.earliestNormal({ date: d, min: 600 }), Q.isOpen(d), Q.dow(d), Q.dateTh(d)]); }
['2026-12-29', '2026-12-30', '2026-12-31', '2027-02-26', '2028-02-26', '2028-02-27'].forEach(d => out.earliest.push([d, Q.earliestNormal({ date: d, min: 0 }), Q.isOpen(d), Q.dow(d), Q.dateTh(d)]));
const LS = { none: [], wall2: [{ t: 'wall', qty: 2 }], mix: [{ t: 'wall', qty: 3 }, { t: 'cassette', qty: 2 }], big: [{ t: 'ceiling', qty: 8 }], unknown: [{ t: null, qty: 2, unknown: true }, { t: 'wall', qty: 1 }], dayish: [{ t: 'wall', qty: 9 }] };
out.judge = [];
for (const nd of ['2026-10-05', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']) for (const min of [480, 720, 1000]) for (const [lk, ls] of Object.entries(LS)) for (const level of ['C1', 'C2']) for (const off of [-1, 0, 1, 2, 3, 4, 6]) {
  if (level === 'C2' && !['mix', 'big'].includes(lk)) continue;
  const date = off === 6 ? '' : Q.addDays(nd, off);
  const J = Q.judge(date, ls, level, { date: nd, min });
  out.judge.push([nd, min, lk, level, date, J.kind, J.rush, J.closed ?? null, J.sameDay ?? null, J.late ?? null, J.earliest, J.slots.join(','), J.fit.kind, J.fit.days, J.fit.unknown ?? null, J.time.join(',')]);
}
out.judgeLines = LS;
out.visitTime = [
  [[{ t: 'wall', qty: 2 }], 'C1'], [[{ t: 'wall', qty: 2, level: 'C2' }, { t: 'floor', qty: 1, level: 'install' }], 'C1'], [[{ t: 'duct', qty: 2 }], 'C1'], [[{ t: 'wall', qty: 1, level: 'repair' }], 'C1'],
  [[{ t: null, qty: 3, unknown: true }], 'C2'], [[{ t: 'cassette', qty: 4 }], 'install'], [[], 'C1'],
].map(([ls, lv]) => { const t = Q.visitTime(ls, lv); return { lines: ls, level: lv, out: t, fit: Q.fitOf(t) }; });
out.timeTh = [[30, 60], [40, 90], [90, 150], [90, 120], [120, 240], [180, 480], [60, 60], [45, 60], [30, 75], [150, 1080], [0, 0], [600, 1500]].map(r => [r, core.timeTh(r)]);

/* ---------- quick cleaning booking (reproduces quickclean.js lines() + drawSum()) ---------- */
const rushItem = () => ({ kind: 'service', group: 'rush', src: 'qc', fixed: true, key: 'QC-RUSH', name: 'คิวด่วน (ภายใน 3 วัน)', detail: 'ต่อการเข้างาน · รับเมื่อมีทีมว่าง ถ้าไม่มีคิวไม่เก็บค่านี้', unitEx: Q.RUSH_FEE_EX, qty: 1 });
function quick(st, zone, date, now) {
  const ls = TYPES_QC.filter(([t]) => st.n[t] > 0).map(([t, th]) => {
    const r = core.cleanRate(st.pkg, st.level, t, st.size[t]);
    return { t, th, r, qty: st.n[t], item: r && r.rate.s != null ? { kind: 'service', group: 'clean', src: 'qc', key: `QC-${st.pkg}-${st.level}-${t}-${st.size[t]}`, name: `${r.name} · ${LEVEL_TH[st.level].th} ${st.level}`, detail: `${(QC.PKG_TH[st.pkg] || { th: st.pkg === 'Corporate Control' ? 'ล้างพร้อมทะเบียนทรัพย์สิน' : st.pkg }).th} (${st.pkg}) · ${r.warranty || ''}`, unitEx: r.rate.s, qty: st.n[t] } : null };
  });
  const J = Q.judge(date, ls.map(l => ({ t: l.t, qty: l.qty })), st.level, now);
  const items = ls.map(l => l.item).filter(Boolean);
  if (J.rush && items.length) items.push(rushItem());
  const t = C.quoteTotals(items, zone);
  const units = ls.reduce((n, l) => n + l.qty, 0);
  let fill = null;
  if (t.travelSmall && (!zone || zone.tier !== 'extended')) {
    const l0 = ls.find(l => l.item && l.item.unitEx > 0), need = l0 ? Math.ceil((D.minBill - t.cleanEx) / l0.item.unitEx) : 0;
    if (need > 0) fill = { type: l0.t, th: l0.th, need };
  }
  return {
    items: items.map(i => [i.key, i.unitEx, i.qty, i.group]), text: items.map(i => [i.name, i.detail]),
    totals: [t.ex, t.travel, t.travelLabel, t.travelSmall, t.units, t.cleanEx, t.visit, t.totalEx, t.vat, t.inc, t.surveys], units, when: [J.kind, J.rush, J.slots.join(',')], fill,
    rows: ls.map(l => [l.t, l.qty, `${(l.t === 'wall' ? core.SIZE_BANDS[st.size[l.t]].wall : core.SIZE_BANDS[st.size[l.t]].other).replace('<=', '≤ ').replace('-', '–')} BTU`, l.item ? l.item.unitEx * l.qty : null]),
  };
}
const SELS = [
  { n: { wall: 1 }, size: { wall: 0 } }, { n: { wall: 3 }, size: { wall: 1 } }, { n: { wall: 7 }, size: { wall: 0 } },
  { n: { wall: 2, cassette: 1 }, size: { wall: 0, cassette: 1 } }, { n: { ceiling: 2, floor: 1 }, size: { ceiling: 3, floor: 2 } },
  { n: { wall: 4, ceiling: 3, cassette: 2, floor: 1 }, size: { wall: 3, ceiling: 1, cassette: 2, floor: 3 } }, { n: { floor: 12 }, size: { floor: 0 } },
];
const qnow = { date: '2026-10-09', min: 600 };
out.quickSels = SELS;
out.quickNow = qnow;
out.quick = [];
for (const pkg of ['Basic Clean', 'Standard Care', 'Corporate Control']) for (const level of ['C1', 'C2']) for (const [si, s] of SELS.entries()) for (const zk of ['none', 'core', 'ext', 'out']) for (const date of ['', '2026-10-09', '2026-10-13']) {
  if (zk !== 'none' && date) continue;
  const st = { n: { wall: 0, ceiling: 0, cassette: 0, floor: 0, ...s.n }, size: { wall: 0, ceiling: 0, cassette: 0, floor: 0, ...s.size }, pkg, level };
  const r = quick(st, ZONES[zk], date, qnow);
  if (zk !== 'none' || si > 2) delete r.text;
  out.quick.push({ pkg, level, sel: si, zone: zk, date, out: r });
}
out.sizesFor = TYPES_QC.map(([t]) => [t, core.SIZE_BANDS.filter(b => D.clean.some(r => r.type === t && r.range === (t === 'wall' ? b.wall : b.other) && r.rate.s != null)).map(b => b.id)]);

/* ---------- BTU ---------- */
out.recommendBtu = [];
for (const w of [2.5, 4, 6, 9]) for (const d of [3, 5]) for (const h of [2.7, 3.5]) for (const sun of [0, 1, 2]) for (const people of [2, 6]) for (const use of ['home', 'office', 'shop']) {
  const i = { w, d, h, sun, people, use };
  out.recommendBtu.push({ in: i, out: core.recommendBtu(i) });
}
out.recommendBtu.push({ in: { w: 3, d: 4 }, out: core.recommendBtu({ w: 3, d: 4 }) }, { in: { w: 20, d: 20 }, out: core.recommendBtu({ w: 20, d: 20 }) });
const ROOMS = ['bedroom', 'master', 'living', 'kitchen', 'study', 'openoffice', 'meeting', 'server', 'shop', 'restaurant', 'cafe', 'salon', 'clinic', 'complab', 'warehouse'];
out.rooms = ROOMS.map(id => { const s = SM.SCENE_BY_ID[id]; return { id, g: s.g, th: s.th, w: s.w, d: s.d, h: s.h, people: s.people, equip: s.equip, sun: s.sun, perM2: s.perM2, types: s.types, closed: !!s.closed, critical: !!s.critical, or: s.or ?? null }; });
out.needBtu = [];
for (const id of ROOMS) {
  const s = SM.SCENE_BY_ID[id];
  const p0 = { w: s.w, d: s.d, h: s.h, people: s.people, equip: s.equip, sun: s.closed ? 0 : s.sun, orient: SM.defaultOrient(s), roof: false, closed: !!s.closed };
  const vars = [p0, { ...p0, roof: true }, { ...p0, closed: true }, { ...p0, orient: 'W', sun: 2 }, { ...p0, orient: 'N', sun: 0 }, { ...p0, people: p0.people + 3, equip: p0.equip + 1000 }, { ...p0, h: 3.6, w: p0.w * 1.5 }, { ...p0, people: 0, equip: 0 }];
  vars.forEach((p, i) => { const r = SM.btuBreakdown(p, s); out.needBtu.push({ id, p, total: r.total, items: r.items.map(x => (i < 2 ? [x.k, x.th, x.btu] : [x.k, x.btu])) }); });
}
out.recommendUnits = [];
for (const need of [6000, 9000, 14000, 26000, 52000, 130000, 300000]) for (const area of [10, 45, 120]) for (const t of TYPE_IDS) out.recommendUnits.push({ need, area, type: t, out: SM.recommendUnits(need, area, t) });

/* ---------- FAQ, trade-in ---------- */
out.faq = core.FAQ.map(f => ({ q: f.q, a: f.a }));
out.tradeValue = [];
for (const btu of [7000, 9000, 12000, 12001, 18000, 24000, 24001, 36000, 60000]) for (const issue of ['reno', 'weak', 'comp', 'leak', 'board']) out.tradeValue.push({ btu, issue, out: TI.tradeValue({ btu, issue }) });

mkdirSync(dirname(OUT), { recursive: true });
const json = JSON.stringify(clone(out));
writeFileSync(OUT, json + '\n');
console.log(`wrote ${OUT} · ${(json.length / 1024).toFixed(0)} KB · series ${out.catalog.series.length} · inst ${out.inst.length} · zones ${out.zones.length} (${JSON.stringify(out.zoneTiers)}) · quotes ${out.quoteTotals.length} · contracts ${out.contracts.length} · judge ${out.judge.length} · quick ${out.quick.length}`);
