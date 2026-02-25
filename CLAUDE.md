# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**unitsafe** is a TypeScript library providing compile-time dimension safety for physical units. It prevents invalid operations like `meters + seconds` at compile time using phantom types and dimension vectors, with minimal runtime overhead.

## Commands

```bash
pnpm test              # Run Vitest tests (486 tests)
pnpm test -- -t "name" # Run a single test by name
pnpm typecheck         # tsc --noEmit — check source type safety
pnpm build             # tsup — produce ESM + CJS + .d.ts in dist/
pnpm type-tests        # tsd — compile-time type assertions (requires prior build)
pnpm bench             # tsx bench/index.ts — performance benchmarks
```

**Full validation pipeline** (run before committing):
```bash
pnpm test && pnpm typecheck && pnpm build && pnpm type-tests && pnpm bench
```

`pnpm type-tests` reads from `dist/`, so `pnpm build` must run first.

## Architecture

The entire library is a single file: `src/index.ts`. This is intentional — the file is large due to lookup tables and 110 unit definitions, but architecturally flat.

### Layers (top to bottom in src/index.ts)

1. **Type-level arithmetic** — `AddMap`/`SubMap` lookup tables for O(1) compile-time integer math (range [-8, +8])
2. **Dimension vectors** — `Dim` = 8-element tuple `[L, M, T, I, Θ, N, J, D]`; `DimMul`/`DimDiv` compose dimensions
3. **Quantity interface** — `{ _v, _s, _l, _o }` branded with phantom `__phantom_dim` and `__phantom_label`
4. **UnitFactory interface** — callable `(v: number | string) => Quantity` with metadata `{ _scale, _label, _dim, _offset }`
5. **Unit factories** — 110 exports across 12 categories (Length, Mass, Time, Temperature, Area, Volume, Velocity, Force, Energy, Power, Pressure, Digital Storage, Scalar)
6. **Operations** — `add`, `sub` (same-dimension), `mul`, `div` (dimension composition)
7. **Conversion** — `to()` using formula `(value * scale + offset - targetOffset) / targetScale`
8. **Comparisons** — `eq`, `lt`, `lte`, `gt`, `gte`
9. **Helpers** — `valueOf`, `format`
10. **Parsing** — `parse("5 m")` string-to-Quantity
11. **Checked mode** — `createChecked()` wraps API with runtime dimension validation

### Key Design Decisions

- **No classes.** Quantities are plain object literals `{ _v, _s, _l, _o }` for V8 monomorphic optimization.
- **No closures in hot paths.** Factories use `Object.assign` on a function.
- **Affine offsets.** Temperature units (C, F, R) use `_o`/`_offset` for non-linear conversions. All non-temperature units have offset 0.
- **8-element dimension vectors.** Position 7 is Data (digital storage). Positions 0-6 are SI base quantities.
- **Phantom types.** `__phantom_dim` and `__phantom_label` are optional properties used only at the type level.

## Adding a New Unit

Follow `CONTRIBUTING.md` § "Adding a New Unit". Key steps:
1. Add factory in `src/index.ts` with `_o: 0` and `_offset: 0` (non-temperature)
2. Register in `parse()` factories record and `createChecked()` allFactories array + return object
3. Add runtime tests in `test/acceptance.test.ts`
4. Add type tests in `type-tests/index.test-d.ts`
5. Run full validation pipeline

## Test Structure

| Location | Framework | Purpose |
|----------|-----------|---------|
| `test/acceptance/*.test.ts` | Vitest | Category-based acceptance tests (13 files) |
| `test/paranoic-*.test.ts` | Vitest | Paranoic/adversarial tests (3 files) |
| `test/parse.test.ts` | Vitest | String parsing edge cases |
| `type-tests/index.test-d.ts` | tsd | Compile-time type safety (`expectType`/`expectError`) |
| `bench/index.ts` | Custom | Performance regression detection |

Acceptance tests are split by category: `length`, `mass`, `time`, `temperature`, `area`, `volume`, `velocity`, `force`, `energy`, `power`, `pressure`, `digital-storage`, `core-operations`.

## Development Process — Paranoic TDD (MANDATORY)

**Every feature, bug fix, or behavior change MUST follow this strict order:**

1. **Tests first, always.** Before writing ANY implementation code, launch the `paranoic-acceptance-test-writer` agent to generate exhaustive acceptance tests. These tests are immutable contracts — implementation must satisfy them, never the other way around.
2. **Tests must be paranoic/aggressive.** Cover: normal flows, edge cases, adversarial inputs, boundary conditions, IEEE 754 quirks (`NaN`, `Infinity`, `-0`, `0.1+0.2`), prototype pollution, Unicode attacks, extreme values, rapid sequential operations, roundtrip accuracy, and real-world physics scenarios.
3. **Red phase.** Run the tests — they MUST fail (proving the feature doesn't exist yet).
4. **Green phase.** Write the minimum implementation to make all tests pass.
5. **Refactor phase.** Clean up while keeping all tests green.
6. **Never weaken tests to match implementation.** If a test fails, fix the code, not the test. The only exception is a genuine test bug (wrong expected value).

## Conventions

- **No `any`** in library source.
- Internal properties prefixed with `_` (`_v`, `_s`, `_l`, `_o`).
- Phantom type properties prefixed with `__phantom_`.
- TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`.
