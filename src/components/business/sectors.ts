// Sector stories for /business/ — port of SECTORS / sampleContract / volumeBenefits / scopeText in the reference
// sbp-aircare/assets/enterprise.js (Rev.22–23, owner 3 ต.ค. 2569).
//   · per sector: who it is for → the problems those buyers name → what the company does about each, tagged by what the
//     promise rests on ('pkg' = in the package / company form already · 'deal' = agreed in the contract per customer)
//   · a sample annual contract computed from the Pricebook (estimateContract — standard rates, before VAT)
//   · what volume under one contract changes, computed only from published rules (no discount, no special-rate figure)
//   · a draft scope of work to copy into an RFQ / TOR (terms the company has not set stay blank: "________")
// Samples are examples to size a budget, not real customers. Client-safe: no Pricebook import (the table is a prop).
import { COMPANY } from '@/lib/domain/company';
import { NOTES, VOLUME_HINT } from '@/lib/domain/constants';
import { JOB_TIME, timeTh } from '@/lib/domain/content';
import { CLEAN_PKGS, estimateContract, type ContractEstimate, type ContractUnits } from '@/lib/domain/contract';
import { SIZE_BANDS, type CleanPkgId, type CleanRateTable } from '@/lib/domain/cleaning';
import { baht, incVat, vatOf } from '@/lib/domain/format';
import { jobTravel, TRAVEL } from '@/lib/domain/travel';
import { TYPE_BY_ID } from '@/lib/domain/types';

export type SectorId = 'office' | 'chain' | 'condo' | 'hospital' | 'school' | 'hotel' | 'factory';
/** pkg = in the package / company form already · deal = agreed in the contract (filled per customer) */
export type PromiseKind = 'pkg' | 'deal';
export type AddOnKey = 'ooh' | 'ctrl' | 'dry' | 'protect' | 'height' | 'lift' | 'ceilingOpen' | 'cduGroup' | 'heavy' | 'ahu';

export type SectorSampleInput = {
  label: string;
  units: ContractUnits;
  /** size band id of most units (SIZE_BANDS) */
  size: number;
  pkg: CleanPkgId;
  visits: 2 | 3 | 4;
};

export type Sector = {
  id: SectorId;
  /** short tab label */
  tab: string;
  th: string;
  who: string;
  /** branches the sample is multiplied by (each branch is its own visit) */
  branches?: number;
  /** [the buyer's problem, what the company does, what it rests on]; {min} {fee} {wallC1} are filled from the domain layer */
  pains: readonly (readonly [pain: string, fix: string, kind: PromiseKind])[];
  sample: SectorSampleInput;
  addOns: readonly AddOnKey[];
  /** when the crew can work */
  window: string;
};

export const PROMISE_TH: Record<PromiseKind, string> = {
  pkg: 'มีในแพ็กเกจ / แบบฟอร์มบริษัท',
  deal: 'ตกลงในสัญญา',
};

export const SECTORS: readonly Sector[] = [
  {
    id: 'office',
    tab: 'สำนักงาน',
    th: 'สำนักงาน / บริษัท',
    who: 'สำนักงานใหญ่ อาคารสำนักงาน Co-working ห้องประชุม ห้อง Server',
    pains: [
      ['ปล่อยจนแอร์มีกลิ่น น้ำหยดใส่โต๊ะ แล้วค่อยเรียกช่าง', 'วางปฏิทินล้างทั้งปีตั้งแต่วันเซ็นสัญญา ทีมแจ้งล่วงหน้าก่อนเข้างานทุกรอบ', 'pkg'],
      ['ล้างแล้วรบกวนการทำงานทั้งชั้น', 'แบ่งโซน ทำทีละชั้นทีละห้อง รู้ล่วงหน้าว่าแต่ละรอบใช้กี่ทีม-วัน', 'pkg'],
      ['ฝ่ายจัดซื้อไม่มีหลักฐานว่าทำอะไรไปบ้าง', 'Service Report พร้อมภาพก่อน–หลังทุกเครื่อง เกรดสภาพ A–D ลงนามรับงาน 3 ฝ่ายตามแบบฟอร์มบริษัท', 'pkg'],
      ['มีค่าใช้จ่ายบวกหน้างานที่ไม่ได้ตกลงไว้', 'ราคามาตรฐานตาม Pricebook ก่อน VAT งานเพิ่มทุกรายการแจ้งให้อนุมัติก่อนทำ', 'pkg'],
      ['อยากให้ทำนอกเวลางานหรือวันอาทิตย์', 'จัดได้ตามที่ตกลงในสัญญา งานนอกเวลามีค่าใช้จ่ายเพิ่มเติม แจ้งในใบเสนอราคา', 'deal'],
    ],
    // size 0 like the 'office-m' preset in the page header and calculator — same label, same price everywhere
    sample: { label: 'สำนักงาน 1 ชั้น 30 เครื่อง', units: { wall: 12, cassette: 14, ceiling: 4 }, size: 0, pkg: 'Standard Care', visits: 3 },
    addOns: ['ooh', 'ctrl', 'ceilingOpen'],
    window: 'วันทำการ 08:30–17:30 น. หรือนอกเวลาตามที่ตกลง (มีค่าใช้จ่ายเพิ่มเติม)',
  },
  {
    id: 'chain',
    tab: 'หลายสาขา',
    th: 'องค์กรหลายสาขา',
    who: 'ธนาคาร ร้านค้าปลีก ร้านอาหาร คลินิกเครือข่าย แฟรนไชส์ ศูนย์บริการ',
    branches: 12,
    pains: [
      ['แต่ละสาขาจ้างช่างเอง ราคาและมาตรฐานไม่เท่ากัน', 'สัญญาเดียว ราคามาตรฐานเดียวกันทุกสาขา ขั้นตอนงานตามแบบฟอร์มเดียวกัน', 'pkg'],
      ['สำนักงานใหญ่ไม่เห็นภาพรวมว่าสาขาไหนทำแล้ว', 'Asset Report รายเครื่องแยกตามสาขา (Corporate Control) ติดตามรอบล้างและสภาพเครื่องได้ทุกสาขา', 'pkg'],
      ['สาขาเล็กมีแอร์ไม่กี่เครื่อง ยอดต่อรอบต่ำ', 'สาขาในพื้นที่หลักที่ยอดงานล้างถึง {min} ไม่มีค่าเดินทาง ต่ำกว่านั้นคิดค่าเดินทาง {fee} ต่อการเข้างาน เห็นชัดในใบเสนอราคา', 'pkg'],
      ['สาขาต่างจังหวัด ค่าเดินทางไม่ชัด', 'คิดตามระยะถนนจากสำนักงานใหญ่ ตามอัตราที่ประกาศบนเว็บ ทุกสาขาเห็นตัวเลขเดียวกัน', 'pkg'],
      ['ร้านเปิดทุกวัน ปิดร้านไม่ได้', 'เข้างานก่อนร้านเปิดหรือหลังร้านปิดตามที่ตกลงในสัญญา (นอกเวลามีค่าใช้จ่ายเพิ่มเติม)', 'deal'],
    ],
    sample: { label: 'สาขาละ 6 เครื่อง × 12 สาขา', units: { wall: 4, cassette: 2 }, size: 1, pkg: 'Corporate Control', visits: 3 },
    addOns: ['ooh', 'heavy'],
    window: 'ก่อนเปิดร้าน หลังปิดร้าน หรือวันทำการ ตามที่ตกลงต่อสาขา',
  },
  {
    id: 'condo',
    tab: 'คอนโด / นิติบุคคล',
    th: 'คอนโด / อาคารชุด / นิติบุคคล',
    who: 'นิติบุคคลอาคารชุด หมู่บ้านจัดสรร อาคารพักอาศัยให้เช่า',
    pains: [
      ['ส่วนกลางเปิดทุกวัน ทั้งล็อบบี้ ฟิตเนส ห้องประชุม', 'วางรอบล้างส่วนกลางทั้งปี ทำทีละจุดให้ส่วนกลางยังเปิดใช้ได้', 'pkg'],
      ['ช่างภายนอกเข้าออกไม่เป็นระบบ ต้องแลกบัตรและลงทะเบียน', 'ส่งรายชื่อช่างและวันเข้างานให้นิติล่วงหน้า ช่างทุกคนมีป้ายชื่อ ใช้ลิฟต์ขนของตามที่นิติกำหนด', 'deal'],
      ['ต้องรายงานคณะกรรมการและที่ประชุมใหญ่', 'Service Report พร้อมภาพทุกเครื่องของส่วนกลาง แนบรายงานผลการดำเนินงานได้', 'pkg'],
      ['ลูกบ้านแจ้งน้ำหยด ไม่รู้จะเรียกใคร', 'ลูกบ้านจองล้างหรือซ่อมเองผ่านเว็บได้ ราคามาตรฐานเดียวกับที่นิติเห็น ส่วนวันล้างแอร์ทั้งอาคารตกลงรูปแบบในสัญญา', 'deal'],
    ],
    sample: { label: 'ส่วนกลางอาคาร 20 เครื่อง', units: { wall: 10, cassette: 6, ceiling: 4 }, size: 1, pkg: 'Standard Care', visits: 2 },
    addOns: ['height', 'lift', 'cduGroup'],
    window: 'ตามเวลาที่นิติกำหนด และลงทะเบียนผู้รับเหมาตามระเบียบอาคาร',
  },
  {
    id: 'hospital',
    tab: 'โรงพยาบาล / คลินิก',
    th: 'โรงพยาบาล / คลินิก',
    who: 'โรงพยาบาล คลินิก ศูนย์ทันตกรรม ห้องแล็บ ศูนย์ดูแลผู้สูงอายุ',
    pains: [
      ['หยุดพื้นที่บริการผู้ป่วยไม่ได้', 'วางแผนทีละโซนร่วมกับฝ่ายอาคาร พื้นที่ผู้ป่วยนอกทำนอกเวลาให้บริการได้ตามที่ตกลง (นอกเวลามีค่าใช้จ่ายเพิ่มเติม)', 'deal'],
      ['กังวลฝุ่นและละอองน้ำในพื้นที่ควบคุม', 'พื้นที่ควบคุมใช้วิธีเป่าฝุ่น/ดูดฝุ่นแห้งไม่ใช้น้ำ หรือวิธีที่ตกลงกับโรงพยาบาล คลุมพื้นที่ทุกครั้ง ประเมินหน้างานก่อนเสนอราคา', 'pkg'],
      ['ต้องมีเอกสารย้อนหลังสำหรับการตรวจประเมินคุณภาพ', 'Asset Report รายเครื่องและประวัติงานทุกรอบ (Corporate Control) ลงนามรับงาน 3 ฝ่ายตามแบบฟอร์มบริษัท', 'pkg'],
      ['แอร์เสียกลางคันในห้องที่ต้องใช้ตลอด', 'ล้างทุก 3 เดือนช่วยให้เห็นอาการเริ่มต้นเร็วขึ้น งานซ่อมแจ้งราคาให้อนุมัติก่อนทุกครั้ง ระยะเวลาตอบสนองเมื่อแจ้งเหตุตกลงในสัญญา', 'deal'],
    ],
    sample: { label: 'คลินิก / รพ.ขนาดเล็ก 46 เครื่อง', units: { wall: 20, cassette: 16, ceiling: 6, duct: 4 }, size: 1, pkg: 'Corporate Control', visits: 4 },
    addOns: ['ctrl', 'dry', 'ooh', 'ceilingOpen'],
    window: 'ทีละโซนตามแผนของโรงพยาบาล บางพื้นที่ทำนอกเวลาให้บริการ (มีค่าใช้จ่ายเพิ่มเติม)',
  },
  {
    id: 'school',
    tab: 'โรงเรียน / มหาวิทยาลัย',
    th: 'โรงเรียน / มหาวิทยาลัย',
    who: 'โรงเรียน มหาวิทยาลัย สถาบันกวดวิชา ศูนย์ฝึกอบรม',
    pains: [
      ['ต้องตั้งงบประมาณทั้งปีล่วงหน้า', 'ประมาณงบทั้งปีจาก Pricebook ได้ทันทีบนหน้านี้ แล้วทีมขายออกใบเสนอราคาอย่างเป็นทางการสำหรับการจัดซื้อ', 'pkg'],
      ['ทำได้เฉพาะช่วงปิดภาคเรียนหรือวันหยุด', 'วางรอบล้างปีละ 2 ครั้งให้ตรงช่วงปิดภาคเรียน (ล้างใหญ่ 1 ครั้ง) ทำวันอาทิตย์ได้ตามที่ตกลง (มีค่าใช้จ่ายเพิ่มเติม)', 'deal'],
      ['ห้องเรียนเยอะ กลัวทำไม่ทันช่วงปิดเทอม', 'คำนวณกำลังคนต่อรอบจากจำนวนเครื่อง ทีมวางจำนวนทีมให้จบในช่วงที่กำหนดก่อนเริ่มงาน', 'pkg'],
      ['ต้องใช้เอกสารประกอบการจัดซื้อจัดจ้าง', 'ใบเสนอราคา ร่างขอบเขตงาน และรายงานผลงานทุกรอบ ใช้ประกอบการตรวจรับงานได้', 'pkg'],
    ],
    sample: { label: 'โรงเรียน 80 ห้อง', units: { wall: 60, ceiling: 10, cassette: 10 }, size: 1, pkg: 'Standard Care', visits: 2 },
    addOns: ['ooh', 'height'],
    window: 'ช่วงปิดภาคเรียนหรือวันหยุด ตามปฏิทินการศึกษา',
  },
  {
    id: 'hotel',
    tab: 'โรงแรม',
    th: 'โรงแรม / ที่พัก',
    who: 'โรงแรม รีสอร์ต เซอร์วิสอพาร์ตเมนต์ โฮสเทล',
    pains: [
      ['ปิดห้องนานเท่ากับเสียรายได้', 'ทยอยทำตามห้องว่างที่ฝ่ายแม่บ้านจัดให้ แอร์ติดผนังล้างปกติใช้เวลาประมาณ {wallC1} ต่อเครื่อง ช่วยวางแผนบล็อกห้อง', 'pkg'],
      ['กลิ่นอับและเสียงแอร์ถูกเขียนในรีวิว', 'Standard Care บันทึกสภาพเครื่องเป็นเกรด A–D พร้อมภาพ เครื่องที่มีกลิ่นหรือคราบหนักแจ้งงานเพิ่มให้อนุมัติก่อน', 'pkg'],
      ['ช่วงไฮซีซันเข้าห้องไม่ได้', 'วางรอบปีละ 3 ครั้ง ให้รอบล้างใหญ่อยู่ช่วงอัตราเข้าพักต่ำตามที่โรงแรมเลือก', 'deal'],
      ['ล็อบบี้ ห้องอาหาร ห้องประชุมใช้งานทุกวัน', 'ทำพื้นที่สาธารณะนอกเวลาให้บริการได้ตามที่ตกลง (นอกเวลามีค่าใช้จ่ายเพิ่มเติม)', 'deal'],
    ],
    sample: { label: 'โรงแรม 80 ห้องพัก + ส่วนกลาง', units: { wall: 80, cassette: 8, duct: 6 }, size: 0, pkg: 'Standard Care', visits: 3 },
    addOns: ['heavy', 'ooh', 'ceilingOpen'],
    window: 'ตามห้องว่างที่ฝ่ายแม่บ้านกำหนด และพื้นที่สาธารณะนอกเวลาให้บริการ',
  },
  {
    id: 'factory',
    tab: 'โรงงาน / คลังสินค้า',
    th: 'โรงงาน / คลังสินค้า',
    who: 'โรงงาน คลังสินค้า ศูนย์กระจายสินค้า ห้องควบคุมเครื่องจักร',
    pains: [
      ['ฝุ่นมาก แอร์ตันเร็ว เครื่องจักรร้อน', 'ล้างทุก 3 เดือน (ปีละ 4 ครั้ง รวมล้างใหญ่ 1 ครั้ง) งานคราบหนักแจ้งราคาให้อนุมัติก่อน', 'pkg'],
      ['หยุดไลน์ผลิตไม่ได้ ต้องคลุมสินค้า', 'วางแผนตามกะการผลิต คลุมพื้นที่และสินค้า ประเมินหน้างานก่อนเสนอราคา', 'deal'],
      ['เครื่องติดสูง ต้องใช้นั่งร้านหรือรถกระเช้า', 'สำรวจก่อนเสนอราคา งานสูงและอุปกรณ์ยกแยกรายการในใบเสนอราคาให้เห็นชัด', 'pkg'],
      ['ต้องมีทะเบียนเครื่องสำหรับงานบำรุงรักษา', 'Asset Report รายเครื่อง และทะเบียนชิ้นส่วนที่ถอดในงานล้างใหญ่ ตามแบบฟอร์มบริษัท (Corporate Control)', 'pkg'],
    ],
    sample: { label: 'โรงงาน / โกดัง 46 เครื่อง', units: { wall: 10, ceiling: 20, floor: 8, duct: 8 }, size: 2, pkg: 'Corporate Control', visits: 4 },
    addOns: ['protect', 'height', 'lift', 'cduGroup', 'ahu'],
    window: 'ตามกะการผลิตหรือวันหยุดไลน์ ตามที่ตกลง',
  },
];

export const SECTOR_BY_ID = Object.fromEntries(SECTORS.map(s => [s.id, s])) as Record<SectorId, Sector>;

/** Text tokens in pains → values from the domain layer (never typed twice). */
export type FillToken = 'min' | 'fee' | 'wallC1';
export const FILL_TOKENS: Record<FillToken, (minBill: number) => string> = {
  min: minBill => baht(minBill),
  fee: () => baht(TRAVEL.baseFee),
  wallC1: () => timeTh(JOB_TIME.C1.wall ?? [0, 0]),
};
/** Split a text into plain parts and {token} parts (the page renders money tokens with <Price>). */
export function splitTokens(text: string): (string | { token: FillToken })[] {
  return text.split(/(\{(?:min|fee|wallC1)\})/).filter(Boolean).map(p => {
    const m = /^\{(min|fee|wallC1)\}$/.exec(p);
    return m ? { token: m[1] as FillToken } : p;
  });
}
/** Plain-text version of a filled sentence (copy / summaries). */
export const fillText = (text: string, minBill: number): string =>
  splitTokens(text).map(p => (typeof p === 'string' ? p : FILL_TOKENS[p.token](minBill))).join('');

/* ---------- sample contract ---------- */

/** Visit gap in months for n visits a year. */
export const everyMonths = (visits: number): number => ({ 2: 6, 3: 4, 4: 3 } as Record<number, number>)[visits] ?? Math.round(12 / visits);

export type SectorSample = {
  sector: SectorId;
  label: string;
  pkg: CleanPkgId;
  size: number;
  visits: number;
  units: ContractUnits;
  branches: number;
  /** months between visits */
  every: number;
  /** the estimate for one site (one branch) */
  est: ContractEstimate;
  /** annual price of one site, before VAT */
  perSite: number;
  /** all sites, before VAT */
  annualEx: number;
  vat: number;
  annualInc: number;
  unitsAll: number;
};

/** One sector's sample contract — per site, then × branches (each branch is its own visit). Null only without units. */
export function sampleContract(table: CleanRateTable, s: Sector, over: Partial<SectorSampleInput> = {}): SectorSample | null {
  const x = { ...s.sample, ...over };
  const n = s.branches ?? 1;
  const est = estimateContract(table, { units: x.units, visits: x.visits, pkg: x.pkg, size: x.size, deep: true });
  if (!est) return null;
  const annualEx = est.annualEx * n;
  return {
    sector: s.id,
    label: x.label,
    pkg: x.pkg,
    size: x.size,
    visits: x.visits,
    units: x.units,
    branches: n,
    every: everyMonths(x.visits),
    est,
    perSite: est.annualEx,
    annualEx,
    vat: vatOf(annualEx),
    annualInc: incVat(annualEx),
    unitsAll: est.count * n,
  };
}

export const reportKindOf = (pkg: CleanPkgId): string =>
  pkg === 'Basic Clean' ? 'ใบรับมอบงานแบบย่อ' : pkg === 'Corporate Control' ? 'Asset Report รายเครื่อง' : 'Service Report พร้อมภาพก่อน–หลัง';

export type VolumeBenefits = {
  /** jobs a year if every unit were booked on its own */
  splitJobs: number;
  /** visits a year under the contract (all branches) */
  contractVisits: number;
  splitTravel: number;
  contractTravel: number;
  travelAvoided: number;
  teamDays: number;
  /** team-days when two crews share a round */
  teamDays2: number;
  /** reports a year (one per unit per visit) */
  reports: number;
  reportKind: string;
  /** annual price per unit per month, before VAT (rounded up to whole baht) */
  perUnitMonth: number;
  terms: string;
  /** units ≥ VOLUME_HINT → special rates may apply (never a figure) */
  special: boolean;
};

/** What volume under one contract changes vs booking every unit on its own — published rules only, no discount. */
export function volumeBenefits(c: SectorSample, minBill: number): VolumeBenefits {
  const n = c.branches;
  const V = c.visits;
  const deep = 1;
  let splitJobs = 0;
  let splitTravel = 0;
  for (const l of c.est.lines) {
    splitJobs += l.n * V;
    splitTravel += l.n * ((V - deep) * jobTravel(null, l.c1 ?? 0, minBill).fee + deep * jobTravel(null, l.c2 ?? 0, minBill).fee);
  }
  splitJobs *= n;
  splitTravel *= n;
  const sum1 = c.est.lines.reduce((a, l) => a + (l.c1 ?? 0) * l.n, 0);
  const sum2 = c.est.lines.reduce((a, l) => a + (l.c2 ?? 0) * l.n, 0);
  const contractTravel = n * ((V - deep) * jobTravel(null, sum1, minBill).fee + deep * jobTravel(null, sum2, minBill).fee);
  const td = c.est.teamDaysPerVisit;
  const pk = CLEAN_PKGS.find(p => p.id === c.pkg);
  return {
    splitJobs,
    contractVisits: V * n,
    splitTravel,
    contractTravel,
    travelAvoided: Math.max(0, splitTravel - contractTravel),
    teamDays: td,
    teamDays2: Math.ceil(td) <= 1 ? td : Math.ceil(td) / 2,
    reports: c.unitsAll * V,
    reportKind: reportKindOf(c.pkg),
    perUnitMonth: Math.ceil(c.annualEx / c.unitsAll / 12),
    terms: pk?.sub ?? '',
    special: c.unitsAll >= VOLUME_HINT,
  };
}

/** A draft scope of work to copy into an RFQ / TOR — blanks stay blank (agreed per customer). */
export function scopeText(s: Sector, c: SectorSample): string {
  const pk = CLEAN_PKGS.find(p => p.id === c.pkg);
  const band = SIZE_BANDS[c.size] ?? SIZE_BANDS[0];
  const br = c.branches > 1;
  const fleet = c.est.lines.map(l => `   - ${TYPE_BY_ID[l.type].th} ${l.range ?? ''} BTU จำนวน ${l.n} เครื่อง${br ? ' ต่อสาขา' : ''}`).join('\n');
  return [
    'ร่างขอบเขตงาน (ตัวอย่าง) — สัญญาล้างและดูแลเครื่องปรับอากาศรายปี',
    `ประเภทสถานที่: ${s.th}${br ? ` · ${c.branches} สาขา` : ''}`,
    `ผู้ให้บริการ: ${COMPANY.th} (${COMPANY.brand}) · โทร ${COMPANY.tel}`,
    '',
    `1. รายการเครื่อง (ตัวอย่าง ยืนยันหลังสำรวจ · ขนาดส่วนใหญ่: ${band.th})`,
    fleet,
    `   รวม ${c.unitsAll} เครื่อง · ระบบ VRV / VRF ไม่รวมในสัญญานี้ (เสนอแยกเป็นงานโครงการ)`,
    `2. ความถี่: ปีละ ${c.visits} ครั้ง ประมาณทุก ${c.every} เดือน — ล้างปกติ (C1) ${c.visits - 1} ครั้ง และล้างใหญ่ (C2) 1 ครั้ง`,
    `3. มาตรฐานงาน: แบบฟอร์มงานล้างของบริษัท · แพ็กเกจ ${c.pkg}: ${pk?.sub ?? ''} · ลงนามรับงาน 3 ฝ่ายทุกรอบ`,
    `4. ราคา: อัตรามาตรฐานตาม Pricebook ก่อน VAT — ตัวอย่าง ${baht(c.annualEx)} ต่อปี (รวม VAT 7% ${baht(c.annualInc)}) · ${NOTES.estimate}${
      c.unitsAll >= VOLUME_HINT ? ` · ${NOTES.volume}` : ''
    }`,
    '5. งานนอกขอบเขต: งานซ่อมและอะไหล่แจ้งราคาให้อนุมัติก่อนทุกครั้ง · งานสูง พื้นที่ควบคุม และการเข้าถึงพิเศษ ประเมินหน้างาน · งานนอกเวลาทำการมีค่าใช้จ่ายเพิ่มเติม · ค่าเดินทางนอกพื้นที่หลักตามอัตราที่ประกาศ',
    `6. ช่วงเวลาเข้างาน: ${s.window}`,
    '7. ข้อที่ตกลงร่วมกัน (กรอกเมื่อทำสัญญา)',
    '   - ระยะเวลาตอบสนองเมื่อแจ้งเหตุ: ________',
    '   - ผู้ประสานงานของลูกค้า / ของบริษัท: ________ / ________',
    '   - รูปแบบใบแจ้งหนี้และรอบวางบิล: ________',
    '   - ระยะเวลาสัญญา: ________',
  ].join('\n');
}

/* ---------- add-on lines often used by a sector (from the cleaning Pricebook, by name) ---------- */

export const ADD_ON_MATCH: Record<AddOnKey, RegExp> = {
  ooh: /นอกเวลาทำการ/,
  ctrl: /Server\/โรงพยาบาล/,
  dry: /เป่าฝุ่น\/ดูดฝุ่นแห้ง/,
  protect: /ป้องกันพื้นที่\/คลุมสินค้า/,
  height: /ความสูงเกิน 3/,
  lift: /บันไดพิเศษ\/นั่งร้าน/,
  ceilingOpen: /เปิดฝ้า\/ปิดฝ้า/,
  cduGroup: /คอยล์ร้อนหลายชุด/,
  heavy: /คราบน้ำมัน\/คราบหนัก/,
  ahu: /ล้าง AHU ไม่เกิน 100,000/,
};

/** Structural row type (pricebook.getCleanRates rows) so this module never imports the Pricebook. */
export type CleanRowLike = { pkg: CleanPkgId; level: 'C1' | 'C2'; type: string | null; name: string; ex: number | null; unit: string | null };

/** ex: a number = standard rate · null = ประเมินหน้างาน · 'ooh' = out of hours (มีค่าใช้จ่ายเพิ่มเติม, never a number). */
export type SectorAddOn = { key: AddOnKey; name: string; ex: number | null | 'ooh'; unit: string | null };

export function sectorAddOns(rows: readonly CleanRowLike[], keys: readonly AddOnKey[], pkg: CleanPkgId): SectorAddOn[] {
  const out: SectorAddOn[] = [];
  for (const k of keys) {
    const re = ADD_ON_MATCH[k];
    const r = rows.find(x => x.pkg === pkg && x.level === 'C1' && !x.type && re.test(x.name)) ?? rows.find(x => !x.type && re.test(x.name));
    if (!r) continue;
    out.push({ key: k, name: r.name, ex: k === 'ooh' ? 'ooh' : r.ex, unit: r.unit });
  }
  return out;
}
