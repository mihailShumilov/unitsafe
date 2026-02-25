# Contributing to unitsafe

Thank you for your interest in contributing. This document describes the development workflow, coding conventions, and processes for submitting changes.

## Development Setup

### Prerequisites

- **Node.js** >= 20
- **pnpm** (any version)
- **TypeScript** >= 5.5 (installed as a dev dependency)

### Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd unitsafe

# Install dependencies
pnpm install

# Verify everything works
pnpm test && pnpm typecheck && pnpm build && pnpm type-tests && pnpm bench
```

## Development Workflow

### Red-Green-Refactor

This project follows a strict test-first development cycle:

1. **Red:** Write a failing test (runtime or type-level) that describes the desired behavior.
2. **Green:** Write the minimum code to make the test pass.
3. **Refactor:** Clean up the implementation while keeping all tests green.

### Validation Pipeline

Before committing, run the full validation pipeline:

```bash
pnpm test && pnpm typecheck && pnpm build && pnpm type-tests && pnpm bench
```

| Script | Tool | What It Checks |
|--------|------|----------------|
| `pnpm test` | Vitest | Runtime correctness (486 tests) |
| `pnpm typecheck` | tsc --noEmit | Source type safety |
| `pnpm build` | tsup | ESM + CJS + .d.ts generation |
| `pnpm type-tests` | tsd | Compile-time safety guarantees |
| `pnpm bench` | tsx | Performance regression detection |

All five must pass. `pnpm type-tests` requires a prior `pnpm build` because tsd reads from `dist/`.

## Code Organization

The entire library lives in a single file: `src/index.ts`. This is intentional — the file is large in line count due to the lookup tables, dimension type aliases, and 110 unit definitions, but it is architecturally flat and easy to navigate.

The file is organized in layers:

```
src/index.ts
├── Type-level integer arithmetic (AddMap, SubMap)
├── Dimension vectors (Dim, DimMul, DimDiv, dimension aliases)
├── Quantity interface (including _o offset property)
├── UnitFactory interface (including _offset property)
├── String coercion helper (toNum)
├── Built-in units
│   ├── Length (m, km, cm, mm, nm, um, dm, inch, ft, yd, mi, nmi, mil, au, ly, pc, pl)
│   ├── Mass (kg, g, lb, oz, ug, mg, t, st, ton, lton, dalton, plm)
│   ├── Time (s, ms, min, h, ns, us, d, week, month, yr, decade, century, plt)
│   ├── Temperature (K, C, F, R, pT)
│   ├── Area (mm2, cm2, m2, ha, km2, in2, ft2, yd2, ac, mi2, pla)
│   ├── Volume (ml, cl, l, m3, tsp, tbsp, floz, cup, pt_liq, qt, gal, plv)
│   ├── Velocity (mps, kmh, fps, mph, kn, pvel)
│   ├── Force (N, kN, lbf, dyn, pfo)
│   ├── Energy (J, kJ, cal, kcal, Wh, kWh, eV, BTU, pene)
│   ├── Power (W, kW, MW, hp, ppow)
│   ├── Pressure (Pa, kPa, bar, psi, atm, mmHg, ppre)
│   ├── Digital Storage (b, B, KB, MB, GB, TB, PB)
│   └── Dimensionless (scalar)
├── Core operations (add, sub, mul, div)
├── Conversion (to)
├── Comparisons (eq, lt, lte, gt, gte)
├── Helpers (valueOf, format)
├── String parsing (parse)
└── Checked mode (createChecked)
```

## Coding Conventions

### TypeScript

- **Strict mode** is enabled with all strict checks and `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`.
- **No `any`** in library source (test files may use `any` to verify runtime error handling).
- **Phantom types** use optional properties with the `__phantom_` prefix.
- **Generic constraints** should be as specific as possible to produce clear error messages.

### Performance

- **No class instances.** Quantities are plain object literals `{ _v, _s, _l, _o }`.
- **No prototype chains.** No `Object.create`, no class hierarchies.
- **Monomorphic shapes.** All quantity objects must have the same four properties in the same order: `_v`, `_s`, `_l`, `_o`.
- **No closures in hot paths.** Factory functions use `Object.assign` rather than closure-based approaches.
- **Minimize allocations.** Each operation creates exactly one new object — avoid intermediate objects.

### Naming

- Public API: short, ergonomic names (`m`, `km`, `add`, `to`, `valueOf`)
- Internal properties: prefixed with `_` (`_v`, `_s`, `_l`, `_o`, `_scale`, `_label`, `_dim`, `_offset`)
- Type parameters: descriptive (`D extends Dim`, `L extends string`, `DA`, `DB` for two dimensions)
- Phantom type properties: prefixed with `__phantom_`

### Tests

- **Runtime tests** go in `test/` and use Vitest's `describe`/`it`/`expect`.
- **Type-level tests** go in `type-tests/` and use tsd's `expectType`/`expectError`.
- Test names should describe the behavior being tested, not the implementation.

## Adding a New Unit

To add a new built-in unit to an existing dimension (e.g., a new length unit `furlong`):

1. **Check the dimension type** — for length, `DimLength = [1, 0, 0, 0, 0, 0, 0, 0]` already exists.

2. **Add the unit factory** in `src/index.ts`. The factory function must accept `number | string` — use the internal `toNum` helper to handle string coercion. Include `_o: 0` in the quantity return and `_offset: 0` in the metadata (non-temperature units always have zero offset):

```typescript
export const furlong: UnitFactory<DimLength, 'furlong'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'furlong'> => ({
    _v: toNum(v, 'furlong'), _s: 201.168, _l: 'furlong', _o: 0,
  }),
  { _scale: 201.168, _label: 'furlong', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);
```

3. **Register in checked mode** — add `furlong` to the `allFactories` array in `createChecked()`.

4. **Add it to the return object** of `createChecked()`.

5. **Register in `parse()`** — add `furlong` to the `factories` record inside the `parse` function body so that `parse('1 furlong')` works:

```typescript
const factories: Record<string, UnitFactory<Dim, string>> = {
  m, km, cm, mm, /* ... */, furlong,  // add here
};
```

6. **Add runtime tests** in `test/acceptance.test.ts`. Include both numeric and string input:

```typescript
it('converts furlong to m', () => {
  const result = to(m, furlong(1));
  expect(valueOf(result)).toBeCloseTo(201.168);
});

it('furlong factory accepts string input', () => {
  expect(valueOf(furlong('1.5'))).toBe(1.5);
});

it('parse handles furlong unit', () => {
  const result = parse('1 furlong');
  expect(valueOf(result)).toBe(1);
  expect(result._l).toBe('furlong');
});
```

7. **Add type tests** in `type-tests/index.test-d.ts`. Include string input:

```typescript
expectType<Quantity<[1,0,0,0,0,0,0,0], 'furlong'>>(furlong(1));
expectType<Quantity<[1,0,0,0,0,0,0,0], 'furlong'>>(furlong('1'));
expectError(add(furlong(1), s(1))); // different dimensions
```

8. **Export** from `src/index.ts` (already exported if using `export const`).

9. **Document** in the README's unit factory table and Unit Reference section.

10. **Run the full pipeline:**

```bash
pnpm test && pnpm typecheck && pnpm build && pnpm type-tests
```

### Adding a Temperature Unit (Affine Offset)

Temperature units differ from all other units in that they require an **additive offset** alongside the scale factor. The conversion formula is `SI_value = value × scale + offset`.

Example — adding a hypothetical unit `myTemp` with scale `2` and offset `100 K`:

```typescript
export const myTemp: UnitFactory<DimTemperature, 'myTemp'> = Object.assign(
  (v: number | string): Quantity<DimTemperature, 'myTemp'> => ({
    _v: toNum(v, 'myTemp'), _s: 2, _l: 'myTemp', _o: 100,
  }),
  { _scale: 2, _label: 'myTemp', _dim: [0,0,0,0,1,0,0,0] as DimTemperature, _offset: 100 },
);
```

The `to()` function automatically handles the offset:
`result = (value × sourceScale + sourceOffset − targetOffset) / targetScale`

## Adding a New Dimension

To add support for a new base dimension:

1. The `Dim` type is an 8-element tuple. Positions 0–6 are the seven SI base quantities; position 7 is Data. Adding a 9th base dimension would require extending the `Dim` type, the `DimMul` and `DimDiv` computed types, and the `AddMap`/`SubMap` lookup tables. This is a significant change — open an issue for discussion first.

2. For adding units to **existing** dimensions (including Data at position 7), follow the standard "Adding a New Unit" process above.

## Pull Request Process

1. Fork the repository and create a feature branch.
2. Write tests first, then implementation.
3. Run the full validation pipeline.
4. Submit a pull request with a clear description of the change.
5. Include benchmark results if performance characteristics might be affected.

## Reporting Issues

When reporting bugs, please include:

- TypeScript version (`tsc --version`)
- Node.js version (`node --version`)
- Minimal reproduction code
- Expected vs. actual behavior
- Whether the issue is at compile time (type error) or runtime (wrong value)
