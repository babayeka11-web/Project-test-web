// Number and price formatting (client-safe). Port of the formatting helpers in the reference sbp-core.js.
// Every price on the site is BEFORE VAT and labelled EX_TH; VAT 7% is added once, on a quotation total.

export const VAT = 0.07;
export const EX_TH = 'ก่อน VAT';

/** Amount including VAT 7%, rounded to the baht: Math.round(n × 1.07). */
export const incVat = (n: number): number => Math.round(n * (1 + VAT));

/** The VAT part of an amount before VAT, rounded to the baht (how quotation totals split VAT). */
export const vatOf = (n: number): number => Math.round(n * VAT);

/** Service rates are rounded UP to the next 100 baht when loaded (materials keep their exact price). */
export function up100(n: number): number;
export function up100(n: number | null | undefined): number | null;
export function up100(n: number | null | undefined): number | null {
  return n == null ? null : Math.ceil(n / 100) * 100;
}

/** '฿1,234' — rounded to the baht, en-US digit grouping (same as the reference). */
export const baht = (n: number): string => '฿' + Math.round(n).toLocaleString('en-US');

/** '1,234' — digit grouping only. */
export const thousands = (n: number): string => n.toLocaleString('en-US');

/** '12,000 BTU' */
export const btuFmt = (n: number): string => n.toLocaleString('en-US') + ' BTU';

/** '12k' · '9.5k' */
export const kbtu = (n: number): string => (n / 1000).toFixed(n % 1000 ? 1 : 0) + 'k';

/** Price cell text: '฿1,200' or the survey label when there is no standard rate. */
export const priceOrSurvey = (n: number | null | undefined, survey = 'ประเมินหน้างาน'): string =>
  n == null ? survey : baht(n);
