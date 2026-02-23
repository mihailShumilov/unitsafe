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
- **Type-safe conversions** between compatible units (km <-> m, s <-> ms)
- **Branded types** that prevent accidental mixing of raw numbers with quantities
- **Tiny runtime** — each quantity is a 3-property object; no classes, no prototypes

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
  m, km, cm, mm,           // length units
  s, ms, min, h,            // time units
  kg, g,                     // mass units
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
```

---

## API Reference

### Unit Factories

Each factory creates a `Quantity` value branded with the corresponding dimension and unit label. The returned quantity stores the numeric value alongside the unit's SI scale factor and label.

| Factory      | Unit          | Dimension | SI Scale Factor | Example                    |
|-------------|--------------|-----------|-----------------|----------------------------|
| `m(v)`      | meters       | Length    | 1               | `m(5)` → 5 meters         |
| `km(v)`     | kilometers   | Length    | 1000            | `km(1)` → 1 kilometer     |
| `cm(v)`     | centimeters  | Length    | 0.01            | `cm(100)` → 100 cm        |
| `mm(v)`     | millimeters  | Length    | 0.001           | `mm(5)` → 5 mm            |
| `s(v)`      | seconds      | Time      | 1               | `s(60)` → 60 seconds      |
| `ms(v)`     | milliseconds | Time      | 0.001           | `ms(500)` → 500 ms        |
| `min(v)`    | minutes      | Time      | 60              | `min(5)` → 5 minutes      |
| `h(v)`      | hours        | Time      | 3600            | `h(2)` → 2 hours          |
| `kg(v)`     | kilograms    | Mass      | 1               | `kg(80)` → 80 kg          |
| `g(v)`      | grams        | Mass      | 0.001           | `g(500)` → 500 grams      |
| `scalar(v)` | dimensionless | —        | 1               | `scalar(3)` → 3 (no unit) |

**Signature:**
```typescript
function m(value: number | string): Quantity<DimLength, 'm'>
function km(value: number | string): Quantity<DimLength, 'km'>
// ... etc.
```

All 11 factories accept either a `number` or a numeric `string`. String values are trimmed of whitespace before parsing. Scientific notation is supported. Non-numeric strings throw a `TypeError`.

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
m._scale  // 1
m._label  // 'm'
m._dim    // [1, 0, 0, 0, 0, 0, 0]
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

**Conversion formula:** `result = sourceValue * sourceScale / targetScale`

```typescript
to(m, km(1))         // 1000 m  (1 × 1000 / 1)
to(km, m(1500))      // 1.5 km  (1500 × 1 / 1000)
to(cm, m(2.5))       // 250 cm  (2.5 × 1 / 0.01)
to(g, kg(1))         // 1000 g  (1 × 1 / 0.001)
to(min, h(1))        // 60 min  (1 × 3600 / 60)
to(ms, s(1))         // 1000 ms (1 × 1 / 0.001)

to(s, km(1))         // COMPILE ERROR: length ≠ time
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

**Supported units:** `m`, `km`, `cm`, `mm`, `s`, `ms`, `min`, `h`, `kg`, `g`, `scalar`

```typescript
parse('5 m')        // equivalent to m(5)
parse('1.5 km')     // equivalent to km(1.5)
parse('-10 s')      // equivalent to s(-10)
parse('1e3 g')      // equivalent to g(1000)
parse('  5   m  ')  // whitespace trimmed and collapsed

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

---

## How the Type System Works

### Dimension Vectors

Every physical quantity has a **dimension** — a combination of the seven SI base quantities. unitsafe represents dimensions as 7-element tuples of integer exponents:

```
[Length, Mass, Time, Current, Temperature, Amount, LuminousIntensity]
```

Examples:

| Quantity | Dimension Vector | Meaning |
|----------|------------------|---------|
| meters | `[1, 0, 0, 0, 0, 0, 0]` | L¹ |
| kilograms | `[0, 1, 0, 0, 0, 0, 0]` | M¹ |
| seconds | `[0, 0, 1, 0, 0, 0, 0]` | T¹ |
| velocity (m/s) | `[1, 0, -1, 0, 0, 0, 0]` | L¹T⁻¹ |
| area (m²) | `[2, 0, 0, 0, 0, 0, 0]` | L² |
| force (N = kg·m/s²) | `[1, 1, -2, 0, 0, 0, 0]` | L¹M¹T⁻² |
| dimensionless | `[0, 0, 0, 0, 0, 0, 0]` | — |

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
  // ... 5 more
];
```

When you write `mul(m(3), m(4))`:
- `m` has dimension `[1, 0, 0, 0, 0, 0, 0]`
- `DimMul` adds exponents: `[1+1, 0+0, 0+0, ...]` = `[2, 0, 0, 0, 0, 0, 0]`
- The result type is `Quantity<[2, 0, 0, 0, 0, 0, 0], "m*m">` (area)

When you write `div(m(10), s(2))`:
- `DimDiv` subtracts exponents: `[1-0, 0-0, 0-1, ...]` = `[1, 0, -1, 0, 0, 0, 0]`
- The result type is `Quantity<[1, 0, -1, 0, 0, 0, 0], "m/s">` (velocity)

The exponent range `[-8, +8]` supports up to 8th-power compositions (e.g., L⁸), which is more than sufficient for any real-world physics formula. Values outside this range are clamped to the boundary.

### Branding and Type Safety

`Quantity<D, L>` is an interface with two phantom type parameters:

```typescript
interface Quantity<D extends Dim, L extends string> {
  readonly _v: number;         // numeric value
  readonly _s: number;         // SI scale factor
  readonly _l: string;         // unit label
  readonly __phantom_dim?: D;  // phantom: dimension (never set at runtime)
  readonly __phantom_label?: L; // phantom: label (never set at runtime)
}
```

TypeScript's structural typing ensures:

1. **Dimension safety:** `add(m(1), s(2))` fails because `Quantity<[1,0,0,...], 'm'>` and `Quantity<[0,0,1,...], 's'>` cannot unify on the `D` parameter.

2. **Unit safety:** `add(m(1), km(2))` fails because the labels `'m'` and `'km'` don't match, even though both have the same dimension.

3. **No raw number leaks:** `add(1, m(2))` fails because `number` lacks the `_v`, `_s`, `_l` properties required by `Quantity`.

### Runtime Representation

Each quantity is a plain JavaScript object with exactly three properties:

```javascript
// m(5) at runtime:
{ _v: 5, _s: 1, _l: 'm' }

// km(1) at runtime:
{ _v: 1, _s: 1000, _l: 'km' }
```

| Property | Purpose |
|----------|---------|
| `_v` | The numeric value in the quantity's own unit |
| `_s` | The SI scale factor (meters per unit for length, seconds per unit for time, etc.) |
| `_l` | The unit label string for formatting and checked-mode validation |

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

The overhead comes from **object allocation**, not from the arithmetic itself. Each factory call and each operation creates a new `{ _v, _s, _l }` object on the heap. The plain-number baseline performs zero allocations — all values live in CPU registers.

This is a fundamental trade-off: carrying unit metadata (`_s` for scale, `_l` for label) enables the ergonomic `to(km, m(1500))` conversion API, but requires an object rather than a plain primitive.

**Breakdown of per-operation cost:**

| Cost Source | Approximate | Notes |
|-------------|------------|-------|
| Object allocation | ~8 ns | V8 bump-pointer allocation + GC pressure |
| Property access (3 reads) | ~1 ns | V8 hidden-class optimization |
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

- **Monomorphic objects:** All quantities have the same 3-property shape `{_v, _s, _l}`, always created in the same order. V8 assigns a single hidden class and uses fast inline-cached property access.
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
| Runtime tests | [Vitest](https://vitest.dev) | `test/acceptance.test.ts` | Correct values, conversions, error handling |
| Type-level tests | [tsd](https://github.com/tsdjs/tsd) | `type-tests/index.test-d.ts` | Compile-time safety guarantees |
| Performance tests | Custom harness | `bench/index.ts` | Throughput and overhead |

### Runtime Tests

**60 tests** across 11 test suites covering the full public API.

| Suite | Tests | What's Covered |
|-------|-------|----------------|
| Unit factories | 1 | All 11 factories produce correct values |
| Addition/subtraction | 3 | Same-unit add/sub, multi-unit (km+km) |
| Multiplication/division | 4 | Cross-dimension mul/div, scalar scaling |
| Conversions | 7 | km↔m, cm→m, mm→m, s↔ms, h→min, kg→g |
| Comparisons | 5 | eq, lt, lte, gt, gte with edge cases |
| valueOf | 1 | Extracts number, verifies type |
| format | 3 | Default format, km format, precision option |
| Checked mode | 6 | Factory availability, valid ops, mismatch throws |
| String input — factories | 10 | String values, all units, arithmetic/conversions/comparisons/format |
| String input — invalid | 4 | Non-numeric, empty, whitespace-only, unit-suffix strings |
| String input — parse | 10 | All units, negatives, scientific notation, whitespace, error cases |
| String input — checked mode | 3 | Checked factories and parse with strings |
| Runtime representation | 2 | Value/metadata access, minimal footprint |

**Example test output:**

```
 ✓ test/acceptance.test.ts (60 tests) 3ms

 Test Files  1 passed (1)
      Tests  60 passed (60)
   Duration  99ms
```

### Type-Level Tests

**27+ type assertions** using [tsd](https://github.com/tsdjs/tsd), verifying both positive and negative cases.

**Positive assertions (should compile):**

| Test | Assertion |
|------|-----------|
| `add(m(1), m(2))` | Returns `Quantity<[1,0,0,0,0,0,0], 'm'>` |
| `add(km(1), km(2))` | Returns `Quantity<[1,0,0,0,0,0,0], 'km'>` |
| `sub(m(5), m(2))` | Returns `Quantity<[1,0,0,0,0,0,0], 'm'>` |
| `mul(m(2), m(3))` | Area — dimension composed correctly |
| `div(m(10), s(2))` | Velocity — dimension composed correctly |
| `mul(scalar(2), m(3))` | Scalar scaling preserves dimension |
| `to(m, km(1))` | Same-dimension conversion compiles |
| `lt(m(1), m(2))` | Same-dimension comparison returns `boolean` |
| `valueOf(m(5))` | Returns `number` |
| `m('5')` | String input returns `Quantity<[1,0,0,0,0,0,0], 'm'>` |
| `km('2.5')` | String input returns correct km type |
| `s('10')` | String input returns correct time type |
| `kg('75')` | String input returns correct mass type |
| `scalar('1')` | String input returns correct scalar type |
| `add(m('1'), m('2'))` | String-created quantities work with add |
| `valueOf(m('5'))` | String-created quantity returns `number` |
| `parse('5 m')` | Returns `Quantity`, `valueOf` returns `number` |

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
| `dist/index.js` | 4.1 KB | ESM |
| `dist/index.cjs` | 4.5 KB | CommonJS |
| `dist/index.d.ts` | 14.4 KB | TypeScript declarations |
| `dist/index.d.cts` | 14.4 KB | CTS declarations |

The declaration files are large due to the lookup tables (`AddMap`, `SubMap`) that encode type-level arithmetic. These are stripped at build time and have zero runtime cost.

The ESM bundle is **4.1 KB unminified** with no dependencies. Tree-shaking further reduces the size if you only import a subset of units.

---

## Design Decisions

### Why Quantity Objects Instead of Branded Numbers?

The ideal zero-cost representation would be a plain `number` with phantom type brands:

```typescript
type Quantity<D> = number & { readonly __dim: D };
```

This gives `typeof q === 'number'` and zero allocation overhead. However, it makes the `to(target, quantity)` conversion API impossible — you can't read the source unit's scale factor from a plain number at runtime.

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

- **No temperature offset units.** Celsius and Fahrenheit require affine transformations (`T_K = T_C + 273.15`), not just scaling. Supporting these safely without breaking the multiply/divide algebra is non-trivial. Only scale-based conversions are supported in v0.1.

- **Derived units show composed labels.** `div(m(10), s(2))` formats as `"5 m/s"`, and `mul(m(3), m(4))` formats as `"12 m*m"`. There is no automatic simplification to named units like `"m²"` or `"N"`.

- **Same-label requirement for add/sub.** You must convert to a common unit before adding: `add(m(1), to(m, km(2)))` instead of `add(m(1), km(2))`.

- **Exponent range [-8, +8].** Dimension exponents are bounded to this range. Values outside are clamped. This is sufficient for virtually all real-world physics formulas.

- **No custom unit definition API.** Only the built-in SI units are provided. A user-facing `defineUnit()` API is a candidate for v0.2.

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
│   └── index.ts          # Entire library: types, units, operations, parse, checked mode
├── test/
│   └── acceptance.test.ts # 60 runtime tests (Vitest)
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

The entire library is a **single source file** (`src/index.ts`). This is intentional — the codebase is small enough that splitting it would add complexity without benefit.

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
