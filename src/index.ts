/**
 * @module unitsafe
 *
 * Compile-time dimension safety for TypeScript. Prevents invalid
 * operations like `meters + seconds` at compile time, with minimal
 * runtime overhead.
 *
 * ## Core Concepts
 *
 * - **Dimension vectors** encode physical dimensions (length, mass, time, ...)
 *   as 8-element integer exponent tuples at the type level.
 * - **Quantities** are tiny runtime objects `{ _v, _s, _l, _o }` branded with
 *   phantom type parameters that carry dimension and unit label information.
 * - **Unit factories** (`m`, `km`, `s`, ...) create branded quantities.
 * - **Operations** (`add`, `sub`, `mul`, `div`) enforce dimension constraints
 *   at compile time and perform plain arithmetic at runtime.
 *
 * ## Quick Example
 *
 * ```typescript
 * import { m, km, s, add, div, to, valueOf } from 'unitsafe';
 *
 * const speed = div(m(100), s(10));  // OK: m/s
 * const total = add(km(10), km(32)); // OK: same unit
 * const meters = to(m, km(1.5));     // OK: 1500 m
 *
 * add(m(1), s(2));  // Compile error: different dimensions
 * to(s, km(1));     // Compile error: incompatible conversion
 * ```
 *
 * @packageDocumentation
 */

// ═══════════════════════════════════════════════════════════════════════
// LAYER 1: Type-Level Dimension Arithmetic
// ═══════════════════════════════════════════════════════════════════════

/**
 * Bounded integer type for dimension exponents.
 *
 * Represents a type-level integer in the range `[-8, +8]`. Used as
 * individual elements within a {@link Dim} vector. The bounded range
 * supports up to 8th-power compositions (e.g., L^8), which covers
 * all practical physical formulas.
 *
 * Values outside this range are clamped to the nearest boundary
 * during type-level arithmetic.
 *
 * @internal
 */
type Int = -8 | -7 | -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Pre-computed lookup table for type-level integer addition.
 *
 * Used by {@link IntAdd} to compute `A + B` at the type level without
 * recursive conditional types (which cause exponential instantiation depth
 * in TypeScript). Each entry `AddMap[A][B]` yields the sum, clamped
 * to the `[-8, +8]` range.
 *
 * @internal
 */
type AddMap = {
  [-8]: { [-8]: -8; [-7]: -8; [-6]: -8; [-5]: -8; [-4]: -8; [-3]: -8; [-2]: -8; [-1]: -8; [0]: -8; [1]: -7; [2]: -6; [3]: -5; [4]: -4; [5]: -3; [6]: -2; [7]: -1; [8]: 0 };
  [-7]: { [-8]: -8; [-7]: -8; [-6]: -8; [-5]: -8; [-4]: -8; [-3]: -8; [-2]: -8; [-1]: -8; [0]: -7; [1]: -6; [2]: -5; [3]: -4; [4]: -3; [5]: -2; [6]: -1; [7]: 0; [8]: 1 };
  [-6]: { [-8]: -8; [-7]: -8; [-6]: -8; [-5]: -8; [-4]: -8; [-3]: -8; [-2]: -8; [-1]: -7; [0]: -6; [1]: -5; [2]: -4; [3]: -3; [4]: -2; [5]: -1; [6]: 0; [7]: 1; [8]: 2 };
  [-5]: { [-8]: -8; [-7]: -8; [-6]: -8; [-5]: -8; [-4]: -8; [-3]: -8; [-2]: -7; [-1]: -6; [0]: -5; [1]: -4; [2]: -3; [3]: -2; [4]: -1; [5]: 0; [6]: 1; [7]: 2; [8]: 3 };
  [-4]: { [-8]: -8; [-7]: -8; [-6]: -8; [-5]: -8; [-4]: -8; [-3]: -7; [-2]: -6; [-1]: -5; [0]: -4; [1]: -3; [2]: -2; [3]: -1; [4]: 0; [5]: 1; [6]: 2; [7]: 3; [8]: 4 };
  [-3]: { [-8]: -8; [-7]: -8; [-6]: -8; [-5]: -8; [-4]: -7; [-3]: -6; [-2]: -5; [-1]: -4; [0]: -3; [1]: -2; [2]: -1; [3]: 0; [4]: 1; [5]: 2; [6]: 3; [7]: 4; [8]: 5 };
  [-2]: { [-8]: -8; [-7]: -8; [-6]: -8; [-5]: -7; [-4]: -6; [-3]: -5; [-2]: -4; [-1]: -3; [0]: -2; [1]: -1; [2]: 0; [3]: 1; [4]: 2; [5]: 3; [6]: 4; [7]: 5; [8]: 6 };
  [-1]: { [-8]: -8; [-7]: -8; [-6]: -7; [-5]: -6; [-4]: -5; [-3]: -4; [-2]: -3; [-1]: -2; [0]: -1; [1]: 0; [2]: 1; [3]: 2; [4]: 3; [5]: 4; [6]: 5; [7]: 6; [8]: 7 };
  [0]:  { [-8]: -8; [-7]: -7; [-6]: -6; [-5]: -5; [-4]: -4; [-3]: -3; [-2]: -2; [-1]: -1; [0]: 0; [1]: 1; [2]: 2; [3]: 3; [4]: 4; [5]: 5; [6]: 6; [7]: 7; [8]: 8 };
  [1]:  { [-8]: -7; [-7]: -6; [-6]: -5; [-5]: -4; [-4]: -3; [-3]: -2; [-2]: -1; [-1]: 0; [0]: 1; [1]: 2; [2]: 3; [3]: 4; [4]: 5; [5]: 6; [6]: 7; [7]: 8; [8]: 8 };
  [2]:  { [-8]: -6; [-7]: -5; [-6]: -4; [-5]: -3; [-4]: -2; [-3]: -1; [-2]: 0; [-1]: 1; [0]: 2; [1]: 3; [2]: 4; [3]: 5; [4]: 6; [5]: 7; [6]: 8; [7]: 8; [8]: 8 };
  [3]:  { [-8]: -5; [-7]: -4; [-6]: -3; [-5]: -2; [-4]: -1; [-3]: 0; [-2]: 1; [-1]: 2; [0]: 3; [1]: 4; [2]: 5; [3]: 6; [4]: 7; [5]: 8; [6]: 8; [7]: 8; [8]: 8 };
  [4]:  { [-8]: -4; [-7]: -3; [-6]: -2; [-5]: -1; [-4]: 0; [-3]: 1; [-2]: 2; [-1]: 3; [0]: 4; [1]: 5; [2]: 6; [3]: 7; [4]: 8; [5]: 8; [6]: 8; [7]: 8; [8]: 8 };
  [5]:  { [-8]: -3; [-7]: -2; [-6]: -1; [-5]: 0; [-4]: 1; [-3]: 2; [-2]: 3; [-1]: 4; [0]: 5; [1]: 6; [2]: 7; [3]: 8; [4]: 8; [5]: 8; [6]: 8; [7]: 8; [8]: 8 };
  [6]:  { [-8]: -2; [-7]: -1; [-6]: 0; [-5]: 1; [-4]: 2; [-3]: 3; [-2]: 4; [-1]: 5; [0]: 6; [1]: 7; [2]: 8; [3]: 8; [4]: 8; [5]: 8; [6]: 8; [7]: 8; [8]: 8 };
  [7]:  { [-8]: -1; [-7]: 0; [-6]: 1; [-5]: 2; [-4]: 3; [-3]: 4; [-2]: 5; [-1]: 6; [0]: 7; [1]: 8; [2]: 8; [3]: 8; [4]: 8; [5]: 8; [6]: 8; [7]: 8; [8]: 8 };
  [8]:  { [-8]: 0; [-7]: 1; [-6]: 2; [-5]: 3; [-4]: 4; [-3]: 5; [-2]: 6; [-1]: 7; [0]: 8; [1]: 8; [2]: 8; [3]: 8; [4]: 8; [5]: 8; [6]: 8; [7]: 8; [8]: 8 };
};

/**
 * Pre-computed lookup table for type-level integer subtraction.
 *
 * Used by {@link IntSub} to compute `A - B` at the type level.
 * Each entry `SubMap[A][B]` yields the difference, clamped
 * to the `[-8, +8]` range.
 *
 * @internal
 */
type SubMap = {
  [-8]: { [-8]: 0; [-7]: -1; [-6]: -2; [-5]: -3; [-4]: -4; [-3]: -5; [-2]: -6; [-1]: -7; [0]: -8; [1]: -8; [2]: -8; [3]: -8; [4]: -8; [5]: -8; [6]: -8; [7]: -8; [8]: -8 };
  [-7]: { [-8]: 1; [-7]: 0; [-6]: -1; [-5]: -2; [-4]: -3; [-3]: -4; [-2]: -5; [-1]: -6; [0]: -7; [1]: -8; [2]: -8; [3]: -8; [4]: -8; [5]: -8; [6]: -8; [7]: -8; [8]: -8 };
  [-6]: { [-8]: 2; [-7]: 1; [-6]: 0; [-5]: -1; [-4]: -2; [-3]: -3; [-2]: -4; [-1]: -5; [0]: -6; [1]: -7; [2]: -8; [3]: -8; [4]: -8; [5]: -8; [6]: -8; [7]: -8; [8]: -8 };
  [-5]: { [-8]: 3; [-7]: 2; [-6]: 1; [-5]: 0; [-4]: -1; [-3]: -2; [-2]: -3; [-1]: -4; [0]: -5; [1]: -6; [2]: -7; [3]: -8; [4]: -8; [5]: -8; [6]: -8; [7]: -8; [8]: -8 };
  [-4]: { [-8]: 4; [-7]: 3; [-6]: 2; [-5]: 1; [-4]: 0; [-3]: -1; [-2]: -2; [-1]: -3; [0]: -4; [1]: -5; [2]: -6; [3]: -7; [4]: -8; [5]: -8; [6]: -8; [7]: -8; [8]: -8 };
  [-3]: { [-8]: 5; [-7]: 4; [-6]: 3; [-5]: 2; [-4]: 1; [-3]: 0; [-2]: -1; [-1]: -2; [0]: -3; [1]: -4; [2]: -5; [3]: -6; [4]: -7; [5]: -8; [6]: -8; [7]: -8; [8]: -8 };
  [-2]: { [-8]: 6; [-7]: 5; [-6]: 4; [-5]: 3; [-4]: 2; [-3]: 1; [-2]: 0; [-1]: -1; [0]: -2; [1]: -3; [2]: -4; [3]: -5; [4]: -6; [5]: -7; [6]: -8; [7]: -8; [8]: -8 };
  [-1]: { [-8]: 7; [-7]: 6; [-6]: 5; [-5]: 4; [-4]: 3; [-3]: 2; [-2]: 1; [-1]: 0; [0]: -1; [1]: -2; [2]: -3; [3]: -4; [4]: -5; [5]: -6; [6]: -7; [7]: -8; [8]: -8 };
  [0]:  { [-8]: 8; [-7]: 7; [-6]: 6; [-5]: 5; [-4]: 4; [-3]: 3; [-2]: 2; [-1]: 1; [0]: 0; [1]: -1; [2]: -2; [3]: -3; [4]: -4; [5]: -5; [6]: -6; [7]: -7; [8]: -8 };
  [1]:  { [-8]: 8; [-7]: 8; [-6]: 7; [-5]: 6; [-4]: 5; [-3]: 4; [-2]: 3; [-1]: 2; [0]: 1; [1]: 0; [2]: -1; [3]: -2; [4]: -3; [5]: -4; [6]: -5; [7]: -6; [8]: -7 };
  [2]:  { [-8]: 8; [-7]: 8; [-6]: 8; [-5]: 7; [-4]: 6; [-3]: 5; [-2]: 4; [-1]: 3; [0]: 2; [1]: 1; [2]: 0; [3]: -1; [4]: -2; [5]: -3; [6]: -4; [7]: -5; [8]: -6 };
  [3]:  { [-8]: 8; [-7]: 8; [-6]: 8; [-5]: 8; [-4]: 7; [-3]: 6; [-2]: 5; [-1]: 4; [0]: 3; [1]: 2; [2]: 1; [3]: 0; [4]: -1; [5]: -2; [6]: -3; [7]: -4; [8]: -5 };
  [4]:  { [-8]: 8; [-7]: 8; [-6]: 8; [-5]: 8; [-4]: 8; [-3]: 7; [-2]: 6; [-1]: 5; [0]: 4; [1]: 3; [2]: 2; [3]: 1; [4]: 0; [5]: -1; [6]: -2; [7]: -3; [8]: -4 };
  [5]:  { [-8]: 8; [-7]: 8; [-6]: 8; [-5]: 8; [-4]: 8; [-3]: 8; [-2]: 7; [-1]: 6; [0]: 5; [1]: 4; [2]: 3; [3]: 2; [4]: 1; [5]: 0; [6]: -1; [7]: -2; [8]: -3 };
  [6]:  { [-8]: 8; [-7]: 8; [-6]: 8; [-5]: 8; [-4]: 8; [-3]: 8; [-2]: 8; [-1]: 7; [0]: 6; [1]: 5; [2]: 4; [3]: 3; [4]: 2; [5]: 1; [6]: 0; [7]: -1; [8]: -2 };
  [7]:  { [-8]: 8; [-7]: 8; [-6]: 8; [-5]: 8; [-4]: 8; [-3]: 8; [-2]: 8; [-1]: 8; [0]: 7; [1]: 6; [2]: 5; [3]: 4; [4]: 3; [5]: 2; [6]: 1; [7]: 0; [8]: -1 };
  [8]:  { [-8]: 8; [-7]: 8; [-6]: 8; [-5]: 8; [-4]: 8; [-3]: 8; [-2]: 8; [-1]: 8; [0]: 8; [1]: 7; [2]: 6; [3]: 5; [4]: 4; [5]: 3; [6]: 2; [7]: 1; [8]: 0 };
};

/**
 * Type-level integer addition via lookup table.
 *
 * Computes `A + B` at the type level, returning an {@link Int} result
 * clamped to `[-8, +8]`. Used internally by {@link DimMul} to compose
 * dimension exponents when multiplying quantities.
 *
 * @typeParam A - First operand (bounded integer)
 * @typeParam B - Second operand (bounded integer)
 *
 * @example
 * ```typescript
 * type Two = IntAdd<1, 1>; // 2
 * type Zero = IntAdd<-3, 3>; // 0
 * ```
 *
 * @internal
 */
type IntAdd<A extends Int, B extends Int> = AddMap[A][B];

/**
 * Type-level integer subtraction via lookup table.
 *
 * Computes `A - B` at the type level, returning an {@link Int} result
 * clamped to `[-8, +8]`. Used internally by {@link DimDiv} to compose
 * dimension exponents when dividing quantities.
 *
 * @typeParam A - Minuend (bounded integer)
 * @typeParam B - Subtrahend (bounded integer)
 *
 * @example
 * ```typescript
 * type One = IntSub<3, 2>; // 1
 * type NegTwo = IntSub<0, 2>; // -2
 * ```
 *
 * @internal
 */
type IntSub<A extends Int, B extends Int> = SubMap[A][B];

// ═══════════════════════════════════════════════════════════════════════
// LAYER 1: Dimension Vectors
// ═══════════════════════════════════════════════════════════════════════

/**
 * A physical dimension represented as an 8-element exponent vector.
 *
 * Each position corresponds to one of the seven SI base quantities
 * plus a Data (digital storage) dimension:
 *
 * | Index | Base Quantity         | Symbol |
 * |-------|-----------------------|--------|
 * | 0     | Length                | L      |
 * | 1     | Mass                  | M      |
 * | 2     | Time                  | T      |
 * | 3     | Electric current      | I      |
 * | 4     | Thermodynamic temp.   | Θ      |
 * | 5     | Amount of substance   | N      |
 * | 6     | Luminous intensity    | J      |
 * | 7     | Data (digital storage)| D      |
 *
 * The exponent at each position indicates the power of that base
 * quantity. For example, velocity (m/s) is `[1, 0, -1, 0, 0, 0, 0, 0]`
 * meaning L^1 * T^-1.
 *
 * @example
 * ```typescript
 * // Length (meters): L^1
 * type DimLength = [1, 0, 0, 0, 0, 0, 0, 0];
 *
 * // Velocity (m/s): L^1 * T^-1
 * type DimVelocity = [1, 0, -1, 0, 0, 0, 0, 0];
 *
 * // Force (N = kg*m/s^2): L^1 * M^1 * T^-2
 * type DimForce = [1, 1, -2, 0, 0, 0, 0, 0];
 * ```
 *
 * @internal
 */
type Dim = readonly [Int, Int, Int, Int, Int, Int, Int, Int];

/**
 * Computes the dimension vector for the product of two quantities.
 *
 * When multiplying physical quantities, their dimension exponents are
 * **added** element-wise. For example, length (L^1) times length (L^1)
 * gives area (L^2).
 *
 * Used by the {@link mul} function at the type level.
 *
 * @typeParam A - Dimension vector of the first operand
 * @typeParam B - Dimension vector of the second operand
 *
 * @example
 * ```typescript
 * // m * m = m^2: [1,0,...] + [1,0,...] = [2,0,...]
 * type Area = DimMul<[1,0,0,0,0,0,0,0], [1,0,0,0,0,0,0,0]>;
 * // Result: [2, 0, 0, 0, 0, 0, 0, 0]
 * ```
 *
 * @internal
 */
type DimMul<A extends Dim, B extends Dim> = [
  IntAdd<A[0], B[0]>, IntAdd<A[1], B[1]>, IntAdd<A[2], B[2]>,
  IntAdd<A[3], B[3]>, IntAdd<A[4], B[4]>, IntAdd<A[5], B[5]>, IntAdd<A[6], B[6]>,
  IntAdd<A[7], B[7]>,
];

/**
 * Computes the dimension vector for the quotient of two quantities.
 *
 * When dividing physical quantities, their dimension exponents are
 * **subtracted** element-wise. For example, length (L^1) divided by
 * time (T^1) gives velocity (L^1 * T^-1).
 *
 * Used by the {@link div} function at the type level.
 *
 * @typeParam A - Dimension vector of the dividend (numerator)
 * @typeParam B - Dimension vector of the divisor (denominator)
 *
 * @example
 * ```typescript
 * // m / s = m/s: [1,0,0,...] - [0,0,1,...] = [1,0,-1,...]
 * type Velocity = DimDiv<[1,0,0,0,0,0,0,0], [0,0,1,0,0,0,0,0]>;
 * // Result: [1, 0, -1, 0, 0, 0, 0, 0]
 * ```
 *
 * @internal
 */
type DimDiv<A extends Dim, B extends Dim> = [
  IntSub<A[0], B[0]>, IntSub<A[1], B[1]>, IntSub<A[2], B[2]>,
  IntSub<A[3], B[3]>, IntSub<A[4], B[4]>, IntSub<A[5], B[5]>, IntSub<A[6], B[6]>,
  IntSub<A[7], B[7]>,
];

/**
 * Dimension vector for a dimensionless (scalar) quantity.
 *
 * All exponents are zero: no physical dimension.
 * Produced by dividing a quantity by itself, or used for pure numeric scalars.
 *
 * @internal
 */
type DimScalar = [0, 0, 0, 0, 0, 0, 0, 0];

/**
 * Dimension vector for length (L^1).
 *
 * Used by the meter, kilometer, centimeter, and millimeter unit factories.
 *
 * @internal
 */
type DimLength = [1, 0, 0, 0, 0, 0, 0, 0];

/**
 * Dimension vector for mass (M^1).
 *
 * Used by the kilogram and gram unit factories.
 *
 * @internal
 */
type DimMass   = [0, 1, 0, 0, 0, 0, 0, 0];

/**
 * Dimension vector for time (T^1).
 *
 * Used by the second, millisecond, minute, and hour unit factories.
 *
 * @internal
 */
type DimTime   = [0, 0, 1, 0, 0, 0, 0, 0];

/** Dimension vector for temperature (Θ^1). @internal */
type DimTemperature = [0, 0, 0, 0, 1, 0, 0, 0];
/** Dimension vector for area (L^2). @internal */
type DimArea        = [2, 0, 0, 0, 0, 0, 0, 0];
/** Dimension vector for volume (L^3). @internal */
type DimVolume      = [3, 0, 0, 0, 0, 0, 0, 0];
/** Dimension vector for velocity (L^1 * T^-1). @internal */
type DimVelocity    = [1, 0, -1, 0, 0, 0, 0, 0];
/** Dimension vector for force (L^1 * M^1 * T^-2). @internal */
type DimForce       = [1, 1, -2, 0, 0, 0, 0, 0];
/** Dimension vector for energy (L^2 * M^1 * T^-2). @internal */
type DimEnergy      = [2, 1, -2, 0, 0, 0, 0, 0];
/** Dimension vector for power (L^2 * M^1 * T^-3). @internal */
type DimPower       = [2, 1, -3, 0, 0, 0, 0, 0];
/** Dimension vector for pressure (L^-1 * M^1 * T^-2). @internal */
type DimPressure    = [-1, 1, -2, 0, 0, 0, 0, 0];
/** Dimension vector for digital data (D^1). @internal */
type DimData        = [0, 0, 0, 0, 0, 0, 0, 1];

// ═══════════════════════════════════════════════════════════════════════
// LAYER 2: Runtime Representation
// ═══════════════════════════════════════════════════════════════════════

/**
 * A physical quantity with compile-time dimension safety.
 *
 * At runtime, a `Quantity` is a plain JavaScript object with four
 * properties:
 *
 * | Property | Type     | Description                                     |
 * |----------|----------|-------------------------------------------------|
 * | `_v`     | `number` | The numeric value in the quantity's own unit     |
 * | `_s`     | `number` | SI scale factor (e.g., 1000 for km → m)         |
 * | `_l`     | `string` | Unit label for formatting (e.g., `"km"`)         |
 * | `_o`     | `number` | SI offset for affine conversions (0 for most)    |
 *
 * The type parameters `D` and `L` are **phantom types** — they exist only
 * at compile time and are erased at runtime. They carry the dimension
 * vector and unit label, respectively, enabling TypeScript to enforce
 * dimension constraints statically.
 *
 * All quantity objects share the same V8 hidden class (same properties,
 * same order, same types), enabling optimized monomorphic property access.
 *
 * @typeParam D - The dimension vector (an 8-element {@link Int} tuple).
 *   Defaults to `Dim` (any dimension) when not specified.
 * @typeParam L - The unit label string literal type (e.g., `'m'`, `'km'`).
 *   Defaults to `string` when not specified.
 *
 * @example
 * ```typescript
 * import { m, km, valueOf, type Quantity } from 'unitsafe';
 *
 * const distance: Quantity<[1,0,0,0,0,0,0,0], 'm'> = m(42);
 * valueOf(distance); // 42
 *
 * // The phantom types prevent mixing incompatible quantities:
 * function addMeters(a: Quantity<[1,0,0,0,0,0,0,0], 'm'>,
 *                    b: Quantity<[1,0,0,0,0,0,0,0], 'm'>) { ... }
 * ```
 */
export interface Quantity<D extends Dim = Dim, L extends string = string> {
  /** The numeric value of this quantity, in the unit denoted by `_l`. */
  readonly _v: number;

  /**
   * The SI scale factor for this quantity's unit.
   *
   * Multiplying `_v` by `_s` converts the value to SI base units.
   * For example, a kilometer quantity has `_s = 1000` because
   * 1 km = 1000 m.
   */
  readonly _s: number;

  /**
   * The unit label string (e.g., `"m"`, `"km"`, `"m/s"`, `"m*m"`).
   *
   * Used by {@link format} for display and by {@link createChecked}
   * for runtime validation. For derived quantities produced by
   * {@link mul} or {@link div}, labels are composed with `*` or `/`
   * (e.g., `"m*m"`, `"m/s"`).
   */
  readonly _l: string;

  /**
   * The SI offset for affine temperature conversions.
   *
   * For most units this is `0`. For temperature units like Celsius
   * and Fahrenheit, this encodes the additive offset so that
   * `SI_value = _v * _s + _o`.
   */
  readonly _o: number;

  /**
   * Phantom property carrying the dimension vector at the type level.
   *
   * Never set at runtime (always `undefined`). Exists solely to make
   * `Quantity<[1,0,0,...], 'm'>` and `Quantity<[0,0,1,...], 's'>` structurally
   * incompatible, preventing invalid operations at compile time.
   */
  readonly __phantom_dim?: D;

  /**
   * Phantom property carrying the unit label at the type level.
   *
   * Never set at runtime (always `undefined`). Ensures that quantities
   * with the same dimension but different units (e.g., meters vs. kilometers)
   * are treated as distinct types for addition and subtraction.
   */
  readonly __phantom_label?: L;
}

/**
 * A factory function that creates {@link Quantity} values for a specific unit.
 *
 * Each unit factory is a callable function with additional metadata properties:
 *
 * | Property | Type     | Description                                 |
 * |----------|----------|---------------------------------------------|
 * | `_scale` | `number` | SI scale factor (same as `Quantity._s`)     |
 * | `_label` | `string` | Unit label (same as `Quantity._l`)          |
 * | `_dim`   | `D`      | The dimension vector (runtime-accessible)    |
 *
 * Calling the factory with a numeric value returns a properly branded
 * `Quantity`. The factory also serves as a unit identifier for the
 * {@link to} conversion function.
 *
 * @typeParam D - The dimension vector for quantities produced by this factory
 * @typeParam L - The unit label string literal type
 *
 * @example
 * ```typescript
 * import { m, to, km } from 'unitsafe';
 *
 * // As a quantity constructor:
 * const distance = m(42);
 *
 * // As a unit identifier for conversion:
 * const inKm = to(km, distance);
 *
 * // Accessing metadata:
 * m._scale  // 1
 * m._label  // 'm'
 * m._dim    // [1, 0, 0, 0, 0, 0, 0, 0]
 * ```
 */
export interface UnitFactory<D extends Dim, L extends string> {
  /**
   * Creates a new quantity with the given value in this unit.
   *
   * Accepts a `number` or a numeric `string`. String values are parsed
   * using `Number()` after trimming whitespace. Non-numeric strings
   * (e.g., `"abc"`, `""`, `"5 m"`) throw a `TypeError`.
   *
   * @param value - The numeric value, or a string representing a number
   * @returns A branded `Quantity` carrying dimension and unit information
   * @throws {TypeError} If a string value cannot be parsed as a finite number
   */
  (value: number | string): Quantity<D, L>;

  /** SI scale factor. Multiplying a value in this unit by `_scale` gives the SI base unit value. */
  readonly _scale: number;

  /** Human-readable unit label (e.g., `"m"`, `"km"`, `"s"`). */
  readonly _label: string;

  /** The dimension vector for this unit, accessible at runtime for checked-mode validation. */
  readonly _dim: D;

  /** The SI offset for affine conversions (e.g., temperature). 0 for most units. */
  readonly _offset: number;
}

// ═══════════════════════════════════════════════════════════════════════
// String Input Parsing
// ═══════════════════════════════════════════════════════════════════════

/**
 * Coerces a `number | string` value to a validated `number`.
 *
 * If the input is already a number, it is returned as-is.
 * If the input is a string, it is trimmed and parsed via `Number()`.
 * Throws a `TypeError` if the result is `NaN` or the trimmed string is empty.
 *
 * @param v - The value to coerce
 * @param label - Unit label for error messages
 * @returns The numeric value
 * @throws {TypeError} If the string cannot be parsed as a finite number
 * @internal
 */
function toNum(v: number | string, label: string): number {
  if (typeof v === 'number') return v;
  const trimmed = v.trim();
  if (trimmed === '') throw new TypeError(`Invalid value for ${label}: empty string`);
  const n = Number(trimmed);
  if (Number.isNaN(n)) throw new TypeError(`Invalid value for ${label}: "${v}" is not a number`);
  return n;
}

// ═══════════════════════════════════════════════════════════════════════
// Built-in Unit Factories
// ═══════════════════════════════════════════════════════════════════════
//
// Each factory is defined as a standalone function with Object.assign
// rather than through a createUnit helper, enabling V8 to optimize
// each call site independently and produce monomorphic quantity objects.

/**
 * Creates a length quantity in **meters** (SI base unit for length).
 *
 * @param v - Numeric value in meters
 * @returns A `Quantity` with dimension Length and label `'m'`
 *
 * @example
 * ```typescript
 * const distance = m(100);
 * valueOf(distance); // 100
 * format(distance);  // "100 m"
 * ```
 */
export const m: UnitFactory<DimLength, 'm'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'm'> => ({ _v: toNum(v, 'm'), _s: 1, _l: 'm', _o: 0 }),
  { _scale: 1, _label: 'm', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

/**
 * Creates a length quantity in **kilometers** (1 km = 1000 m).
 *
 * @param v - Numeric value in kilometers
 * @returns A `Quantity` with dimension Length and label `'km'`
 *
 * @example
 * ```typescript
 * const marathon = km(42.195);
 * valueOf(to(m, marathon)); // 42195
 * ```
 */
export const km: UnitFactory<DimLength, 'km'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'km'> => ({ _v: toNum(v, 'km'), _s: 1000, _l: 'km', _o: 0 }),
  { _scale: 1000, _label: 'km', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

/**
 * Creates a length quantity in **centimeters** (1 cm = 0.01 m).
 *
 * @param v - Numeric value in centimeters
 * @returns A `Quantity` with dimension Length and label `'cm'`
 *
 * @example
 * ```typescript
 * const height = cm(175);
 * valueOf(to(m, height)); // 1.75
 * ```
 */
export const cm: UnitFactory<DimLength, 'cm'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'cm'> => ({ _v: toNum(v, 'cm'), _s: 0.01, _l: 'cm', _o: 0 }),
  { _scale: 0.01, _label: 'cm', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

/**
 * Creates a length quantity in **millimeters** (1 mm = 0.001 m).
 *
 * @param v - Numeric value in millimeters
 * @returns A `Quantity` with dimension Length and label `'mm'`
 *
 * @example
 * ```typescript
 * const thickness = mm(2.5);
 * valueOf(to(m, thickness)); // 0.0025
 * ```
 */
export const mm: UnitFactory<DimLength, 'mm'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'mm'> => ({ _v: toNum(v, 'mm'), _s: 0.001, _l: 'mm', _o: 0 }),
  { _scale: 0.001, _label: 'mm', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

/**
 * Creates a length quantity in **inches** (1 in = 0.0254 m).
 *
 * Exported as `inch` because `in` is a reserved keyword in JavaScript.
 * The unit label is `'in'`.
 *
 * @param v - Numeric value in inches
 * @returns A `Quantity` with dimension Length and label `'in'`
 *
 * @example
 * ```typescript
 * const width = inch(12);
 * valueOf(to(m, width)); // 0.3048
 * valueOf(to(ft, width)); // 1
 * ```
 */
export const inch: UnitFactory<DimLength, 'in'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'in'> => ({ _v: toNum(v, 'in'), _s: 0.0254, _l: 'in', _o: 0 }),
  { _scale: 0.0254, _label: 'in', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

/**
 * Creates a length quantity in **feet** (1 ft = 0.3048 m).
 *
 * @param v - Numeric value in feet
 * @returns A `Quantity` with dimension Length and label `'ft'`
 *
 * @example
 * ```typescript
 * const height = ft(6);
 * valueOf(to(m, height)); // 1.8288
 * ```
 */
export const ft: UnitFactory<DimLength, 'ft'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'ft'> => ({ _v: toNum(v, 'ft'), _s: 0.3048, _l: 'ft', _o: 0 }),
  { _scale: 0.3048, _label: 'ft', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

/**
 * Creates a length quantity in **yards** (1 yd = 0.9144 m).
 *
 * @param v - Numeric value in yards
 * @returns A `Quantity` with dimension Length and label `'yd'`
 *
 * @example
 * ```typescript
 * const field = yd(100);
 * valueOf(to(m, field)); // 91.44
 * ```
 */
export const yd: UnitFactory<DimLength, 'yd'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'yd'> => ({ _v: toNum(v, 'yd'), _s: 0.9144, _l: 'yd', _o: 0 }),
  { _scale: 0.9144, _label: 'yd', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

/**
 * Creates a length quantity in **miles** (1 mi = 1609.344 m).
 *
 * @param v - Numeric value in miles
 * @returns A `Quantity` with dimension Length and label `'mi'`
 *
 * @example
 * ```typescript
 * const marathon = mi(26.2);
 * valueOf(to(km, marathon)); // ≈ 42.165
 * ```
 */
export const mi: UnitFactory<DimLength, 'mi'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'mi'> => ({ _v: toNum(v, 'mi'), _s: 1609.344, _l: 'mi', _o: 0 }),
  { _scale: 1609.344, _label: 'mi', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

/**
 * Creates a time quantity in **seconds** (SI base unit for time).
 *
 * @param v - Numeric value in seconds
 * @returns A `Quantity` with dimension Time and label `'s'`
 *
 * @example
 * ```typescript
 * const duration = s(30);
 * const speed = div(m(100), duration); // 100/30 m/s
 * ```
 */
export const s: UnitFactory<DimTime, 's'> = Object.assign(
  (v: number | string): Quantity<DimTime, 's'> => ({ _v: toNum(v, 's'), _s: 1, _l: 's', _o: 0 }),
  { _scale: 1, _label: 's', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

/**
 * Creates a time quantity in **milliseconds** (1 ms = 0.001 s).
 *
 * @param v - Numeric value in milliseconds
 * @returns A `Quantity` with dimension Time and label `'ms'`
 *
 * @example
 * ```typescript
 * const latency = ms(250);
 * valueOf(to(s, latency)); // 0.25
 * ```
 */
export const ms: UnitFactory<DimTime, 'ms'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'ms'> => ({ _v: toNum(v, 'ms'), _s: 0.001, _l: 'ms', _o: 0 }),
  { _scale: 0.001, _label: 'ms', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

/**
 * Creates a time quantity in **minutes** (1 min = 60 s).
 *
 * @param v - Numeric value in minutes
 * @returns A `Quantity` with dimension Time and label `'min'`
 *
 * @example
 * ```typescript
 * const halfHour = min(30);
 * valueOf(to(s, halfHour)); // 1800
 * ```
 */
export const min: UnitFactory<DimTime, 'min'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'min'> => ({ _v: toNum(v, 'min'), _s: 60, _l: 'min', _o: 0 }),
  { _scale: 60, _label: 'min', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

/**
 * Creates a time quantity in **hours** (1 h = 3600 s).
 *
 * @param v - Numeric value in hours
 * @returns A `Quantity` with dimension Time and label `'h'`
 *
 * @example
 * ```typescript
 * const workday = h(8);
 * valueOf(to(min, workday)); // 480
 * ```
 */
export const h: UnitFactory<DimTime, 'h'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'h'> => ({ _v: toNum(v, 'h'), _s: 3600, _l: 'h', _o: 0 }),
  { _scale: 3600, _label: 'h', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

/**
 * Creates a mass quantity in **kilograms** (SI base unit for mass).
 *
 * @param v - Numeric value in kilograms
 * @returns A `Quantity` with dimension Mass and label `'kg'`
 *
 * @example
 * ```typescript
 * const weight = kg(75);
 * valueOf(to(g, weight)); // 75000
 * ```
 */
export const kg: UnitFactory<DimMass, 'kg'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'kg'> => ({ _v: toNum(v, 'kg'), _s: 1, _l: 'kg', _o: 0 }),
  { _scale: 1, _label: 'kg', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

/**
 * Creates a mass quantity in **grams** (1 g = 0.001 kg).
 *
 * @param v - Numeric value in grams
 * @returns A `Quantity` with dimension Mass and label `'g'`
 *
 * @example
 * ```typescript
 * const sugar = g(250);
 * valueOf(to(kg, sugar)); // 0.25
 * ```
 */
export const g: UnitFactory<DimMass, 'g'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'g'> => ({ _v: toNum(v, 'g'), _s: 0.001, _l: 'g', _o: 0 }),
  { _scale: 0.001, _label: 'g', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

/**
 * Creates a mass quantity in **pounds** (1 lb = 0.45359237 kg).
 *
 * @param v - Numeric value in pounds
 * @returns A `Quantity` with dimension Mass and label `'lb'`
 *
 * @example
 * ```typescript
 * const weight = lb(150);
 * valueOf(to(kg, weight)); // ≈ 68.04
 * ```
 */
export const lb: UnitFactory<DimMass, 'lb'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'lb'> => ({ _v: toNum(v, 'lb'), _s: 0.45359237, _l: 'lb', _o: 0 }),
  { _scale: 0.45359237, _label: 'lb', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

/**
 * Creates a mass quantity in **ounces** (1 oz = 0.028349523125 kg).
 *
 * @param v - Numeric value in ounces
 * @returns A `Quantity` with dimension Mass and label `'oz'`
 *
 * @example
 * ```typescript
 * const portion = oz(8);
 * valueOf(to(g, portion)); // ≈ 226.796
 * valueOf(to(lb, oz(16))); // ≈ 1
 * ```
 */
export const oz: UnitFactory<DimMass, 'oz'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'oz'> => ({ _v: toNum(v, 'oz'), _s: 0.028349523125, _l: 'oz', _o: 0 }),
  { _scale: 0.028349523125, _label: 'oz', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

/**
 * Creates a **dimensionless** (scalar) quantity.
 *
 * Scalars have dimension `[0,0,0,0,0,0,0]` and can be multiplied with
 * or divided into any quantity without changing its dimension. Use
 * `scalar()` to scale quantities by a unitless factor.
 *
 * @param v - Numeric value (unitless)
 * @returns A `Quantity` with dimension Scalar and label `'scalar'`
 *
 * @example
 * ```typescript
 * const doubled = mul(scalar(2), m(50));  // 100 m
 * const halved  = div(km(10), scalar(2)); // 5 km
 *
 * // Scalar arithmetic:
 * const ratio = add(scalar(0.5), scalar(0.5)); // 1 (scalar)
 * ```
 */
export const scalar: UnitFactory<DimScalar, 'scalar'> = Object.assign(
  (v: number | string): Quantity<DimScalar, 'scalar'> => ({ _v: toNum(v, 'scalar'), _s: 1, _l: 'scalar', _o: 0 }),
  { _scale: 1, _label: 'scalar', _dim: [0,0,0,0,0,0,0,0] as DimScalar, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// New Length Units
// ═══════════════════════════════════════════════════════════════════════

export const nm: UnitFactory<DimLength, 'nm'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'nm'> => ({ _v: toNum(v, 'nm'), _s: 1e-9, _l: 'nm', _o: 0 }),
  { _scale: 1e-9, _label: 'nm', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

export const um: UnitFactory<DimLength, 'um'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'um'> => ({ _v: toNum(v, 'um'), _s: 1e-6, _l: 'um', _o: 0 }),
  { _scale: 1e-6, _label: 'um', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

export const dm: UnitFactory<DimLength, 'dm'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'dm'> => ({ _v: toNum(v, 'dm'), _s: 0.1, _l: 'dm', _o: 0 }),
  { _scale: 0.1, _label: 'dm', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

export const nmi: UnitFactory<DimLength, 'nmi'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'nmi'> => ({ _v: toNum(v, 'nmi'), _s: 1852, _l: 'nmi', _o: 0 }),
  { _scale: 1852, _label: 'nmi', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

export const mil: UnitFactory<DimLength, 'mil'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'mil'> => ({ _v: toNum(v, 'mil'), _s: 2.54e-5, _l: 'mil', _o: 0 }),
  { _scale: 2.54e-5, _label: 'mil', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

export const au: UnitFactory<DimLength, 'au'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'au'> => ({ _v: toNum(v, 'au'), _s: 1.495978707e11, _l: 'au', _o: 0 }),
  { _scale: 1.495978707e11, _label: 'au', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

export const ly: UnitFactory<DimLength, 'ly'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'ly'> => ({ _v: toNum(v, 'ly'), _s: 9.4607304725808e15, _l: 'ly', _o: 0 }),
  { _scale: 9.4607304725808e15, _label: 'ly', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

export const pc: UnitFactory<DimLength, 'pc'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'pc'> => ({ _v: toNum(v, 'pc'), _s: 3.0856775814913673e16, _l: 'pc', _o: 0 }),
  { _scale: 3.0856775814913673e16, _label: 'pc', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

export const pl: UnitFactory<DimLength, 'pl'> = Object.assign(
  (v: number | string): Quantity<DimLength, 'pl'> => ({ _v: toNum(v, 'pl'), _s: 1.616255e-35, _l: 'pl', _o: 0 }),
  { _scale: 1.616255e-35, _label: 'pl', _dim: [1,0,0,0,0,0,0,0] as DimLength, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// New Mass Units
// ═══════════════════════════════════════════════════════════════════════

export const ug: UnitFactory<DimMass, 'ug'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'ug'> => ({ _v: toNum(v, 'ug'), _s: 1e-9, _l: 'ug', _o: 0 }),
  { _scale: 1e-9, _label: 'ug', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

export const mg: UnitFactory<DimMass, 'mg'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'mg'> => ({ _v: toNum(v, 'mg'), _s: 1e-6, _l: 'mg', _o: 0 }),
  { _scale: 1e-6, _label: 'mg', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

export const t: UnitFactory<DimMass, 't'> = Object.assign(
  (v: number | string): Quantity<DimMass, 't'> => ({ _v: toNum(v, 't'), _s: 1000, _l: 't', _o: 0 }),
  { _scale: 1000, _label: 't', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

export const st: UnitFactory<DimMass, 'st'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'st'> => ({ _v: toNum(v, 'st'), _s: 6.35029318, _l: 'st', _o: 0 }),
  { _scale: 6.35029318, _label: 'st', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

export const ton: UnitFactory<DimMass, 'ton'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'ton'> => ({ _v: toNum(v, 'ton'), _s: 907.18474, _l: 'ton', _o: 0 }),
  { _scale: 907.18474, _label: 'ton', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

export const lton: UnitFactory<DimMass, 'lton'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'lton'> => ({ _v: toNum(v, 'lton'), _s: 1016.0469088, _l: 'lton', _o: 0 }),
  { _scale: 1016.0469088, _label: 'lton', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

export const dalton: UnitFactory<DimMass, 'Da'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'Da'> => ({ _v: toNum(v, 'Da'), _s: 1.6605390666e-27, _l: 'Da', _o: 0 }),
  { _scale: 1.6605390666e-27, _label: 'Da', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

export const plm: UnitFactory<DimMass, 'plm'> = Object.assign(
  (v: number | string): Quantity<DimMass, 'plm'> => ({ _v: toNum(v, 'plm'), _s: 2.176434e-8, _l: 'plm', _o: 0 }),
  { _scale: 2.176434e-8, _label: 'plm', _dim: [0,1,0,0,0,0,0,0] as DimMass, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// New Time Units
// ═══════════════════════════════════════════════════════════════════════

export const ns: UnitFactory<DimTime, 'ns'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'ns'> => ({ _v: toNum(v, 'ns'), _s: 1e-9, _l: 'ns', _o: 0 }),
  { _scale: 1e-9, _label: 'ns', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

export const us: UnitFactory<DimTime, 'us'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'us'> => ({ _v: toNum(v, 'us'), _s: 1e-6, _l: 'us', _o: 0 }),
  { _scale: 1e-6, _label: 'us', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

export const d: UnitFactory<DimTime, 'd'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'd'> => ({ _v: toNum(v, 'd'), _s: 86400, _l: 'd', _o: 0 }),
  { _scale: 86400, _label: 'd', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

export const week: UnitFactory<DimTime, 'week'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'week'> => ({ _v: toNum(v, 'week'), _s: 604800, _l: 'week', _o: 0 }),
  { _scale: 604800, _label: 'week', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

export const month: UnitFactory<DimTime, 'month'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'month'> => ({ _v: toNum(v, 'month'), _s: 2629800, _l: 'month', _o: 0 }),
  { _scale: 2629800, _label: 'month', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

export const yr: UnitFactory<DimTime, 'yr'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'yr'> => ({ _v: toNum(v, 'yr'), _s: 31557600, _l: 'yr', _o: 0 }),
  { _scale: 31557600, _label: 'yr', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

export const decade: UnitFactory<DimTime, 'decade'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'decade'> => ({ _v: toNum(v, 'decade'), _s: 315576000, _l: 'decade', _o: 0 }),
  { _scale: 315576000, _label: 'decade', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

export const century: UnitFactory<DimTime, 'century'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'century'> => ({ _v: toNum(v, 'century'), _s: 3155760000, _l: 'century', _o: 0 }),
  { _scale: 3155760000, _label: 'century', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

export const plt: UnitFactory<DimTime, 'plt'> = Object.assign(
  (v: number | string): Quantity<DimTime, 'plt'> => ({ _v: toNum(v, 'plt'), _s: 5.391247e-44, _l: 'plt', _o: 0 }),
  { _scale: 5.391247e-44, _label: 'plt', _dim: [0,0,1,0,0,0,0,0] as DimTime, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// Temperature Units (with affine offset support)
// ═══════════════════════════════════════════════════════════════════════

export const K: UnitFactory<DimTemperature, 'K'> = Object.assign(
  (v: number | string): Quantity<DimTemperature, 'K'> => ({ _v: toNum(v, 'K'), _s: 1, _l: 'K', _o: 0 }),
  { _scale: 1, _label: 'K', _dim: [0,0,0,0,1,0,0,0] as DimTemperature, _offset: 0 },
);

export const C: UnitFactory<DimTemperature, 'C'> = Object.assign(
  (v: number | string): Quantity<DimTemperature, 'C'> => ({ _v: toNum(v, 'C'), _s: 1, _l: 'C', _o: 273.15 }),
  { _scale: 1, _label: 'C', _dim: [0,0,0,0,1,0,0,0] as DimTemperature, _offset: 273.15 },
);

export const F: UnitFactory<DimTemperature, 'F'> = Object.assign(
  // offset = 273.15 - 32 * 5/9 = 255.3722... (Kelvin value at 0 °F)
  (v: number | string): Quantity<DimTemperature, 'F'> => ({ _v: toNum(v, 'F'), _s: 5/9, _l: 'F', _o: 255.3722222222222 }),
  { _scale: 5/9, _label: 'F', _dim: [0,0,0,0,1,0,0,0] as DimTemperature, _offset: 255.3722222222222 },
);

export const R: UnitFactory<DimTemperature, 'R'> = Object.assign(
  (v: number | string): Quantity<DimTemperature, 'R'> => ({ _v: toNum(v, 'R'), _s: 5/9, _l: 'R', _o: 0 }),
  { _scale: 5/9, _label: 'R', _dim: [0,0,0,0,1,0,0,0] as DimTemperature, _offset: 0 },
);

export const pT: UnitFactory<DimTemperature, 'pT'> = Object.assign(
  (v: number | string): Quantity<DimTemperature, 'pT'> => ({ _v: toNum(v, 'pT'), _s: 1.416784e32, _l: 'pT', _o: 0 }),
  { _scale: 1.416784e32, _label: 'pT', _dim: [0,0,0,0,1,0,0,0] as DimTemperature, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// Area Units
// ═══════════════════════════════════════════════════════════════════════

export const mm2: UnitFactory<DimArea, 'mm2'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'mm2'> => ({ _v: toNum(v, 'mm2'), _s: 1e-6, _l: 'mm2', _o: 0 }),
  { _scale: 1e-6, _label: 'mm2', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

export const cm2: UnitFactory<DimArea, 'cm2'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'cm2'> => ({ _v: toNum(v, 'cm2'), _s: 1e-4, _l: 'cm2', _o: 0 }),
  { _scale: 1e-4, _label: 'cm2', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

export const m2: UnitFactory<DimArea, 'm2'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'm2'> => ({ _v: toNum(v, 'm2'), _s: 1, _l: 'm2', _o: 0 }),
  { _scale: 1, _label: 'm2', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

export const ha: UnitFactory<DimArea, 'ha'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'ha'> => ({ _v: toNum(v, 'ha'), _s: 10000, _l: 'ha', _o: 0 }),
  { _scale: 10000, _label: 'ha', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

export const km2: UnitFactory<DimArea, 'km2'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'km2'> => ({ _v: toNum(v, 'km2'), _s: 1e6, _l: 'km2', _o: 0 }),
  { _scale: 1e6, _label: 'km2', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

export const in2: UnitFactory<DimArea, 'in2'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'in2'> => ({ _v: toNum(v, 'in2'), _s: 6.4516e-4, _l: 'in2', _o: 0 }),
  { _scale: 6.4516e-4, _label: 'in2', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

export const ft2: UnitFactory<DimArea, 'ft2'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'ft2'> => ({ _v: toNum(v, 'ft2'), _s: 0.09290304, _l: 'ft2', _o: 0 }),
  { _scale: 0.09290304, _label: 'ft2', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

export const yd2: UnitFactory<DimArea, 'yd2'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'yd2'> => ({ _v: toNum(v, 'yd2'), _s: 0.83612736, _l: 'yd2', _o: 0 }),
  { _scale: 0.83612736, _label: 'yd2', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

export const ac: UnitFactory<DimArea, 'ac'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'ac'> => ({ _v: toNum(v, 'ac'), _s: 4046.8564224, _l: 'ac', _o: 0 }),
  { _scale: 4046.8564224, _label: 'ac', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

export const mi2: UnitFactory<DimArea, 'mi2'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'mi2'> => ({ _v: toNum(v, 'mi2'), _s: 2589988.110336, _l: 'mi2', _o: 0 }),
  { _scale: 2589988.110336, _label: 'mi2', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

export const pla: UnitFactory<DimArea, 'pla'> = Object.assign(
  (v: number | string): Quantity<DimArea, 'pla'> => ({ _v: toNum(v, 'pla'), _s: 2.61228e-70, _l: 'pla', _o: 0 }),
  { _scale: 2.61228e-70, _label: 'pla', _dim: [2,0,0,0,0,0,0,0] as DimArea, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// Volume Units
// ═══════════════════════════════════════════════════════════════════════

export const ml: UnitFactory<DimVolume, 'ml'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'ml'> => ({ _v: toNum(v, 'ml'), _s: 1e-6, _l: 'ml', _o: 0 }),
  { _scale: 1e-6, _label: 'ml', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const cl: UnitFactory<DimVolume, 'cl'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'cl'> => ({ _v: toNum(v, 'cl'), _s: 1e-5, _l: 'cl', _o: 0 }),
  { _scale: 1e-5, _label: 'cl', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const l: UnitFactory<DimVolume, 'l'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'l'> => ({ _v: toNum(v, 'l'), _s: 0.001, _l: 'l', _o: 0 }),
  { _scale: 0.001, _label: 'l', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const m3: UnitFactory<DimVolume, 'm3'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'm3'> => ({ _v: toNum(v, 'm3'), _s: 1, _l: 'm3', _o: 0 }),
  { _scale: 1, _label: 'm3', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const tsp: UnitFactory<DimVolume, 'tsp'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'tsp'> => ({ _v: toNum(v, 'tsp'), _s: 4.92892159375e-6, _l: 'tsp', _o: 0 }),
  { _scale: 4.92892159375e-6, _label: 'tsp', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const tbsp: UnitFactory<DimVolume, 'tbsp'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'tbsp'> => ({ _v: toNum(v, 'tbsp'), _s: 1.478676478125e-5, _l: 'tbsp', _o: 0 }),
  { _scale: 1.478676478125e-5, _label: 'tbsp', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const floz: UnitFactory<DimVolume, 'floz'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'floz'> => ({ _v: toNum(v, 'floz'), _s: 2.95735295625e-5, _l: 'floz', _o: 0 }),
  { _scale: 2.95735295625e-5, _label: 'floz', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const cup: UnitFactory<DimVolume, 'cup'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'cup'> => ({ _v: toNum(v, 'cup'), _s: 2.365882365e-4, _l: 'cup', _o: 0 }),
  { _scale: 2.365882365e-4, _label: 'cup', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const pt_liq: UnitFactory<DimVolume, 'pt-liq'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'pt-liq'> => ({ _v: toNum(v, 'pt-liq'), _s: 4.73176473e-4, _l: 'pt-liq', _o: 0 }),
  { _scale: 4.73176473e-4, _label: 'pt-liq', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const qt: UnitFactory<DimVolume, 'qt'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'qt'> => ({ _v: toNum(v, 'qt'), _s: 9.46352946e-4, _l: 'qt', _o: 0 }),
  { _scale: 9.46352946e-4, _label: 'qt', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const gal: UnitFactory<DimVolume, 'gal'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'gal'> => ({ _v: toNum(v, 'gal'), _s: 3.785411784e-3, _l: 'gal', _o: 0 }),
  { _scale: 3.785411784e-3, _label: 'gal', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

export const plv: UnitFactory<DimVolume, 'plv'> = Object.assign(
  (v: number | string): Quantity<DimVolume, 'plv'> => ({ _v: toNum(v, 'plv'), _s: 4.22419e-105, _l: 'plv', _o: 0 }),
  { _scale: 4.22419e-105, _label: 'plv', _dim: [3,0,0,0,0,0,0,0] as DimVolume, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// Velocity Units
// ═══════════════════════════════════════════════════════════════════════

export const mps: UnitFactory<DimVelocity, 'm/s'> = Object.assign(
  (v: number | string): Quantity<DimVelocity, 'm/s'> => ({ _v: toNum(v, 'm/s'), _s: 1, _l: 'm/s', _o: 0 }),
  { _scale: 1, _label: 'm/s', _dim: [1,0,-1,0,0,0,0,0] as DimVelocity, _offset: 0 },
);

export const kmh: UnitFactory<DimVelocity, 'km/h'> = Object.assign(
  (v: number | string): Quantity<DimVelocity, 'km/h'> => ({ _v: toNum(v, 'km/h'), _s: 5/18, _l: 'km/h', _o: 0 }),
  { _scale: 5/18, _label: 'km/h', _dim: [1,0,-1,0,0,0,0,0] as DimVelocity, _offset: 0 },
);

export const fps: UnitFactory<DimVelocity, 'ft/s'> = Object.assign(
  (v: number | string): Quantity<DimVelocity, 'ft/s'> => ({ _v: toNum(v, 'ft/s'), _s: 0.3048, _l: 'ft/s', _o: 0 }),
  { _scale: 0.3048, _label: 'ft/s', _dim: [1,0,-1,0,0,0,0,0] as DimVelocity, _offset: 0 },
);

export const mph: UnitFactory<DimVelocity, 'mph'> = Object.assign(
  (v: number | string): Quantity<DimVelocity, 'mph'> => ({ _v: toNum(v, 'mph'), _s: 0.44704, _l: 'mph', _o: 0 }),
  { _scale: 0.44704, _label: 'mph', _dim: [1,0,-1,0,0,0,0,0] as DimVelocity, _offset: 0 },
);

export const kn: UnitFactory<DimVelocity, 'kn'> = Object.assign(
  (v: number | string): Quantity<DimVelocity, 'kn'> => ({ _v: toNum(v, 'kn'), _s: 1852/3600, _l: 'kn', _o: 0 }),
  { _scale: 1852/3600, _label: 'kn', _dim: [1,0,-1,0,0,0,0,0] as DimVelocity, _offset: 0 },
);

export const pvel: UnitFactory<DimVelocity, 'c'> = Object.assign(
  (v: number | string): Quantity<DimVelocity, 'c'> => ({ _v: toNum(v, 'c'), _s: 299792458, _l: 'c', _o: 0 }),
  { _scale: 299792458, _label: 'c', _dim: [1,0,-1,0,0,0,0,0] as DimVelocity, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// Force Units
// ═══════════════════════════════════════════════════════════════════════

export const N: UnitFactory<DimForce, 'N'> = Object.assign(
  (v: number | string): Quantity<DimForce, 'N'> => ({ _v: toNum(v, 'N'), _s: 1, _l: 'N', _o: 0 }),
  { _scale: 1, _label: 'N', _dim: [1,1,-2,0,0,0,0,0] as DimForce, _offset: 0 },
);

export const kN: UnitFactory<DimForce, 'kN'> = Object.assign(
  (v: number | string): Quantity<DimForce, 'kN'> => ({ _v: toNum(v, 'kN'), _s: 1000, _l: 'kN', _o: 0 }),
  { _scale: 1000, _label: 'kN', _dim: [1,1,-2,0,0,0,0,0] as DimForce, _offset: 0 },
);

export const lbf: UnitFactory<DimForce, 'lbf'> = Object.assign(
  (v: number | string): Quantity<DimForce, 'lbf'> => ({ _v: toNum(v, 'lbf'), _s: 4.4482216152605, _l: 'lbf', _o: 0 }),
  { _scale: 4.4482216152605, _label: 'lbf', _dim: [1,1,-2,0,0,0,0,0] as DimForce, _offset: 0 },
);

export const dyn: UnitFactory<DimForce, 'dyn'> = Object.assign(
  (v: number | string): Quantity<DimForce, 'dyn'> => ({ _v: toNum(v, 'dyn'), _s: 1e-5, _l: 'dyn', _o: 0 }),
  { _scale: 1e-5, _label: 'dyn', _dim: [1,1,-2,0,0,0,0,0] as DimForce, _offset: 0 },
);

export const pfo: UnitFactory<DimForce, 'pfo'> = Object.assign(
  (v: number | string): Quantity<DimForce, 'pfo'> => ({ _v: toNum(v, 'pfo'), _s: 1.21027e44, _l: 'pfo', _o: 0 }),
  { _scale: 1.21027e44, _label: 'pfo', _dim: [1,1,-2,0,0,0,0,0] as DimForce, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// Energy Units
// ═══════════════════════════════════════════════════════════════════════

export const J: UnitFactory<DimEnergy, 'J'> = Object.assign(
  (v: number | string): Quantity<DimEnergy, 'J'> => ({ _v: toNum(v, 'J'), _s: 1, _l: 'J', _o: 0 }),
  { _scale: 1, _label: 'J', _dim: [2,1,-2,0,0,0,0,0] as DimEnergy, _offset: 0 },
);

export const kJ: UnitFactory<DimEnergy, 'kJ'> = Object.assign(
  (v: number | string): Quantity<DimEnergy, 'kJ'> => ({ _v: toNum(v, 'kJ'), _s: 1000, _l: 'kJ', _o: 0 }),
  { _scale: 1000, _label: 'kJ', _dim: [2,1,-2,0,0,0,0,0] as DimEnergy, _offset: 0 },
);

export const cal: UnitFactory<DimEnergy, 'cal'> = Object.assign(
  (v: number | string): Quantity<DimEnergy, 'cal'> => ({ _v: toNum(v, 'cal'), _s: 4.184, _l: 'cal', _o: 0 }),
  { _scale: 4.184, _label: 'cal', _dim: [2,1,-2,0,0,0,0,0] as DimEnergy, _offset: 0 },
);

export const kcal: UnitFactory<DimEnergy, 'kcal'> = Object.assign(
  (v: number | string): Quantity<DimEnergy, 'kcal'> => ({ _v: toNum(v, 'kcal'), _s: 4184, _l: 'kcal', _o: 0 }),
  { _scale: 4184, _label: 'kcal', _dim: [2,1,-2,0,0,0,0,0] as DimEnergy, _offset: 0 },
);

export const Wh: UnitFactory<DimEnergy, 'Wh'> = Object.assign(
  (v: number | string): Quantity<DimEnergy, 'Wh'> => ({ _v: toNum(v, 'Wh'), _s: 3600, _l: 'Wh', _o: 0 }),
  { _scale: 3600, _label: 'Wh', _dim: [2,1,-2,0,0,0,0,0] as DimEnergy, _offset: 0 },
);

export const kWh: UnitFactory<DimEnergy, 'kWh'> = Object.assign(
  (v: number | string): Quantity<DimEnergy, 'kWh'> => ({ _v: toNum(v, 'kWh'), _s: 3600000, _l: 'kWh', _o: 0 }),
  { _scale: 3600000, _label: 'kWh', _dim: [2,1,-2,0,0,0,0,0] as DimEnergy, _offset: 0 },
);

export const eV: UnitFactory<DimEnergy, 'eV'> = Object.assign(
  (v: number | string): Quantity<DimEnergy, 'eV'> => ({ _v: toNum(v, 'eV'), _s: 1.602176634e-19, _l: 'eV', _o: 0 }),
  { _scale: 1.602176634e-19, _label: 'eV', _dim: [2,1,-2,0,0,0,0,0] as DimEnergy, _offset: 0 },
);

export const BTU: UnitFactory<DimEnergy, 'BTU'> = Object.assign(
  (v: number | string): Quantity<DimEnergy, 'BTU'> => ({ _v: toNum(v, 'BTU'), _s: 1055.06, _l: 'BTU', _o: 0 }),
  { _scale: 1055.06, _label: 'BTU', _dim: [2,1,-2,0,0,0,0,0] as DimEnergy, _offset: 0 },
);

export const pene: UnitFactory<DimEnergy, 'pene'> = Object.assign(
  (v: number | string): Quantity<DimEnergy, 'pene'> => ({ _v: toNum(v, 'pene'), _s: 1.9561e9, _l: 'pene', _o: 0 }),
  { _scale: 1.9561e9, _label: 'pene', _dim: [2,1,-2,0,0,0,0,0] as DimEnergy, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// Power Units
// ═══════════════════════════════════════════════════════════════════════

export const W: UnitFactory<DimPower, 'W'> = Object.assign(
  (v: number | string): Quantity<DimPower, 'W'> => ({ _v: toNum(v, 'W'), _s: 1, _l: 'W', _o: 0 }),
  { _scale: 1, _label: 'W', _dim: [2,1,-3,0,0,0,0,0] as DimPower, _offset: 0 },
);

export const kW: UnitFactory<DimPower, 'kW'> = Object.assign(
  (v: number | string): Quantity<DimPower, 'kW'> => ({ _v: toNum(v, 'kW'), _s: 1000, _l: 'kW', _o: 0 }),
  { _scale: 1000, _label: 'kW', _dim: [2,1,-3,0,0,0,0,0] as DimPower, _offset: 0 },
);

export const MW: UnitFactory<DimPower, 'MW'> = Object.assign(
  (v: number | string): Quantity<DimPower, 'MW'> => ({ _v: toNum(v, 'MW'), _s: 1e6, _l: 'MW', _o: 0 }),
  { _scale: 1e6, _label: 'MW', _dim: [2,1,-3,0,0,0,0,0] as DimPower, _offset: 0 },
);

export const hp: UnitFactory<DimPower, 'hp'> = Object.assign(
  (v: number | string): Quantity<DimPower, 'hp'> => ({ _v: toNum(v, 'hp'), _s: 745.69987158227, _l: 'hp', _o: 0 }),
  { _scale: 745.69987158227, _label: 'hp', _dim: [2,1,-3,0,0,0,0,0] as DimPower, _offset: 0 },
);

export const ppow: UnitFactory<DimPower, 'ppow'> = Object.assign(
  (v: number | string): Quantity<DimPower, 'ppow'> => ({ _v: toNum(v, 'ppow'), _s: 3.62831e52, _l: 'ppow', _o: 0 }),
  { _scale: 3.62831e52, _label: 'ppow', _dim: [2,1,-3,0,0,0,0,0] as DimPower, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// Pressure Units
// ═══════════════════════════════════════════════════════════════════════

export const Pa: UnitFactory<DimPressure, 'Pa'> = Object.assign(
  (v: number | string): Quantity<DimPressure, 'Pa'> => ({ _v: toNum(v, 'Pa'), _s: 1, _l: 'Pa', _o: 0 }),
  { _scale: 1, _label: 'Pa', _dim: [-1,1,-2,0,0,0,0,0] as DimPressure, _offset: 0 },
);

export const kPa: UnitFactory<DimPressure, 'kPa'> = Object.assign(
  (v: number | string): Quantity<DimPressure, 'kPa'> => ({ _v: toNum(v, 'kPa'), _s: 1000, _l: 'kPa', _o: 0 }),
  { _scale: 1000, _label: 'kPa', _dim: [-1,1,-2,0,0,0,0,0] as DimPressure, _offset: 0 },
);

export const bar: UnitFactory<DimPressure, 'bar'> = Object.assign(
  (v: number | string): Quantity<DimPressure, 'bar'> => ({ _v: toNum(v, 'bar'), _s: 100000, _l: 'bar', _o: 0 }),
  { _scale: 100000, _label: 'bar', _dim: [-1,1,-2,0,0,0,0,0] as DimPressure, _offset: 0 },
);

export const psi: UnitFactory<DimPressure, 'psi'> = Object.assign(
  (v: number | string): Quantity<DimPressure, 'psi'> => ({ _v: toNum(v, 'psi'), _s: 6894.757293168361, _l: 'psi', _o: 0 }),
  { _scale: 6894.757293168361, _label: 'psi', _dim: [-1,1,-2,0,0,0,0,0] as DimPressure, _offset: 0 },
);

export const atm: UnitFactory<DimPressure, 'atm'> = Object.assign(
  (v: number | string): Quantity<DimPressure, 'atm'> => ({ _v: toNum(v, 'atm'), _s: 101325, _l: 'atm', _o: 0 }),
  { _scale: 101325, _label: 'atm', _dim: [-1,1,-2,0,0,0,0,0] as DimPressure, _offset: 0 },
);

export const mmHg: UnitFactory<DimPressure, 'mmHg'> = Object.assign(
  (v: number | string): Quantity<DimPressure, 'mmHg'> => ({ _v: toNum(v, 'mmHg'), _s: 133.322387415, _l: 'mmHg', _o: 0 }),
  { _scale: 133.322387415, _label: 'mmHg', _dim: [-1,1,-2,0,0,0,0,0] as DimPressure, _offset: 0 },
);

export const ppre: UnitFactory<DimPressure, 'ppre'> = Object.assign(
  (v: number | string): Quantity<DimPressure, 'ppre'> => ({ _v: toNum(v, 'ppre'), _s: 4.63309e113, _l: 'ppre', _o: 0 }),
  { _scale: 4.63309e113, _label: 'ppre', _dim: [-1,1,-2,0,0,0,0,0] as DimPressure, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// Digital Storage Units
// ═══════════════════════════════════════════════════════════════════════

export const b: UnitFactory<DimData, 'b'> = Object.assign(
  (v: number | string): Quantity<DimData, 'b'> => ({ _v: toNum(v, 'b'), _s: 1, _l: 'b', _o: 0 }),
  { _scale: 1, _label: 'b', _dim: [0,0,0,0,0,0,0,1] as DimData, _offset: 0 },
);

export const B: UnitFactory<DimData, 'B'> = Object.assign(
  (v: number | string): Quantity<DimData, 'B'> => ({ _v: toNum(v, 'B'), _s: 8, _l: 'B', _o: 0 }),
  { _scale: 8, _label: 'B', _dim: [0,0,0,0,0,0,0,1] as DimData, _offset: 0 },
);

export const KB: UnitFactory<DimData, 'KB'> = Object.assign(
  (v: number | string): Quantity<DimData, 'KB'> => ({ _v: toNum(v, 'KB'), _s: 8192, _l: 'KB', _o: 0 }),
  { _scale: 8192, _label: 'KB', _dim: [0,0,0,0,0,0,0,1] as DimData, _offset: 0 },
);

export const MB: UnitFactory<DimData, 'MB'> = Object.assign(
  (v: number | string): Quantity<DimData, 'MB'> => ({ _v: toNum(v, 'MB'), _s: 8388608, _l: 'MB', _o: 0 }),
  { _scale: 8388608, _label: 'MB', _dim: [0,0,0,0,0,0,0,1] as DimData, _offset: 0 },
);

export const GB: UnitFactory<DimData, 'GB'> = Object.assign(
  (v: number | string): Quantity<DimData, 'GB'> => ({ _v: toNum(v, 'GB'), _s: 8589934592, _l: 'GB', _o: 0 }),
  { _scale: 8589934592, _label: 'GB', _dim: [0,0,0,0,0,0,0,1] as DimData, _offset: 0 },
);

export const TB: UnitFactory<DimData, 'TB'> = Object.assign(
  (v: number | string): Quantity<DimData, 'TB'> => ({ _v: toNum(v, 'TB'), _s: 8796093022208, _l: 'TB', _o: 0 }),
  { _scale: 8796093022208, _label: 'TB', _dim: [0,0,0,0,0,0,0,1] as DimData, _offset: 0 },
);

export const PB: UnitFactory<DimData, 'PB'> = Object.assign(
  (v: number | string): Quantity<DimData, 'PB'> => ({ _v: toNum(v, 'PB'), _s: 9007199254740992, _l: 'PB', _o: 0 }),
  { _scale: 9007199254740992, _label: 'PB', _dim: [0,0,0,0,0,0,0,1] as DimData, _offset: 0 },
);

// ═══════════════════════════════════════════════════════════════════════
// Core Arithmetic Operations
// ═══════════════════════════════════════════════════════════════════════

/**
 * Adds two quantities of the **same dimension and unit**.
 *
 * Both operands must have identical type parameters `D` (dimension vector)
 * and `L` (unit label). This is enforced at compile time — attempting to
 * add quantities with different dimensions or units produces a type error.
 *
 * To add quantities in different units of the same dimension, convert one
 * first using {@link to}:
 * ```typescript
 * add(m(500), to(m, km(1)))  // OK: 1500 m
 * ```
 *
 * **Runtime behavior:** Returns `{ _v: a._v + b._v, _s: a._s, _l: a._l, _o: a._o }`.
 * No conversion is performed — the values are added directly.
 *
 * @typeParam D - Shared dimension vector of both operands
 * @typeParam L - Shared unit label of both operands
 * @param a - First quantity (augend)
 * @param b - Second quantity (addend)
 * @returns A new quantity with the sum of the two values, same unit
 *
 * @example
 * ```typescript
 * add(m(1), m(2))     // OK: 3 m
 * add(km(5), km(3))   // OK: 8 km
 *
 * add(m(1), s(2))     // COMPILE ERROR: Length ≠ Time
 * add(m(1), km(2))    // COMPILE ERROR: 'm' ≠ 'km'
 * add(1, m(2))        // COMPILE ERROR: number is not Quantity
 * ```
 */
export function add<D extends Dim, L extends string>(
  a: Quantity<D, L>,
  b: Quantity<D, L>,
): Quantity<D, L> {
  return { _v: a._v + b._v, _s: a._s, _l: a._l, _o: a._o } as Quantity<D, L>;
}

/**
 * Subtracts two quantities of the **same dimension and unit**.
 *
 * Both operands must have identical type parameters `D` (dimension vector)
 * and `L` (unit label). This is enforced at compile time.
 *
 * **Runtime behavior:** Returns `{ _v: a._v - b._v, _s: a._s, _l: a._l, _o: a._o }`.
 *
 * @typeParam D - Shared dimension vector of both operands
 * @typeParam L - Shared unit label of both operands
 * @param a - The quantity to subtract from (minuend)
 * @param b - The quantity to subtract (subtrahend)
 * @returns A new quantity with the difference, same unit
 *
 * @example
 * ```typescript
 * sub(m(5), m(2))     // OK: 3 m
 * sub(kg(10), kg(3))  // OK: 7 kg
 *
 * sub(m(1), s(2))     // COMPILE ERROR: Length ≠ Time
 * ```
 */
export function sub<D extends Dim, L extends string>(
  a: Quantity<D, L>,
  b: Quantity<D, L>,
): Quantity<D, L> {
  return { _v: a._v - b._v, _s: a._s, _l: a._l, _o: a._o } as Quantity<D, L>;
}

/**
 * Multiplies two quantities of any dimension.
 *
 * The result has a **composed dimension**: the exponent vectors are added
 * element-wise via {@link DimMul}. The label is composed with `*`
 * (e.g., `"m*m"`, `"kg*m"`).
 *
 * **Runtime behavior:** Returns `{ _v: a._v * b._v, _s: a._s * b._s, _l: a._l + '*' + b._l, _o: 0 }`.
 * Throws a `TypeError` if either operand has a non-zero offset (e.g., Celsius
 * or Fahrenheit) — convert to an absolute unit (Kelvin) first.
 *
 * @typeParam DA - Dimension vector of the first operand
 * @typeParam LA - Unit label of the first operand
 * @typeParam DB - Dimension vector of the second operand
 * @typeParam LB - Unit label of the second operand
 * @param a - First quantity (multiplicand)
 * @param b - Second quantity (multiplier)
 * @returns A new quantity with composed dimension `DimMul<DA, DB>` and
 *   composed label `"${LA}*${LB}"`
 * @throws {TypeError} If either operand has a non-zero affine offset
 *
 * @example
 * ```typescript
 * // Area: m * m = m^2
 * const area = mul(m(3), m(4));        // 12, dim [2,0,0,0,0,0,0,0]
 *
 * // Force component: kg * m
 * const kgm = mul(kg(10), m(5));       // 50, dim [1,1,0,0,0,0,0,0]
 *
 * // Scalar scaling:
 * const doubled = mul(scalar(2), m(5)); // 10, dim [1,0,0,0,0,0,0,0]
 * ```
 */
export function mul<DA extends Dim, LA extends string, DB extends Dim, LB extends string>(
  a: Quantity<DA, LA>,
  b: Quantity<DB, LB>,
): Quantity<DimMul<DA, DB>, `${LA}*${LB}`> {
  if (a._o !== 0 || b._o !== 0) {
    throw new TypeError(
      `Cannot multiply quantities with affine offsets ("${a._l}", "${b._l}") — convert to an absolute unit (e.g., Kelvin) first`,
    );
  }
  return { _v: a._v * b._v, _s: a._s * b._s, _l: a._l + '*' + b._l, _o: 0 } as Quantity<DimMul<DA, DB>, `${LA}*${LB}`>;
}

/**
 * Divides two quantities of any dimension.
 *
 * The result has a **composed dimension**: the exponent vectors are
 * subtracted element-wise via {@link DimDiv}. The label is composed
 * with `/` (e.g., `"m/s"`, `"kg/m"`).
 *
 * **Runtime behavior:** Returns `{ _v: a._v / b._v, _s: a._s / b._s, _l: a._l + '/' + b._l, _o: 0 }`.
 * Throws a `TypeError` if either operand has a non-zero offset (e.g., Celsius
 * or Fahrenheit) — convert to an absolute unit (Kelvin) first.
 *
 * @typeParam DA - Dimension vector of the dividend
 * @typeParam LA - Unit label of the dividend
 * @typeParam DB - Dimension vector of the divisor
 * @typeParam LB - Unit label of the divisor
 * @param a - The quantity to divide (dividend / numerator)
 * @param b - The quantity to divide by (divisor / denominator)
 * @returns A new quantity with composed dimension `DimDiv<DA, DB>` and
 *   composed label `"${LA}/${LB}"`
 * @throws {TypeError} If either operand has a non-zero affine offset
 *
 * @example
 * ```typescript
 * // Velocity: m / s
 * const speed = div(m(100), s(10));    // 10, dim [1,0,-1,0,0,0,0,0]
 *
 * // Density: kg / m^3
 * const vol = mul(m(1), mul(m(1), m(1)));
 * const density = div(kg(1000), vol);  // 1000 kg/m^3
 *
 * // Scalar division (halving):
 * const half = div(m(10), scalar(2));  // 5, dim [1,0,0,0,0,0,0,0]
 * ```
 */
export function div<DA extends Dim, LA extends string, DB extends Dim, LB extends string>(
  a: Quantity<DA, LA>,
  b: Quantity<DB, LB>,
): Quantity<DimDiv<DA, DB>, `${LA}/${LB}`> {
  if (a._o !== 0 || b._o !== 0) {
    throw new TypeError(
      `Cannot divide quantities with affine offsets ("${a._l}", "${b._l}") — convert to an absolute unit (e.g., Kelvin) first`,
    );
  }
  return { _v: a._v / b._v, _s: a._s / b._s, _l: a._l + '/' + b._l, _o: 0 } as Quantity<DimDiv<DA, DB>, `${LA}/${LB}`>;
}

// ═══════════════════════════════════════════════════════════════════════
// Unit Conversion
// ═══════════════════════════════════════════════════════════════════════

/**
 * Converts a quantity to a different unit of the **same dimension**.
 *
 * The first argument is the target {@link UnitFactory} (e.g., `km`, `m`, `g`).
 * The second is the source quantity. Dimension compatibility is enforced at
 * compile time — attempting to convert between incompatible dimensions
 * (e.g., length to time) produces a type error.
 *
 * **Conversion formula:**
 * ```
 * result = (sourceValue * sourceScale + sourceOffset - targetOffset) / targetScale
 * ```
 *
 * For non-temperature units (offset = 0), this simplifies to
 * `sourceValue * sourceScale / targetScale`. For temperature units,
 * the offset enables affine conversions (e.g., Celsius ↔ Fahrenheit).
 *
 * @typeParam D - Shared dimension vector (enforced to be the same for
 *   source and target)
 * @typeParam TL - Unit label of the target unit
 * @typeParam SL - Unit label of the source quantity
 * @param target - The target unit factory (determines output unit)
 * @param quantity - The source quantity to convert
 * @returns A new quantity expressed in the target unit, with the same dimension
 *
 * @example
 * ```typescript
 * to(m, km(1.5))       // 1500 m
 * to(km, m(1500))      // 1.5 km
 * to(g, kg(2.5))       // 2500 g
 * to(min, h(1))        // 60 min
 * to(ms, s(0.5))       // 500 ms
 *
 * to(s, km(1))         // COMPILE ERROR: Length ≠ Time
 * ```
 */
export function to<D extends Dim, TL extends string, SL extends string>(
  target: UnitFactory<D, TL>,
  quantity: Quantity<D, SL>,
): Quantity<D, TL> {
  return {
    _v: (quantity._v * quantity._s + quantity._o - target._offset) / target._scale,
    _s: target._scale,
    _l: target._label,
    _o: target._offset,
  } as Quantity<D, TL>;
}

// ═══════════════════════════════════════════════════════════════════════
// Comparisons
// ═══════════════════════════════════════════════════════════════════════

/**
 * Tests whether two quantities are **strictly equal** (`===`).
 *
 * Both operands must have the same dimension and unit label. Compares
 * the raw numeric values directly (no epsilon tolerance).
 *
 * @typeParam D - Shared dimension vector
 * @typeParam L - Shared unit label
 * @param a - First quantity
 * @param b - Second quantity
 * @returns `true` if `a._v === b._v`, `false` otherwise
 *
 * @example
 * ```typescript
 * eq(m(5), m(5))   // true
 * eq(m(5), m(5.1)) // false
 * eq(m(1), s(1))   // COMPILE ERROR
 * ```
 */
export function eq<D extends Dim, L extends string>(a: Quantity<D, L>, b: Quantity<D, L>): boolean {
  return a._v === b._v;
}

/**
 * Tests whether the first quantity is **strictly less than** the second.
 *
 * Both operands must have the same dimension and unit label.
 *
 * @typeParam D - Shared dimension vector
 * @typeParam L - Shared unit label
 * @param a - Quantity to test
 * @param b - Quantity to compare against
 * @returns `true` if `a._v < b._v`
 *
 * @example
 * ```typescript
 * lt(m(1), m(2))   // true
 * lt(m(2), m(1))   // false
 * lt(m(1), m(1))   // false
 * lt(m(1), s(2))   // COMPILE ERROR
 * ```
 */
export function lt<D extends Dim, L extends string>(a: Quantity<D, L>, b: Quantity<D, L>): boolean {
  return a._v < b._v;
}

/**
 * Tests whether the first quantity is **less than or equal to** the second.
 *
 * Both operands must have the same dimension and unit label.
 *
 * @typeParam D - Shared dimension vector
 * @typeParam L - Shared unit label
 * @param a - Quantity to test
 * @param b - Quantity to compare against
 * @returns `true` if `a._v <= b._v`
 *
 * @example
 * ```typescript
 * lte(m(1), m(2))   // true
 * lte(m(1), m(1))   // true
 * lte(m(2), m(1))   // false
 * ```
 */
export function lte<D extends Dim, L extends string>(a: Quantity<D, L>, b: Quantity<D, L>): boolean {
  return a._v <= b._v;
}

/**
 * Tests whether the first quantity is **strictly greater than** the second.
 *
 * Both operands must have the same dimension and unit label.
 *
 * @typeParam D - Shared dimension vector
 * @typeParam L - Shared unit label
 * @param a - Quantity to test
 * @param b - Quantity to compare against
 * @returns `true` if `a._v > b._v`
 *
 * @example
 * ```typescript
 * gt(m(2), m(1))   // true
 * gt(m(1), m(2))   // false
 * gt(m(1), m(1))   // false
 * ```
 */
export function gt<D extends Dim, L extends string>(a: Quantity<D, L>, b: Quantity<D, L>): boolean {
  return a._v > b._v;
}

/**
 * Tests whether the first quantity is **greater than or equal to** the second.
 *
 * Both operands must have the same dimension and unit label.
 *
 * @typeParam D - Shared dimension vector
 * @typeParam L - Shared unit label
 * @param a - Quantity to test
 * @param b - Quantity to compare against
 * @returns `true` if `a._v >= b._v`
 *
 * @example
 * ```typescript
 * gte(m(2), m(1))   // true
 * gte(m(1), m(1))   // true
 * gte(m(1), m(2))   // false
 * ```
 */
export function gte<D extends Dim, L extends string>(a: Quantity<D, L>, b: Quantity<D, L>): boolean {
  return a._v >= b._v;
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/**
 * Extracts the raw numeric value from a quantity.
 *
 * Returns the value in the quantity's own unit (not converted to SI).
 * For example, `valueOf(km(1.5))` returns `1.5`, not `1500`.
 *
 * Use this function to bridge between the type-safe quantity world
 * and APIs that expect plain numbers.
 *
 * @typeParam D - Dimension vector of the quantity
 * @typeParam L - Unit label of the quantity
 * @param q - The quantity to extract the value from
 * @returns The numeric value as a plain `number`
 *
 * @example
 * ```typescript
 * valueOf(m(42))              // 42
 * valueOf(km(1.5))            // 1.5
 * valueOf(to(m, km(1.5)))     // 1500
 * valueOf(add(m(1), m(2)))    // 3
 *
 * typeof valueOf(m(5))        // 'number'
 * ```
 */
export function valueOf<D extends Dim, L extends string>(q: Quantity<D, L>): number {
  return q._v;
}

/**
 * Formats a quantity as a human-readable string with its unit label.
 *
 * The output format is `"<value> <label>"` (e.g., `"42 m"`, `"1.5 km"`).
 * For derived quantities from {@link mul} or {@link div}, labels are
 * composed (e.g., `"5 m/s"`, `"12 m*m"`).
 *
 * Use the `precision` option to control decimal places via `Number.toFixed()`.
 *
 * @typeParam D - Dimension vector of the quantity
 * @typeParam L - Unit label of the quantity
 * @param q - The quantity to format
 * @param options - Optional formatting configuration
 * @param options.precision - Number of decimal places. When specified,
 *   the value is formatted using `toFixed(precision)`. When omitted,
 *   the value is converted using `String()` (full precision).
 * @returns A string in the format `"<value> <label>"`
 *
 * @example
 * ```typescript
 * format(m(5))                          // "5 m"
 * format(km(1.5))                       // "1.5 km"
 * format(m(3.14159), { precision: 2 })  // "3.14 m"
 * format(div(m(10), s(2)))              // "5 m/s"
 * format(mul(m(3), m(4)))               // "12 m*m"
 * ```
 */
export function format<D extends Dim, L extends string>(
  q: Quantity<D, L>,
  options?: { precision?: number },
): string {
  const v = options?.precision != null ? q._v.toFixed(options.precision) : String(q._v);
  return v + ' ' + q._l;
}

/**
 * Parses a string like `"5 m"` or `"1.5 km"` into a typed {@link Quantity}.
 *
 * The input format is `"<value> <unit>"` where:
 * - `<value>` is any valid JavaScript numeric literal (integers, floats,
 *   negative numbers, scientific notation)
 * - `<unit>` is any built-in unit label (all 110 units are supported,
 *   including `m`, `km`, `ft`, `mi`, `kg`, `lb`, `s`, `h`, `K`, `C`, `F`,
 *   `m2`, `l`, `gal`, `m/s`, `mph`, `N`, `J`, `W`, `Pa`, `B`, `GB`, etc.)
 *
 * Leading/trailing whitespace is trimmed. Value and unit can be separated
 * by one or more spaces.
 *
 * Because the unit is determined at runtime, the returned type is
 * `Quantity` (with unspecified dimension/label). Use this for dynamic
 * input scenarios; for static usage, prefer the typed factories directly.
 *
 * @param input - A string in the format `"<value> <unit>"`
 * @returns A `Quantity` for the parsed unit and value
 * @throws {TypeError} If the input is empty, missing a value or unit,
 *   contains an unknown unit, or the value is non-numeric
 *
 * @example
 * ```typescript
 * parse('5 m')       // equivalent to m(5)
 * parse('1.5 km')    // equivalent to km(1.5)
 * parse('-10 s')     // equivalent to s(-10)
 * parse('1e3 g')     // equivalent to g(1000)
 *
 * parse('5 miles')   // throws TypeError: unknown unit "miles"
 * parse('abc m')     // throws TypeError: "abc" is not a number
 * parse('5')         // throws TypeError: missing unit
 * parse('')          // throws TypeError: empty string
 * ```
 */
// ── Module-scope factory registry (single source of truth for parse + createChecked) ──

const _ALL_FACTORIES: UnitFactory<Dim, string>[] = [
  // Length
  m, km, cm, mm, inch, ft, yd, mi, nm, um, dm, nmi, mil, au, ly, pc, pl,
  // Mass
  kg, g, lb, oz, ug, mg, t, st, ton, lton, dalton, plm,
  // Time
  s, ms, min, h, ns, us, d, week, month, yr, decade, century, plt,
  // Temperature
  K, C, F, R, pT,
  // Area
  mm2, cm2, m2, ha, km2, in2, ft2, yd2, ac, mi2, pla,
  // Volume
  ml, cl, l, m3, tsp, tbsp, floz, cup, pt_liq, qt, gal, plv,
  // Velocity
  mps, kmh, fps, mph, kn, pvel,
  // Force
  N, kN, lbf, dyn, pfo,
  // Energy
  J, kJ, cal, kcal, Wh, kWh, eV, BTU, pene,
  // Power
  W, kW, MW, hp, ppow,
  // Pressure
  Pa, kPa, bar, psi, atm, mmHg, ppre,
  // Digital Storage
  b, B, KB, MB, GB, TB, PB,
  // Scalar
  scalar,
];

const _PARSE_FACTORIES: Record<string, UnitFactory<Dim, string>> = Object.create(null);
for (const f of _ALL_FACTORIES) {
  _PARSE_FACTORIES[f._label] = f;
}

export function parse(input: string): Quantity {
  const trimmed = input.trim();
  if (trimmed === '') throw new TypeError('Invalid parse input: empty string');

  // Split on whitespace: first token is value, last token is unit.
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) {
    throw new TypeError(`Invalid parse input: "${input}" — expected "<value> <unit>"`);
  }

  const valueStr = parts[0];
  const unitLabel = parts[parts.length - 1];
  const factory = _PARSE_FACTORIES[unitLabel];

  if (!factory) {
    throw new TypeError(`Unknown unit "${unitLabel}" in parse input "${input}"`);
  }

  const n = Number(valueStr);
  if (Number.isNaN(n)) {
    throw new TypeError(`Invalid value "${valueStr}" in parse input "${input}" — not a number`);
  }

  return factory(n);
}

// ═══════════════════════════════════════════════════════════════════════
// Checked Mode (Development Runtime Validation)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Creates a runtime-validated mirror of the entire unitsafe API.
 *
 * The returned object contains the same unit factories and operations as
 * the top-level exports, but `add`, `sub`, and `to` perform **runtime
 * dimension and unit checks** that throw descriptive `Error` messages on
 * mismatches. This catches bugs that may be hidden by `any` casts,
 * complex generics, or data from external sources.
 *
 * `mul` and `div` are passed through without additional checks because
 * multiplication and division are valid for any dimension combination.
 *
 * **When to use checked mode:**
 *
 * - During development, when `as any` casts or complex generics may
 *   bypass compile-time checks
 * - In test suites, to verify dimension constraints hold at runtime
 * - When consuming data from untyped external sources (APIs, user input)
 *
 * **Performance note:** Checked mode adds a label-lookup overhead per
 * operation. It is intended for development and testing only — use the
 * default (unchecked) exports in production.
 *
 * @returns An object containing all unit factories (`m`, `km`, `s`, etc.)
 *   and checked versions of `add`, `sub`, `to`, plus pass-through `mul`,
 *   `div`, comparisons, `valueOf`, and `format`.
 *
 * @example
 * ```typescript
 * import { createChecked } from 'unitsafe';
 *
 * const { m, s, km, add, to } = createChecked();
 *
 * // Valid operations work normally:
 * add(m(1), m(2));         // OK: 3 m
 * to(m, km(1));            // OK: 1000 m
 *
 * // Invalid operations throw at runtime (even if type-cast):
 * add(m(1) as any, s(1) as any);
 * // Error: "Unit mismatch in add: cannot add "m" and "s" — convert first"
 *
 * to(s as any, km(1) as any);
 * // Error: "Dimension mismatch in to: cannot convert "km" to "s""
 * ```
 */
export function createChecked() {
  /**
   * Serializes a dimension vector into a comparable string key.
   * Used to compare dimensions at runtime (e.g., `"1,0,0,0,0,0,0,0"`).
   *
   * @param dim - A dimension exponent array
   * @returns A comma-separated string of exponents
   * @internal
   */
  function dimKey(dim: readonly number[]): string {
    return dim.join(',');
  }

  // Pre-compute a label → dimension-key lookup for all built-in units.
  // This allows O(1) runtime dimension checks by label comparison.
  const dimByLabel: Record<string, string> = {};
  for (const f of _ALL_FACTORIES) {
    dimByLabel[f._label] = dimKey(f._dim);
  }

  /**
   * Runtime-checked addition. Validates that both operands have the same
   * dimension (via label → dim lookup) AND the same unit label before
   * delegating to the unchecked {@link add}.
   *
   * @throws {Error} If dimensions differ (e.g., adding meters and seconds)
   * @throws {Error} If unit labels differ (e.g., adding meters and kilometers
   *   without converting first)
   * @internal
   */
  function checkedAdd<D extends Dim, L extends string>(
    a: Quantity<D, L>,
    b: Quantity<D, L>,
  ): Quantity<D, L> {
    const aDim = dimByLabel[a._l];
    const bDim = dimByLabel[b._l];
    if (aDim !== undefined && bDim !== undefined && aDim !== bDim) {
      throw new Error(`Dimension mismatch in add: cannot add "${a._l}" and "${b._l}"`);
    }
    if (a._l !== b._l) {
      throw new Error(`Unit mismatch in add: cannot add "${a._l}" and "${b._l}" — convert first`);
    }
    return add(a, b);
  }

  /**
   * Runtime-checked subtraction. Same validation as {@link checkedAdd}.
   *
   * @throws {Error} If dimensions differ
   * @throws {Error} If unit labels differ
   * @internal
   */
  function checkedSub<D extends Dim, L extends string>(
    a: Quantity<D, L>,
    b: Quantity<D, L>,
  ): Quantity<D, L> {
    const aDim = dimByLabel[a._l];
    const bDim = dimByLabel[b._l];
    if (aDim !== undefined && bDim !== undefined && aDim !== bDim) {
      throw new Error(`Dimension mismatch in sub: cannot subtract "${b._l}" from "${a._l}"`);
    }
    if (a._l !== b._l) {
      throw new Error(`Unit mismatch in sub: cannot subtract "${b._l}" from "${a._l}" — convert first`);
    }
    return sub(a, b);
  }

  /**
   * Runtime-checked conversion. Validates that the source quantity's
   * dimension matches the target unit's dimension before delegating
   * to the unchecked {@link to}.
   *
   * @throws {Error} If the source and target have different dimensions
   *   (e.g., converting kilometers to seconds)
   * @internal
   */
  function checkedTo<D extends Dim, TL extends string, SL extends string>(
    target: UnitFactory<D, TL>,
    quantity: Quantity<D, SL>,
  ): Quantity<D, TL> {
    const sourceDim = dimByLabel[quantity._l];
    const targetDim = dimKey(target._dim);
    if (sourceDim !== undefined && sourceDim !== targetDim) {
      throw new Error(`Dimension mismatch in to: cannot convert "${quantity._l}" to "${target._label}"`);
    }
    return to(target, quantity);
  }

  return {
    // Unit factories (identical to unchecked — they always produce valid quantities)
    m, km, cm, mm, inch, ft, yd, mi, nm, um, dm, nmi, mil, au, ly, pc, pl,
    kg, g, lb, oz, ug, mg, t, st, ton, lton, dalton, plm,
    s, ms, min, h, ns, us, d, week, month, yr, decade, century, plt,
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
    // Runtime-checked operations
    add: checkedAdd,
    sub: checkedSub,
    // Pass-through (mul/div are always dimension-valid)
    mul,
    div,
    // Runtime-checked conversion
    to: checkedTo,
    // Comparisons (no additional runtime checks needed — same-label constraint
    // is already enforced by the type system, and the check would add overhead
    // without catching new bugs in practice)
    eq, lt, lte, gt, gte,
    // Helpers (pass-through)
    valueOf,
    format,
    parse,
  };
}
