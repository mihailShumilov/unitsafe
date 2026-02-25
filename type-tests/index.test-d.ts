import { expectType, expectError } from 'tsd';
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
  lt, lte, gt, gte, eq,
  valueOf,
  parse,
  type Quantity,
} from '../src/index.js';

// Use all imports to avoid unused warnings
void cm; void mm; void ms; void min; void h; void kg; void g;
void inch; void yd; void lb; void oz;
void nm; void um; void dm; void nmi; void mil; void au; void ly; void pc; void pl;
void ns; void us; void d; void week; void month; void yr; void decade; void century; void plt;
void ug; void mg; void t; void st; void ton; void lton; void dalton; void plm;
void K; void C; void F; void R; void pT;
void mm2; void cm2; void m2; void ha; void km2; void in2; void ft2; void yd2; void ac; void mi2; void pla;
void ml; void cl; void l; void m3; void tsp; void tbsp; void floz; void cup; void pt_liq; void qt; void gal; void plv;
void mps; void kmh; void fps; void mph; void kn; void pvel;
void N; void kN; void lbf; void dyn; void pfo;
void J; void kJ; void cal; void kcal; void Wh; void kWh; void eV; void BTU; void pene;
void W; void kW; void MW; void hp; void ppow;
void Pa; void kPa; void bar; void psi; void atm; void mmHg; void ppre;
void b; void B; void KB; void MB; void GB; void TB; void PB;

// ── Addition / Subtraction ──────────────────────────────────────────

// OK: same unit
expectType<Quantity<[1,0,0,0,0,0,0,0], 'm'>>(add(m(1), m(2)));
expectType<Quantity<[1,0,0,0,0,0,0,0], 'km'>>(add(km(1), km(2)));

// ERROR: different dimensions (m + s)
expectError(add(m(1), s(2)));

// OK: subtraction same unit
expectType<Quantity<[1,0,0,0,0,0,0,0], 'm'>>(sub(m(5), m(2)));

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
expectType<Quantity<[1,0,0,0,0,0,0,0], 'm'>>(m('5'));
expectType<Quantity<[1,0,0,0,0,0,0,0], 'km'>>(km('2.5'));
expectType<Quantity<[0,0,1,0,0,0,0,0], 's'>>(s('10'));
expectType<Quantity<[0,1,0,0,0,0,0,0], 'kg'>>(kg('75'));
expectType<Quantity<[0,0,0,0,0,0,0,0], 'scalar'>>(scalar('1'));

// OK: string-created quantities work with operations
expectType<Quantity<[1,0,0,0,0,0,0,0], 'm'>>(add(m('1'), m('2')));
expectType<number>(valueOf(m('5')));

// OK: parse returns a Quantity
void parse;
const parsed = parse('5 m');
expectType<number>(valueOf(parsed));

// ── US/English length units ──────────────────────────────────────────

// OK: US length factories produce Length dimension
expectType<Quantity<[1,0,0,0,0,0,0,0], 'in'>>(inch(1));
expectType<Quantity<[1,0,0,0,0,0,0,0], 'ft'>>(ft(1));
expectType<Quantity<[1,0,0,0,0,0,0,0], 'yd'>>(yd(1));
expectType<Quantity<[1,0,0,0,0,0,0,0], 'mi'>>(mi(1));

// OK: US length factories accept string values
expectType<Quantity<[1,0,0,0,0,0,0,0], 'in'>>(inch('12'));
expectType<Quantity<[1,0,0,0,0,0,0,0], 'ft'>>(ft('6'));
expectType<Quantity<[1,0,0,0,0,0,0,0], 'yd'>>(yd('100'));
expectType<Quantity<[1,0,0,0,0,0,0,0], 'mi'>>(mi('26.2'));

// OK: convert between US and metric length (same dimension)
expectType<number>(valueOf(to(m, ft(1))));
expectType<number>(valueOf(to(km, mi(1))));
expectType<number>(valueOf(to(inch, cm(100))));

// OK: add same US length units
expectType<Quantity<[1,0,0,0,0,0,0,0], 'ft'>>(add(ft(1), ft(2)));
expectType<Quantity<[1,0,0,0,0,0,0,0], 'mi'>>(add(mi(1), mi(2)));

// ERROR: add US length + time (different dimensions)
expectError(add(ft(1), s(2)));
expectError(add(mi(1), h(2)));

// ERROR: add US length + US mass (different dimensions)
expectError(add(ft(1), lb(2)));

// ERROR: convert US length to time
expectError(to(s, ft(1)));
expectError(to(h, mi(1)));

// ── US/English mass units ───────────────────────────────────────────

// OK: US mass factories produce Mass dimension
expectType<Quantity<[0,1,0,0,0,0,0,0], 'lb'>>(lb(1));
expectType<Quantity<[0,1,0,0,0,0,0,0], 'oz'>>(oz(1));

// OK: US mass factories accept string values
expectType<Quantity<[0,1,0,0,0,0,0,0], 'lb'>>(lb('150'));
expectType<Quantity<[0,1,0,0,0,0,0,0], 'oz'>>(oz('8'));

// OK: convert between US and metric mass (same dimension)
expectType<number>(valueOf(to(kg, lb(1))));
expectType<number>(valueOf(to(g, oz(1))));
expectType<number>(valueOf(to(lb, kg(1))));

// OK: add same US mass units
expectType<Quantity<[0,1,0,0,0,0,0,0], 'lb'>>(add(lb(1), lb(2)));
expectType<Quantity<[0,1,0,0,0,0,0,0], 'oz'>>(add(oz(1), oz(2)));

// ERROR: add US mass + length (different dimensions)
expectError(add(lb(1), m(2)));
expectError(add(oz(1), ft(2)));

// ERROR: convert US mass to length
expectError(to(m, lb(1)));

// ── Temperature ─────────────────────────────────────────────────────

// OK: temperature factories produce Temperature dimension
expectType<Quantity<[0,0,0,0,1,0,0,0], 'K'>>(K(273));
expectType<Quantity<[0,0,0,0,1,0,0,0], 'C'>>(C(100));
expectType<Quantity<[0,0,0,0,1,0,0,0], 'F'>>(F(212));
expectType<Quantity<[0,0,0,0,1,0,0,0], 'R'>>(R(491.67));

// OK: convert between temperature units (same dimension)
expectType<number>(valueOf(to(K, C(100))));
expectType<number>(valueOf(to(F, C(100))));

// ERROR: add temperature + length
expectError(add(K(1), m(1)));

// ERROR: convert temperature to length
expectError(to(m, K(1)));

// ── Area ────────────────────────────────────────────────────────────

// OK: area factories produce Area dimension
expectType<Quantity<[2,0,0,0,0,0,0,0], 'm2'>>(m2(1));
expectType<Quantity<[2,0,0,0,0,0,0,0], 'km2'>>(km2(1));
expectType<Quantity<[2,0,0,0,0,0,0,0], 'ft2'>>(ft2(1));

// OK: convert between area units
expectType<number>(valueOf(to(m2, km2(1))));

// ERROR: add area + length
expectError(add(m2(1), m(1)));

// ERROR: convert area to length
expectError(to(m, m2(1)));

// ── Volume ──────────────────────────────────────────────────────────

// OK: volume factories produce Volume dimension
expectType<Quantity<[3,0,0,0,0,0,0,0], 'l'>>(l(1));
expectType<Quantity<[3,0,0,0,0,0,0,0], 'm3'>>(m3(1));
expectType<Quantity<[3,0,0,0,0,0,0,0], 'gal'>>(gal(1));

// OK: convert between volume units
expectType<number>(valueOf(to(ml, l(1))));

// ERROR: add volume + area
expectError(add(l(1), m2(1)));

// ── Velocity ────────────────────────────────────────────────────────

// OK: velocity factories produce Velocity dimension
expectType<Quantity<[1,0,-1,0,0,0,0,0], 'm/s'>>(mps(1));
expectType<Quantity<[1,0,-1,0,0,0,0,0], 'km/h'>>(kmh(100));
expectType<Quantity<[1,0,-1,0,0,0,0,0], 'mph'>>(mph(60));

// OK: convert between velocity units
expectType<number>(valueOf(to(kmh, mps(1))));

// ERROR: add velocity + length
expectError(add(mps(1), m(1)));

// ── Force ───────────────────────────────────────────────────────────

// OK: force factories produce Force dimension
expectType<Quantity<[1,1,-2,0,0,0,0,0], 'N'>>(N(1));
expectType<Quantity<[1,1,-2,0,0,0,0,0], 'kN'>>(kN(1));

// ERROR: add force + pressure (different dimensions)
expectError(add(N(1), Pa(1)));

// ── Energy ──────────────────────────────────────────────────────────

// OK: energy factories produce Energy dimension
expectType<Quantity<[2,1,-2,0,0,0,0,0], 'J'>>(J(1));
expectType<Quantity<[2,1,-2,0,0,0,0,0], 'kWh'>>(kWh(1));

// ── Power ───────────────────────────────────────────────────────────

// OK: power factories produce Power dimension
expectType<Quantity<[2,1,-3,0,0,0,0,0], 'W'>>(W(1));
expectType<Quantity<[2,1,-3,0,0,0,0,0], 'hp'>>(hp(1));

// ── Pressure ────────────────────────────────────────────────────────

// OK: pressure factories produce Pressure dimension
expectType<Quantity<[-1,1,-2,0,0,0,0,0], 'Pa'>>(Pa(1));
expectType<Quantity<[-1,1,-2,0,0,0,0,0], 'atm'>>(atm(1));

// ERROR: add pressure + force
expectError(add(Pa(1), N(1)));

// ── Digital Storage ─────────────────────────────────────────────────

// OK: data factories produce Data dimension
expectType<Quantity<[0,0,0,0,0,0,0,1], 'b'>>(b(1));
expectType<Quantity<[0,0,0,0,0,0,0,1], 'B'>>(B(1));
expectType<Quantity<[0,0,0,0,0,0,0,1], 'GB'>>(GB(1));

// OK: convert between data units
expectType<number>(valueOf(to(B, KB(1))));

// ERROR: add data + length
expectError(add(B(1), m(1)));

// ERROR: convert data to length
expectError(to(m, B(1)));

// ── valueOf ─────────────────────────────────────────────────────────

expectType<number>(valueOf(m(5)));
