import { describe, it, expect } from 'vitest';
import {
  m, km, cm, mm,
  nm, um, dm, nmi, mil, au, ly, pc, pl,
  inch, ft, yd, mi,
  s, ms, min, h,
  ns, us, d, week, month, yr, decade, century, plt,
  kg, g, lb, oz,
  ug, mg, t, st, ton, lton, dalton, plm,
  K, C, F, R, pT,
  mm2, cm2, m2, ha, km2, in2, ft2, yd2, ac, mi2, pla,
  ml, cl, l, m3, tsp, tbsp, floz, cup, pt_liq, qt, gal, plv,
  mps, kmh, fps, mph, kn, pvel,
  N, kN, lbf, dyn, pfo,
  J, kJ, cal, kcal, Wh, kWh, eV, BTU, pene,
  W, kW, MW, hp, ppow,
  Pa, kPa, bar, psi, atm, mmHg, ppre,
  b, B, KB, MB, GB, TB, PB,
  scalar,
  add, sub, mul, div,
  to,
  eq, lt, lte, gt, gte,
  valueOf,
  format,
  parse,
  createChecked,
} from '../src/index.js';

describe('unitsafe acceptance tests', () => {
  describe('unit factories', () => {
    it('creates quantities from unit factories', () => {
      expect(valueOf(m(5))).toBe(5);
      expect(valueOf(km(1))).toBe(1);
      expect(valueOf(s(10))).toBe(10);
      expect(valueOf(kg(2))).toBe(2);
      expect(valueOf(scalar(42))).toBe(42);
    });
  });

  describe('addition and subtraction', () => {
    it('adds same-unit quantities', () => {
      const result = add(m(1), m(2));
      expect(valueOf(result)).toBe(3);
    });

    it('subtracts same-unit quantities', () => {
      const result = sub(m(5), m(2));
      expect(valueOf(result)).toBe(3);
    });

    it('adds kilometers', () => {
      const result = add(km(1), km(2));
      expect(valueOf(result)).toBe(3);
    });
  });

  describe('multiplication and division', () => {
    it('multiplies quantities to produce composed dimensions', () => {
      const area = mul(m(3), m(4));
      expect(valueOf(area)).toBe(12);
    });

    it('divides quantities to produce composed dimensions', () => {
      const velocity = div(m(10), s(2));
      expect(valueOf(velocity)).toBe(5);
    });

    it('multiplies scalar by quantity', () => {
      const result = mul(scalar(2), m(3));
      expect(valueOf(result)).toBe(6);
    });

    it('divides quantity by scalar', () => {
      const result = div(m(6), scalar(2));
      expect(valueOf(result)).toBe(3);
    });
  });

  describe('conversions', () => {
    it('converts km to m', () => {
      const result = to(m, km(1));
      expect(valueOf(result)).toBe(1000);
    });

    it('converts m to km', () => {
      const result = to(km, m(1500));
      expect(valueOf(result)).toBeCloseTo(1.5);
    });

    it('converts cm to m', () => {
      const result = to(m, cm(100));
      expect(valueOf(result)).toBe(1);
    });

    it('converts mm to m', () => {
      const result = to(m, mm(1000));
      expect(valueOf(result)).toBe(1);
    });

    it('converts s to ms', () => {
      const result = to(ms, s(1));
      expect(valueOf(result)).toBe(1000);
    });

    it('converts h to min', () => {
      const result = to(min, h(1));
      expect(valueOf(result)).toBe(60);
    });

    it('converts kg to g', () => {
      const result = to(g, kg(1));
      expect(valueOf(result)).toBe(1000);
    });
  });

  describe('comparisons', () => {
    it('eq: equal quantities', () => {
      expect(eq(m(1), m(1))).toBe(true);
      expect(eq(m(1), m(2))).toBe(false);
    });

    it('lt: less than', () => {
      expect(lt(m(1), m(2))).toBe(true);
      expect(lt(m(2), m(1))).toBe(false);
      expect(lt(m(1), m(1))).toBe(false);
    });

    it('lte: less than or equal', () => {
      expect(lte(m(1), m(2))).toBe(true);
      expect(lte(m(1), m(1))).toBe(true);
      expect(lte(m(2), m(1))).toBe(false);
    });

    it('gt: greater than', () => {
      expect(gt(m(2), m(1))).toBe(true);
      expect(gt(m(1), m(2))).toBe(false);
    });

    it('gte: greater than or equal', () => {
      expect(gte(m(2), m(1))).toBe(true);
      expect(gte(m(1), m(1))).toBe(true);
      expect(gte(m(1), m(2))).toBe(false);
    });
  });

  describe('valueOf', () => {
    it('extracts raw number from quantity', () => {
      expect(valueOf(m(42))).toBe(42);
      expect(typeof valueOf(m(42))).toBe('number');
    });
  });

  describe('format', () => {
    it('formats quantity with unit label', () => {
      const formatted = format(m(5));
      expect(formatted).toContain('5');
      expect(formatted).toContain('m');
    });

    it('formats km quantity', () => {
      const formatted = format(km(1.5));
      expect(formatted).toContain('1.5');
      expect(formatted).toContain('km');
    });

    it('formats with precision option', () => {
      const formatted = format(m(3.14159), { precision: 2 });
      expect(formatted).toBe('3.14 m');
    });
  });

  describe('checked mode (dev runtime validation)', () => {
    it('createChecked returns factories and operations', () => {
      const checked = createChecked();
      expect(typeof checked.m).toBe('function');
      expect(typeof checked.km).toBe('function');
      expect(typeof checked.s).toBe('function');
      expect(typeof checked.add).toBe('function');
      expect(typeof checked.sub).toBe('function');
      expect(typeof checked.mul).toBe('function');
      expect(typeof checked.div).toBe('function');
      expect(typeof checked.to).toBe('function');
    });

    it('checked add works for same units', () => {
      const checked = createChecked();
      const result = checked.add(checked.m(1), checked.m(2));
      expect(checked.valueOf(result)).toBe(3);
    });

    it('checked add throws for mismatched units', () => {
      const checked = createChecked();
      expect(() => {
        checked.add(checked.m(1) as any, checked.s(1) as any);
      }).toThrow();
    });

    it('checked sub throws for mismatched units', () => {
      const checked = createChecked();
      expect(() => {
        checked.sub(checked.m(1) as any, checked.s(1) as any);
      }).toThrow();
    });

    it('checked conversion works for compatible units', () => {
      const checked = createChecked();
      const result = checked.to(checked.m, checked.km(1));
      expect(checked.valueOf(result)).toBe(1000);
    });

    it('checked conversion throws for incompatible units', () => {
      const checked = createChecked();
      expect(() => {
        checked.to(checked.s as any, checked.km(1) as any);
      }).toThrow();
    });
  });

  describe('raw string input', () => {
    describe('unit factories accept string values', () => {
      it('creates quantity from integer string', () => {
        expect(valueOf(m('5'))).toBe(5);
      });

      it('creates quantity from float string', () => {
        expect(valueOf(m('3.14'))).toBe(3.14);
      });

      it('creates quantity from negative string', () => {
        expect(valueOf(m('-10'))).toBe(-10);
      });

      it('creates quantity from string with leading/trailing whitespace', () => {
        expect(valueOf(m('  42  '))).toBe(42);
      });

      it('creates quantity from scientific notation string', () => {
        expect(valueOf(m('1e3'))).toBe(1000);
      });

      it('works with all unit factories', () => {
        expect(valueOf(km('2.5'))).toBe(2.5);
        expect(valueOf(cm('100'))).toBe(100);
        expect(valueOf(mm('500'))).toBe(500);
        expect(valueOf(s('30'))).toBe(30);
        expect(valueOf(ms('250'))).toBe(250);
        expect(valueOf(min('5'))).toBe(5);
        expect(valueOf(h('2'))).toBe(2);
        expect(valueOf(kg('75'))).toBe(75);
        expect(valueOf(g('250'))).toBe(250);
        expect(valueOf(scalar('1'))).toBe(1);
      });

      it('string-created quantities work with arithmetic', () => {
        expect(valueOf(add(m('1'), m('2')))).toBe(3);
        expect(valueOf(sub(m('5'), m('2')))).toBe(3);
        expect(valueOf(mul(m('3'), m('4')))).toBe(12);
        expect(valueOf(div(m('10'), s('2')))).toBe(5);
      });

      it('string-created quantities work with conversions', () => {
        const result = to(m, km('1.5'));
        expect(valueOf(result)).toBe(1500);
      });

      it('string-created quantities work with comparisons', () => {
        expect(eq(m('5'), m('5'))).toBe(true);
        expect(lt(m('1'), m('2'))).toBe(true);
        expect(gt(m('2'), m('1'))).toBe(true);
      });

      it('string-created quantities work with format', () => {
        expect(format(m('5'))).toBe('5 m');
        expect(format(km('1.5'))).toBe('1.5 km');
      });
    });

    describe('invalid string input throws', () => {
      it('throws on non-numeric string', () => {
        expect(() => m('abc')).toThrow();
      });

      it('throws on empty string', () => {
        expect(() => m('')).toThrow();
      });

      it('throws on whitespace-only string', () => {
        expect(() => m('   ')).toThrow();
      });

      it('throws on string with unit suffix', () => {
        expect(() => m('5 m')).toThrow();
      });
    });

    describe('parse function', () => {
      it('parses "5 m" into a meters quantity', () => {
        const result = parse('5 m');
        expect(valueOf(result)).toBe(5);
        expect(result._l).toBe('m');
      });

      it('parses "1.5 km" into a kilometers quantity', () => {
        const result = parse('1.5 km');
        expect(valueOf(result)).toBe(1.5);
        expect(result._l).toBe('km');
      });

      it('parses quantities for all built-in units', () => {
        expect(valueOf(parse('100 cm'))).toBe(100);
        expect(valueOf(parse('500 mm'))).toBe(500);
        expect(valueOf(parse('30 s'))).toBe(30);
        expect(valueOf(parse('250 ms'))).toBe(250);
        expect(valueOf(parse('5 min'))).toBe(5);
        expect(valueOf(parse('2 h'))).toBe(2);
        expect(valueOf(parse('75 kg'))).toBe(75);
        expect(valueOf(parse('250 g'))).toBe(250);
        expect(valueOf(parse('1 scalar'))).toBe(1);
      });

      it('handles negative values', () => {
        const result = parse('-10 m');
        expect(valueOf(result)).toBe(-10);
      });

      it('handles scientific notation', () => {
        const result = parse('1e3 m');
        expect(valueOf(result)).toBe(1000);
      });

      it('handles extra whitespace', () => {
        const result = parse('  5   m  ');
        expect(valueOf(result)).toBe(5);
        expect(result._l).toBe('m');
      });

      it('throws on unknown unit', () => {
        expect(() => parse('5 miles')).toThrow();
      });

      it('throws on missing value', () => {
        expect(() => parse('m')).toThrow();
      });

      it('throws on missing unit', () => {
        expect(() => parse('5')).toThrow();
      });

      it('throws on empty string', () => {
        expect(() => parse('')).toThrow();
      });

      it('throws on non-numeric value', () => {
        expect(() => parse('abc m')).toThrow();
      });
    });

    describe('checked mode with string input', () => {
      it('checked factories accept string values', () => {
        const checked = createChecked();
        expect(checked.valueOf(checked.m('5'))).toBe(5);
        expect(checked.valueOf(checked.km('2.5'))).toBe(2.5);
      });

      it('checked add works with string-created quantities', () => {
        const checked = createChecked();
        const result = checked.add(checked.m('1'), checked.m('2'));
        expect(checked.valueOf(result)).toBe(3);
      });

      it('checked parse works', () => {
        const checked = createChecked();
        const result = checked.parse('5 m');
        expect(checked.valueOf(result)).toBe(5);
        expect(result._l).toBe('m');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // US / ENGLISH UNITS
  // ═══════════════════════════════════════════════════════════════════

  describe('US/English length units', () => {
    describe('unit factories', () => {
      it('creates inch quantities', () => {
        expect(valueOf(inch(12))).toBe(12);
      });

      it('creates foot quantities', () => {
        expect(valueOf(ft(6))).toBe(6);
      });

      it('creates yard quantities', () => {
        expect(valueOf(yd(100))).toBe(100);
      });

      it('creates mile quantities', () => {
        expect(valueOf(mi(1))).toBe(1);
      });
    });

    describe('conversions to metric', () => {
      it('converts 1 inch to meters', () => {
        const result = to(m, inch(1));
        expect(valueOf(result)).toBeCloseTo(0.0254);
      });

      it('converts 1 foot to meters', () => {
        const result = to(m, ft(1));
        expect(valueOf(result)).toBeCloseTo(0.3048);
      });

      it('converts 1 yard to meters', () => {
        const result = to(m, yd(1));
        expect(valueOf(result)).toBeCloseTo(0.9144);
      });

      it('converts 1 mile to meters', () => {
        const result = to(m, mi(1));
        expect(valueOf(result)).toBeCloseTo(1609.344);
      });

      it('converts 1 mile to kilometers', () => {
        const result = to(km, mi(1));
        expect(valueOf(result)).toBeCloseTo(1.609344);
      });

      it('converts 100 cm to inches', () => {
        const result = to(inch, cm(100));
        expect(valueOf(result)).toBeCloseTo(39.3701, 3);
      });
    });

    describe('conversions between US length units', () => {
      it('converts 12 inches to feet', () => {
        const result = to(ft, inch(12));
        expect(valueOf(result)).toBeCloseTo(1);
      });

      it('converts 3 feet to yards', () => {
        const result = to(yd, ft(3));
        expect(valueOf(result)).toBeCloseTo(1);
      });

      it('converts 1760 yards to miles', () => {
        const result = to(mi, yd(1760));
        expect(valueOf(result)).toBeCloseTo(1);
      });

      it('converts 5280 feet to miles', () => {
        const result = to(mi, ft(5280));
        expect(valueOf(result)).toBeCloseTo(1);
      });

      it('converts 1 mile to feet', () => {
        const result = to(ft, mi(1));
        expect(valueOf(result)).toBeCloseTo(5280);
      });

      it('converts 1 yard to inches', () => {
        const result = to(inch, yd(1));
        expect(valueOf(result)).toBeCloseTo(36);
      });
    });

    describe('arithmetic with US length units', () => {
      it('adds same US length units', () => {
        expect(valueOf(add(ft(3), ft(4)))).toBe(7);
        expect(valueOf(add(mi(1), mi(2)))).toBe(3);
        expect(valueOf(add(inch(5), inch(7)))).toBe(12);
        expect(valueOf(add(yd(10), yd(20)))).toBe(30);
      });

      it('subtracts same US length units', () => {
        expect(valueOf(sub(ft(10), ft(3)))).toBe(7);
        expect(valueOf(sub(mi(5), mi(2)))).toBe(3);
      });

      it('multiplies US length units', () => {
        const area = mul(ft(3), ft(4));
        expect(valueOf(area)).toBe(12);
      });

      it('divides US length with time for velocity', () => {
        const speed = div(mi(60), h(1));
        expect(valueOf(speed)).toBe(60);
      });
    });

    describe('comparisons with US length units', () => {
      it('compares feet', () => {
        expect(lt(ft(1), ft(2))).toBe(true);
        expect(gt(ft(2), ft(1))).toBe(true);
        expect(eq(ft(5), ft(5))).toBe(true);
      });

      it('compares miles', () => {
        expect(lte(mi(1), mi(1))).toBe(true);
        expect(gte(mi(2), mi(1))).toBe(true);
      });
    });

    describe('format US length units', () => {
      it('formats inch quantity', () => {
        expect(format(inch(12))).toBe('12 in');
      });

      it('formats foot quantity', () => {
        expect(format(ft(6))).toBe('6 ft');
      });

      it('formats yard quantity', () => {
        expect(format(yd(100))).toBe('100 yd');
      });

      it('formats mile quantity', () => {
        expect(format(mi(26.2))).toBe('26.2 mi');
      });

      it('formats with precision', () => {
        expect(format(mi(3.14159), { precision: 2 })).toBe('3.14 mi');
      });
    });
  });

  describe('US/English mass units', () => {
    describe('unit factories', () => {
      it('creates pound quantities', () => {
        expect(valueOf(lb(150))).toBe(150);
      });

      it('creates ounce quantities', () => {
        expect(valueOf(oz(8))).toBe(8);
      });
    });

    describe('conversions to metric', () => {
      it('converts 1 pound to kilograms', () => {
        const result = to(kg, lb(1));
        expect(valueOf(result)).toBeCloseTo(0.45359237);
      });

      it('converts 1 ounce to grams', () => {
        const result = to(g, oz(1));
        expect(valueOf(result)).toBeCloseTo(28.349523125);
      });

      it('converts 1 kg to pounds', () => {
        const result = to(lb, kg(1));
        expect(valueOf(result)).toBeCloseTo(2.20462, 4);
      });

      it('converts 1000 grams to ounces', () => {
        const result = to(oz, g(1000));
        expect(valueOf(result)).toBeCloseTo(35.274, 2);
      });
    });

    describe('conversions between US mass units', () => {
      it('converts 16 ounces to pounds', () => {
        const result = to(lb, oz(16));
        expect(valueOf(result)).toBeCloseTo(1);
      });

      it('converts 1 pound to ounces', () => {
        const result = to(oz, lb(1));
        expect(valueOf(result)).toBeCloseTo(16);
      });
    });

    describe('arithmetic with US mass units', () => {
      it('adds pounds', () => {
        expect(valueOf(add(lb(5), lb(3)))).toBe(8);
      });

      it('subtracts ounces', () => {
        expect(valueOf(sub(oz(16), oz(4)))).toBe(12);
      });

      it('multiplies scalar by pounds', () => {
        expect(valueOf(mul(scalar(2), lb(5)))).toBe(10);
      });
    });

    describe('comparisons with US mass units', () => {
      it('compares pounds', () => {
        expect(lt(lb(1), lb(2))).toBe(true);
        expect(eq(lb(5), lb(5))).toBe(true);
      });

      it('compares ounces', () => {
        expect(gt(oz(8), oz(4))).toBe(true);
        expect(lte(oz(4), oz(4))).toBe(true);
      });
    });

    describe('format US mass units', () => {
      it('formats pound quantity', () => {
        expect(format(lb(150))).toBe('150 lb');
      });

      it('formats ounce quantity', () => {
        expect(format(oz(8))).toBe('8 oz');
      });

      it('formats with precision', () => {
        expect(format(lb(2.20462), { precision: 2 })).toBe('2.20 lb');
      });
    });
  });

  describe('US/English units — string input', () => {
    it('factories accept string values', () => {
      expect(valueOf(inch('12'))).toBe(12);
      expect(valueOf(ft('6'))).toBe(6);
      expect(valueOf(yd('100'))).toBe(100);
      expect(valueOf(mi('1'))).toBe(1);
      expect(valueOf(lb('150'))).toBe(150);
      expect(valueOf(oz('8'))).toBe(8);
    });

    it('factories accept float strings', () => {
      expect(valueOf(ft('5.5'))).toBe(5.5);
      expect(valueOf(mi('26.2'))).toBe(26.2);
      expect(valueOf(lb('2.5'))).toBe(2.5);
    });

    it('factories throw on invalid strings', () => {
      expect(() => inch('abc')).toThrow(TypeError);
      expect(() => ft('')).toThrow(TypeError);
      expect(() => lb('   ')).toThrow(TypeError);
      expect(() => mi('5 mi')).toThrow(TypeError);
    });

    it('string-created quantities work with conversions', () => {
      const result = to(m, ft('10'));
      expect(valueOf(result)).toBeCloseTo(3.048);
    });

    it('string-created quantities work with arithmetic', () => {
      expect(valueOf(add(ft('3'), ft('4')))).toBe(7);
      expect(valueOf(sub(lb('10'), lb('3')))).toBe(7);
    });
  });

  describe('US/English units — parse', () => {
    it('parses "12 in" into an inch quantity', () => {
      const result = parse('12 in');
      expect(valueOf(result)).toBe(12);
      expect(result._l).toBe('in');
    });

    it('parses "6 ft" into a feet quantity', () => {
      const result = parse('6 ft');
      expect(valueOf(result)).toBe(6);
      expect(result._l).toBe('ft');
    });

    it('parses "100 yd" into a yards quantity', () => {
      const result = parse('100 yd');
      expect(valueOf(result)).toBe(100);
      expect(result._l).toBe('yd');
    });

    it('parses "26.2 mi" into a miles quantity', () => {
      const result = parse('26.2 mi');
      expect(valueOf(result)).toBeCloseTo(26.2);
      expect(result._l).toBe('mi');
    });

    it('parses "150 lb" into a pounds quantity', () => {
      const result = parse('150 lb');
      expect(valueOf(result)).toBe(150);
      expect(result._l).toBe('lb');
    });

    it('parses "8 oz" into an ounces quantity', () => {
      const result = parse('8 oz');
      expect(valueOf(result)).toBe(8);
      expect(result._l).toBe('oz');
    });

    it('parsed US units carry correct scale factors', () => {
      expect(parse('1 in')._s).toBe(0.0254);
      expect(parse('1 ft')._s).toBe(0.3048);
      expect(parse('1 yd')._s).toBe(0.9144);
      expect(parse('1 mi')._s).toBe(1609.344);
      expect(parse('1 lb')._s).toBe(0.45359237);
      expect(parse('1 oz')._s).toBe(0.028349523125);
    });

    it('still throws on unknown units', () => {
      expect(() => parse('5 miles')).toThrow(TypeError);
      expect(() => parse('5 feet')).toThrow(TypeError);
      expect(() => parse('5 inches')).toThrow(TypeError);
      expect(() => parse('5 pounds')).toThrow(TypeError);
      expect(() => parse('5 ounces')).toThrow(TypeError);
      expect(() => parse('5 yards')).toThrow(TypeError);
    });
  });

  describe('US/English units — checked mode', () => {
    it('checked mode exposes US unit factories', () => {
      const checked = createChecked();
      expect(typeof checked.inch).toBe('function');
      expect(typeof checked.ft).toBe('function');
      expect(typeof checked.yd).toBe('function');
      expect(typeof checked.mi).toBe('function');
      expect(typeof checked.lb).toBe('function');
      expect(typeof checked.oz).toBe('function');
    });

    it('checked add works for same US units', () => {
      const checked = createChecked();
      const result = checked.add(checked.ft(3), checked.ft(4));
      expect(checked.valueOf(result)).toBe(7);
    });

    it('checked add throws for US length + time', () => {
      const checked = createChecked();
      expect(() => {
        checked.add(checked.ft(1) as any, checked.s(1) as any);
      }).toThrow();
    });

    it('checked add throws for US length + US mass', () => {
      const checked = createChecked();
      expect(() => {
        checked.add(checked.ft(1) as any, checked.lb(1) as any);
      }).toThrow();
    });

    it('checked conversion works between US and metric length', () => {
      const checked = createChecked();
      const result = checked.to(checked.m, checked.ft(1));
      expect(checked.valueOf(result)).toBeCloseTo(0.3048);
    });

    it('checked conversion throws for US length to mass', () => {
      const checked = createChecked();
      expect(() => {
        checked.to(checked.lb as any, checked.ft(1) as any);
      }).toThrow();
    });

    it('checked parse works with US units', () => {
      const checked = createChecked();
      const result = checked.parse('5 ft');
      expect(checked.valueOf(result)).toBe(5);
      expect(result._l).toBe('ft');
    });
  });

  describe('US/English units — real-world values', () => {
    it('marathon distance: 26.2 mi ≈ 42.195 km', () => {
      const result = to(km, mi(26.2));
      expect(valueOf(result)).toBeCloseTo(42.165, 0);
    });

    it('human height: 5 ft 10 in ≈ 1.778 m', () => {
      const totalInches = add(to(inch, ft(5)), inch(10));
      const meters = to(m, totalInches);
      expect(valueOf(meters)).toBeCloseTo(1.778, 2);
    });

    it('human weight: 150 lb ≈ 68.04 kg', () => {
      const result = to(kg, lb(150));
      expect(valueOf(result)).toBeCloseTo(68.04, 1);
    });

    it('football field: 100 yd ≈ 91.44 m', () => {
      const result = to(m, yd(100));
      expect(valueOf(result)).toBeCloseTo(91.44);
    });

    it('1 kg ≈ 35.274 oz', () => {
      const result = to(oz, kg(1));
      expect(valueOf(result)).toBeCloseTo(35.274, 2);
    });
  });

  describe('zero-cost runtime representation', () => {
    it('quantity carries value and metadata as a tiny object', () => {
      const q = m(5);
      expect(valueOf(q)).toBe(5);
      expect(typeof valueOf(q)).toBe('number');
    });

    it('quantity object has minimal footprint', () => {
      const q = m(5);
      // Only 3 runtime properties + phantom brands (which are undefined)
      expect(q._v).toBe(5);
      expect(typeof q._s).toBe('number');
      expect(typeof q._l).toBe('string');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // EXTENDED UNITS — NEW DIMENSIONS
  // ═══════════════════════════════════════════════════════════════════

  describe('new length units', () => {
    it('creates factories for all new length units', () => {
      expect(valueOf(nm(100))).toBe(100);
      expect(valueOf(um(50))).toBe(50);
      expect(valueOf(dm(10))).toBe(10);
      expect(valueOf(nmi(1))).toBe(1);
      expect(valueOf(mil(5))).toBe(5);
      expect(valueOf(au(1))).toBe(1);
      expect(valueOf(ly(1))).toBe(1);
      expect(valueOf(pc(1))).toBe(1);
      expect(valueOf(pl(1))).toBe(1);
    });

    it('converts 1000 nm to 1 um', () => {
      expect(valueOf(to(um, nm(1000)))).toBeCloseTo(1);
    });

    it('converts 10 dm to 1 m', () => {
      expect(valueOf(to(m, dm(10)))).toBeCloseTo(1);
    });

    it('converts 1 nmi to 1852 m', () => {
      expect(valueOf(to(m, nmi(1)))).toBe(1852);
    });

    it('converts 1 au to ~149597870.7 km', () => {
      expect(valueOf(to(km, au(1)))).toBeCloseTo(149597870.7, 0);
    });

    it('ly and pc valueOf returns input', () => {
      expect(valueOf(ly(2.5))).toBe(2.5);
      expect(valueOf(pc(3.14))).toBe(3.14);
    });

    it('formats new length units', () => {
      expect(format(nm(500))).toBe('500 nm');
      expect(format(nmi(1))).toBe('1 nmi');
    });
  });

  describe('new mass units', () => {
    it('creates factories for all new mass units', () => {
      expect(valueOf(ug(100))).toBe(100);
      expect(valueOf(mg(250))).toBe(250);
      expect(valueOf(t(1))).toBe(1);
      expect(valueOf(st(10))).toBe(10);
      expect(valueOf(ton(1))).toBe(1);
      expect(valueOf(lton(1))).toBe(1);
      expect(valueOf(dalton(1))).toBe(1);
      expect(valueOf(plm(1))).toBe(1);
    });

    it('converts 1000 mg to 1 g', () => {
      expect(valueOf(to(g, mg(1000)))).toBeCloseTo(1);
    });

    it('converts 1000 ug to 1 mg', () => {
      expect(valueOf(to(mg, ug(1000)))).toBeCloseTo(1);
    });

    it('converts 1 t to 1000 kg', () => {
      expect(valueOf(to(kg, t(1)))).toBe(1000);
    });

    it('converts 1 st to ~14 lb', () => {
      expect(valueOf(to(lb, st(1)))).toBeCloseTo(14, 0);
    });

    it('converts 1 ton (US short ton) to ~907.18 kg', () => {
      expect(valueOf(to(kg, ton(1)))).toBeCloseTo(907.18474, 2);
    });

    it('converts 1 lton (long ton) to ~1016.05 kg', () => {
      expect(valueOf(to(kg, lton(1)))).toBeCloseTo(1016.0469088, 2);
    });

    it('formats new mass units', () => {
      expect(format(mg(500))).toBe('500 mg');
      expect(format(t(2))).toBe('2 t');
    });
  });

  describe('new time units', () => {
    it('creates factories for all new time units', () => {
      expect(valueOf(ns(100))).toBe(100);
      expect(valueOf(us(100))).toBe(100);
      expect(valueOf(d(1))).toBe(1);
      expect(valueOf(week(1))).toBe(1);
      expect(valueOf(month(1))).toBe(1);
      expect(valueOf(yr(1))).toBe(1);
      expect(valueOf(decade(1))).toBe(1);
      expect(valueOf(century(1))).toBe(1);
      expect(valueOf(plt(1))).toBe(1);
    });

    it('converts 1 day to 86400 seconds', () => {
      expect(valueOf(to(s, d(1)))).toBe(86400);
    });

    it('converts 1 week to 7 days', () => {
      expect(valueOf(to(d, week(1)))).toBe(7);
    });

    it('converts 1 day to 24 hours', () => {
      expect(valueOf(to(h, d(1)))).toBe(24);
    });

    it('converts 1 year to 31557600 seconds', () => {
      expect(valueOf(to(s, yr(1)))).toBe(31557600);
    });

    it('formats new time units', () => {
      expect(format(d(5))).toBe('5 d');
      expect(format(yr(1))).toBe('1 yr');
    });
  });

  describe('temperature units', () => {
    it('creates factories for all temperature units', () => {
      expect(valueOf(K(273.15))).toBe(273.15);
      expect(valueOf(C(100))).toBe(100);
      expect(valueOf(F(212))).toBe(212);
      expect(valueOf(R(491.67))).toBe(491.67);
      expect(valueOf(pT(1))).toBe(1);
    });

    it('converts C(100) to F(212) — boiling point', () => {
      expect(valueOf(to(F, C(100)))).toBeCloseTo(212, 2);
    });

    it('converts F(32) to C(0) — freezing point', () => {
      expect(valueOf(to(C, F(32)))).toBeCloseTo(0, 2);
    });

    it('converts C(0) to K(273.15)', () => {
      expect(valueOf(to(K, C(0)))).toBeCloseTo(273.15, 2);
    });

    it('converts K(373.15) to C(100)', () => {
      expect(valueOf(to(C, K(373.15)))).toBeCloseTo(100, 2);
    });

    it('converts F(212) to K(373.15)', () => {
      expect(valueOf(to(K, F(212)))).toBeCloseTo(373.15, 1);
    });

    it('converts K(1) to R(1.8)', () => {
      expect(valueOf(to(R, K(1)))).toBeCloseTo(1.8, 2);
    });

    it('formats temperature units', () => {
      expect(format(K(273))).toBe('273 K');
      expect(format(C(100))).toBe('100 C');
      expect(format(F(72))).toBe('72 F');
    });
  });

  describe('area units', () => {
    it('converts 1 km2 to 1e6 m2', () => {
      expect(valueOf(to(m2, km2(1)))).toBe(1e6);
    });

    it('converts 1 m2 to 10000 cm2', () => {
      expect(valueOf(to(cm2, m2(1)))).toBe(10000);
    });

    it('converts 1 m2 to ~10.7639 ft2', () => {
      expect(valueOf(to(ft2, m2(1)))).toBeCloseTo(10.7639, 1);
    });

    it('converts 1 ac to ~4046.856 m2', () => {
      expect(valueOf(to(m2, ac(1)))).toBeCloseTo(4046.856, 0);
    });

    it('converts 1 ha to 10000 m2', () => {
      expect(valueOf(to(m2, ha(1)))).toBe(10000);
    });

    it('formats area units', () => {
      expect(format(m2(50))).toBe('50 m2');
      expect(format(km2(1))).toBe('1 km2');
      expect(format(ac(10))).toBe('10 ac');
    });
  });

  describe('volume units', () => {
    it('converts 1 l to 1000 ml', () => {
      expect(valueOf(to(ml, l(1)))).toBeCloseTo(1000);
    });

    it('converts 1 m3 to 1000 l', () => {
      expect(valueOf(to(l, m3(1)))).toBe(1000);
    });

    it('converts 1 cup to ~8 floz', () => {
      expect(valueOf(to(floz, cup(1)))).toBeCloseTo(8, 1);
    });

    it('converts 1 gal to ~16 cups', () => {
      expect(valueOf(to(cup, gal(1)))).toBeCloseTo(16, 1);
    });

    it('converts 1 tbsp to ~3 tsp', () => {
      expect(valueOf(to(tsp, tbsp(1)))).toBeCloseTo(3, 1);
    });

    it('formats volume units', () => {
      expect(format(l(2))).toBe('2 l');
      expect(format(ml(500))).toBe('500 ml');
      expect(format(gal(1))).toBe('1 gal');
    });
  });

  describe('velocity units', () => {
    it('converts 1 m/s to ~3.6 km/h', () => {
      expect(valueOf(to(kmh, mps(1)))).toBeCloseTo(3.6, 2);
    });

    it('converts 100 km/h to ~27.778 m/s', () => {
      expect(valueOf(to(mps, kmh(100)))).toBeCloseTo(27.778, 2);
    });

    it('converts 100 km/h to ~62.137 mph', () => {
      expect(valueOf(to(mph, kmh(100)))).toBeCloseTo(62.137, 1);
    });

    it('converts 1 c (speed of light) to 299792458 m/s', () => {
      expect(valueOf(to(mps, pvel(1)))).toBe(299792458);
    });

    it('formats velocity units', () => {
      expect(format(mps(10))).toBe('10 m/s');
      expect(format(kmh(100))).toBe('100 km/h');
      expect(format(mph(60))).toBe('60 mph');
    });
  });

  describe('force units', () => {
    it('converts 1 kN to 1000 N', () => {
      expect(valueOf(to(N, kN(1)))).toBe(1000);
    });

    it('converts 1 lbf to ~4.448 N', () => {
      expect(valueOf(to(N, lbf(1)))).toBeCloseTo(4.448, 2);
    });

    it('formats force units', () => {
      expect(format(N(100))).toBe('100 N');
      expect(format(kN(5))).toBe('5 kN');
    });
  });

  describe('energy units', () => {
    it('converts 1 kJ to 1000 J', () => {
      expect(valueOf(to(J, kJ(1)))).toBe(1000);
    });

    it('converts 1 kcal to 1000 cal', () => {
      expect(valueOf(to(cal, kcal(1)))).toBe(1000);
    });

    it('converts 1 Wh to 3600 J', () => {
      expect(valueOf(to(J, Wh(1)))).toBe(3600);
    });

    it('converts 1 kWh to 3600000 J', () => {
      expect(valueOf(to(J, kWh(1)))).toBe(3600000);
    });

    it('formats energy units', () => {
      expect(format(J(1000))).toBe('1000 J');
      expect(format(kWh(1))).toBe('1 kWh');
    });
  });

  describe('power units', () => {
    it('converts 1 kW to 1000 W', () => {
      expect(valueOf(to(W, kW(1)))).toBe(1000);
    });

    it('converts 1 hp to ~746 W', () => {
      expect(valueOf(to(W, hp(1)))).toBeCloseTo(745.7, 0);
    });

    it('formats power units', () => {
      expect(format(W(500))).toBe('500 W');
      expect(format(hp(1))).toBe('1 hp');
    });
  });

  describe('pressure units', () => {
    it('converts 1 kPa to 1000 Pa', () => {
      expect(valueOf(to(Pa, kPa(1)))).toBe(1000);
    });

    it('converts 1 bar to 100000 Pa', () => {
      expect(valueOf(to(Pa, bar(1)))).toBe(100000);
    });

    it('converts 1 atm to 101325 Pa', () => {
      expect(valueOf(to(Pa, atm(1)))).toBe(101325);
    });

    it('converts 1 psi to ~6894.757 Pa', () => {
      expect(valueOf(to(Pa, psi(1)))).toBeCloseTo(6894.757, 0);
    });

    it('formats pressure units', () => {
      expect(format(Pa(1013))).toBe('1013 Pa');
      expect(format(atm(1))).toBe('1 atm');
      expect(format(psi(14.7))).toBe('14.7 psi');
    });
  });

  describe('digital storage units', () => {
    it('converts 1 B to 8 b', () => {
      expect(valueOf(to(b, B(1)))).toBe(8);
    });

    it('converts 1 KB to 1024 B', () => {
      expect(valueOf(to(B, KB(1)))).toBe(1024);
    });

    it('converts 1 MB to 1024 KB', () => {
      expect(valueOf(to(KB, MB(1)))).toBe(1024);
    });

    it('converts 1 GB to 1024 MB', () => {
      expect(valueOf(to(MB, GB(1)))).toBe(1024);
    });

    it('formats digital storage units', () => {
      expect(format(B(512))).toBe('512 B');
      expect(format(GB(1))).toBe('1 GB');
      expect(format(TB(2))).toBe('2 TB');
    });
  });

  describe('cross-dimension safety for new units (checked mode)', () => {
    it('throws when adding temperature and length', () => {
      const checked = createChecked();
      expect(() => {
        checked.add(checked.K(1) as any, checked.m(1) as any);
      }).toThrow();
    });

    it('throws when adding pressure and force', () => {
      const checked = createChecked();
      expect(() => {
        checked.add(checked.Pa(1) as any, checked.N(1) as any);
      }).toThrow();
    });

    it('throws when converting temperature to length', () => {
      const checked = createChecked();
      expect(() => {
        checked.to(checked.m as any, checked.K(1) as any);
      }).toThrow();
    });
  });
});
