import { applyRate, clamp, clampCents, roundDownToDollar } from './money';

describe('roundDownToDollar', () => {
  it('rounds down, never up, to avoid false precision', () => {
    expect(roundDownToDollar(199)).toBe(100);
    expect(roundDownToDollar(100)).toBe(100);
    expect(roundDownToDollar(0)).toBe(0);
  });

  it('rounds negative amounts down (more negative), never toward zero', () => {
    expect(roundDownToDollar(-199)).toBe(-200);
    expect(roundDownToDollar(-100)).toBe(-100);
  });
});

describe('applyRate', () => {
  it('rounds to the nearest cent', () => {
    expect(applyRate(10_00, 0.15)).toBe(150);
    expect(applyRate(333, 0.1)).toBe(33);
  });
});

describe('clamp / clampCents', () => {
  it('bounds a value within [min, max]', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clampCents(-500, 0, 1000)).toBe(0);
  });
});
