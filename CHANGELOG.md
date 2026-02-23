# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-23

### Added

- **Core type system** — dimension vectors as 7-element integer exponent tuples `[L, M, T, I, Θ, N, J]` with compile-time arithmetic via lookup tables (`AddMap`, `SubMap`).
- **11 built-in unit factories** — `m`, `km`, `cm`, `mm`, `s`, `ms`, `min`, `h`, `kg`, `g`, `scalar`.
- **Arithmetic operations** — `add`, `sub` (same-dimension enforcement), `mul`, `div` (dimension composition).
- **Unit conversion** — `to(targetFactory, quantity)` with compile-time dimension compatibility checks.
- **Comparisons** — `eq`, `lt`, `lte`, `gt`, `gte` with same-dimension enforcement.
- **Helpers** — `valueOf` (extract number), `format` (string with unit label and optional precision).
- **Checked mode** — `createChecked()` returns a mirror API with runtime dimension/unit validation for development.
- **Dual build** — ESM (4.1 KB) and CommonJS (4.5 KB) via tsup.
- **Type-level tests** — 20+ tsd assertions for both positive and negative type cases.
- **Runtime tests** — 32 Vitest tests covering factories, arithmetic, conversions, comparisons, formatting, and checked mode.
- **Benchmark harness** — custom Node.js benchmark with trimmed-mean reporting.

### Known Limitations

- No temperature offset units (Celsius/Fahrenheit).
- Derived units show composed labels (`m*m`, `m/s`) without simplification.
- Same unit label required for add/sub (explicit conversion required).
- Exponent range bounded to [-8, +8].
- No user-facing custom unit definition API.
