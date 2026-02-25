import { describe, it, expect } from 'vitest';
import {
  parse, valueOf,
  m, km, cm, mm, inch, ft, yd, mi,
  s, ms, min, h,
  kg, g, lb, oz,
  scalar,
} from '../src/index.js';

describe('parse — exhaustive scenarios', () => {
  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — integers
  // ═══════════════════════════════════════════════════════════════════

  describe('integer values', () => {
    it('parses single digit with every unit', () => {
      const cases: [string, number, string][] = [
        ['0 m', 0, 'm'], ['1 km', 1, 'km'], ['2 cm', 2, 'cm'],
        ['3 mm', 3, 'mm'], ['1 in', 1, 'in'], ['2 ft', 2, 'ft'],
        ['3 yd', 3, 'yd'], ['4 mi', 4, 'mi'],
        ['4 s', 4, 's'], ['5 ms', 5, 'ms'],
        ['6 min', 6, 'min'], ['7 h', 7, 'h'], ['8 kg', 8, 'kg'],
        ['9 g', 9, 'g'], ['5 lb', 5, 'lb'], ['6 oz', 6, 'oz'],
        ['1 scalar', 1, 'scalar'],
      ];
      for (const [input, val, label] of cases) {
        const q = parse(input);
        expect(valueOf(q)).toBe(val);
        expect(q._l).toBe(label);
      }
    });

    it('parses multi-digit integers', () => {
      expect(valueOf(parse('42 m'))).toBe(42);
      expect(valueOf(parse('100 km'))).toBe(100);
      expect(valueOf(parse('9999 s'))).toBe(9999);
    });

    it('parses MAX_SAFE_INTEGER', () => {
      expect(valueOf(parse('9007199254740991 m'))).toBe(9007199254740991);
    });

    it('parses a number just above MAX_SAFE_INTEGER (loses precision)', () => {
      const q = parse('9007199254740993 m');
      // JS can't represent this exactly, but parse should not throw
      expect(typeof valueOf(q)).toBe('number');
    });

    it('parses 13-digit integer', () => {
      expect(valueOf(parse('1234567890123 g'))).toBe(1234567890123);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — zero & negative zero
  // ═══════════════════════════════════════════════════════════════════

  describe('zero and negative zero', () => {
    it('parses plain zero', () => {
      expect(valueOf(parse('0 m'))).toBe(0);
    });

    it('parses 0.0', () => {
      expect(valueOf(parse('0.0 km'))).toBe(0);
    });

    it('parses -0', () => {
      const q = parse('-0 s');
      expect(valueOf(q)).toBe(-0);
      expect(Object.is(valueOf(q), -0)).toBe(true);
    });

    it('parses +0', () => {
      expect(valueOf(parse('+0 m'))).toBe(0);
    });

    it('parses 0e0', () => {
      expect(valueOf(parse('0e0 kg'))).toBe(0);
    });

    it('parses 0.00000', () => {
      expect(valueOf(parse('0.00000 mm'))).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — floats
  // ═══════════════════════════════════════════════════════════════════

  describe('floating point values', () => {
    it('parses simple decimal', () => {
      expect(valueOf(parse('3.14 m'))).toBeCloseTo(3.14);
    });

    it('parses leading dot without zero', () => {
      expect(valueOf(parse('.5 km'))).toBe(0.5);
    });

    it('parses trailing dot without fraction', () => {
      expect(valueOf(parse('5. cm'))).toBe(5);
    });

    it('parses pi to 15 decimal places', () => {
      expect(valueOf(parse('3.141592653589793 m'))).toBeCloseTo(Math.PI);
    });

    it('parses very small positive float', () => {
      expect(valueOf(parse('0.000001 kg'))).toBe(1e-6);
    });

    it('parses negative decimal', () => {
      expect(valueOf(parse('-2.718 s'))).toBeCloseTo(-2.718);
    });

    it('parses negative leading dot', () => {
      expect(valueOf(parse('-.25 g'))).toBe(-0.25);
    });

    it('parses 0.1 + 0.2 style precision edge', () => {
      const q = parse('0.30000000000000004 m');
      expect(valueOf(q)).toBe(0.1 + 0.2);
    });

    it('parses number with many trailing zeros', () => {
      expect(valueOf(parse('7.0000000000 h'))).toBe(7);
    });

    it('parses 999.999', () => {
      expect(valueOf(parse('999.999 min'))).toBeCloseTo(999.999);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — positive sign prefix
  // ═══════════════════════════════════════════════════════════════════

  describe('explicit positive sign', () => {
    it('parses +5 m', () => {
      expect(valueOf(parse('+5 m'))).toBe(5);
    });

    it('parses +0.001 km', () => {
      expect(valueOf(parse('+0.001 km'))).toBe(0.001);
    });

    it('parses +.75 s', () => {
      expect(valueOf(parse('+.75 s'))).toBe(0.75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — scientific notation
  // ═══════════════════════════════════════════════════════════════════

  describe('scientific notation', () => {
    it('lowercase e with positive exponent', () => {
      expect(valueOf(parse('1e3 m'))).toBe(1000);
    });

    it('uppercase E with positive exponent', () => {
      expect(valueOf(parse('1E3 m'))).toBe(1000);
    });

    it('explicit + in exponent', () => {
      expect(valueOf(parse('1e+3 km'))).toBe(1000);
    });

    it('negative exponent', () => {
      expect(valueOf(parse('5e-2 m'))).toBe(0.05);
    });

    it('float mantissa with exponent', () => {
      expect(valueOf(parse('1.5e2 cm'))).toBe(150);
    });

    it('leading-dot mantissa with exponent', () => {
      expect(valueOf(parse('.5e2 s'))).toBe(50);
    });

    it('negative mantissa with exponent', () => {
      expect(valueOf(parse('-3e2 kg'))).toBe(-300);
    });

    it('negative mantissa with negative exponent', () => {
      expect(valueOf(parse('-2.5e-1 g'))).toBe(-0.25);
    });

    it('zero exponent', () => {
      expect(valueOf(parse('7e0 mm'))).toBe(7);
    });

    it('very large exponent (near Number.MAX_VALUE)', () => {
      const q = parse('1.7e308 m');
      expect(valueOf(q)).toBe(1.7e308);
    });

    it('very small exponent (near Number.MIN_VALUE)', () => {
      const q = parse('5e-324 m');
      expect(valueOf(q)).toBe(5e-324);
    });

    it('exponent that produces subnormal number', () => {
      const q = parse('2.2e-308 m');
      expect(valueOf(q)).toBeCloseTo(2.2e-308);
    });

    it('uppercase E with negative exponent', () => {
      expect(valueOf(parse('9E-4 ms'))).toBeCloseTo(0.0009);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — hex, octal, binary literals
  // ═══════════════════════════════════════════════════════════════════

  describe('alternate numeric bases (JS Number() accepts these)', () => {
    it('hexadecimal 0x10 → 16', () => {
      expect(valueOf(parse('0x10 m'))).toBe(16);
    });

    it('hexadecimal 0xFF → 255', () => {
      expect(valueOf(parse('0xFF m'))).toBe(255);
    });

    it('octal 0o17 → 15', () => {
      expect(valueOf(parse('0o17 s'))).toBe(15);
    });

    it('binary 0b1010 → 10', () => {
      expect(valueOf(parse('0b1010 kg'))).toBe(10);
    });

    it('hex zero 0x0 → 0', () => {
      expect(valueOf(parse('0x0 g'))).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — Infinity
  // ═══════════════════════════════════════════════════════════════════

  describe('Infinity values', () => {
    it('parses "Infinity m"', () => {
      expect(valueOf(parse('Infinity m'))).toBe(Infinity);
    });

    it('parses "-Infinity km"', () => {
      expect(valueOf(parse('-Infinity km'))).toBe(-Infinity);
    });

    it('parses "+Infinity s"', () => {
      expect(valueOf(parse('+Infinity s'))).toBe(Infinity);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — whitespace variations
  // ═══════════════════════════════════════════════════════════════════

  describe('whitespace handling', () => {
    it('single space separator', () => {
      expect(valueOf(parse('5 m'))).toBe(5);
    });

    it('multiple spaces between value and unit', () => {
      expect(valueOf(parse('5     m'))).toBe(5);
    });

    it('tab separator', () => {
      expect(valueOf(parse('5\tm'))).toBe(5);
    });

    it('mixed tabs and spaces', () => {
      expect(valueOf(parse('5 \t  m'))).toBe(5);
    });

    it('leading spaces only', () => {
      expect(valueOf(parse('   5 m'))).toBe(5);
    });

    it('trailing spaces only', () => {
      expect(valueOf(parse('5 m   '))).toBe(5);
    });

    it('surrounded by many spaces', () => {
      expect(valueOf(parse('     5     m     '))).toBe(5);
    });

    it('newline as separator', () => {
      expect(valueOf(parse('5\nm'))).toBe(5);
    });

    it('carriage return + newline', () => {
      expect(valueOf(parse('5\r\nm'))).toBe(5);
    });

    it('leading newline', () => {
      expect(valueOf(parse('\n5 m'))).toBe(5);
    });

    it('trailing newline', () => {
      expect(valueOf(parse('5 m\n'))).toBe(5);
    });

    it('form feed as whitespace', () => {
      // \f is a whitespace character in JS
      expect(valueOf(parse('5\fm'))).toBe(5);
    });

    it('vertical tab', () => {
      expect(valueOf(parse('5\vm'))).toBe(5);
    });

    it('50 spaces between value and unit', () => {
      expect(valueOf(parse('42' + ' '.repeat(50) + 'km'))).toBe(42);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — scale factor verification
  // ═══════════════════════════════════════════════════════════════════

  describe('parsed quantity carries correct scale factor', () => {
    it('m has scale 1', () => {
      expect(parse('1 m')._s).toBe(1);
    });

    it('km has scale 1000', () => {
      expect(parse('1 km')._s).toBe(1000);
    });

    it('cm has scale 0.01', () => {
      expect(parse('1 cm')._s).toBe(0.01);
    });

    it('mm has scale 0.001', () => {
      expect(parse('1 mm')._s).toBe(0.001);
    });

    it('in has scale 0.0254', () => {
      expect(parse('1 in')._s).toBe(0.0254);
    });

    it('ft has scale 0.3048', () => {
      expect(parse('1 ft')._s).toBe(0.3048);
    });

    it('yd has scale 0.9144', () => {
      expect(parse('1 yd')._s).toBe(0.9144);
    });

    it('mi has scale 1609.344', () => {
      expect(parse('1 mi')._s).toBe(1609.344);
    });

    it('s has scale 1', () => {
      expect(parse('1 s')._s).toBe(1);
    });

    it('ms has scale 0.001', () => {
      expect(parse('1 ms')._s).toBe(0.001);
    });

    it('min has scale 60', () => {
      expect(parse('1 min')._s).toBe(60);
    });

    it('h has scale 3600', () => {
      expect(parse('1 h')._s).toBe(3600);
    });

    it('kg has scale 1', () => {
      expect(parse('1 kg')._s).toBe(1);
    });

    it('g has scale 0.001', () => {
      expect(parse('1 g')._s).toBe(0.001);
    });

    it('lb has scale 0.45359237', () => {
      expect(parse('1 lb')._s).toBe(0.45359237);
    });

    it('oz has scale 0.028349523125', () => {
      expect(parse('1 oz')._s).toBe(0.028349523125);
    });

    it('scalar has scale 1', () => {
      expect(parse('1 scalar')._s).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // BEHAVIORAL EDGE CASES — multi-token inputs
  // ═══════════════════════════════════════════════════════════════════

  describe('multi-token parsing behavior', () => {
    it('three tokens: uses first as value, last as unit', () => {
      // "5 ignored km" → value "5", unit "km"
      const q = parse('5 ignored km');
      expect(valueOf(q)).toBe(5);
      expect(q._l).toBe('km');
    });

    it('four tokens: first value, last unit', () => {
      const q = parse('10 a b s');
      expect(valueOf(q)).toBe(10);
      expect(q._l).toBe('s');
    });

    it('value followed by two valid units takes last', () => {
      const q = parse('7 m km');
      expect(valueOf(q)).toBe(7);
      expect(q._l).toBe('km');
    });

    it('numeric middle token is ignored', () => {
      const q = parse('3 99 g');
      expect(valueOf(q)).toBe(3);
      expect(q._l).toBe('g');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // INVALID — empty / whitespace-only
  // ═══════════════════════════════════════════════════════════════════

  describe('empty and whitespace-only inputs', () => {
    it('throws on empty string', () => {
      expect(() => parse('')).toThrow(TypeError);
    });

    it('throws on single space', () => {
      expect(() => parse(' ')).toThrow(TypeError);
    });

    it('throws on multiple spaces', () => {
      expect(() => parse('       ')).toThrow(TypeError);
    });

    it('throws on tab only', () => {
      expect(() => parse('\t')).toThrow(TypeError);
    });

    it('throws on newline only', () => {
      expect(() => parse('\n')).toThrow(TypeError);
    });

    it('throws on mixed whitespace only', () => {
      expect(() => parse(' \t \n \r ')).toThrow(TypeError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // INVALID — single-token inputs (no unit)
  // ═══════════════════════════════════════════════════════════════════

  describe('missing unit (single token)', () => {
    it('throws on bare integer', () => {
      expect(() => parse('5')).toThrow(TypeError);
    });

    it('throws on bare float', () => {
      expect(() => parse('3.14')).toThrow(TypeError);
    });

    it('throws on bare negative', () => {
      expect(() => parse('-7')).toThrow(TypeError);
    });

    it('throws on bare zero', () => {
      expect(() => parse('0')).toThrow(TypeError);
    });

    it('throws on bare scientific notation', () => {
      expect(() => parse('1e5')).toThrow(TypeError);
    });

    it('throws on a unit name alone (treated as single non-value token)', () => {
      expect(() => parse('m')).toThrow(TypeError);
    });

    it('throws on "km" alone', () => {
      expect(() => parse('km')).toThrow(TypeError);
    });

    it('throws on "scalar" alone', () => {
      expect(() => parse('scalar')).toThrow(TypeError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // INVALID — unknown units
  // ═══════════════════════════════════════════════════════════════════

  describe('unknown unit labels', () => {
    it('throws on "miles" (full word instead of "mi")', () => {
      expect(() => parse('5 miles')).toThrow(TypeError);
    });

    it('throws on "feet" (full word instead of "ft")', () => {
      expect(() => parse('5 feet')).toThrow(TypeError);
    });

    it('throws on "inch" (full word instead of "in")', () => {
      expect(() => parse('12 inch')).toThrow(TypeError);
    });

    it('throws on "inches" (plural instead of "in")', () => {
      expect(() => parse('12 inches')).toThrow(TypeError);
    });

    it('throws on "pounds" (full word instead of "lb")', () => {
      expect(() => parse('100 pounds')).toThrow(TypeError);
    });

    it('throws on "ounces" (full word instead of "oz")', () => {
      expect(() => parse('8 ounces')).toThrow(TypeError);
    });

    it('throws on "yard" (full word instead of "yd")', () => {
      expect(() => parse('3 yard')).toThrow(TypeError);
    });

    it('throws on "yards" (plural instead of "yd")', () => {
      expect(() => parse('3 yards')).toThrow(TypeError);
    });

    it('throws on "meter" (full word instead of "m")', () => {
      expect(() => parse('5 meter')).toThrow(TypeError);
    });

    it('throws on "meters" (plural)', () => {
      expect(() => parse('5 meters')).toThrow(TypeError);
    });

    it('throws on "second" (full word)', () => {
      expect(() => parse('10 second')).toThrow(TypeError);
    });

    it('throws on "kilogram" (full word)', () => {
      expect(() => parse('2 kilogram')).toThrow(TypeError);
    });

    it('throws on "kilometre" (British spelling)', () => {
      expect(() => parse('5 kilometre')).toThrow(TypeError);
    });

    it('throws on "celsius"', () => {
      expect(() => parse('100 celsius')).toThrow(TypeError);
    });

    it('parses "273 K" as kelvin (now supported)', () => {
      expect(valueOf(parse('273 K'))).toBe(273);
      expect(parse('273 K')._l).toBe('K');
    });

    it('parses "10 N" as newton (now supported)', () => {
      expect(valueOf(parse('10 N'))).toBe(10);
      expect(parse('10 N')._l).toBe('N');
    });

    it('parses "101325 Pa" as pascal (now supported)', () => {
      expect(valueOf(parse('101325 Pa'))).toBe(101325);
      expect(parse('101325 Pa')._l).toBe('Pa');
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // INVALID — case sensitivity
  // ═══════════════════════════════════════════════════════════════════

  describe('case sensitivity (units are case-sensitive)', () => {
    it('throws on uppercase "M" (not "m")', () => {
      expect(() => parse('5 M')).toThrow(TypeError);
    });

    it('throws on "KM"', () => {
      expect(() => parse('5 KM')).toThrow(TypeError);
    });

    it('throws on "Km"', () => {
      expect(() => parse('5 Km')).toThrow(TypeError);
    });

    it('throws on "CM"', () => {
      expect(() => parse('5 CM')).toThrow(TypeError);
    });

    it('throws on "S" (uppercase)', () => {
      expect(() => parse('5 S')).toThrow(TypeError);
    });

    it('throws on "MS" (uppercase milliseconds)', () => {
      expect(() => parse('5 MS')).toThrow(TypeError);
    });

    it('throws on "Min"', () => {
      expect(() => parse('5 Min')).toThrow(TypeError);
    });

    it('throws on "H" (uppercase hour)', () => {
      expect(() => parse('5 H')).toThrow(TypeError);
    });

    it('throws on "KG"', () => {
      expect(() => parse('5 KG')).toThrow(TypeError);
    });

    it('throws on "G" (uppercase gram)', () => {
      expect(() => parse('5 G')).toThrow(TypeError);
    });

    it('throws on "SCALAR"', () => {
      expect(() => parse('5 SCALAR')).toThrow(TypeError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // INVALID — non-numeric value token
  // ═══════════════════════════════════════════════════════════════════

  describe('non-numeric value tokens', () => {
    it('throws on alphabetic value', () => {
      expect(() => parse('abc m')).toThrow(TypeError);
    });

    it('throws on "NaN m" (NaN is not a valid number)', () => {
      expect(() => parse('NaN m')).toThrow(TypeError);
    });

    it('throws on "null m"', () => {
      expect(() => parse('null m')).toThrow(TypeError);
    });

    it('throws on "undefined m"', () => {
      expect(() => parse('undefined m')).toThrow(TypeError);
    });

    it('throws on "true m"', () => {
      expect(() => parse('true m')).toThrow(TypeError);
    });

    it('throws on "false m"', () => {
      expect(() => parse('false m')).toThrow(TypeError);
    });

    it('throws on "one m" (word number)', () => {
      expect(() => parse('one m')).toThrow(TypeError);
    });

    it('throws on "#5 m" (hash prefix)', () => {
      expect(() => parse('#5 m')).toThrow(TypeError);
    });

    it('throws on "$5 m" (dollar prefix)', () => {
      expect(() => parse('$5 m')).toThrow(TypeError);
    });

    it('throws on "5,000 m" (comma thousands separator)', () => {
      expect(() => parse('5,000 m')).toThrow(TypeError);
    });

    it('throws on "1_000 m" (underscore separator)', () => {
      expect(() => parse('1_000 m')).toThrow(TypeError);
    });

    it('throws on "5% m" (percentage)', () => {
      expect(() => parse('5% m')).toThrow(TypeError);
    });

    it('throws on "±5 m" (plus-minus sign)', () => {
      expect(() => parse('±5 m')).toThrow(TypeError);
    });

    it('throws on "½ m" (unicode fraction)', () => {
      expect(() => parse('½ m')).toThrow(TypeError);
    });

    it('throws on "٥ m" (Arabic-Indic digit 5)', () => {
      expect(() => parse('٥ m')).toThrow(TypeError);
    });

    it('throws on "五 m" (Chinese numeral 5)', () => {
      expect(() => parse('五 m')).toThrow(TypeError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // INVALID — special characters and injection
  // ═══════════════════════════════════════════════════════════════════

  describe('special characters and adversarial inputs', () => {
    it('throws on "5 m!" (punctuation in unit)', () => {
      expect(() => parse('5 m!')).toThrow(TypeError);
    });

    it('throws on emoji unit', () => {
      expect(() => parse('5 🏃')).toThrow(TypeError);
    });

    it('throws on unit with trailing newline char embedded', () => {
      // After trim+split, last token is still "m\n" if embedded mid-string?
      // Actually "5 m\nfoo" → trim → "5 m\nfoo" → split → ["5", "m", "foo"] → unit "foo"
      expect(() => parse('5 m\nfoo')).toThrow(TypeError);
    });

    it('throws on reversed order "m 5" (unit first)', () => {
      // "m" is first token (value), "5" is last token (unit)
      // Number("m") = NaN → throws
      expect(() => parse('m 5')).toThrow(TypeError);
    });

    it('throws on "5m" (no separator)', () => {
      // single token "5m" → length < 2 → throws
      expect(() => parse('5m')).toThrow(TypeError);
    });

    it('throws on "5kg" (no separator, multi-char unit)', () => {
      expect(() => parse('5kg')).toThrow(TypeError);
    });

    it('throws on SQL injection attempt', () => {
      expect(() => parse("5; DROP TABLE users; -- m")).toThrow(TypeError);
    });

    it('throws on HTML script tag', () => {
      expect(() => parse('<script>alert(1)</script> m')).toThrow(TypeError);
    });

    it('throws on JSON object as value', () => {
      expect(() => parse('{"v":5} m')).toThrow(TypeError);
    });

    it('throws on array notation as value', () => {
      expect(() => parse('[5] m')).toThrow(TypeError);
    });

    it('throws on URL-like value', () => {
      expect(() => parse('https://evil.com m')).toThrow(TypeError);
    });

    it('throws on prototype pollution key as unit', () => {
      expect(() => parse('5 __proto__')).toThrow(TypeError);
    });

    it('throws on "constructor" as unit', () => {
      expect(() => parse('5 constructor')).toThrow(TypeError);
    });

    it('throws on "toString" as unit', () => {
      expect(() => parse('5 toString')).toThrow(TypeError);
    });

    it('throws on "hasOwnProperty" as unit', () => {
      expect(() => parse('5 hasOwnProperty')).toThrow(TypeError);
    });

    it('throws on backslash in input', () => {
      expect(() => parse('5\\n m')).toThrow(TypeError);
    });

    it('throws on null byte in value', () => {
      expect(() => parse('5\0 m')).toThrow(TypeError);
    });

    it('throws on regex-like value', () => {
      expect(() => parse('/5/g m')).toThrow(TypeError);
    });

    it('throws on template literal syntax', () => {
      expect(() => parse('${5} m')).toThrow(TypeError);
    });

    it('throws on value with equals sign', () => {
      expect(() => parse('x=5 m')).toThrow(TypeError);
    });

    it('throws on semicolon-separated values', () => {
      expect(() => parse('5;3 m')).toThrow(TypeError);
    });

    it('throws on pipe character', () => {
      expect(() => parse('5|0 m')).toThrow(TypeError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // INVALID — confusing near-miss unit names
  // ═══════════════════════════════════════════════════════════════════

  describe('near-miss unit names that are NOT valid', () => {
    it('parses "5 km/h" as velocity (now supported)', () => {
      expect(valueOf(parse('5 km/h'))).toBe(5);
      expect(parse('5 km/h')._l).toBe('km/h');
    });

    it('parses "5 m/s" as velocity (now supported)', () => {
      expect(valueOf(parse('5 m/s'))).toBe(5);
      expect(parse('5 m/s')._l).toBe('m/s');
    });

    it('throws on "5 m^2"', () => {
      expect(() => parse('5 m^2')).toThrow(TypeError);
    });

    it('throws on "5 m*m"', () => {
      expect(() => parse('5 m*m')).toThrow(TypeError);
    });

    it('throws on "5 sec" (abbreviation)', () => {
      expect(() => parse('5 sec')).toThrow(TypeError);
    });

    it('throws on "5 hr" (abbreviation)', () => {
      expect(() => parse('5 hr')).toThrow(TypeError);
    });

    it('throws on "5 mins" (plural abbreviation)', () => {
      expect(() => parse('5 mins')).toThrow(TypeError);
    });

    it('throws on "5 kgs"', () => {
      expect(() => parse('5 kgs')).toThrow(TypeError);
    });

    it('throws on "5 grams"', () => {
      expect(() => parse('5 grams')).toThrow(TypeError);
    });

    it('throws on "5 Scalar" (capitalized)', () => {
      expect(() => parse('5 Scalar')).toThrow(TypeError);
    });

    it('throws on "5 milli" (prefix without base)', () => {
      expect(() => parse('5 milli')).toThrow(TypeError);
    });

    it('throws on "5 kilo"', () => {
      expect(() => parse('5 kilo')).toThrow(TypeError);
    });

    it('throws on "5 centi"', () => {
      expect(() => parse('5 centi')).toThrow(TypeError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // INVALID — overflow / underflow edge cases
  // ═══════════════════════════════════════════════════════════════════

  describe('overflow and underflow', () => {
    it('parses exponent that overflows to Infinity', () => {
      // 1e309 exceeds Number.MAX_VALUE → Infinity
      const q = parse('1e309 m');
      expect(valueOf(q)).toBe(Infinity);
    });

    it('parses negative exponent that overflows to -Infinity', () => {
      const q = parse('-1e309 m');
      expect(valueOf(q)).toBe(-Infinity);
    });

    it('parses exponent that underflows to zero', () => {
      // 1e-400 underflows to 0
      const q = parse('1e-400 m');
      expect(valueOf(q)).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — negative values across all units
  // ═══════════════════════════════════════════════════════════════════

  describe('negative values with every unit', () => {
    it('-42 m', () => {
      expect(valueOf(parse('-42 m'))).toBe(-42);
    });

    it('-0.5 km', () => {
      expect(valueOf(parse('-0.5 km'))).toBe(-0.5);
    });

    it('-100 cm', () => {
      expect(valueOf(parse('-100 cm'))).toBe(-100);
    });

    it('-1.5 mm', () => {
      expect(valueOf(parse('-1.5 mm'))).toBe(-1.5);
    });

    it('-12 in', () => {
      expect(valueOf(parse('-12 in'))).toBe(-12);
    });

    it('-6 ft', () => {
      expect(valueOf(parse('-6 ft'))).toBe(-6);
    });

    it('-100 yd', () => {
      expect(valueOf(parse('-100 yd'))).toBe(-100);
    });

    it('-26.2 mi', () => {
      expect(valueOf(parse('-26.2 mi'))).toBeCloseTo(-26.2);
    });

    it('-30 s', () => {
      expect(valueOf(parse('-30 s'))).toBe(-30);
    });

    it('-250 ms', () => {
      expect(valueOf(parse('-250 ms'))).toBe(-250);
    });

    it('-5 min', () => {
      expect(valueOf(parse('-5 min'))).toBe(-5);
    });

    it('-2 h', () => {
      expect(valueOf(parse('-2 h'))).toBe(-2);
    });

    it('-75 kg', () => {
      expect(valueOf(parse('-75 kg'))).toBe(-75);
    });

    it('-250 g', () => {
      expect(valueOf(parse('-250 g'))).toBe(-250);
    });

    it('-150 lb', () => {
      expect(valueOf(parse('-150 lb'))).toBe(-150);
    });

    it('-8 oz', () => {
      expect(valueOf(parse('-8 oz'))).toBe(-8);
    });

    it('-1 scalar', () => {
      expect(valueOf(parse('-1 scalar'))).toBe(-1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALID INPUTS — realistic physical values
  // ═══════════════════════════════════════════════════════════════════

  describe('realistic physical values', () => {
    it('speed of light components: 299792458 m', () => {
      expect(valueOf(parse('299792458 m'))).toBe(299792458);
    });

    it('Earth radius: 6371 km', () => {
      expect(valueOf(parse('6371 km'))).toBe(6371);
    });

    it('human hair width: 75000 mm → 75 mm', () => {
      expect(valueOf(parse('75 mm'))).toBe(75);
    });

    it('one year in seconds: 31557600 s', () => {
      expect(valueOf(parse('31557600 s'))).toBe(31557600);
    });

    it('light nanosecond: 0.299792 m', () => {
      expect(valueOf(parse('0.299792 m'))).toBeCloseTo(0.299792);
    });

    it('Planck time order of magnitude: 5.4e-44 s', () => {
      expect(valueOf(parse('5.4e-44 s'))).toBe(5.4e-44);
    });

    it('observable universe: 8.8e26 m', () => {
      expect(valueOf(parse('8.8e26 m'))).toBe(8.8e26);
    });

    it('mass of electron in kg: 9.109e-31 kg', () => {
      expect(valueOf(parse('9.109e-31 kg'))).toBe(9.109e-31);
    });

    it('marathon distance: 42.195 km', () => {
      expect(valueOf(parse('42.195 km'))).toBeCloseTo(42.195);
    });

    it('boiling point duration: 0.5 h', () => {
      expect(valueOf(parse('0.5 h'))).toBe(0.5);
    });

    it('microcontroller clock: 16000000 ms is silly but valid', () => {
      expect(valueOf(parse('16000000 ms'))).toBe(16000000);
    });

    it('a grain of sand: 0.067 g', () => {
      expect(valueOf(parse('0.067 g'))).toBeCloseTo(0.067);
    });

    it('sprint time: 9.58 s (Bolt record)', () => {
      expect(valueOf(parse('9.58 s'))).toBeCloseTo(9.58);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ERROR TYPE VERIFICATION
  // ═══════════════════════════════════════════════════════════════════

  describe('error types are TypeError', () => {
    it('empty string throws TypeError', () => {
      expect(() => parse('')).toThrow(TypeError);
    });

    it('unknown unit throws TypeError', () => {
      expect(() => parse('5 furlongs')).toThrow(TypeError);
    });

    it('non-numeric value throws TypeError', () => {
      expect(() => parse('hello m')).toThrow(TypeError);
    });

    it('single token throws TypeError', () => {
      expect(() => parse('42')).toThrow(TypeError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // ERROR MESSAGE CONTENT
  // ═══════════════════════════════════════════════════════════════════

  describe('error messages are descriptive', () => {
    it('empty input error mentions "empty"', () => {
      expect(() => parse('')).toThrow(/empty/i);
    });

    it('unknown unit error mentions the unit name', () => {
      expect(() => parse('5 furlongs')).toThrow(/furlongs/);
    });

    it('non-numeric error mentions the bad value', () => {
      expect(() => parse('xyz m')).toThrow(/xyz/);
    });

    it('single-token error mentions expected format', () => {
      expect(() => parse('42')).toThrow(/expected|value.*unit/i);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // UNICODE & ENCODING EDGE CASES
  // ═══════════════════════════════════════════════════════════════════

  describe('unicode edge cases', () => {
    it('throws on non-breaking space as only separator', () => {
      // \u00A0 is non-breaking space — not matched by \s in some engines,
      // but JS \s does match it. If split works, "5" and "m" are tokens.
      // This test verifies behavior rather than asserting one specific outcome.
      const input = '5\u00A0m';
      // JS RegExp \s matches \u00A0, so this should parse successfully
      expect(valueOf(parse(input))).toBe(5);
    });

    it('throws on zero-width space between value and unit', () => {
      // \u200B is zero-width space — NOT matched by \s
      // "5\u200Bm" is a single token after split on \s+
      expect(() => parse('5\u200Bm')).toThrow(TypeError);
    });

    it('throws on em space as value', () => {
      // \u2003 is em space — matched by \s
      // "\u2003 m" → trim → "m" (single token) → throws
      expect(() => parse('\u2003 m')).toThrow(TypeError);
    });

    it('throws on fullwidth digit ５ as value', () => {
      expect(() => parse('５ m')).toThrow(TypeError);
    });

    it('throws on superscript ² as value', () => {
      expect(() => parse('² m')).toThrow(TypeError);
    });

    it('throws on subscript ₅ as value', () => {
      expect(() => parse('₅ m')).toThrow(TypeError);
    });

    it('throws on Roman numeral Ⅴ as value', () => {
      expect(() => parse('Ⅴ m')).toThrow(TypeError);
    });

    it('throws on emoji number as value', () => {
      expect(() => parse('5️⃣ m')).toThrow(TypeError);
    });

    it('throws on math bold digit 𝟓 as value', () => {
      expect(() => parse('𝟓 m')).toThrow(TypeError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // IDEMPOTENCY & CONSISTENCY
  // ═══════════════════════════════════════════════════════════════════

  describe('idempotency and consistency', () => {
    it('parsing the same string twice gives equal results', () => {
      const a = parse('3.14 m');
      const b = parse('3.14 m');
      expect(valueOf(a)).toBe(valueOf(b));
      expect(a._l).toBe(b._l);
      expect(a._s).toBe(b._s);
    });

    it('parse result matches direct factory call for every unit', () => {
      const pairs: [string, ReturnType<typeof m>][] = [
        ['7.5 m', m(7.5)],
        ['7.5 km', km(7.5)],
        ['7.5 cm', cm(7.5)],
        ['7.5 mm', mm(7.5)],
        ['7.5 in', inch(7.5)],
        ['7.5 ft', ft(7.5)],
        ['7.5 yd', yd(7.5)],
        ['7.5 mi', mi(7.5)],
        ['7.5 s', s(7.5)],
        ['7.5 ms', ms(7.5)],
        ['7.5 min', min(7.5)],
        ['7.5 h', h(7.5)],
        ['7.5 kg', kg(7.5)],
        ['7.5 g', g(7.5)],
        ['7.5 lb', lb(7.5)],
        ['7.5 oz', oz(7.5)],
        ['7.5 scalar', scalar(7.5)],
      ];

      for (const [input, direct] of pairs) {
        const parsed = parse(input);
        expect(valueOf(parsed)).toBe(valueOf(direct));
        expect(parsed._l).toBe(direct._l);
        expect(parsed._s).toBe(direct._s);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // LONG & PATHOLOGICAL STRINGS
  // ═══════════════════════════════════════════════════════════════════

  describe('long and pathological strings', () => {
    it('handles a 1000-character numeric string', () => {
      const longNum = '1' + '0'.repeat(999);
      // Number(longNum) = Infinity (too many digits)
      const q = parse(longNum + ' m');
      expect(valueOf(q)).toBe(Infinity);
    });

    it('throws on 10000 random characters followed by " m"', () => {
      const garbage = Array.from({ length: 10000 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      ).join('');
      expect(() => parse(garbage + ' m')).toThrow(TypeError);
    });

    it('handles value with 100 decimal places', () => {
      const longDecimal = '0.' + '1'.repeat(100);
      const q = parse(longDecimal + ' m');
      expect(typeof valueOf(q)).toBe('number');
      expect(valueOf(q)).toBeGreaterThan(0);
      expect(valueOf(q)).toBeLessThan(1);
    });

    it('handles 500 spaces between value and unit', () => {
      const q = parse('5' + ' '.repeat(500) + 'kg');
      expect(valueOf(q)).toBe(5);
    });

    it('throws on extremely long unknown unit', () => {
      expect(() => parse('5 ' + 'x'.repeat(1000))).toThrow(TypeError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // VALUE BOUNDARY ARITHMETIC
  // ═══════════════════════════════════════════════════════════════════

  describe('IEEE 754 boundaries', () => {
    it('Number.EPSILON', () => {
      expect(valueOf(parse('2.220446049250313e-16 m'))).toBe(Number.EPSILON);
    });

    it('Number.MAX_SAFE_INTEGER as string', () => {
      expect(valueOf(parse(`${Number.MAX_SAFE_INTEGER} s`))).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('Number.MIN_SAFE_INTEGER as string', () => {
      expect(valueOf(parse(`${Number.MIN_SAFE_INTEGER} kg`))).toBe(Number.MIN_SAFE_INTEGER);
    });

    it('Number.MAX_VALUE', () => {
      expect(valueOf(parse(`${Number.MAX_VALUE} m`))).toBe(Number.MAX_VALUE);
    });

    it('Number.MIN_VALUE (smallest positive subnormal)', () => {
      expect(valueOf(parse(`${Number.MIN_VALUE} m`))).toBe(Number.MIN_VALUE);
    });

    it('-Number.MAX_VALUE', () => {
      expect(valueOf(parse(`${-Number.MAX_VALUE} g`))).toBe(-Number.MAX_VALUE);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MIXED VALID & INVALID RAPID-FIRE
  // ═══════════════════════════════════════════════════════════════════

  describe('rapid-fire mixed valid/invalid', () => {
    const valid: [string, number, string][] = [
      ['  42  km  ', 42, 'km'],
      ['+99 s', 99, 's'],
      ['-0.001 g', -0.001, 'g'],
      ['1e-10 mm', 1e-10, 'mm'],
      ['0.0 scalar', 0, 'scalar'],
      ['.1 h', 0.1, 'h'],
      ['3. min', 3, 'min'],
      ['007 m', 7, 'm'],
      ['00100 cm', 100, 'cm'],
      ['+.5e+2 kg', 50, 'kg'],
      ['12 in', 12, 'in'],
      ['5280 ft', 5280, 'ft'],
      ['100 yd', 100, 'yd'],
      ['26.2 mi', 26.2, 'mi'],
      ['150 lb', 150, 'lb'],
      ['8 oz', 8, 'oz'],
    ];

    for (const [input, expectedVal, expectedLabel] of valid) {
      it(`valid: "${input.replace(/\n/g, '\\n')}" → ${expectedVal} ${expectedLabel}`, () => {
        const q = parse(input);
        expect(valueOf(q)).toBeCloseTo(expectedVal);
        expect(q._l).toBe(expectedLabel);
      });
    }

    const invalid: string[] = [
      '', '  ', '5', 'm', '5m', 'm5',
      '5 M', '5 KM', '5 meters',
      'abc m', 'NaN s', '5,5 m',
      '5 m^2', '5 m*m',
      '--5 m', '++5 m', '5..5 m',
      '5 5 5', '. m', 'e5 m',
      '5 .', '5 1', '5 5',
    ];

    for (const input of invalid) {
      it(`invalid: "${input.replace(/\n/g, '\\n')}" throws`, () => {
        expect(() => parse(input)).toThrow();
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // QUIRKY JS Number() BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════

  describe('quirky Number() coercion behavior', () => {
    it('leading zeros: "007 m" → 7 (not octal)', () => {
      // Number("007") is 7, not octal interpretation
      expect(valueOf(parse('007 m'))).toBe(7);
    });

    it('"  +  " is not a valid number even though "+" exists', () => {
      expect(() => parse('+ m')).toThrow();
    });

    it('"  -  " alone is not valid', () => {
      expect(() => parse('- m')).toThrow();
    });

    it('" . " alone is NaN via Number()', () => {
      expect(() => parse('. m')).toThrow();
    });

    it('"e5" alone (no mantissa) is NaN', () => {
      expect(() => parse('e5 m')).toThrow();
    });

    it('"1e m" — truncated exponent is NaN', () => {
      expect(() => parse('1e m')).toThrow();
    });

    it('"--5" double negative is NaN', () => {
      expect(() => parse('--5 m')).toThrow();
    });

    it('"++5" double positive is NaN', () => {
      expect(() => parse('++5 m')).toThrow();
    });

    it('"5..5" double dot is NaN', () => {
      expect(() => parse('5..5 m')).toThrow();
    });

    it('"5e5e5" double exponent is NaN', () => {
      expect(() => parse('5e5e5 m')).toThrow();
    });

    it('"0x m" — incomplete hex is NaN', () => {
      expect(() => parse('0x m')).toThrow();
    });

    it('"0b m" — incomplete binary is NaN', () => {
      expect(() => parse('0b m')).toThrow();
    });

    it('"0o m" — incomplete octal is NaN', () => {
      expect(() => parse('0o m')).toThrow();
    });
  });

  describe('extended unit labels', () => {
    // Length
    it('parses "5 nm" as nanometers', () => {
      const r = parse('5 nm');
      expect(r._v).toBe(5);
      expect(r._l).toBe('nm');
    });

    it('parses "3 um" as micrometers', () => {
      const r = parse('3 um');
      expect(r._v).toBe(3);
      expect(r._l).toBe('um');
    });

    it('parses "10 dm" as decimeters', () => {
      const r = parse('10 dm');
      expect(r._v).toBe(10);
      expect(r._l).toBe('dm');
    });

    it('parses "2 nmi" as nautical miles', () => {
      const r = parse('2 nmi');
      expect(r._v).toBe(2);
      expect(r._l).toBe('nmi');
    });

    it('parses "100 mil" as mils', () => {
      const r = parse('100 mil');
      expect(r._v).toBe(100);
      expect(r._l).toBe('mil');
    });

    it('parses "1 au" as astronomical unit', () => {
      const r = parse('1 au');
      expect(r._v).toBe(1);
      expect(r._l).toBe('au');
    });

    it('parses "1 ly" as light-year', () => {
      const r = parse('1 ly');
      expect(r._v).toBe(1);
      expect(r._l).toBe('ly');
    });

    it('parses "1 pc" as parsec', () => {
      const r = parse('1 pc');
      expect(r._v).toBe(1);
      expect(r._l).toBe('pc');
    });

    it('parses "1 pl" as Planck length', () => {
      const r = parse('1 pl');
      expect(r._v).toBe(1);
      expect(r._l).toBe('pl');
    });

    // Mass
    it('parses "5 Da" as dalton', () => {
      const r = parse('5 Da');
      expect(r._v).toBe(5);
      expect(r._l).toBe('Da');
    });

    it('parses "10 ug" as micrograms', () => {
      const r = parse('10 ug');
      expect(r._v).toBe(10);
      expect(r._l).toBe('ug');
    });

    it('parses "500 mg" as milligrams', () => {
      const r = parse('500 mg');
      expect(r._v).toBe(500);
      expect(r._l).toBe('mg');
    });

    it('parses "2 t" as metric tonnes', () => {
      const r = parse('2 t');
      expect(r._v).toBe(2);
      expect(r._l).toBe('t');
    });

    it('parses "10 st" as stone', () => {
      const r = parse('10 st');
      expect(r._v).toBe(10);
      expect(r._l).toBe('st');
    });

    it('parses "1 ton" as US short ton', () => {
      const r = parse('1 ton');
      expect(r._v).toBe(1);
      expect(r._l).toBe('ton');
    });

    it('parses "1 lton" as long ton', () => {
      const r = parse('1 lton');
      expect(r._v).toBe(1);
      expect(r._l).toBe('lton');
    });

    it('parses "1 plm" as Planck mass', () => {
      const r = parse('1 plm');
      expect(r._v).toBe(1);
      expect(r._l).toBe('plm');
    });

    // Time
    it('parses "100 ns" as nanoseconds', () => {
      const r = parse('100 ns');
      expect(r._v).toBe(100);
      expect(r._l).toBe('ns');
    });

    it('parses "50 us" as microseconds', () => {
      const r = parse('50 us');
      expect(r._v).toBe(50);
      expect(r._l).toBe('us');
    });

    it('parses "7 d" as days', () => {
      const r = parse('7 d');
      expect(r._v).toBe(7);
      expect(r._l).toBe('d');
    });

    it('parses "2 week" as weeks', () => {
      const r = parse('2 week');
      expect(r._v).toBe(2);
      expect(r._l).toBe('week');
    });

    it('parses "6 month" as months', () => {
      const r = parse('6 month');
      expect(r._v).toBe(6);
      expect(r._l).toBe('month');
    });

    it('parses "1 yr" as years', () => {
      const r = parse('1 yr');
      expect(r._v).toBe(1);
      expect(r._l).toBe('yr');
    });

    it('parses "1 decade"', () => {
      const r = parse('1 decade');
      expect(r._v).toBe(1);
      expect(r._l).toBe('decade');
    });

    it('parses "1 century"', () => {
      const r = parse('1 century');
      expect(r._v).toBe(1);
      expect(r._l).toBe('century');
    });

    it('parses "1 plt" as Planck time', () => {
      const r = parse('1 plt');
      expect(r._v).toBe(1);
      expect(r._l).toBe('plt');
    });

    // Temperature
    it('parses "100 C" as Celsius', () => {
      const r = parse('100 C');
      expect(r._v).toBe(100);
      expect(r._l).toBe('C');
    });

    it('parses "212 F" as Fahrenheit', () => {
      const r = parse('212 F');
      expect(r._v).toBe(212);
      expect(r._l).toBe('F');
    });

    it('parses "491.67 R" as Rankine', () => {
      const r = parse('491.67 R');
      expect(r._v).toBe(491.67);
      expect(r._l).toBe('R');
    });

    it('parses "1 pT" as Planck temperature', () => {
      const r = parse('1 pT');
      expect(r._v).toBe(1);
      expect(r._l).toBe('pT');
    });

    // Area
    it('parses "100 mm2"', () => {
      const r = parse('100 mm2');
      expect(r._v).toBe(100);
      expect(r._l).toBe('mm2');
    });

    it('parses "50 cm2"', () => {
      const r = parse('50 cm2');
      expect(r._v).toBe(50);
      expect(r._l).toBe('cm2');
    });

    it('parses "1 ha"', () => {
      const r = parse('1 ha');
      expect(r._v).toBe(1);
      expect(r._l).toBe('ha');
    });

    it('parses "10 in2"', () => {
      const r = parse('10 in2');
      expect(r._v).toBe(10);
      expect(r._l).toBe('in2');
    });

    it('parses "500 ft2"', () => {
      const r = parse('500 ft2');
      expect(r._v).toBe(500);
      expect(r._l).toBe('ft2');
    });

    it('parses "1 ac" as acres', () => {
      const r = parse('1 ac');
      expect(r._v).toBe(1);
      expect(r._l).toBe('ac');
    });

    it('parses "1 mi2"', () => {
      const r = parse('1 mi2');
      expect(r._v).toBe(1);
      expect(r._l).toBe('mi2');
    });

    it('parses "1 pla" as Planck area', () => {
      const r = parse('1 pla');
      expect(r._v).toBe(1);
      expect(r._l).toBe('pla');
    });

    // Volume
    it('parses "250 ml"', () => {
      const r = parse('250 ml');
      expect(r._v).toBe(250);
      expect(r._l).toBe('ml');
    });

    it('parses "75 cl"', () => {
      const r = parse('75 cl');
      expect(r._v).toBe(75);
      expect(r._l).toBe('cl');
    });

    it('parses "1 tsp"', () => {
      const r = parse('1 tsp');
      expect(r._v).toBe(1);
      expect(r._l).toBe('tsp');
    });

    it('parses "2 tbsp"', () => {
      const r = parse('2 tbsp');
      expect(r._v).toBe(2);
      expect(r._l).toBe('tbsp');
    });

    it('parses "8 floz"', () => {
      const r = parse('8 floz');
      expect(r._v).toBe(8);
      expect(r._l).toBe('floz');
    });

    it('parses "2 cup"', () => {
      const r = parse('2 cup');
      expect(r._v).toBe(2);
      expect(r._l).toBe('cup');
    });

    it('parses "1 pt-liq" (hyphenated label)', () => {
      const r = parse('1 pt-liq');
      expect(r._v).toBe(1);
      expect(r._l).toBe('pt-liq');
    });

    it('parses "1 qt"', () => {
      const r = parse('1 qt');
      expect(r._v).toBe(1);
      expect(r._l).toBe('qt');
    });

    it('parses "1 gal"', () => {
      const r = parse('1 gal');
      expect(r._v).toBe(1);
      expect(r._l).toBe('gal');
    });

    it('parses "1 plv" as Planck volume', () => {
      const r = parse('1 plv');
      expect(r._v).toBe(1);
      expect(r._l).toBe('plv');
    });

    // Velocity
    it('parses "10 m/s" (label with slash)', () => {
      const r = parse('10 m/s');
      expect(r._v).toBe(10);
      expect(r._l).toBe('m/s');
    });

    it('parses "100 km/h" (label with slash)', () => {
      const r = parse('100 km/h');
      expect(r._v).toBe(100);
      expect(r._l).toBe('km/h');
    });

    it('parses "30 ft/s"', () => {
      const r = parse('30 ft/s');
      expect(r._v).toBe(30);
      expect(r._l).toBe('ft/s');
    });

    it('parses "60 mph"', () => {
      const r = parse('60 mph');
      expect(r._v).toBe(60);
      expect(r._l).toBe('mph');
    });

    it('parses "20 kn" as knots', () => {
      const r = parse('20 kn');
      expect(r._v).toBe(20);
      expect(r._l).toBe('kn');
    });

    it('parses "1 c" as speed of light', () => {
      const r = parse('1 c');
      expect(r._v).toBe(1);
      expect(r._l).toBe('c');
    });

    // Force
    it('parses "100 kN"', () => {
      const r = parse('100 kN');
      expect(r._v).toBe(100);
      expect(r._l).toBe('kN');
    });

    it('parses "10 lbf"', () => {
      const r = parse('10 lbf');
      expect(r._v).toBe(10);
      expect(r._l).toBe('lbf');
    });

    it('parses "1000 dyn"', () => {
      const r = parse('1000 dyn');
      expect(r._v).toBe(1000);
      expect(r._l).toBe('dyn');
    });

    it('parses "1 pfo" as Planck force', () => {
      const r = parse('1 pfo');
      expect(r._v).toBe(1);
      expect(r._l).toBe('pfo');
    });

    // Energy
    it('parses "100 kJ"', () => {
      const r = parse('100 kJ');
      expect(r._v).toBe(100);
      expect(r._l).toBe('kJ');
    });

    it('parses "500 cal"', () => {
      const r = parse('500 cal');
      expect(r._v).toBe(500);
      expect(r._l).toBe('cal');
    });

    it('parses "2000 kcal"', () => {
      const r = parse('2000 kcal');
      expect(r._v).toBe(2000);
      expect(r._l).toBe('kcal');
    });

    it('parses "1 Wh"', () => {
      const r = parse('1 Wh');
      expect(r._v).toBe(1);
      expect(r._l).toBe('Wh');
    });

    it('parses "3.5 kWh"', () => {
      const r = parse('3.5 kWh');
      expect(r._v).toBe(3.5);
      expect(r._l).toBe('kWh');
    });

    it('parses "1 eV"', () => {
      const r = parse('1 eV');
      expect(r._v).toBe(1);
      expect(r._l).toBe('eV');
    });

    it('parses "100 BTU"', () => {
      const r = parse('100 BTU');
      expect(r._v).toBe(100);
      expect(r._l).toBe('BTU');
    });

    it('parses "1 pene" as Planck energy', () => {
      const r = parse('1 pene');
      expect(r._v).toBe(1);
      expect(r._l).toBe('pene');
    });

    // Power
    it('parses "500 kW"', () => {
      const r = parse('500 kW');
      expect(r._v).toBe(500);
      expect(r._l).toBe('kW');
    });

    it('parses "1 MW"', () => {
      const r = parse('1 MW');
      expect(r._v).toBe(1);
      expect(r._l).toBe('MW');
    });

    it('parses "300 hp"', () => {
      const r = parse('300 hp');
      expect(r._v).toBe(300);
      expect(r._l).toBe('hp');
    });

    it('parses "1 ppow" as Planck power', () => {
      const r = parse('1 ppow');
      expect(r._v).toBe(1);
      expect(r._l).toBe('ppow');
    });

    // Pressure
    it('parses "100 kPa"', () => {
      const r = parse('100 kPa');
      expect(r._v).toBe(100);
      expect(r._l).toBe('kPa');
    });

    it('parses "1 bar"', () => {
      const r = parse('1 bar');
      expect(r._v).toBe(1);
      expect(r._l).toBe('bar');
    });

    it('parses "30 psi"', () => {
      const r = parse('30 psi');
      expect(r._v).toBe(30);
      expect(r._l).toBe('psi');
    });

    it('parses "1 atm"', () => {
      const r = parse('1 atm');
      expect(r._v).toBe(1);
      expect(r._l).toBe('atm');
    });

    it('parses "760 mmHg"', () => {
      const r = parse('760 mmHg');
      expect(r._v).toBe(760);
      expect(r._l).toBe('mmHg');
    });

    it('parses "1 ppre" as Planck pressure', () => {
      const r = parse('1 ppre');
      expect(r._v).toBe(1);
      expect(r._l).toBe('ppre');
    });

    // Digital Storage
    it('parses "8 b" as bits', () => {
      const r = parse('8 b');
      expect(r._v).toBe(8);
      expect(r._l).toBe('b');
    });

    it('parses "1024 KB"', () => {
      const r = parse('1024 KB');
      expect(r._v).toBe(1024);
      expect(r._l).toBe('KB');
    });

    it('parses "512 MB"', () => {
      const r = parse('512 MB');
      expect(r._v).toBe(512);
      expect(r._l).toBe('MB');
    });

    it('parses "1 TB"', () => {
      const r = parse('1 TB');
      expect(r._v).toBe(1);
      expect(r._l).toBe('TB');
    });

    it('parses "1 PB"', () => {
      const r = parse('1 PB');
      expect(r._v).toBe(1);
      expect(r._l).toBe('PB');
    });
  });
});
