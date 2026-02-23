import { expectType, expectError } from 'tsd';
import {
  m, km, cm, mm,
  s, ms, min, h,
  kg, g,
  scalar,
  add, sub, mul, div,
  to,
  lt, lte, gt, gte, eq,
  valueOf,
  parse,
  type Quantity,
} from '../src/index.js';

// Use all imports to avoid unused warnings
void cm; void mm; void ms; void min; void h; void kg; void g;

// ── Addition / Subtraction ──────────────────────────────────────────

// OK: same unit
expectType<Quantity<[1,0,0,0,0,0,0], 'm'>>(add(m(1), m(2)));
expectType<Quantity<[1,0,0,0,0,0,0], 'km'>>(add(km(1), km(2)));

// ERROR: different dimensions (m + s)
expectError(add(m(1), s(2)));

// OK: subtraction same unit
expectType<Quantity<[1,0,0,0,0,0,0], 'm'>>(sub(m(5), m(2)));

// ERROR: subtraction different dimensions
expectError(sub(m(1), s(2)));

// ── Multiplication / Division ───────────────────────────────────────

// OK: m * m => area (composed dimension)
const area = mul(m(2), m(3));
expectType<number>(valueOf(area));

// OK: m / s => velocity (composed dimension)
const velocity = div(m(10), s(2));
expectType<number>(valueOf(velocity));

// OK: scalar * m
const scaled = mul(scalar(2), m(3));
expectType<number>(valueOf(scaled));

// OK: m / scalar
const halved = div(m(6), scalar(2));
expectType<number>(valueOf(halved));

// ── Scalar ──────────────────────────────────────────────────────────

// OK: scalar operations
const scalarSum = add(scalar(5), scalar(3));
expectType<number>(valueOf(scalarSum));
const scalarProduct = mul(scalar(5), scalar(3));
expectType<number>(valueOf(scalarProduct));

// ── Conversion ──────────────────────────────────────────────────────

// OK: convert between compatible units (same dimension)
const metersFromKm = to(m, km(1));
expectType<number>(valueOf(metersFromKm));

const kmFromM = to(km, m(1500));
expectType<number>(valueOf(kmFromM));

// ERROR: convert between incompatible units (different dimensions)
expectError(to(s, km(1)));

// ── Raw number leak ─────────────────────────────────────────────────

// ERROR: raw number should not be accepted as quantity
expectError(add(1 as number, m(2)));
expectError(add(m(1), 1 as number));
expectError(sub(1 as number, m(2)));

// ── Comparisons ─────────────────────────────────────────────────────

// OK: compare same dimension
expectType<boolean>(lt(m(1), m(2)));
expectType<boolean>(gt(m(2), m(1)));

// ERROR: compare different dimensions
expectError(lt(m(1), s(2)));
expectError(gt(m(1), s(2)));
expectError(lte(m(1), s(2)));
expectError(gte(m(1), s(2)));
expectError(eq(m(1), s(2)));

// ── String input ──────────────────────────────────────────────────

// OK: factories accept string values
expectType<Quantity<[1,0,0,0,0,0,0], 'm'>>(m('5'));
expectType<Quantity<[1,0,0,0,0,0,0], 'km'>>(km('2.5'));
expectType<Quantity<[0,0,1,0,0,0,0], 's'>>(s('10'));
expectType<Quantity<[0,1,0,0,0,0,0], 'kg'>>(kg('75'));
expectType<Quantity<[0,0,0,0,0,0,0], 'scalar'>>(scalar('1'));

// OK: string-created quantities work with operations
expectType<Quantity<[1,0,0,0,0,0,0], 'm'>>(add(m('1'), m('2')));
expectType<number>(valueOf(m('5')));

// OK: parse returns a Quantity
void parse;
const parsed = parse('5 m');
expectType<number>(valueOf(parsed));

// ── valueOf ─────────────────────────────────────────────────────────

expectType<number>(valueOf(m(5)));
