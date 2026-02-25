# unitsafe

**Compile-time dimension safety for TypeScript.** Prevents invalid operations like `meters + seconds` at compile time. Catches unit mismatches before your code ever runs.

```typescript
import { m, km, s, add, div, to, valueOf } from 'unitsafe';

const speed = div(m(100), s(10));      // OK: m/s
const total = add(km(10), km(32));     // OK: same unit
const converted = to(m, km(1.5));      // OK: 1500 m

add(m(1), s(2));   // Compile error: cannot add length and time
to(s, km(1));      // Compile error: cannot convert length to time
add(1, m(2));      // Compile error: raw number rejected
```

---

## Table of Contents

- [Motivation](#motivation)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Unit Factories](#unit-factories)
  - [Arithmetic Operations](#arithmetic-operations)
  - [Unit Conversion](#unit-conversion)
  - [Comparisons](#comparisons)
  - [Helpers](#helpers)
  - [parse()](#parseinput--parse-a-value-unit-string)
  - [Checked Mode](#checked-mode-development-runtime-validation)
- [Worked Examples](#worked-examples)
- [Unit Reference](#unit-reference)
- [How the Type System Works](#how-the-type-system-works)
  - [Dimension Vectors](#dimension-vectors)
  - [Type-Level Arithmetic](#type-level-arithmetic)
  - [Branding and Type Safety](#branding-and-type-safety)
  - [Runtime Representation](#runtime-representation)
- [Performance](#performance)
  - [Benchmark Methodology](#benchmark-methodology)
  - [Benchmark Results](#benchmark-results)
  - [Why the Overhead Exists](#why-the-overhead-exists)
  - [When It Matters (and When It Doesn't)](#when-it-matters-and-when-it-doesnt)
  - [V8 Optimization Notes](#v8-optimization-notes)
  - [Running Benchmarks Yourself](#running-benchmarks-yourself)
- [Testing](#testing)
  - [Test Architecture](#test-architecture)
  - [Runtime Tests](#runtime-tests)
  - [Type-Level Tests](#type-level-tests)
  - [Running Tests](#running-tests)
- [Bundle Size](#bundle-size)
- [Design Decisions](#design-decisions)
- [Limitations](#limitations-v01)
- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Motivation

Physical quantities have dimensions. Meters measure length. Seconds measure time. You can't add them — it's physically meaningless. Yet most programs represent both as plain `number`, and the compiler can't help you catch the mistake.

**unitsafe** encodes dimensional information into TypeScript's type system. The compiler rejects invalid operations at build time, and the library provides ergonomic unit conversions with runtime metadata for display and formatting.

**Why not just use plain numbers with naming conventions?**

- `distanceMeters + timeSeconds` compiles and runs silently, producing garbage
- Naming conventions don't compose: what type should `distanceMeters / timeSeconds` have?
- Off-by-one scale errors (forgetting to convert km to m) are invisible until production

**unitsafe gives you:**

- **Compile-time errors** for dimension mismatches (add/sub/compare)
- **Automatic dimension composition** for multiply/divide (m/s, m^2, kg*m/s^2)
- **Type-safe conversions** between compatible units (km <-> m, s <-> ms, C <-> F)
- **Branded types** that prevent accidental mixing of raw numbers with quantities
- **Tiny runtime** — each quantity is a 4-property object; no classes, no prototypes

---

## Installation

```bash
# npm
npm install unitsafe

# pnpm
pnpm add unitsafe

# yarn
yarn add unitsafe
```

**Requirements:** TypeScript 5.5+ and Node.js 20+. See [Requirements](#requirements) for details.

---

## Quick Start

```typescript
import {
  m, km, cm, mm,           // metric length
  inch, ft, yd, mi,        // US/English length
  s, ms, min, h,            // time units
  kg, g,                     // metric mass
  lb, oz,                    // US/English mass
  C, K, F,                   // temperature
  J, kWh,                    // energy
  Pa, atm,                   // pressure
  B, GB,                     // digital storage
  scalar,                    // dimensionless
  add, sub, mul, div,        // arithmetic
  to,                        // conversion
  eq, lt, lte, gt, gte,      // comparisons
  valueOf, format,           // extraction
} from 'unitsafe';

// Create quantities using unit factories
const distance = km(42.195);    // marathon distance
const time = h(2);              // 2 hours

// Divide to get speed (dimension: length/time)
const speed = div(distance, time);

// Convert to different units
const distanceInMeters = to(m, distance);
console.log(valueOf(distanceInMeters));   // 42195
console.log(format(distanceInMeters));    // "42195 m"

// Add same-unit quantities
const totalDistance = add(km(10), km(32.195));
console.log(format(totalDistance));        // "42.195 km"

// Scale a quantity
const doubled = mul(scalar(2), km(5));
console.log(format(doubled));             // "10 km"

// Compare quantities
console.log(lt(m(1), m(2)));   // true
console.log(gte(kg(5), kg(5))); // true

// Temperature conversion (affine — uses offset internally)
const boiling = to(K, C(100));
console.log(valueOf(boiling));             // 373.15
```

---

## API Reference

### Unit Factories

Each factory creates a `Quantity` value branded with the corresponding dimension and unit label. The returned quantity stores the numeric value alongside the unit's SI scale factor, label, and SI offset.

**110 built-in unit factories** organized by dimension:

#### Length (17 units)

| Factory      | Label | Dimension | SI Scale (m) | Example |
|-------------|-------|-----------|-------------|---------|
| `m(v)`      | `m`   | Length    | 1           | `m(5)` |
| `km(v)`     | `km`  | Length    | 1000        | `km(1)` |
| `cm(v)`     | `cm`  | Length    | 0.01        | `cm(100)` |
| `mm(v)`     | `mm`  | Length    | 0.001       | `mm(5)` |
| `nm(v)`     | `nm`  | Length    | 1e-9        | `nm(500)` |
| `um(v)`     | `um`  | Length    | 1e-6        | `um(1)` |
| `dm(v)`     | `dm`  | Length    | 0.1         | `dm(10)` |
| `inch(v)`   | `in`  | Length    | 0.0254      | `inch(12)` |
| `ft(v)`     | `ft`  | Length    | 0.3048      | `ft(6)` |
| `yd(v)`     | `yd`  | Length    | 0.9144      | `yd(100)` |
| `mi(v)`     | `mi`  | Length    | 1609.344    | `mi(1)` |
| `nmi(v)`    | `nmi` | Length    | 1852        | `nmi(1)` |
| `mil(v)`    | `mil` | Length    | 2.54e-5     | `mil(1000)` |
| `au(v)`     | `au`  | Length    | 1.495978707e11 | `au(1)` |
| `ly(v)`     | `ly`  | Length    | 9.4607304725808e15 | `ly(1)` |
| `pc(v)`     | `pc`  | Length    | 3.0856775814913673e16 | `pc(1)` |
| `pl(v)`     | `pl`  | Length    | 1.616255e-35 | `pl(1)` |

#### Mass (12 units)

| Factory      | Label  | Dimension | SI Scale (kg) | Example |
|-------------|--------|-----------|--------------|---------|
| `kg(v)`     | `kg`   | Mass      | 1            | `kg(80)` |
| `g(v)`      | `g`    | Mass      | 0.001        | `g(500)` |
| `mg(v)`     | `mg`   | Mass      | 1e-6         | `mg(500)` |
| `ug(v)`     | `ug`   | Mass      | 1e-9         | `ug(1)` |
| `t(v)`      | `t`    | Mass      | 1000         | `t(2)` |
| `lb(v)`     | `lb`   | Mass      | 0.45359237   | `lb(150)` |
| `oz(v)`     | `oz`   | Mass      | 0.028349523125 | `oz(8)` |
| `st(v)`     | `st`   | Mass      | 6.35029318   | `st(14)` |
| `ton(v)`    | `ton`  | Mass      | 907.18474    | `ton(1)` |
| `lton(v)`   | `lton` | Mass      | 1016.0469088 | `lton(1)` |
| `dalton(v)` | `Da`   | Mass      | 1.6605390666e-27 | `dalton(1)` |
| `plm(v)`    | `plm`  | Mass      | 2.176434e-8  | `plm(1)` |

#### Time (13 units)

| Factory       | Label     | Dimension | SI Scale (s) | Example |
|--------------|-----------|-----------|-------------|---------|
| `s(v)`       | `s`       | Time      | 1           | `s(60)` |
| `ms(v)`      | `ms`      | Time      | 0.001       | `ms(500)` |
| `ns(v)`      | `ns`      | Time      | 1e-9        | `ns(1)` |
| `us(v)`      | `us`      | Time      | 1e-6        | `us(1)` |
| `min(v)`     | `min`     | Time      | 60          | `min(5)` |
| `h(v)`       | `h`       | Time      | 3600        | `h(2)` |
| `d(v)`       | `d`       | Time      | 86400       | `d(7)` |
| `week(v)`    | `week`    | Time      | 604800      | `week(1)` |
| `month(v)`   | `month`   | Time      | 2629800     | `month(1)` |
| `yr(v)`      | `yr`      | Time      | 31557600    | `yr(1)` |
| `decade(v)`  | `decade`  | Time      | 315576000   | `decade(1)` |
| `century(v)` | `century` | Time      | 3155760000  | `century(1)` |
| `plt(v)`     | `plt`     | Time      | 5.391247e-44 | `plt(1)` |

#### Temperature (5 units)

Temperature conversions use an **affine formula** (`SI = value × scale + offset`) rather than pure scaling. See [Unit Conversion](#unit-conversion).

| Factory  | Label | SI Scale (K) | SI Offset (K) | Example |
|---------|-------|-------------|--------------|---------|
| `K(v)`  | `K`   | 1           | 0            | `K(273)` |
| `C(v)`  | `C`   | 1           | 273.15       | `C(100)` |
| `F(v)`  | `F`   | 5/9         | 255.372...   | `F(212)` |
| `R(v)`  | `R`   | 5/9         | 0            | `R(491.67)` |
| `pT(v)` | `pT`  | 1.416784e32 | 0            | `pT(1)` |

#### Area (11 units)

| Factory    | Label  | Dimension | SI Scale (m²) | Example |
|-----------|--------|-----------|--------------|---------|
| `mm2(v)`  | `mm2`  | Area      | 1e-6         | `mm2(1)` |
| `cm2(v)`  | `cm2`  | Area      | 1e-4         | `cm2(1)` |
| `m2(v)`   | `m2`   | Area      | 1            | `m2(10)` |
| `ha(v)`   | `ha`   | Area      | 10000        | `ha(1)` |
| `km2(v)`  | `km2`  | Area      | 1e6          | `km2(1)` |
| `in2(v)`  | `in2`  | Area      | 6.4516e-4    | `in2(1)` |
| `ft2(v)`  | `ft2`  | Area      | 0.09290304   | `ft2(1)` |
| `yd2(v)`  | `yd2`  | Area      | 0.83612736   | `yd2(1)` |
| `ac(v)`   | `ac`   | Area      | 4046.8564224 | `ac(1)` |
| `mi2(v)`  | `mi2`  | Area      | 2589988.110336 | `mi2(1)` |
| `pla(v)`  | `pla`  | Area      | 2.6121e-70   | `pla(1)` |

#### Volume (12 units)

| Factory      | Label    | Dimension | SI Scale (m³) | Example |
|-------------|----------|-----------|--------------|---------|
| `ml(v)`     | `ml`     | Volume    | 1e-6         | `ml(250)` |
| `cl(v)`     | `cl`     | Volume    | 1e-5         | `cl(33)` |
| `l(v)`      | `l`      | Volume    | 0.001        | `l(2)` |
| `m3(v)`     | `m3`     | Volume    | 1            | `m3(1)` |
| `tsp(v)`    | `tsp`    | Volume    | 4.92892159375e-6 | `tsp(3)` |
| `tbsp(v)`   | `tbsp`   | Volume    | 1.47867647813e-5 | `tbsp(2)` |
| `floz(v)`   | `floz`   | Volume    | 2.95735295625e-5 | `floz(8)` |
| `cup(v)`    | `cup`    | Volume    | 2.365882365e-4 | `cup(2)` |
| `pt_liq(v)` | `pt`     | Volume    | 4.73176473e-4  | `pt_liq(1)` |
| `qt(v)`     | `qt`     | Volume    | 9.46352946e-4  | `qt(1)` |
| `gal(v)`    | `gal`    | Volume    | 0.003785411784 | `gal(1)` |
| `plv(v)`    | `plv`    | Volume    | 4.2217e-105  | `plv(1)` |

#### Velocity (6 units)

| Factory    | Label  | Dimension | SI Scale (m/s) | Example |
|-----------|--------|-----------|---------------|---------|
| `mps(v)`  | `m/s`  | Velocity  | 1             | `mps(10)` |
| `kmh(v)`  | `km/h` | Velocity  | 1/3.6         | `kmh(100)` |
| `fps(v)`  | `ft/s` | Velocity  | 0.3048        | `fps(10)` |
| `mph(v)`  | `mph`  | Velocity  | 0.44704       | `mph(60)` |
| `kn(v)`   | `kn`   | Velocity  | 0.514444...   | `kn(1)` |
| `pvel(v)` | `c`    | Velocity  | 299792458     | `pvel(1)` |

#### Force (5 units)

| Factory   | Label | Dimension | SI Scale (N) | Example |
|----------|-------|-----------|-------------|---------|
| `N(v)`   | `N`   | Force     | 1           | `N(100)` |
| `kN(v)`  | `kN`  | Force     | 1000        | `kN(5)` |
| `lbf(v)` | `lbf` | Force     | 4.44822162  | `lbf(1)` |
| `dyn(v)` | `dyn` | Force     | 1e-5        | `dyn(1)` |
| `pfo(v)` | `pfo` | Force     | 1.21027e44  | `pfo(1)` |

#### Energy (9 units)

| Factory     | Label  | Dimension | SI Scale (J) | Example |
|------------|--------|-----------|-------------|---------|
| `J(v)`     | `J`    | Energy    | 1           | `J(500)` |
| `kJ(v)`    | `kJ`   | Energy    | 1000        | `kJ(1)` |
| `cal(v)`   | `cal`  | Energy    | 4.184       | `cal(200)` |
| `kcal(v)`  | `kcal` | Energy    | 4184        | `kcal(2)` |
| `Wh(v)`    | `Wh`   | Energy    | 3600        | `Wh(1)` |
| `kWh(v)`   | `kWh`  | Energy    | 3600000     | `kWh(1)` |
| `eV(v)`    | `eV`   | Energy    | 1.602176634e-19 | `eV(1)` |
| `BTU(v)`   | `BTU`  | Energy    | 1055.05585262 | `BTU(1)` |
| `pene(v)`  | `pene` | Energy    | 1.9562e9    | `pene(1)` |

#### Power (5 units)

| Factory    | Label | Dimension | SI Scale (W) | Example |
|-----------|-------|-----------|-------------|---------|
| `W(v)`    | `W`   | Power     | 1           | `W(100)` |
| `kW(v)`   | `kW`  | Power     | 1000        | `kW(5)` |
| `MW(v)`   | `MW`  | Power     | 1e6         | `MW(1)` |
| `hp(v)`   | `hp`  | Power     | 745.69987   | `hp(1)` |
| `ppow(v)` | `ppow`| Power     | 3.6282e52   | `ppow(1)` |

#### Pressure (7 units)

| Factory     | Label  | Dimension | SI Scale (Pa) | Example |
|------------|--------|-----------|--------------|---------|
| `Pa(v)`    | `Pa`   | Pressure  | 1            | `Pa(101325)` |
| `kPa(v)`   | `kPa`  | Pressure  | 1000         | `kPa(101.325)` |
| `bar(v)`   | `bar`  | Pressure  | 1e5          | `bar(1)` |
| `psi(v)`   | `psi`  | Pressure  | 6894.757...  | `psi(14.7)` |
| `atm(v)`   | `atm`  | Pressure  | 101325       | `atm(1)` |
| `mmHg(v)`  | `mmHg` | Pressure  | 133.322...   | `mmHg(760)` |
| `ppre(v)`  | `ppre` | Pressure  | 3.6282e113   | `ppre(1)` |

#### Digital Storage (7 units)

Binary convention: 1 KB = 1024 B, 1 MB = 1024 KB, etc.

| Factory   | Label | Dimension | SI Scale (bits) | Example |
|----------|-------|-----------|----------------|---------|
| `b(v)`   | `b`   | Data      | 1              | `b(8)` |
| `B(v)`   | `B`   | Data      | 8              | `B(1)` |
| `KB(v)`  | `KB`  | Data      | 8192           | `KB(1)` |
| `MB(v)`  | `MB`  | Data      | 8388608        | `MB(1)` |
| `GB(v)`  | `GB`  | Data      | 8589934592     | `GB(4)` |
| `TB(v)`  | `TB`  | Data      | 8796093022208  | `TB(1)` |
| `PB(v)`  | `PB`  | Data      | ~9.0072e15     | `PB(1)` |

**Note:** The `inch` factory produces quantities with label `'in'`. The export name is `inch` because `in` is a reserved keyword in JavaScript. Similarly, `dalton` produces label `'Da'`.

**Signature:**
```typescript
function m(value: number | string): Quantity<DimLength, 'm'>
function km(value: number | string): Quantity<DimLength, 'km'>
function inch(value: number | string): Quantity<DimLength, 'in'>
function ft(value: number | string): Quantity<DimLength, 'ft'>
// ... etc.
```

All 110 factories accept either a `number` or a numeric `string`. String values are trimmed of whitespace before parsing. Scientific notation is supported. Non-numeric strings throw a `TypeError`.

```typescript
m(5)         // number input
m('5')       // string input — same result
m('3.14')    // float string
m('-10')     // negative string
m('1e3')     // scientific notation → 1000
m('  42  ')  // whitespace trimmed → 42

m('abc')     // TypeError: "abc" is not a number
m('')        // TypeError: empty string
m('5 m')     // TypeError: "5 m" is not a number (use parse() instead)
```

Each factory is also a `UnitFactory` object with metadata properties:

```typescript
m._scale   // 1
m._label   // 'm'
m._dim     // [1, 0, 0, 0, 0, 0, 0, 0]
m._offset  // 0

C._scale   // 1
C._offset  // 273.15  (K offset for Celsius)
```

### Arithmetic Operations

#### `add(a, b)` — Addition

Adds two quantities. **Both operands must have the same dimension and unit label.** Returns a quantity of the same type.

```typescript
add(m(1), m(2))     // OK: Quantity<DimLength, 'm'> — value 3
add(km(5), km(3))   // OK: Quantity<DimLength, 'km'> — value 8

add(m(1), s(2))     // COMPILE ERROR: different dimensions
add(m(1), km(2))    // COMPILE ERROR: different labels (convert first)
add(1, m(2))        // COMPILE ERROR: raw number rejected
```

To add quantities in different units of the same dimension, convert first:

```typescript
add(m(500), to(m, km(1)))  // OK: 500 + 1000 = 1500 m
```

#### `sub(a, b)` — Subtraction

Subtracts two quantities. Same constraints as `add`.

```typescript
sub(m(5), m(2))     // OK: value 3
sub(m(1), s(2))     // COMPILE ERROR
```

#### `mul(a, b)` — Multiplication

Multiplies two quantities. Dimensions are **composed** (exponents added). Accepts any combination of dimensions.

```typescript
mul(m(3), m(4))         // Area:     Quantity<[2,0,0,...], 'm*m'> — value 12
mul(kg(10), m(5))       // kg*m:     Quantity<[1,1,0,...], 'kg*m'>
mul(scalar(2), km(5))   // Scaling:  Quantity<[1,0,0,...], 'scalar*km'> — value 10
```

#### `div(a, b)` — Division

Divides two quantities. Dimensions are composed (exponents subtracted).

```typescript
div(m(10), s(2))        // Velocity: Quantity<[1,0,-1,...], 'm/s'> — value 5
div(m(6), scalar(2))    // Scaling:  Quantity<[1,0,0,...], 'm/scalar'> — value 3
```

### Unit Conversion

#### `to(target, quantity)` — Convert Between Compatible Units

Converts a quantity to a different unit of the **same dimension**. The first argument is the target unit factory; the second is the source quantity.

**Conversion formula (general, supports affine offsets):**

```
result = (sourceValue × sourceScale + sourceOffset − targetOffset) / targetScale
```

For most units `sourceOffset` and `targetOffset` are both 0, reducing to the familiar `sourceValue × sourceScale / targetScale`. Temperature units (Celsius, Fahrenheit) carry non-zero offsets.

```typescript
to(m, km(1))         // 1000 m  (1 × 1000 / 1)
to(km, m(1500))      // 1.5 km  (1500 × 1 / 1000)
to(cm, m(2.5))       // 250 cm  (2.5 × 1 / 0.01)
to(g, kg(1))         // 1000 g  (1 × 1 / 0.001)
to(min, h(1))        // 60 min  (1 × 3600 / 60)
to(ms, s(1))         // 1000 ms (1 × 1 / 0.001)

// US/English ↔ Metric conversions
to(m, ft(1))         // 0.3048 m
to(km, mi(1))        // 1.609344 km
to(kg, lb(1))        // 0.45359237 kg
to(ft, mi(1))        // 5280 ft

// Temperature (affine — uses offset)
to(K, C(100))        // 373.15 K
to(C, K(373.15))     // 100 C
to(F, C(100))        // 212 F
to(C, F(32))         // 0 C

// Digital storage
to(B, KB(1))         // 1024 B

to(s, km(1))         // COMPILE ERROR: length ≠ time
to(lb, ft(1))        // COMPILE ERROR: mass ≠ length
```

### Comparisons

All comparisons require both operands to have the same dimension and unit label.

| Function | Operation | Example |
|----------|-----------|---------|
| `eq(a, b)` | `a === b` | `eq(m(1), m(1))` → `true` |
| `lt(a, b)` | `a < b` | `lt(m(1), m(2))` → `true` |
| `lte(a, b)` | `a <= b` | `lte(m(1), m(1))` → `true` |
| `gt(a, b)` | `a > b` | `gt(m(2), m(1))` → `true` |
| `gte(a, b)` | `a >= b` | `gte(m(1), m(2))` → `false` |

```typescript
lt(m(1), m(2))     // OK: true
lt(m(1), s(2))     // COMPILE ERROR: different dimensions
```

To compare quantities in different units, convert first:

```typescript
lt(to(m, km(1)), m(500))   // true: 1000 m > 500 m → false actually. lt(1000, 500) → false
gt(to(m, km(1)), m(500))   // true: 1000 > 500
```

### Helpers

#### `valueOf(q)` — Extract Raw Number

Returns the numeric value stored in the quantity, in the quantity's own unit.

```typescript
valueOf(m(42))        // 42
valueOf(km(1.5))      // 1.5
valueOf(to(m, km(1))) // 1000
typeof valueOf(m(5))  // 'number'
```

#### `format(q, options?)` — Format as String

Returns a human-readable string with the value and unit label.

```typescript
format(m(5))                       // "5 m"
format(km(1.5))                    // "1.5 km"
format(m(3.14159), { precision: 2 })  // "3.14 m"
format(div(m(10), s(2)))           // "5 m/s"
format(mul(m(3), m(4)))            // "12 m*m"
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `precision` | `number` | — | Number of decimal places (uses `toFixed`) |

### `parse(input)` — Parse a `"<value> <unit>"` String

Parses a string in the format `"<value> <unit>"` and returns a typed `Quantity`. Useful when consuming quantities from external input — API responses, user-entered strings, configuration files, etc.

**Supported units:** `m`, `km`, `cm`, `mm`, `nm`, `um`, `dm`, `nmi`, `mil`, `au`, `ly`, `pc`, `pl`, `in`, `ft`, `yd`, `mi`, `s`, `ms`, `ns`, `us`, `min`, `h`, `d`, `week`, `month`, `yr`, `decade`, `century`, `plt`, `kg`, `g`, `ug`, `mg`, `t`, `st`, `ton`, `lton`, `Da`, `plm`, `lb`, `oz`, `K`, `C`, `F`, `R`, `pT`, `mm2`, `cm2`, `m2`, `ha`, `km2`, `in2`, `ft2`, `yd2`, `ac`, `mi2`, `pla`, `ml`, `cl`, `l`, `m3`, `tsp`, `tbsp`, `floz`, `cup`, `pt`, `qt`, `gal`, `plv`, `m/s`, `km/h`, `ft/s`, `mph`, `kn`, `c`, `N`, `kN`, `lbf`, `dyn`, `pfo`, `J`, `kJ`, `cal`, `kcal`, `Wh`, `kWh`, `eV`, `BTU`, `pene`, `W`, `kW`, `MW`, `hp`, `ppow`, `Pa`, `kPa`, `bar`, `psi`, `atm`, `mmHg`, `ppre`, `b`, `B`, `KB`, `MB`, `GB`, `TB`, `PB`, `scalar`

```typescript
parse('5 m')        // equivalent to m(5)
parse('1.5 km')     // equivalent to km(1.5)
parse('-10 s')      // equivalent to s(-10)
parse('1e3 g')      // equivalent to g(1000)
parse('  5   m  ')  // whitespace trimmed and collapsed
parse('100 C')      // equivalent to C(100)
parse('4 GB')       // equivalent to GB(4)

parse('5 miles')    // TypeError: unknown unit "miles"
parse('abc m')      // TypeError: "abc" is not a number
parse('5')          // TypeError: missing unit
parse('')           // TypeError: empty string
```

Because the unit is resolved at runtime, the return type is the base `Quantity` (with unresolved dimension and label type parameters). For static usage where the unit is known at compile time, prefer the typed factories directly — they produce narrower types.

```typescript
import { parse, valueOf } from 'unitsafe';

// Dynamic input from an API:
const userInput = '42.5 km';
const distance = parse(userInput);
console.log(valueOf(distance));   // 42.5
console.log(distance._l);         // "km"
```

`parse` is also available through `createChecked()`, giving it access to the same checked-mode API:

```typescript
const checked = createChecked();
const q = checked.parse('5 m');   // Quantity
```

### Checked Mode (Development Runtime Validation)

The default API relies entirely on compile-time checks. For development and testing, `createChecked()` returns a mirror of the full API that adds **runtime validation** — it throws descriptive errors when dimension or unit mismatches are detected.

```typescript
import { createChecked } from 'unitsafe';

const {
  m, km, s,            // same factories (accept number | string)
  add, sub, mul, div,  // checked operations
  to,                  // checked conversion
  eq, lt, lte, gt, gte,
  valueOf, format,
  parse,               // also available in checked mode
} = createChecked();

// Works normally for valid operations
add(m(1), m(2));         // OK: 3 m

// Throws at runtime for invalid operations (that type casts might hide)
add(m(1) as any, s(1) as any);
// Error: "Unit mismatch in add: cannot add "m" and "s" — convert first"

to(s as any, km(1) as any);
// Error: "Dimension mismatch in to: cannot convert "km" to "s""
```

**When to use checked mode:**

- During development, when `any` casts or complex generics might bypass compile-time checks
- In test suites, to verify that dimension constraints hold at runtime
- When consuming data from external sources (APIs, user input) where types may not be reliable

**What it checks:**

| Operation | Validation |
|-----------|-----------|
| `add(a, b)` | Same dimension (via label→dim lookup) AND same unit label |
| `sub(a, b)` | Same dimension AND same unit label |
| `to(target, q)` | Source and target have same dimension |
| `mul(a, b)` | No validation needed (always valid) |
| `div(a, b)` | No validation needed (always valid) |

---

## Worked Examples

### Physics: Kinematic Equation

Calculate distance traveled under constant acceleration: `d = v₀t + ½at²`

```typescript
import { m, s, scalar, mul, add, div, valueOf } from 'unitsafe';

// v₀ = 10 m/s, a = 2 m/s², t = 5 s
const v0 = div(m(10), s(1));              // 10 m/s
const a = div(m(2), mul(s(1), s(1)));     // 2 m/s²
const t = s(5);                            // 5 s

// v₀t: (m/s) * s = m
const v0t = mul(v0, t);

// ½at²: scalar * (m/s²) * s * s = m
const halfAt2 = mul(scalar(0.5), mul(a, mul(t, t)));

// d = v₀t + ½at²
// Both terms have dimension Length — this compiles
const d = add(v0t, halfAt2);
console.log(valueOf(d));  // 75 (meters)
```

### Temperature Conversion

```typescript
import { C, K, F, to, valueOf, format } from 'unitsafe';

// Water boils at 100°C
const boiling = C(100);

console.log(format(to(K, boiling)));     // "373.15 K"
console.log(format(to(F, boiling)));     // "212 F"

// Body temperature
const body = F(98.6);
console.log(format(to(C, body)));        // "37 C"
console.log(format(to(K, body)));        // "310.15 K"
```

### Unit Conversion Pipeline

```typescript
import { km, m, cm, to, valueOf, format } from 'unitsafe';

const marathon = km(42.195);

console.log(format(to(m, marathon)));    // "42195 m"
console.log(format(to(cm, marathon)));   // "4219500 cm"
console.log(format(marathon));           // "42.195 km"
```

### Comparing Quantities in Different Units

```typescript
import { m, km, to, gt } from 'unitsafe';

// Is 1.5 km greater than 1000 m?
const result = gt(to(m, km(1.5)), m(1000));
console.log(result);  // true (1500 > 1000)
```

### Digital Storage

```typescript
import { B, KB, MB, GB, to, valueOf, format } from 'unitsafe';

const fileSize = MB(512);

console.log(format(to(GB, fileSize)));   // "0.5 GB"
console.log(format(to(KB, fileSize)));   // "524288 KB"
```

---

## Unit Reference

Complete list of all built-in units, organized by dimension, with their SI conversion relationships.

### Length

Base SI unit: **meter (m)**. `SI_value = value × scale`.

| Factory | Label | Scale (m) |
|---------|-------|-----------|
| `pl`    | `pl`  | 1.616255e-35 (Planck length) |
| `nm`    | `nm`  | 1e-9 |
| `um`    | `um`  | 1e-6 |
| `mm`    | `mm`  | 0.001 |
| `cm`    | `cm`  | 0.01 |
| `dm`    | `dm`  | 0.1 |
| `m`     | `m`   | 1 |
| `mil`   | `mil` | 2.54e-5 (thousandth of an inch) |
| `inch`  | `in`  | 0.0254 |
| `ft`    | `ft`  | 0.3048 |
| `yd`    | `yd`  | 0.9144 |
| `km`    | `km`  | 1000 |
| `nmi`   | `nmi` | 1852 (nautical mile) |
| `mi`    | `mi`  | 1609.344 |
| `au`    | `au`  | 1.495978707e11 |
| `ly`    | `ly`  | 9.4607304725808e15 |
| `pc`    | `pc`  | 3.0856775814913673e16 |

### Mass

Base SI unit: **kilogram (kg)**. `SI_value = value × scale`.

| Factory  | Label  | Scale (kg) |
|---------|--------|-----------|
| `ug`    | `ug`   | 1e-9 |
| `mg`    | `mg`   | 1e-6 |
| `g`     | `g`    | 0.001 |
| `oz`    | `oz`   | 0.028349523125 |
| `lb`    | `lb`   | 0.45359237 |
| `kg`    | `kg`   | 1 |
| `st`    | `st`   | 6.35029318 (stone) |
| `ton`   | `ton`  | 907.18474 (US short ton) |
| `lton`  | `lton` | 1016.0469088 (long ton) |
| `t`     | `t`    | 1000 (metric tonne) |
| `dalton`| `Da`   | 1.6605390666e-27 |
| `plm`   | `plm`  | 2.176434e-8 (Planck mass) |

### Time

Base SI unit: **second (s)**. `SI_value = value × scale`.

| Factory   | Label     | Scale (s) |
|----------|-----------|----------|
| `plt`    | `plt`     | 5.391247e-44 (Planck time) |
| `ns`     | `ns`      | 1e-9 |
| `us`     | `us`      | 1e-6 |
| `ms`     | `ms`      | 0.001 |
| `s`      | `s`       | 1 |
| `min`    | `min`     | 60 |
| `h`      | `h`       | 3600 |
| `d`      | `d`       | 86400 |
| `week`   | `week`    | 604800 |
| `month`  | `month`   | 2629800 (~30.44 days) |
| `yr`     | `yr`      | 31557600 (Julian year) |
| `decade` | `decade`  | 315576000 |
| `century`| `century` | 3155760000 |

### Temperature

Base SI unit: **kelvin (K)**. `SI_value = value × scale + offset`.

| Factory | Label | Scale | Offset (K) |
|--------|-------|-------|-----------|
| `K`    | `K`   | 1     | 0 |
| `R`    | `R`   | 5/9   | 0 (Rankine) |
| `C`    | `C`   | 1     | 273.15 |
| `F`    | `F`   | 5/9   | 255.3722... |
| `pT`   | `pT`  | 1.416784e32 | 0 (Planck temperature) |

Example: 100°C → K: `100 × 1 + 273.15 = 373.15 K`

### Area

Base SI unit: **square meter (m²)**. `SI_value = value × scale`.

| Factory | Label  | Scale (m²) |
|--------|--------|-----------|
| `pla`  | `pla`  | 2.6121e-70 (Planck area) |
| `mm2`  | `mm2`  | 1e-6 |
| `cm2`  | `cm2`  | 1e-4 |
| `in2`  | `in2`  | 6.4516e-4 |
| `ft2`  | `ft2`  | 0.09290304 |
| `yd2`  | `yd2`  | 0.83612736 |
| `m2`   | `m2`   | 1 |
| `ac`   | `ac`   | 4046.8564224 (acre) |
| `ha`   | `ha`   | 10000 (hectare) |
| `km2`  | `km2`  | 1e6 |
| `mi2`  | `mi2`  | 2589988.110336 |

### Volume

Base SI unit: **cubic meter (m³)**. `SI_value = value × scale`.

| Factory   | Label  | Scale (m³) |
|----------|--------|-----------|
| `plv`    | `plv`  | 4.2217e-105 (Planck volume) |
| `ml`     | `ml`   | 1e-6 |
| `cl`     | `cl`   | 1e-5 |
| `tsp`    | `tsp`  | 4.92892159375e-6 |
| `tbsp`   | `tbsp` | 1.47867647813e-5 |
| `floz`   | `floz` | 2.95735295625e-5 |
| `cup`    | `cup`  | 2.365882365e-4 |
| `pt_liq` | `pt`   | 4.73176473e-4 |
| `qt`     | `qt`   | 9.46352946e-4 |
| `l`      | `l`    | 0.001 |
| `gal`    | `gal`  | 0.003785411784 |
| `m3`     | `m3`   | 1 |

### Velocity

Dimension: `[1, 0, -1, 0, 0, 0, 0, 0]` (L¹T⁻¹). `SI_value = value × scale`.

| Factory  | Label  | Scale (m/s) |
|---------|--------|-----------|
| `fps`   | `ft/s` | 0.3048 |
| `kmh`   | `km/h` | 1/3.6 |
| `kn`    | `kn`   | ~0.514444 (knot) |
| `mph`   | `mph`  | 0.44704 |
| `mps`   | `m/s`  | 1 |
| `pvel`  | `c`    | 299792458 (speed of light) |

### Force

Dimension: `[1, 1, -2, 0, 0, 0, 0, 0]` (L¹M¹T⁻²). `SI_value = value × scale`.

| Factory | Label | Scale (N) |
|--------|-------|----------|
| `dyn`  | `dyn` | 1e-5 |
| `N`    | `N`   | 1 |
| `lbf`  | `lbf` | 4.44822162 |
| `kN`   | `kN`  | 1000 |
| `pfo`  | `pfo` | 1.21027e44 (Planck force) |

### Energy

Dimension: `[2, 1, -2, 0, 0, 0, 0, 0]` (L²M¹T⁻²). `SI_value = value × scale`.

| Factory | Label  | Scale (J) |
|--------|--------|----------|
| `eV`   | `eV`   | 1.602176634e-19 |
| `cal`  | `cal`  | 4.184 |
| `J`    | `J`    | 1 |
| `kcal` | `kcal` | 4184 |
| `Wh`   | `Wh`   | 3600 |
| `BTU`  | `BTU`  | 1055.05585262 |
| `kJ`   | `kJ`   | 1000 |
| `kWh`  | `kWh`  | 3600000 |
| `pene` | `pene` | 1.9562e9 (Planck energy) |

### Power

Dimension: `[2, 1, -3, 0, 0, 0, 0, 0]` (L²M¹T⁻³). `SI_value = value × scale`.

| Factory | Label  | Scale (W) |
|--------|--------|----------|
| `W`    | `W`    | 1 |
| `kW`   | `kW`   | 1000 |
| `hp`   | `hp`   | 745.69987 |
| `MW`   | `MW`   | 1e6 |
| `ppow` | `ppow` | 3.6282e52 (Planck power) |

### Pressure

Dimension: `[-1, 1, -2, 0, 0, 0, 0, 0]` (L⁻¹M¹T⁻²). `SI_value = value × scale`.

| Factory | Label  | Scale (Pa) |
|--------|--------|-----------|
| `Pa`   | `Pa`   | 1 |
| `mmHg` | `mmHg` | 133.322... |
| `kPa`  | `kPa`  | 1000 |
| `psi`  | `psi`  | 6894.757... |
| `bar`  | `bar`  | 1e5 |
| `atm`  | `atm`  | 101325 |
| `ppre` | `ppre` | 3.6282e113 (Planck pressure) |

### Digital Storage

Dimension: `[0, 0, 0, 0, 0, 0, 0, 1]` (Data¹). Binary convention: 1 KB = 1024 B. `SI_value = value × scale`.

| Factory | Label | Scale (bits) |
|--------|-------|-------------|
| `b`    | `b`   | 1 |
| `B`    | `B`   | 8 |
| `KB`   | `KB`  | 8192 |
| `MB`   | `MB`  | 8388608 |
| `GB`   | `GB`  | 8589934592 |
| `TB`   | `TB`  | 8796093022208 |
| `PB`   | `PB`  | ~9.0072e15 |

---

## How the Type System Works

### Dimension Vectors

Every physical quantity has a **dimension** — a combination of the eight base quantities. unitsafe represents dimensions as 8-element tuples of integer exponents:

```
[Length, Mass, Time, Current, Temperature, Amount, LuminousIntensity, Data]
```

Examples:

| Quantity | Dimension Vector | Meaning |
|----------|------------------|---------|
| meters | `[1, 0, 0, 0, 0, 0, 0, 0]` | L¹ |
| kilograms | `[0, 1, 0, 0, 0, 0, 0, 0]` | M¹ |
| seconds | `[0, 0, 1, 0, 0, 0, 0, 0]` | T¹ |
| velocity (m/s) | `[1, 0, -1, 0, 0, 0, 0, 0]` | L¹T⁻¹ |
| area (m²) | `[2, 0, 0, 0, 0, 0, 0, 0]` | L² |
| force (N = kg·m/s²) | `[1, 1, -2, 0, 0, 0, 0, 0]` | L¹M¹T⁻² |
| temperature | `[0, 0, 0, 0, 1, 0, 0, 0]` | Θ¹ |
| data (bits) | `[0, 0, 0, 0, 0, 0, 0, 1]` | D¹ |
| dimensionless | `[0, 0, 0, 0, 0, 0, 0, 0]` | — |

### Type-Level Arithmetic

TypeScript cannot perform arithmetic on type-level integers natively. unitsafe works around this with pre-computed **lookup tables** for addition and subtraction on a bounded integer range of `[-8, +8]`.

```typescript
// Bounded integer type
type Int = -8 | -7 | -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Lookup: AddMap[A][B] gives A + B (clamped to [-8, 8])
type IntAdd<A extends Int, B extends Int> = AddMap[A][B];

// Dimension composition for multiplication: add exponent vectors element-wise
type DimMul<A extends Dim, B extends Dim> = [
  IntAdd<A[0], B[0]>,  // Length exponents
  IntAdd<A[1], B[1]>,  // Mass exponents
  // ... 6 more
];
```

When you write `mul(m(3), m(4))`:
- `m` has dimension `[1, 0, 0, 0, 0, 0, 0, 0]`
- `DimMul` adds exponents: `[1+1, 0+0, 0+0, ...]` = `[2, 0, 0, 0, 0, 0, 0, 0]`
- The result type is `Quantity<[2, 0, 0, 0, 0, 0, 0, 0], "m*m">` (area)

When you write `div(m(10), s(2))`:
- `DimDiv` subtracts exponents: `[1-0, 0-0, 0-1, ...]` = `[1, 0, -1, 0, 0, 0, 0, 0]`
- The result type is `Quantity<[1, 0, -1, 0, 0, 0, 0, 0], "m/s">` (velocity)

The exponent range `[-8, +8]` supports up to 8th-power compositions (e.g., L⁸), which is more than sufficient for any real-world physics formula. Values outside this range are clamped to the boundary.

### Branding and Type Safety

`Quantity<D, L>` is an interface with two phantom type parameters:

```typescript
interface Quantity<D extends Dim, L extends string> {
  readonly _v: number;         // numeric value
  readonly _s: number;         // SI scale factor
  readonly _l: string;         // unit label
  readonly _o: number;         // SI offset (0 for all non-temperature units)
  readonly __phantom_dim?: D;  // phantom: dimension (never set at runtime)
  readonly __phantom_label?: L; // phantom: label (never set at runtime)
}
```

TypeScript's structural typing ensures:

1. **Dimension safety:** `add(m(1), s(2))` fails because `Quantity<[1,0,0,...], 'm'>` and `Quantity<[0,0,1,...], 's'>` cannot unify on the `D` parameter.

2. **Unit safety:** `add(m(1), km(2))` fails because the labels `'m'` and `'km'` don't match, even though both have the same dimension.

3. **No raw number leaks:** `add(1, m(2))` fails because `number` lacks the `_v`, `_s`, `_l`, `_o` properties required by `Quantity`.

### Runtime Representation

Each quantity is a plain JavaScript object with exactly four properties:

```javascript
// m(5) at runtime:
{ _v: 5, _s: 1, _l: 'm', _o: 0 }

// km(1) at runtime:
{ _v: 1, _s: 1000, _l: 'km', _o: 0 }

// C(100) at runtime (Celsius — has non-zero offset):
{ _v: 100, _s: 1, _l: 'C', _o: 273.15 }
```

| Property | Purpose |
|----------|---------|
| `_v` | The numeric value in the quantity's own unit |
| `_s` | The SI scale factor (meters per unit for length, seconds per unit for time, etc.) |
| `_l` | The unit label string for formatting and checked-mode validation |
| `_o` | The SI offset for affine conversions; 0 for all units except Celsius and Fahrenheit |

All quantity objects share the **same hidden class** in V8 (same properties, same order, same types), enabling optimized property access.

---

## Performance

### Benchmark Methodology

The benchmark compares three operations (add, multiply, divide) across 1,000,000 iterations using random data from pre-allocated `Float64Array` buffers. Random data prevents V8 from constant-folding or eliminating the computation.

**Benchmark structure:**

```
Plain numbers:  a + b, a * b, a / b  (raw arithmetic)
unitsafe:       add(m(a), m(b)), mul(m(a), m(b)), div(m(a), scalar(b))
```

Each round is timed with `performance.now()`. Seven rounds are run; the best and worst are dropped and the remaining five are averaged (trimmed mean) to reduce variance from GC pauses and CPU scheduling.

**Source:** [`bench/index.ts`](bench/index.ts)

### Benchmark Results

Measured on Apple Silicon (M-series), Node.js 20+, V8:

```
Iterations: 1,000,000

Results (7 rounds, trimmed mean):
  Plain numbers: 0.66 ms  (~1,500 M ops/s)
  unitsafe:      14.14 ms (~70 M ops/s)
  Ratio:         0.047 (unitsafe / plain)
  Overhead:      ~95%
```

| Metric | Plain Numbers | unitsafe | Notes |
|--------|---------------|----------|-------|
| Time per 1M ops | ~0.7 ms | ~14 ms | |
| Time per single op | ~0.7 ns | ~14 ns | |
| Throughput | ~1,500 M ops/s | ~70 M ops/s | |
| Relative speed | 1.0x | ~0.05x | |

### Why the Overhead Exists

The overhead comes from **object allocation**, not from the arithmetic itself. Each factory call and each operation creates a new `{ _v, _s, _l, _o }` object on the heap. The plain-number baseline performs zero allocations — all values live in CPU registers.

This is a fundamental trade-off: carrying unit metadata (`_s` for scale, `_l` for label, `_o` for offset) enables the ergonomic `to(km, m(1500))` conversion API (including affine temperature conversions), but requires an object rather than a plain primitive.

**Breakdown of per-operation cost:**

| Cost Source | Approximate | Notes |
|-------------|------------|-------|
| Object allocation | ~8 ns | V8 bump-pointer allocation + GC pressure |
| Property access (4 reads) | ~1 ns | V8 hidden-class optimization |
| Arithmetic | ~0.3 ns | Same as plain numbers |
| String concat (mul/div labels) | ~2 ns | Only in mul/div |

### When It Matters (and When It Doesn't)

**It does NOT matter for:**

- Application code (I/O-bound, rendering, business logic)
- Moderate-frequency calculations (< 100K ops/s)
- Any code path where a single operation is followed by non-trivial work
- Most scientific computing (bottleneck is usually matrix operations, not scalar arithmetic)

At ~14 ns per operation, you can perform **70 million operations per second**. That's faster than:
- A single network round-trip (~1 ms = 70,000 unitsafe operations)
- A single DOM paint (~16 ms = 1.1 million operations)
- A database query (~5 ms = 350,000 operations)

**It MIGHT matter for:**

- Tight inner loops performing billions of arithmetic operations on scalar values
- Real-time physics simulations at microsecond granularity
- Performance-critical numerical kernels

For these cases, use `valueOf()` to extract plain numbers for the hot loop, and re-wrap with unit factories at the boundaries.

### V8 Optimization Notes

unitsafe is designed to be V8-friendly:

- **Monomorphic objects:** All quantities have the same 4-property shape `{_v, _s, _l, _o}`, always created in the same order. V8 assigns a single hidden class and uses fast inline-cached property access.
- **No polymorphic dispatch:** Each operation function (`add`, `mul`, etc.) always receives the same object shape, avoiding megamorphic deoptimization.
- **No prototype chain:** Quantities are plain objects created with object literals — no class instantiation, no `__proto__` lookup.
- **Small functions:** All operations are small enough for V8's inliner.

### Running Benchmarks Yourself

```bash
pnpm bench
```

The benchmark prints ops/s, overhead percentage, and a pass/warn/note verdict. Results will vary by hardware and Node.js version.

---

## Testing

### Test Architecture

unitsafe has three layers of testing:

| Layer | Tool | Files | What It Validates |
|-------|------|-------|-------------------|
| Runtime tests | [Vitest](https://vitest.dev) | `test/acceptance.test.ts`, `test/parse.test.ts` | Correct values, conversions, error handling |
| Type-level tests | [tsd](https://github.com/tsdjs/tsd) | `type-tests/index.test-d.ts` | Compile-time safety guarantees |
| Performance tests | Custom harness | `bench/index.ts` | Throughput and overhead |

### Runtime Tests

**486 tests** across acceptance and parse test suites covering the full public API.

**Example test output:**

```
 ✓ test/acceptance.test.ts (198 tests) 12ms
 ✓ test/parse.test.ts (288 tests) 15ms

 Test Files  2 passed (2)
      Tests  486 passed (486)
   Duration  ~150ms
```

### Type-Level Tests

**80+ type assertions** using [tsd](https://github.com/tsdjs/tsd), verifying both positive and negative cases.

**Positive assertions (should compile):**

| Test | Assertion |
|------|-----------|
| `add(m(1), m(2))` | Returns `Quantity<[1,0,0,0,0,0,0,0], 'm'>` |
| `add(km(1), km(2))` | Returns `Quantity<[1,0,0,0,0,0,0,0], 'km'>` |
| `sub(m(5), m(2))` | Returns `Quantity<[1,0,0,0,0,0,0,0], 'm'>` |
| `mul(m(2), m(3))` | Area — dimension composed correctly |
| `div(m(10), s(2))` | Velocity — dimension composed correctly |
| `mul(scalar(2), m(3))` | Scalar scaling preserves dimension |
| `to(m, km(1))` | Same-dimension conversion compiles |
| `lt(m(1), m(2))` | Same-dimension comparison returns `boolean` |
| `valueOf(m(5))` | Returns `number` |
| `m('5')` | String input returns `Quantity<[1,0,0,0,0,0,0,0], 'm'>` |
| `km('2.5')` | String input returns correct km type |
| `s('10')` | String input returns correct time type |
| `kg('75')` | String input returns correct mass type |
| `scalar('1')` | String input returns correct scalar type |
| `add(m('1'), m('2'))` | String-created quantities work with add |
| `valueOf(m('5'))` | String-created quantity returns `number` |
| `parse('5 m')` | Returns `Quantity`, `valueOf` returns `number` |
| `inch(1)` | Returns `Quantity<[1,0,0,0,0,0,0,0], 'in'>` |
| `ft(1)`, `yd(1)`, `mi(1)` | Correct Length dimension and label |
| `lb(1)`, `oz(1)` | Returns `Quantity<[0,1,0,0,0,0,0,0], 'lb'\|'oz'>` |
| `inch('12')`, `ft('6')`, etc. | String input for US units |
| `to(m, ft(1))`, `to(km, mi(1))` | US↔Metric conversion compiles |
| `add(ft(1), ft(2))` | Same US unit addition |
| `to(kg, lb(1))`, `to(g, oz(1))` | US↔Metric mass conversion |
| `add(lb(1), lb(2))` | Same US mass unit addition |
| `K(273)` | Returns `Quantity<[0,0,0,0,1,0,0,0], 'K'>` |
| `C(100)`, `F(212)`, `R(491.67)` | Temperature dimension and labels |
| `to(K, C(100))`, `to(F, C(100))` | Temperature conversion compiles |
| `m2(1)`, `km2(1)`, `ft2(1)` | Area dimension |
| `to(m2, km2(1))` | Area conversion compiles |
| `l(1)`, `m3(1)`, `gal(1)` | Volume dimension |
| `to(ml, l(1))` | Volume conversion compiles |
| `mps(1)`, `kmh(100)`, `mph(60)` | Velocity dimension |
| `to(kmh, mps(1))` | Velocity conversion compiles |
| `N(1)`, `kN(1)` | Force dimension |
| `J(1)`, `kWh(1)` | Energy dimension |
| `W(1)`, `hp(1)` | Power dimension |
| `Pa(1)`, `atm(1)` | Pressure dimension |
| `b(1)`, `B(1)`, `GB(1)` | Data dimension |
| `to(B, KB(1))` | Data conversion compiles |

**Negative assertions (must NOT compile):**

| Test | Why It Must Fail |
|------|------------------|
| `add(m(1), s(2))` | Different dimensions (length vs. time) |
| `sub(m(1), s(2))` | Different dimensions |
| `to(s, km(1))` | Incompatible conversion (length → time) |
| `add(1, m(2))` | Raw number lacks Quantity branding |
| `add(m(1), 1)` | Raw number on right side |
| `sub(1, m(2))` | Raw number in subtraction |
| `lt(m(1), s(2))` | Cross-dimension comparison |
| `gt(m(1), s(2))` | Cross-dimension comparison |
| `lte(m(1), s(2))` | Cross-dimension comparison |
| `gte(m(1), s(2))` | Cross-dimension comparison |
| `eq(m(1), s(2))` | Cross-dimension comparison |
| `add(ft(1), s(2))` | US length + time (different dimensions) |
| `add(ft(1), lb(2))` | US length + US mass (different dimensions) |
| `to(s, ft(1))` | US length → time (incompatible) |
| `add(lb(1), m(2))` | US mass + metric length |
| `to(m, lb(1))` | US mass → metric length |
| `add(K(1), m(1))` | Temperature + length |
| `to(m, K(1))` | Temperature → length (incompatible) |
| `add(m2(1), m(1))` | Area + length |
| `to(m, m2(1))` | Area → length |
| `add(l(1), m2(1))` | Volume + area |
| `add(mps(1), m(1))` | Velocity + length |
| `add(N(1), Pa(1))` | Force + pressure (different dimensions) |
| `add(Pa(1), N(1))` | Pressure + force |
| `add(B(1), m(1))` | Data + length |
| `to(m, B(1))` | Data → length |

### Running Tests

```bash
# All runtime tests
pnpm test

# Watch mode (re-run on file changes)
pnpm test:watch

# Type checking (catches errors in src/)
pnpm typecheck

# Type-level assertions (requires build first)
pnpm build && pnpm type-tests

# Full validation pipeline
pnpm test && pnpm typecheck && pnpm build && pnpm type-tests && pnpm bench
```

---

## Bundle Size

| Output | Size | Format |
|--------|------|--------|
| `dist/index.js` | 28.19 KB | ESM |
| `dist/index.cjs` | 29.86 KB | CommonJS |
| `dist/index.d.ts` | 52.49 KB | TypeScript declarations |
| `dist/index.d.cts` | 52.49 KB | CTS declarations |

The declaration files are large due to the lookup tables (`AddMap`, `SubMap`) that encode type-level arithmetic. These are stripped at build time and have zero runtime cost.

The ESM bundle is **28.19 KB unminified** with no dependencies. Tree-shaking further reduces the size if you only import a subset of units.

---

## Design Decisions

### Why Quantity Objects Instead of Branded Numbers?

The ideal zero-cost representation would be a plain `number` with phantom type brands:

```typescript
type Quantity<D> = number & { readonly __dim: D };
```

This gives `typeof q === 'number'` and zero allocation overhead. However, it makes the `to(target, quantity)` conversion API impossible — you can't read the source unit's scale factor (or offset, for temperature) from a plain number at runtime.

Alternatives considered:

| Approach | Pros | Cons |
|----------|------|------|
| Plain branded numbers | Zero overhead | `to` needs source factory as extra arg |
| Store in SI internally | `to` only needs target | `valueOf(km(1))` returns 1000, not 1 |
| WeakMap metadata | Numbers stay plain | Can't key WeakMap on primitives |
| Number objects | Has `valueOf()` | `typeof` returns `'object'`, slower |
| **Tiny object (chosen)** | **Ergonomic API, full metadata** | **Allocation overhead** |

The chosen approach trades ~14 ns/op overhead for an ergonomic, correct API.

### Why Same-Label Required for Add/Sub?

`add(m(1), km(2))` is a compile error even though both are lengths. This is intentional:

1. **Correctness:** `1 + 2 = 3`, but 3 of what? Meters? Kilometers? The answer is ambiguous.
2. **No hidden conversions:** Implicit conversions are a common source of bugs.
3. **Explicit is better:** `add(m(1), to(m, km(2)))` makes the intent clear: "add 1 meter and 2 km, converting km to m first."

### Why Lookup Tables Instead of Recursive Types?

TypeScript can express integer arithmetic through recursive conditional types:

```typescript
type Add<A, B> = A extends 0 ? B : Add<Prev<A>, Succ<B>>;
```

This causes exponential type instantiation depth for compositions like `mul(mul(mul(a, b), c), d)`. Lookup tables are O(1) at the type level — a single indexed access regardless of nesting depth.

---

## Limitations (v0.1)

- **Derived units show composed labels.** `div(m(10), s(2))` formats as `"5 m/s"`, and `mul(m(3), m(4))` formats as `"12 m*m"`. There is no automatic simplification to named units like `"m²"` or `"N"`.

- **Same-label requirement for add/sub.** You must convert to a common unit before adding: `add(m(1), to(m, km(2)))` instead of `add(m(1), km(2))`.

- **Exponent range [-8, +8].** Dimension exponents are bounded to this range. Values outside are clamped. This is sufficient for virtually all real-world physics formulas.

- **No custom unit definition API.** Only the built-in units are provided. A user-facing `defineUnit()` API is a candidate for v0.2.

---

## Requirements

| Dependency | Version | Notes |
|------------|---------|-------|
| TypeScript | >= 5.5 | Required for type-level tuple manipulation |
| Node.js | >= 20 | Runtime target (ES2022) |
| pnpm | any | Development package manager |

**Runtime dependencies:** none (zero dependencies).

---

## Project Structure

```
unitsafe/
├── src/
│   └── index.ts          # Entire library: types, units, operations, parse, checked mode (~2000 lines)
├── test/
│   ├── acceptance.test.ts # Runtime tests (Vitest) — unit factories, arithmetic, conversions
│   └── parse.test.ts      # Runtime tests (Vitest) — parse(), all unit labels
├── type-tests/
│   └── index.test-d.ts   # Type-level assertions (tsd)
├── bench/
│   └── index.ts          # Performance benchmark harness
├── dist/                  # Build output (ESM + CJS + .d.ts)
├── package.json
├── tsconfig.json          # Strict TypeScript config
├── tsup.config.ts         # Build configuration
├── vitest.config.ts       # Test runner configuration
├── LICENSE                # MIT
└── README.md
```

The entire library is a **single source file** (`src/index.ts`). This is intentional — the codebase is large in line count due to the lookup tables and unit definitions, but architecturally flat and easy to navigate.

---

## Development

```bash
# Install dependencies
pnpm install

# Run runtime tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type-check the source
pnpm typecheck

# Build the library (ESM + CJS + declarations)
pnpm build

# Run type-level tests (requires build)
pnpm type-tests

# Run performance benchmarks
pnpm bench

# Full validation (run before committing)
pnpm test && pnpm typecheck && pnpm build && pnpm type-tests && pnpm bench
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and contribution guidelines.

---

## License

[MIT](LICENSE)
