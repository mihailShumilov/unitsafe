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
| `pnpm test` | Vitest | Runtime correctness (60 tests) |
| `pnpm typecheck` | tsc --noEmit | Source type safety |
| `pnpm build` | tsup | ESM + CJS + .d.ts generation |
| `pnpm type-tests` | tsd | Compile-time safety guarantees |
| `pnpm bench` | tsx | Performance regression detection |

All five must pass. `pnpm type-tests` requires a prior `pnpm build` because tsd reads from `dist/`.

## Code Organization

The entire library lives in a single file: `src/index.ts`. This is intentional — at ~300 lines, the codebase is small enough that splitting would add navigational overhead without architectural benefit.

The file is organized in layers:

```
src/index.ts
├── Type-level integer arithmetic (AddMap, SubMap)
├── Dimension vectors (Dim, DimMul, DimDiv)
├── Quantity interface
├── UnitFactory interface
├── String coercion helper (toNum)
├── Built-in units (m, km, cm, mm, s, ms, min, h, kg, g, scalar)
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

- **No class instances.** Quantities are plain object literals `{ _v, _s, _l }`.
- **No prototype chains.** No `Object.create`, no class hierarchies.
- **Monomorphic shapes.** All quantity objects must have the same properties in the same order.
- **No closures in hot paths.** Factory functions use `Object.assign` rather than closure-based approaches.
- **Minimize allocations.** Each operation creates exactly one new object — avoid intermediate objects.

### Naming

- Public API: short, ergonomic names (`m`, `km`, `add`, `to`, `valueOf`)
- Internal properties: prefixed with `_` (`_v`, `_s`, `_l`, `_scale`, `_label`, `_dim`)
- Type parameters: descriptive (`D extends Dim`, `L extends string`, `DA`, `DB` for two dimensions)
- Phantom type properties: prefixed with `__phantom_`

### Tests

- **Runtime tests** go in `test/` and use Vitest's `describe`/`it`/`expect`.
- **Type-level tests** go in `type-tests/` and use tsd's `expectType`/`expectError`.
- Test names should describe the behavior being tested, not the implementation.

## Adding a New Unit

To add a new built-in unit (e.g., miles):

1. **Define the dimension type** if new (e.g., `DimLength` already exists for length).

2. **Add the unit factory** in `src/index.ts`. The factory function must accept `number | string` — use the internal `toNum` helper to handle string coercion:

```typescript
export const mi: UnitFactory<DimLength, 'mi'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'mi'> => ({ _v: toNum(v, 'mi'), _s: 1609.344, _l: 'mi' }),
  { _scale: 1609.344, _label: 'mi', _dim: [1,0,0,0,0,0,0] as DimLength },
);
```

3. **Register in checked mode** — add `mi` to the `allFactories` array in `createChecked()`.

4. **Add it to the return object** of `createChecked()`.

5. **Register in `parse()`** — add `mi` to the `factories` record inside the `parse` function body so that `parse('1 mi')` works:

```typescript
const factories: Record<string, UnitFactory<Dim, string>> = {
  m, km, cm, mm, s, ms, min, h, kg, g, scalar, mi,  // add here
};
```

6. **Add runtime tests** in `test/acceptance.test.ts`. Include both numeric and string input:

```typescript
it('converts mi to m', () => {
  const result = to(m, mi(1));
  expect(valueOf(result)).toBeCloseTo(1609.344);
});

it('mi factory accepts string input', () => {
  expect(valueOf(mi('1.5'))).toBe(1.5);
});

it('parse handles mi unit', () => {
  const result = parse('1 mi');
  expect(valueOf(result)).toBe(1);
  expect(result._l).toBe('mi');
});
```

7. **Add type tests** in `type-tests/index.test-d.ts`. Include string input:

```typescript
expectType<Quantity<[1,0,0,0,0,0,0], 'mi'>>(mi(1));
expectType<Quantity<[1,0,0,0,0,0,0], 'mi'>>(mi('1'));
expectError(add(mi(1), s(1))); // different dimensions
```

8. **Export** from `src/index.ts` (already exported if using `export const`).

9. **Document** in the README's unit factory table.

10. **Run the full pipeline:**

```bash
pnpm test && pnpm typecheck && pnpm build && pnpm type-tests
```

## Adding a New Dimension

To add support for a new base dimension (e.g., electric current):

1. The dimension type already exists in the exponent vector at position `[3]` (Current). Define a named alias:

```typescript
type DimCurrent = [0, 0, 0, 1, 0, 0, 0];
```

2. Add unit factories (e.g., ampere, milliampere) following the pattern above.

3. Add tests verifying that current quantities cannot be added to length/time/mass quantities.

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
