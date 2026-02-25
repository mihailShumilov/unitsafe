# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **8-element dimension vectors** — Extended from 7 to 8 elements, adding Data (digital storage) as the 8th base dimension `[L, M, T, I, Θ, N, J, D]`.
- **Affine offset support** — Temperature conversions now use `SI = value × scale + offset`, enabling Celsius, Fahrenheit, and Rankine alongside Kelvin. The `_o` property on `Quantity` and `_offset` on `UnitFactory` carry the offset value (0 for all non-temperature units).
- **Temperature units** — `K` (kelvin, scale 1, offset 0), `C` (celsius, scale 1, offset 273.15), `F` (fahrenheit, scale 5/9, offset 255.372...), `R` (rankine, scale 5/9, offset 0), `pT` (Planck temperature).
- **9 new length units** — `nm` (1e-9 m), `um` (1e-6 m), `dm` (0.1 m), `nmi` (1852 m, nautical mile), `mil` (2.54e-5 m), `au` (1.496e11 m), `ly` (9.461e15 m), `pc` (3.086e16 m), `pl` (1.616e-35 m, Planck length).
- **8 new mass units** — `ug` (1e-9 kg), `mg` (1e-6 kg), `t` (1000 kg, metric tonne), `st` (6.350 kg, stone), `ton` (907.18 kg, US short ton), `lton` (1016.05 kg, long ton), `dalton` (label `Da`, 1.661e-27 kg), `plm` (2.176e-8 kg, Planck mass).
- **9 new time units** — `ns` (1e-9 s), `us` (1e-6 s), `d` (86400 s), `week` (604800 s), `month` (2629800 s), `yr` (31557600 s, Julian year), `decade`, `century`, `plt` (5.391e-44 s, Planck time).
- **11 area units** — `mm2`, `cm2`, `m2`, `ha`, `km2`, `in2`, `ft2`, `yd2`, `ac` (acre), `mi2`, `pla` (Planck area).
- **12 volume units** — `ml`, `cl`, `l`, `m3`, `tsp`, `tbsp`, `floz`, `cup`, `pt_liq` (label `pt`), `qt`, `gal`, `plv` (Planck volume).
- **6 velocity units** — `mps` (label `m/s`), `kmh` (label `km/h`), `fps` (label `ft/s`), `mph`, `kn` (knot), `pvel` (label `c`, speed of light).
- **5 force units** — `N`, `kN`, `lbf`, `dyn`, `pfo` (Planck force).
- **9 energy units** — `J`, `kJ`, `cal`, `kcal`, `Wh`, `kWh`, `eV`, `BTU`, `pene` (Planck energy).
- **5 power units** — `W`, `kW`, `MW`, `hp`, `ppow` (Planck power).
- **7 pressure units** — `Pa`, `kPa`, `bar`, `psi`, `atm`, `mmHg`, `ppre` (Planck pressure).
- **7 digital storage units** — `b` (bits), `B` (bytes), `KB`, `MB`, `GB`, `TB`, `PB` (binary convention: 1 KB = 1024 B).
- **All new units in `parse()`** — every new label is parseable via `parse('100 C')`, `parse('4 GB')`, etc.
- **All new units in `createChecked()`** — full runtime dimension validation for all 110 unit factories.
- **69 new acceptance tests** (198 total), **80+ type assertions** covering all new dimensions, temperature conversions, area, volume, velocity, force, energy, power, pressure, and digital storage.
- **US/English length units** — `inch` (label `in`, 0.0254 m), `ft` (0.3048 m), `yd` (0.9144 m), `mi` (1609.344 m). Full cross-conversion support with metric units and between each other (e.g., `to(ft, mi(1))` → 5280).
- **US/English mass units** — `lb` (0.45359237 kg), `oz` (0.028349523125 kg). Converts to/from metric (`kg`, `g`) and between each other (`to(oz, lb(1))` → 16).
- **`parse()` supports US/English units** — `parse('5 ft')`, `parse('150 lb')`, etc. all work. Full-word forms (`feet`, `miles`, `pounds`) remain rejected.
- **Checked mode includes US/English units** — `createChecked()` exposes `inch`, `ft`, `yd`, `mi`, `lb`, `oz` factories with runtime dimension validation.
- **String input for unit factories** — All factories accept `number | string`. String values are trimmed of whitespace, parsed via `Number()`, and throw a `TypeError` on empty or non-numeric input. Scientific notation is supported.
- **`parse(input)` function** — Parses a `"<value> <unit>"` string (e.g., `parse('5 m')`, `parse('1.5 km')`) into a `Quantity`. Handles negative values, scientific notation, and extra whitespace. Throws a `TypeError` on unknown units, missing value or unit, empty input, and non-numeric values. Available from both the top-level export and `createChecked()`.

### Changed

- **Dimension vector type** extended from 7-element to 8-element tuple `[L, M, T, I, Θ, N, J, D]`.
- **`Quantity` interface** — added `_o: number` property (SI offset; 0 for all non-temperature units).
- **`UnitFactory` interface** — added `_offset: number` property (corresponding offset metadata).
- **`to()` conversion formula** generalized to `(value × scale + offset − targetOffset) / targetScale` to support affine temperature conversions.
- **Unit count** increased from 17 to 110 built-in unit factories.

### Removed

- **"No temperature offset units" limitation** — Celsius and Fahrenheit are now fully supported via affine offset conversions.

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
