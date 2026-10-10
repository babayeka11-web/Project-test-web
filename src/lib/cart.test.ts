import { beforeEach, describe, expect, it } from 'vitest';
import { cart, type CartLineInput } from './cart';

const pipe = (unitEx: number, qty: number, detail?: string): CartLineInput => ({ kind: 'addon', group: 'addon', key: 'A-PIP-PKG-1438', name: 'ท่อ', unitEx, qty, detail });
const amount = () => cart.get().lines.reduce((n, l) => n + (l.unitEx ?? 0) * l.qty, 0);

describe('cart.add merging', () => {
  beforeEach(() => cart.clear());

  it('an exact duplicate adds its quantity', () => {
    cart.add(pipe(1000, 2));
    cart.add(pipe(1000, 3));
    expect(cart.get().lines).toHaveLength(1);
    expect(cart.get().lines[0].qty).toBe(5);
  });

  it('the same key at another unit price stays a separate line, so no metres are re-priced', () => {
    cart.add(pipe(3000, 1, 'ท่อเกิน 3 เมตรต่อเครื่อง')); // install price tool: per machine
    cart.add(pipe(1000, 2)); // add-on list / price centre: per metre
    expect(cart.get().lines).toHaveLength(2);
    expect(amount()).toBe(5000);
  });

  it('the same key and price with another detail stays separate (detail never contradicts the quantity)', () => {
    cart.add({ kind: 'service', group: 'clean', key: 'CX-AHU', name: 'AHU', unitEx: 3200, qty: 1, detail: 'ล้างมาตรฐาน' });
    cart.add({ kind: 'service', group: 'clean', key: 'CX-AHU', name: 'AHU', unitEx: 3200, qty: 1, detail: 'ทะเบียนทรัพย์สิน' });
    expect(cart.get().lines).toHaveLength(2);
  });

  it('an annual contract, a rush fee and a survey request are kept once', () => {
    const contract: CartLineInput = { kind: 'service', group: 'contract', key: 'K-x', name: 'สัญญา', unitEx: 148600, qty: 1 };
    cart.add(contract);
    cart.add(contract);
    cart.add({ kind: 'survey', group: 'install', key: 'S-INS-X', name: 'สำรวจ', unitEx: null, qty: 1 });
    cart.add({ kind: 'survey', group: 'install', key: 'S-INS-X', name: 'สำรวจ', unitEx: null, qty: 1 });
    expect(cart.get().lines.map(l => [l.key, l.qty])).toEqual([
      ['K-x', 1],
      ['S-INS-X', 1],
    ]);
  });
});
