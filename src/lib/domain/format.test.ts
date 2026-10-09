import { describe, expect, it } from 'vitest';
import { baht, btuFmt, EX_TH, incVat, kbtu, priceOrSurvey, thousands, up100, VAT, vatOf } from './format';

describe('format', () => {
  it('VAT 7% added once, rounded to the baht', () => {
    expect(VAT).toBe(0.07);
    expect(incVat(4500)).toBe(4815);
    expect(incVat(700)).toBe(749);
    expect(incVat(0)).toBe(0);
    expect(vatOf(3800)).toBe(266);
    expect(EX_TH).toBe('ก่อน VAT');
  });
  it('up100 rounds service rates UP to the next hundred and keeps null', () => {
    expect(up100(650)).toBe(700);
    expect(up100(700)).toBe(700);
    expect(up100(701)).toBe(800);
    expect(up100(0)).toBe(0);
    expect(up100(null)).toBeNull();
    expect(up100(undefined)).toBeNull();
  });
  it('baht like the reference: ฿ + rounded en-US grouping', () => {
    expect(baht(1234)).toBe('฿1,234');
    expect(baht(1234.5)).toBe('฿1,235');
    expect(baht(700)).toBe('฿700');
    expect(baht(1000000)).toBe('฿1,000,000');
    expect(priceOrSurvey(null)).toBe('ประเมินหน้างาน');
    expect(priceOrSurvey(2500)).toBe('฿2,500');
  });
  it('BTU helpers', () => {
    expect(btuFmt(12000)).toBe('12,000 BTU');
    expect(kbtu(12000)).toBe('12k');
    expect(kbtu(9500)).toBe('9.5k');
    expect(thousands(4500)).toBe('4,500');
  });
});
