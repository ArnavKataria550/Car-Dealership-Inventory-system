import { describe, expect, it } from 'vitest';

import { centsToDollarInput, formatPrice, parseDollars } from './money';

describe('formatPrice', () => {
  it.each([
    [3_099_500, '$30,995'],
    [2_999_950, '$29,999.50'],
    [0, '$0'],
    [99, '$0.99'],
    [123_456_789_00, '$123,456,789'],
  ])('formats %i cents as %s', (cents, expected) => {
    expect(formatPrice(cents)).toBe(expected);
  });
});

describe('parseDollars', () => {
  it.each([
    ['27999', 2_799_900],
    ['27,999', 2_799_900],
    ['27,999.5', 2_799_950],
    ['27999.05', 2_799_905],
    ['$27,999.99', 2_799_999],
    ['  42  ', 4_200],
    ['0', 0],
  ])('reads %j as %i cents', (input, cents) => {
    expect(parseDollars(input)).toBe(cents);
  });

  it.each([[''], ['   '], ['abc'], ['-5'], ['12.345'], ['1.2.3'], ['12e3'], ['$']])(
    'rejects %j',
    (input) => {
      expect(parseDollars(input)).toBeNull();
    },
  );

  it('never suffers from floating-point rounding (0.29 dollars is exactly 29 cents)', () => {
    expect(parseDollars('0.29')).toBe(29);
    expect(parseDollars('1.15')).toBe(115);
  });
});

describe('centsToDollarInput', () => {
  it.each([
    [2_799_900, '27999'],
    [2_799_950, '27999.50'],
    [5, '0.05'],
  ])('turns %i cents into the editable value %j', (cents, expected) => {
    expect(centsToDollarInput(cents)).toBe(expected);
  });
});
