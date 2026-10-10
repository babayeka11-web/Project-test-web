// Parity with the reference prototype: every value recorded by scripts/ref-parity.mjs (from the reference modules running
// in node) must be reproduced exactly by the TypeScript port. Regenerate the fixture with `node scripts/ref-parity.mjs`.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import raw from '@data/th-address.json';
import { addrSearch, addrTh, buildAddressBook, checkZone, zoneOf, type AddrPick, type RawAddressBook } from './address';
import { btuBreakdown, recommendBtu, recommendUnits, ROOM_BY_ID, ROOM_USES, ORIENT, GLASS, ROOF_F, CLOSED_F, TYPE_RULES, STD_SIZES, type RoomInput } from './btu';
import { emptyFilter, facetCounts, filterToParams, queryCatalog, PRICE_BANDS, BTU_BANDS, type CatalogFilter } from './catalog';
import { cleaningQuote, LEVEL_TH, METHOD_INFO, PKG_INFO, PKG_TH, QUICK_TYPES, SIZE_BANDS, sizesFor, type CleanLevel, type CleanPkgId } from './cleaning';
import { COMPANY } from './company';
import { QUEUE_RULES, VOLUME_HINT } from './constants';
import { CONTACT_TOPICS, JOB_TIME, PROCESS, TIME_NOTE, timeTh, VRF_NOTE } from './content';
import { CLEAN_PKGS, estimateContract, PRESETS, PRICING, VOLUME_LEVELS } from './contract';
import { EX_TH, VAT } from './format';
import { breakdown, MAT_ROWS, optionNote, packageParts } from './install';
import {
  addonsFor, cleanFrom, getBrands, getCatalog, getCleanRates, getCleanRateTable, getFaq, getInstallItem, getInstallItems, getRepairItems,
  getServices, getSkuCount, installOptions, materialMatrix, minBill, pipeBundle, pipeItemFor, pricebookVersion,
} from './pricebook';
import { quoteTotals, quoteUnits, type QuoteLine } from './quote';
import { addDays, bkkNow, dateTh, DAY_FROM, DAY_MIN, DAY_TO, dow, earliestNormal, fitOf, isOpen, judge, LEAD_DAYS, RUSH_FEE_EX, SLOTS, visitLinesOf, visitTime, type VisitLine } from './queue';
import { DECIDED, MOVE, MOVE_REPLACES, MOVE_TH, RATE_DATE, RATE_SOURCES, SMALL_VISIT } from './rates';
import { TRADE_IN, TRADE_ISSUES, tradeValue } from './tradein';
import { HQ, jobTravel, roadKm, TIER_TH, TRAVEL, travelFee, travelNote, type Zone } from './travel';
import { AC_TYPES, type AcTypeId } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any -- the fixture is untyped JSON written by the reference script */
const FX: any = JSON.parse(readFileSync(path.join(__dirname, '__fixtures__/parity.json'), 'utf8'));
/* eslint-enable @typescript-eslint/no-explicit-any */

const T = (s: unknown) => (typeof s === 'string' && s.length > 60 ? 'sha1:' + createHash('sha1').update(s).digest('hex').slice(0, 20) : s);
const clone = <X>(x: X): unknown => JSON.parse(JSON.stringify(x, (_k, v) => (v === Infinity ? 'Infinity' : v instanceof RegExp ? v.source : v)));
const BOOK = buildAddressBook(raw as unknown as RawAddressBook);
const TABLE = getCleanRateTable();
const ZONES = FX.sampleZones as Record<string, Zone | null>;

describe('parity · fixture coverage', () => {
  it('every section holds a broad grid (no vacuous loops)', () => {
    const n = (k: string) => (Array.isArray(FX[k]) ? FX[k].length : Object.keys(FX[k] || {}).length);
    const min: Record<string, number> = {
      inst: 150, clean: 200, rep: 80, installOptions: 90, addonsFor: 35, materialMatrix: 35, pipeBundle: 15, queries: 35, zones: 40,
      addrSearch: 40, checkZone: 20, travelFee: 60, jobTravel: 30, quoteTotals: 100, breakdown: 20, visitLines: 20, contracts: 500, contractsCustom: 25,
      bkkNow: 6, earliest: 35, judge: 500, visitTime: 6, timeTh: 10, quick: 200, recommendBtu: 250, needBtu: 100, recommendUnits: 100, faq: 10, tradeValue: 40,
    };
    for (const [k, m] of Object.entries(min)) expect(n(k), k).toBeGreaterThanOrEqual(m);
    expect(FX.catalog.series.length).toBeGreaterThan(100);
    expect(FX.quick.filter((r: { out: { when: unknown[] } }) => r.out.when[1]).length).toBeGreaterThan(10);
    expect(FX.quick.filter((r: { out: { fill: unknown } }) => r.out.fill).length).toBeGreaterThan(10);
  });
});

describe('parity · constants', () => {
  const K = FX.constants;
  it('format, taxonomy, travel, queue, contract constants', () => {
    expect(VAT).toBe(K.VAT);
    expect(EX_TH).toBe(K.EX_TH);
    expect(AC_TYPES).toEqual(K.TYPES);
    expect(TRAVEL).toEqual(K.TRAVEL);
    expect(TIER_TH).toEqual(K.TIER_TH);
    expect(HQ).toEqual(K.HQ);
    expect(QUEUE_RULES).toEqual(K.QUEUE_RULES);
    expect(VOLUME_HINT).toBe(K.VOLUME_HINT);
    expect(VOLUME_LEVELS).toEqual(K.VOLUME_LEVELS);
    expect(PRICING).toEqual(K.PRICING);
    expect(PRESETS).toEqual(K.PRESETS);
    expect(CLEAN_PKGS).toEqual(K.CLEAN_PKGS);
    expect(SIZE_BANDS).toEqual(K.SIZE_BANDS);
    expect(clone(PRICE_BANDS)).toEqual(K.PRICE_BANDS);
    expect(clone(BTU_BANDS)).toEqual(K.BTU_BANDS);
  });
  it('content constants', () => {
    expect(JOB_TIME).toEqual(K.JOB_TIME);
    expect(TIME_NOTE).toBe(K.TIME_NOTE);
    expect(VRF_NOTE).toBe(K.VRF_NOTE);
    expect(CONTACT_TOPICS).toEqual(K.CONTACT_TOPICS);
    expect(PROCESS).toEqual(K.PROCESS);
    const { hq, ...company } = COMPANY;
    expect(hq).toEqual(K.HQ);
    expect(company).toEqual(K.COMPANY);
  });
  it('rates.js', () => {
    expect(DECIDED).toEqual(K.DECIDED);
    expect(MOVE).toEqual(K.MOVE);
    expect(MOVE_TH).toEqual(K.MOVE_TH);
    expect(MOVE_REPLACES).toEqual(K.MOVE_REPLACES);
    expect(SMALL_VISIT).toEqual(K.SMALL_VISIT);
    expect(RATE_SOURCES).toEqual(K.RATE_SOURCES);
    expect(RATE_DATE).toBe(K.RATE_DATE);
  });
  it('queue.js', () => {
    expect(SLOTS).toEqual(K.SLOTS);
    expect([LEAD_DAYS, RUSH_FEE_EX, DAY_FROM, DAY_TO, DAY_MIN]).toEqual([K.LEAD_DAYS, K.RUSH_FEE_EX, K.DAY_FROM, K.DAY_TO, K.DAY_MIN]);
  });
  it('cleaning labels (quickclean / commerce)', () => {
    for (const [id, v] of Object.entries(K.PKG_TH as Record<CleanPkgId, { th: string; sub: string }>)) {
      expect({ th: PKG_TH[id as CleanPkgId].th, sub: PKG_TH[id as CleanPkgId].sub }).toEqual(v);
    }
    expect(LEVEL_TH).toEqual(K.LEVEL_TH);
    expect(QUICK_TYPES.map(t => [t.id, t.th, t.where])).toEqual(K.TYPES_QC);
    expect(PKG_INFO).toEqual(K.PKG_INFO);
    expect(METHOD_INFO).toEqual(K.METHOD_INFO);
    expect(clone(MAT_ROWS)).toEqual(K.MAT_ROWS);
  });
  it('trade-in + studio constants', () => {
    expect(clone(TRADE_IN)).toEqual(K.TRADE_IN);
    expect(TRADE_ISSUES).toEqual(K.ISSUES);
    expect(ORIENT).toEqual((K.STUDIO.ORIENT as { sun: number }[]).map(({ sun: _s, ...o }) => (void _s, o)));
    expect(GLASS).toEqual(K.STUDIO.GLASS);
    expect([ROOF_F, CLOSED_F]).toEqual([K.STUDIO.ROOF_F, K.STUDIO.CLOSED_F]);
    expect(TYPE_RULES).toEqual(K.STUDIO.TYPE_RULES);
    expect(STD_SIZES).toEqual(K.STUDIO.STD_SIZES);
  });
});

describe('parity · Pricebook load', () => {
  it('version and minBill', () => {
    expect(pricebookVersion).toBe(FX.meta.pricebook);
    expect(minBill).toBe(FX.meta.minBill);
  });
  it('catalog series, SKUs, prices and spec', () => {
    const cat = getCatalog();
    expect(getSkuCount()).toBe(FX.catalog.skuCount);
    expect(cat.length).toBe(FX.catalog.series.length);
    FX.catalog.series.forEach((r: { id: string; code: string; brand: string; type: string; inverter: boolean; label: string; series: string; skus: unknown[]; spec: unknown[] }, i: number) => {
      const m = cat[i];
      expect([m.refId, m.code, m.brand, m.type, m.inverter, m.label, m.series]).toEqual([r.id, r.code, r.brand, r.type, r.inverter, r.label, r.series]);
      expect(m.skus.map(s => [s.sku, s.btu, s.price, s.price, s.installStdEx])).toEqual(r.skus);
      expect(m.skus.map(s => { const d = s.spec; return T(JSON.stringify([d.series, d.system, d.refrigerant, d.pipeLiquid, d.pipeGas, d.indoorDim, d.indoorKg, d.outdoorDim, d.outdoorKg, d.power, d.compressor, d.warranty, d.lead, d.outdoorModel, d.maxPipe, d.maxLift, d.approved])); })).toEqual(r.spec);
    });
  });
  it('brands', () => {
    expect(getBrands().map(b => [b.id, b.name, b.n, !!b.own])).toEqual(FX.brands);
  });
  it('installation items (O-TWO, MASS / Type L removed, up100, DECIDED overlay, MOVE rows)', () => {
    expect(getInstallItems().map(i => [i.code, i.cat, i.name, i.unit, i.ex, i.inc, i.exc, i.warranty, i.survey, i.decided ?? null].map(T))).toEqual(FX.inst);
  });
  it('cleaning rows (up100, type mapping)', () => {
    expect(getCleanRates().map(r => [r.pkg, r.level, r.ty, r.type, r.range, r.unit, r.ex, r.pb, r.warranty, r.care, r.doc, r.inc, r.exc, r.status, r.name].map(T))).toEqual(FX.clean);
  });
  it('repair rows', () => {
    expect(getRepairItems().map(r => [r.cat, r.name, r.unit, r.ex, r.pb, r.warranty, r.inc, r.exc, r.status].map(T))).toEqual(FX.rep);
  });
  it('headline prices', () => {
    expect(cleanFrom()).toBe(FX.headline.cleanFrom);
    const mine = Object.fromEntries(getServices().map(s => [s.id, s.from]));
    // deliberate difference: the reference card says relocation is 'ประเมินหน้างาน', but /installation/ lists fixed
    // relocation prices by size, so this site's card says 'ราคาตามขนาดเครื่อง'
    const OURS: Record<string, string> = { move: 'ราคาตามขนาดเครื่อง' };
    for (const s of FX.headline.services as { id: string; from: string }[]) expect(mine[s.id]).toBe(OURS[s.id] ?? s.from);
  });
});

describe('parity · product page helpers', () => {
  it('installOptions', () => {
    for (const r of FX.installOptions) expect(installOptions(r.type, r.btu).map(o => [o.key, o.th, o.note, o.item.code, o.item.ex])).toEqual(r.out);
  });
  it('addonsFor', () => {
    for (const r of FX.addonsFor) {
      expect(addonsFor(r.type, r.btu).map(g => ({ group: g.group, items: g.items.map(a => ({ codes: a.choices.map(c => c.code), qty: a.qty, note: a.note ?? null })) }))).toEqual(r.out);
    }
  });
  it('materialMatrix', () => {
    for (const r of FX.materialMatrix) expect(materialMatrix(r.type, r.btu).map(c => ({ key: c.key, th: c.th, code: c.item.code, cell: T(JSON.stringify(c.cell)) }))).toEqual(r.out);
  });
  it('pipeBundle', () => {
    for (const r of FX.pipeBundle) {
      const pb = pipeBundle(pipeItemFor(r.btu));
      expect(pb && { code: pb.item.code, parts: pb.parts, sum: pb.sum ?? null }).toEqual(r.out);
    }
  });
  it('packageParts + optionNote', () => {
    for (const [code, digest] of FX.packageParts as [string, string][]) expect(T(JSON.stringify(packageParts(getInstallItem(code))))).toBe(digest);
    expect(getInstallItems().map(i => [i.code, optionNote(i.code)]).filter(([, n]) => n)).toEqual(FX.optionNote);
  });
});

describe('parity · catalog queries', () => {
  const F = (o: Partial<Record<'q' | 'inverter' | 'sort', string>> & Partial<Record<'type' | 'brand' | 'btu' | 'price', string[]>>): CatalogFilter => ({
    ...emptyFilter(),
    ...(o.q != null ? { q: o.q } : {}),
    ...(o.inverter != null ? { inverter: o.inverter as CatalogFilter['inverter'] } : {}),
    ...(o.sort != null ? { sort: o.sort as CatalogFilter['sort'] } : {}),
    type: new Set(o.type || []),
    brand: new Set(o.brand || []),
    btu: new Set(o.btu || []),
    price: new Set(o.price || []),
  });
  it('list order, sku totals, visible skus, facets, params', () => {
    const cat = getCatalog();
    const brands = getBrands();
    for (const r of FX.queries) {
      const f = F(r.f);
      const res = queryCatalog(cat, f);
      expect(res.list.map(m => m.refId)).toEqual(r.ids);
      expect(res.skuTotal).toBe(r.skuTotal);
      expect(res.list.map(m => res.visibleSkus(m).length)).toEqual(r.visible);
      expect(facetCounts(cat, f, brands)).toEqual(r.facets);
      expect(filterToParams(f)).toBe(r.params);
    }
  });
});

describe('parity · address, zones, travel', () => {
  it('zoneOf + addrTh for picks across tiers', () => {
    expect(Object.keys(FX.zoneTiers).sort()).toEqual(['core', 'extended', 'out', 'unknown']);
    for (const r of FX.zones as { pick: AddrPick; zone: Zone; th: string }[]) {
      expect(zoneOf(BOOK, r.pick)).toEqual(r.zone);
      expect(addrTh(r.pick)).toBe(r.th);
    }
  });
  it('addrSearch', () => {
    for (const r of FX.addrSearch) expect(addrSearch(BOOK, r.q, r.n)).toEqual(r.out);
  });
  it('checkZone (free text)', () => {
    for (const r of FX.checkZone) {
      const z = checkZone(BOOK, r.input);
      if (r.zone && r.zone.tier === 'unknown' && !r.zone.province) expect(z).toEqual({ ...r.zone, district: '', sub: '', zip: '' });
      else expect(z).toEqual(r.zone);
    }
  });
  it('travelFee, roadKm, jobTravel, travelNote', () => {
    for (const [km, fee] of FX.travelFee) expect(travelFee(km)).toBe(fee);
    for (const [la, lo, km] of FX.roadKm) expect(roadKm(la, lo)).toBe(km);
    for (const r of FX.jobTravel) expect(jobTravel(ZONES[r.zone], r.cleanEx)).toEqual(r.out);
    for (const r of FX.travelNote) expect(travelNote(ZONES[r.zone])).toBe(r.out);
  });
});

describe('parity · quotation totals', () => {
  it('quoteTotals + quoteUnits for mixed carts × zones', () => {
    for (const r of FX.quoteTotals) {
      const lines = FX.carts[r.cart] as QuoteLine[];
      const { travelWaived: _w, travelShort: _s, minGap: _g, ...want } = r.out;
      void [_w, _s, _g];
      expect(quoteTotals(lines, ZONES[r.zone])).toEqual(want);
      expect(quoteUnits(lines)).toBe(r.units);
    }
  });
  it('visit lines read from quotation lines', () => {
    for (const r of FX.visitLines) expect(visitLinesOf(FX.carts[r.cart])).toEqual(r.out);
  });
  it('itemised breakdown', () => {
    for (const r of FX.breakdown) expect(breakdown(FX.carts[r.cart])).toEqual(r.out);
  });
});

describe('parity · annual contract', () => {
  it('estimateContract: presets × packages × size × deep × zone × visits', () => {
    for (const row of FX.contracts) {
      const [key, ...want] = row as [string, ...unknown[]];
      const [pid, pkg, size, deep, zk, visits] = key.split('|');
      const p = PRESETS.find(x => x.id === pid);
      const e = estimateContract(TABLE, { units: p!.units, visits: +visits, zone: ZONES[zk], pkg: pkg as CleanPkgId, size: +size, deep: deep === '1' });
      expect(e).not.toBeNull();
      if (!e) continue;
      const lines = want[want.length - 1];
      expect([e.annualEx, e.vat, e.annualInc, e.perVisitC1, e.perVisitC2, e.travel, e.travelLabel, e.minBillApplied, e.perUnitYear, e.teamDaysPerVisit, e.count]).toEqual(want.slice(0, -1));
      if (lines) expect(clone(e.lines)).toEqual(lines);
    }
  });
  it('estimateContract: custom units (incl. empty, string counts, unknown size)', () => {
    for (const r of FX.contractsCustom) {
      const e = estimateContract(TABLE, { ...r.o, zone: ZONES[r.zone] });
      if (!r.out.count) {
        expect(e).toBeNull();
        continue;
      }
      const want = r.out;
      expect(e && clone({ count: e.count, visits: e.visits, level: e.level, lines: e.lines, perVisitC1: e.perVisitC1, perVisitC2: e.perVisitC2, travel: e.travel, travelLabel: e.travelLabel, minBillApplied: e.minBillApplied, annualEx: e.annualEx, vat: e.vat, annualInc: e.annualInc, perUnitYear: e.perUnitYear, teamDaysPerVisit: e.teamDaysPerVisit, high: e.high })).toEqual({
        count: want.count, visits: want.visits, level: want.level, lines: want.lines, perVisitC1: want.perVisitC1, perVisitC2: want.perVisitC2, travel: want.travel, travelLabel: want.travelLabel, minBillApplied: want.minBillApplied, annualEx: want.annualEx, vat: want.vat, annualInc: want.annualInc, perUnitYear: want.perUnitYear, teamDaysPerVisit: want.teamDaysPerVisit, high: want.high,
      });
    }
  });
});

describe('parity · queue', () => {
  it('bkkNow for fixed instants', () => {
    for (const [iso, want] of FX.bkkNow) expect(bkkNow(new Date(iso))).toEqual(want);
  });
  it('earliestNormal / isOpen / dow / dateTh incl. Saturdays and Sundays', () => {
    for (const [d, e, open, wd, th] of FX.earliest) {
      expect(earliestNormal({ date: d, min: 600 })).toBe(e);
      expect([isOpen(d), dow(d), dateTh(d)]).toEqual([open, wd, th]);
    }
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('judge for dates × now × lines × level', () => {
    const LS = FX.judgeLines as Record<string, VisitLine[]>;
    for (const r of FX.judge) {
      const [nd, min, lk, level, date, ...want] = r;
      const J = judge(date, LS[lk], level, { date: nd, min });
      expect([J.kind, J.rush, J.closed ?? null, J.sameDay ?? null, J.late ?? null, J.earliest, J.slots.join(','), J.fit.kind, J.fit.days, J.fit.unknown ?? null, J.time.join(',')]).toEqual(want);
    }
  });
  it('visitTime / fitOf / timeTh', () => {
    for (const r of FX.visitTime) {
      const t = visitTime(r.lines, r.level);
      expect(t).toEqual(r.out);
      expect(fitOf(t)).toEqual(r.fit);
    }
    for (const [range, want] of FX.timeTh) expect(timeTh(range)).toBe(want);
  });
});

describe('parity · quick cleaning booking', () => {
  it('lines, totals, rush, fill hint for selections × packages × levels × zones × dates', () => {
    for (const r of FX.quick) {
      const s = FX.quickSels[r.sel];
      const sel = { n: { wall: 0, ceiling: 0, cassette: 0, floor: 0, ...s.n }, size: { wall: 0, ceiling: 0, cassette: 0, floor: 0, ...s.size }, pkg: r.pkg as CleanPkgId, level: r.level as CleanLevel };
      const q = cleaningQuote(sel, TABLE, ZONES[r.zone], { date: r.date, now: FX.quickNow });
      const o = r.out;
      expect(q.lines.map(i => [i.key, i.unitEx, i.qty, i.group])).toEqual(o.items);
      if (o.text) expect(q.lines.map(i => [i.name, i.detail])).toEqual(o.text);
      const t = q.totals;
      expect([t.ex, t.travel, t.travelLabel, t.travelSmall, t.units, t.cleanEx, t.visit, t.totalEx, t.vat, t.inc, t.surveys]).toEqual(o.totals);
      expect(q.units).toBe(o.units);
      expect([q.when.kind, q.when.rush, q.when.slots.join(',')]).toEqual(o.when);
      expect(q.fill).toEqual(o.fill);
      expect(q.rows.map(x => [x.type, x.qty, x.sizeTh, x.amount])).toEqual(o.rows);
    }
  });
  it('sizes with a price per type', () => {
    for (const [t, ids] of FX.sizesFor) expect(sizesFor(TABLE, t).map(b => b.id)).toEqual(ids);
  });
});

describe('parity · BTU', () => {
  it('recommendBtu grid', () => {
    for (const r of FX.recommendBtu) expect(recommendBtu(r.in)).toEqual(r.out);
  });
  it('room library subset = reference scenes', () => {
    for (const r of FX.rooms) {
      const m = ROOM_BY_ID[r.id];
      expect({ id: m.id, g: m.g, th: m.th, w: m.w, d: m.d, h: m.h, people: m.people, equip: m.equip, sun: m.sun, perM2: m.perM2, types: m.types, closed: !!m.closed, critical: !!m.critical, or: null }).toEqual(r);
    }
    expect(ROOM_USES.length).toBe(FX.rooms.length);
  });
  it('btuBreakdown / needBtu', () => {
    let i = 0;
    let last = '';
    for (const r of FX.needBtu) {
      i = r.id === last ? i + 1 : 0;
      last = r.id;
      const b = btuBreakdown(r.p as RoomInput, ROOM_BY_ID[r.id]);
      expect(b.total).toBe(r.total);
      expect(b.items.map(x => (i < 2 ? [x.k, x.th, x.btu] : [x.k, x.btu]))).toEqual(r.items);
    }
  });
  it('recommendUnits', () => {
    for (const r of FX.recommendUnits) expect(recommendUnits(r.need, r.area, r.type as AcTypeId)).toEqual(r.out);
  });
});

describe('parity · FAQ + trade-in', () => {
  it('FAQ answers (numbers from the same constants and the Pricebook)', () => {
    expect(getFaq()).toEqual(FX.faq);
  });
  it('tradeValue', () => {
    for (const r of FX.tradeValue) expect(tradeValue(r)).toEqual(r.out);
  });
});
