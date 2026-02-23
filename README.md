# unitsafe

Compile-time dimension safety for TypeScript. Prevents invalid operations like `meters + seconds` at compile time, with minimal runtime overhead.

## Features

- **Compile-time safety** — addition/subtraction only for same dimensions; multiplication/division composes dimensions; comparisons only for same dimensions
- **Type-safe conversions** — `to(km, m(1500))` works; `to(s, km(1))` is a compile error
- **Branded types prevent leaks** — raw numbers cannot be accidentally mixed with quantities
- **Tiny runtime footprint** — quantities are small 3-property objects (`{_v, _s, _l}`)
- **Zero dependencies**
- **ESM + CJS** dual build
- **Optional checked mode** for runtime validation during development

## Install

```bash
npm install unitsafe
# or
pnpm add unitsafe
```

## Quick Start

```typescript
import { m, km, s, add, div, to, valueOf, format } from 'unitsafe';

// Create quantities
const distance = km(42);
const time = s(3600);

// Arithmetic
const speed = div(distance, time);     // dimension: length/time
const total = add(km(10), km(32));     // OK: same units

// Conversions
const meters = to(m, km(1.5));         // 1500 m
console.log(valueOf(meters));          // 1500
console.log(format(meters));           // "1500 m"

// Compile-time errors (won't compile):
// add(m(1), s(2))     — different dimensions
// to(s, km(1))        — incompatible conversion
// add(1, m(2))        — raw number not allowed
```

## API

### Unit Factories

Each factory creates a `Quantity` branded with the unit's dimension:

| Factory | Unit | Dimension | SI Scale |
|---------|------|-----------|----------|
| `m(v)` | meters | Length | 1 |
| `km(v)` | kilometers | Length | 1000 |
| `cm(v)` | centimeters | Length | 0.01 |
| `mm(v)` | millimeters | Length | 0.001 |
| `s(v)` | seconds | Time | 1 |
| `ms(v)` | milliseconds | Time | 0.001 |
| `min(v)` | minutes | Time | 60 |
| `h(v)` | hours | Time | 3600 |
| `kg(v)` | kilograms | Mass | 1 |
| `g(v)` | grams | Mass | 0.001 |
| `scalar(v)` | dimensionless | — | 1 |

### Operations

```typescript
add(a, b)   // same dimension + same unit required
sub(a, b)   // same dimension + same unit required
mul(a, b)   // any dimensions — result is composed (exponents added)
div(a, b)   // any dimensions — result is composed (exponents subtracted)
```

**Multiplication and division compose dimensions:**

```typescript
const area = mul(m(3), m(4));       // Quantity<[2,0,0,0,0,0,0], "m*m">
const velocity = div(m(10), s(2));  // Quantity<[1,0,-1,0,0,0,0], "m/s">
const force = mul(kg(10), div(m(5), mul(s(1), s(1)))); // kg*m/s²
```

**Scalars can multiply/divide any quantity:**

```typescript
const doubled = mul(scalar(2), m(5));  // 10 m
const halved = div(m(10), scalar(2));  // 5 m
```

### Conversion

```typescript
to(targetFactory, quantity)
```

Converts a quantity to a different unit of the same dimension:

```typescript
to(m, km(1))       // 1000 m
to(km, m(1500))    // 1.5 km
to(g, kg(2.5))     // 2500 g
to(min, h(1))      // 60 min
```

Incompatible conversions are compile-time errors:

```typescript
to(s, km(1))    // ERROR: length cannot convert to time
```

### Comparisons

```typescript
eq(a, b)    // a === b
lt(a, b)    // a < b
lte(a, b)   // a <= b
gt(a, b)    // a > b
gte(a, b)   // a >= b
```

Only quantities of the same dimension and unit can be compared:

```typescript
lt(m(1), m(2))   // true
lt(m(1), s(2))   // COMPILE ERROR
```

### Helpers

```typescript
valueOf(q)                 // extract raw number
format(q)                  // "5 m"
format(q, { precision: 2 }) // "5.00 m"
```

### Checked Mode (Development)

For runtime validation during development:

```typescript
import { createChecked } from 'unitsafe';

const { m, s, km, add, sub, to } = createChecked();

add(m(1), m(2));     // OK
add(m(1), s(1));     // THROWS: "Unit mismatch in add"
to(s, km(1));        // THROWS: "Dimension mismatch in to"
```

## How the Types Work

### Dimension Vectors

Dimensions are represented as 7-element tuples corresponding to the SI base quantities:

```
[Length, Mass, Time, Current, Temperature, Amount, LuminousIntensity]
```

Each element is an integer exponent in the range [-8, +8]:

- `m` → `[1, 0, 0, 0, 0, 0, 0]` (length¹)
- `s` → `[0, 0, 1, 0, 0, 0, 0]` (time¹)
- `m/s` → `[1, 0, -1, 0, 0, 0, 0]` (length¹ × time⁻¹)
- `m²` → `[2, 0, 0, 0, 0, 0, 0]` (length²)

### Type-Level Arithmetic

Multiplication adds exponents; division subtracts them. This is implemented via lookup tables (`AddMap`/`SubMap`) since TypeScript cannot do arithmetic on type-level integers natively.

### Branding

`Quantity<D, L>` is an interface with phantom type parameters `D` (dimension vector) and `L` (unit label). TypeScript's structural typing ensures:

- `add(m(1), s(2))` fails because `Quantity<[1,0,0,...], 'm'>` and `Quantity<[0,0,1,...], 's'>` are incompatible
- `add(1, m(2))` fails because `number` lacks the `_v`, `_s`, `_l` properties

## Design Goals

1. **Safety over convenience** — the type system prevents errors at compile time
2. **Minimal runtime cost** — quantities are tiny 3-property objects; no classes, no prototype chains
3. **Simple internals** — the entire library is a single file with no dependencies
4. **Ergonomic API** — `m(5)` is shorter than `new Meters(5)` or `quantity(5, "m")`

## Performance

Quantities are tiny objects `{_v: number, _s: number, _l: string}` rather than plain numbers. This enables the ergonomic conversion API (`to(km, m(1500))`) but introduces object allocation overhead in microbenchmarks.

In practice, quantity operations take ~15ns each (vs ~0.7ns for raw arithmetic). This overhead is negligible in any application doing real work (I/O, rendering, computation) between quantity operations.

Run benchmarks:

```bash
pnpm bench
```

## Limitations (v1)

- No temperature offset units (Celsius/Fahrenheit) — only scale-based conversions
- Derived units are shown as composed labels (e.g., `m*m`, `m/s`) rather than simplified names
- Addition/subtraction requires the same unit label (e.g., `add(m(1), km(2))` is an error; convert first with `add(m(1), to(m, km(2)))`)

## Development

```bash
pnpm test          # runtime tests
pnpm typecheck     # tsc --noEmit
pnpm type-tests    # compile-time type assertions (tsd)
pnpm bench         # performance benchmarks
pnpm build         # build dist (ESM + CJS)
```

## License

MIT
