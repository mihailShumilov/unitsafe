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
 *   as 7-element integer exponent tuples at the type level.
 * - **Quantities** are tiny runtime objects `{ _v, _s, _l }` branded with
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
 * A physical dimension represented as a 7-element exponent vector.
 *
 * Each position corresponds to one of the seven SI base quantities:
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
 *
 * The exponent at each position indicates the power of that base
 * quantity. For example, velocity (m/s) is `[1, 0, -1, 0, 0, 0, 0]`
 * meaning L^1 * T^-1.
 *
 * @example
 * ```typescript
 * // Length (meters): L^1
 * type DimLength = [1, 0, 0, 0, 0, 0, 0];
 *
 * // Velocity (m/s): L^1 * T^-1
 * type DimVelocity = [1, 0, -1, 0, 0, 0, 0];
 *
 * // Force (N = kg*m/s^2): L^1 * M^1 * T^-2
 * type DimForce = [1, 1, -2, 0, 0, 0, 0];
 * ```
 *
 * @internal
 */
type Dim = readonly [Int, Int, Int, Int, Int, Int, Int];

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
 * type Area = DimMul<[1,0,0,0,0,0,0], [1,0,0,0,0,0,0]>;
 * // Result: [2, 0, 0, 0, 0, 0, 0]
 * ```
 *
 * @internal
 */
type DimMul<A extends Dim, B extends Dim> = [
  IntAdd<A[0], B[0]>, IntAdd<A[1], B[1]>, IntAdd<A[2], B[2]>,
  IntAdd<A[3], B[3]>, IntAdd<A[4], B[4]>, IntAdd<A[5], B[5]>, IntAdd<A[6], B[6]>,
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
 * type Velocity = DimDiv<[1,0,0,0,0,0,0], [0,0,1,0,0,0,0]>;
 * // Result: [1, 0, -1, 0, 0, 0, 0]
 * ```
 *
 * @internal
 */
type DimDiv<A extends Dim, B extends Dim> = [
  IntSub<A[0], B[0]>, IntSub<A[1], B[1]>, IntSub<A[2], B[2]>,
  IntSub<A[3], B[3]>, IntSub<A[4], B[4]>, IntSub<A[5], B[5]>, IntSub<A[6], B[6]>,
];

/**
 * Dimension vector for a dimensionless (scalar) quantity.
 *
 * All exponents are zero: no physical dimension.
 * Produced by dividing a quantity by itself, or used for pure numeric scalars.
 *
 * @internal
 */
type DimScalar = [0, 0, 0, 0, 0, 0, 0];

/**
 * Dimension vector for length (L^1).
 *
 * Used by the meter, kilometer, centimeter, and millimeter unit factories.
 *
 * @internal
 */
type DimLength = [1, 0, 0, 0, 0, 0, 0];

/**
 * Dimension vector for mass (M^1).
 *
 * Used by the kilogram and gram unit factories.
 *
 * @internal
 */
type DimMass   = [0, 1, 0, 0, 0, 0, 0];

/**
 * Dimension vector for time (T^1).
 *
 * Used by the second, millisecond, minute, and hour unit factories.
 *
 * @internal
 */
type DimTime   = [0, 0, 1, 0, 0, 0, 0];

// ═══════════════════════════════════════════════════════════════════════
// LAYER 2: Runtime Representation
// ═══════════════════════════════════════════════════════════════════════

/**
 * A physical quantity with compile-time dimension safety.
 *
 * At runtime, a `Quantity` is a plain JavaScript object with three
 * properties:
 *
 * | Property | Type     | Description                                   |
 * |----------|----------|-----------------------------------------------|
 * | `_v`     | `number` | The numeric value in the quantity's own unit   |
 * | `_s`     | `number` | SI scale factor (e.g., 1000 for km → m)       |
 * | `_l`     | `string` | Unit label for formatting (e.g., `"km"`)       |
 *
 * The type parameters `D` and `L` are **phantom types** — they exist only
 * at compile time and are erased at runtime. They carry the dimension
 * vector and unit label, respectively, enabling TypeScript to enforce
 * dimension constraints statically.
 *
 * All quantity objects share the same V8 hidden class (same properties,
 * same order, same types), enabling optimized monomorphic property access.
 *
 * @typeParam D - The dimension vector (a 7-element {@link Int} tuple).
 *   Defaults to `Dim` (any dimension) when not specified.
 * @typeParam L - The unit label string literal type (e.g., `'m'`, `'km'`).
 *   Defaults to `string` when not specified.
 *
 * @example
 * ```typescript
 * import { m, km, valueOf, type Quantity } from 'unitsafe';
 *
 * const distance: Quantity<[1,0,0,0,0,0,0], 'm'> = m(42);
 * valueOf(distance); // 42
 *
 * // The phantom types prevent mixing incompatible quantities:
 * function addMeters(a: Quantity<[1,0,0,0,0,0,0], 'm'>,
 *                    b: Quantity<[1,0,0,0,0,0,0], 'm'>) { ... }
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
 * m._dim    // [1, 0, 0, 0, 0, 0, 0]
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
  (v: number | string): Quantity<DimLength, 'm'> => ({ _v: toNum(v, 'm'), _s: 1, _l: 'm' }),
  { _scale: 1, _label: 'm', _dim: [1,0,0,0,0,0,0] as DimLength },
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
  (v: number | string): Quantity<DimLength, 'km'> => ({ _v: toNum(v, 'km'), _s: 1000, _l: 'km' }),
  { _scale: 1000, _label: 'km', _dim: [1,0,0,0,0,0,0] as DimLength },
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
  (v: number | string): Quantity<DimLength, 'cm'> => ({ _v: toNum(v, 'cm'), _s: 0.01, _l: 'cm' }),
  { _scale: 0.01, _label: 'cm', _dim: [1,0,0,0,0,0,0] as DimLength },
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
  (v: number | string): Quantity<DimLength, 'mm'> => ({ _v: toNum(v, 'mm'), _s: 0.001, _l: 'mm' }),
  { _scale: 0.001, _label: 'mm', _dim: [1,0,0,0,0,0,0] as DimLength },
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
  (v: number | string): Quantity<DimTime, 's'> => ({ _v: toNum(v, 's'), _s: 1, _l: 's' }),
  { _scale: 1, _label: 's', _dim: [0,0,1,0,0,0,0] as DimTime },
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
  (v: number | string): Quantity<DimTime, 'ms'> => ({ _v: toNum(v, 'ms'), _s: 0.001, _l: 'ms' }),
  { _scale: 0.001, _label: 'ms', _dim: [0,0,1,0,0,0,0] as DimTime },
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
  (v: number | string): Quantity<DimTime, 'min'> => ({ _v: toNum(v, 'min'), _s: 60, _l: 'min' }),
  { _scale: 60, _label: 'min', _dim: [0,0,1,0,0,0,0] as DimTime },
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
  (v: number | string): Quantity<DimTime, 'h'> => ({ _v: toNum(v, 'h'), _s: 3600, _l: 'h' }),
  { _scale: 3600, _label: 'h', _dim: [0,0,1,0,0,0,0] as DimTime },
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
  (v: number | string): Quantity<DimMass, 'kg'> => ({ _v: toNum(v, 'kg'), _s: 1, _l: 'kg' }),
  { _scale: 1, _label: 'kg', _dim: [0,1,0,0,0,0,0] as DimMass },
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
  (v: number | string): Quantity<DimMass, 'g'> => ({ _v: toNum(v, 'g'), _s: 0.001, _l: 'g' }),
  { _scale: 0.001, _label: 'g', _dim: [0,1,0,0,0,0,0] as DimMass },
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
  (v: number | string): Quantity<DimScalar, 'scalar'> => ({ _v: toNum(v, 'scalar'), _s: 1, _l: 'scalar' }),
  { _scale: 1, _label: 'scalar', _dim: [0,0,0,0,0,0,0] as DimScalar },
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
 * **Runtime behavior:** Returns `{ _v: a._v + b._v, _s: a._s, _l: a._l }`.
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
  return { _v: a._v + b._v, _s: a._s, _l: a._l } as Quantity<D, L>;
}

/**
 * Subtracts two quantities of the **same dimension and unit**.
 *
 * Both operands must have identical type parameters `D` (dimension vector)
 * and `L` (unit label). This is enforced at compile time.
 *
 * **Runtime behavior:** Returns `{ _v: a._v - b._v, _s: a._s, _l: a._l }`.
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
  return { _v: a._v - b._v, _s: a._s, _l: a._l } as Quantity<D, L>;
}

/**
 * Multiplies two quantities of any dimension.
 *
 * The result has a **composed dimension**: the exponent vectors are added
 * element-wise via {@link DimMul}. The label is composed with `*`
 * (e.g., `"m*m"`, `"kg*m"`).
 *
 * **Runtime behavior:** Returns `{ _v: a._v * b._v, _s: a._s * b._s, _l: a._l + '*' + b._l }`.
 *
 * @typeParam DA - Dimension vector of the first operand
 * @typeParam LA - Unit label of the first operand
 * @typeParam DB - Dimension vector of the second operand
 * @typeParam LB - Unit label of the second operand
 * @param a - First quantity (multiplicand)
 * @param b - Second quantity (multiplier)
 * @returns A new quantity with composed dimension `DimMul<DA, DB>` and
 *   composed label `"${LA}*${LB}"`
 *
 * @example
 * ```typescript
 * // Area: m * m = m^2
 * const area = mul(m(3), m(4));        // 12, dim [2,0,0,0,0,0,0]
 *
 * // Force component: kg * m
 * const kgm = mul(kg(10), m(5));       // 50, dim [1,1,0,0,0,0,0]
 *
 * // Scalar scaling:
 * const doubled = mul(scalar(2), m(5)); // 10, dim [1,0,0,0,0,0,0]
 * ```
 */
export function mul<DA extends Dim, LA extends string, DB extends Dim, LB extends string>(
  a: Quantity<DA, LA>,
  b: Quantity<DB, LB>,
): Quantity<DimMul<DA, DB>, `${LA}*${LB}`> {
  return { _v: a._v * b._v, _s: a._s * b._s, _l: a._l + '*' + b._l } as Quantity<DimMul<DA, DB>, `${LA}*${LB}`>;
}

/**
 * Divides two quantities of any dimension.
 *
 * The result has a **composed dimension**: the exponent vectors are
 * subtracted element-wise via {@link DimDiv}. The label is composed
 * with `/` (e.g., `"m/s"`, `"kg/m"`).
 *
 * **Runtime behavior:** Returns `{ _v: a._v / b._v, _s: a._s / b._s, _l: a._l + '/' + b._l }`.
 *
 * @typeParam DA - Dimension vector of the dividend
 * @typeParam LA - Unit label of the dividend
 * @typeParam DB - Dimension vector of the divisor
 * @typeParam LB - Unit label of the divisor
 * @param a - The quantity to divide (dividend / numerator)
 * @param b - The quantity to divide by (divisor / denominator)
 * @returns A new quantity with composed dimension `DimDiv<DA, DB>` and
 *   composed label `"${LA}/${LB}"`
 *
 * @example
 * ```typescript
 * // Velocity: m / s
 * const speed = div(m(100), s(10));    // 10, dim [1,0,-1,0,0,0,0]
 *
 * // Density: kg / m^3
 * const vol = mul(m(1), mul(m(1), m(1)));
 * const density = div(kg(1000), vol);  // 1000 kg/m^3
 *
 * // Scalar division (halving):
 * const half = div(m(10), scalar(2));  // 5, dim [1,0,0,0,0,0,0]
 * ```
 */
export function div<DA extends Dim, LA extends string, DB extends Dim, LB extends string>(
  a: Quantity<DA, LA>,
  b: Quantity<DB, LB>,
): Quantity<DimDiv<DA, DB>, `${LA}/${LB}`> {
  return { _v: a._v / b._v, _s: a._s / b._s, _l: a._l + '/' + b._l } as Quantity<DimDiv<DA, DB>, `${LA}/${LB}`>;
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
 * result = sourceValue * sourceScale / targetScale
 * ```
 *
 * For example, converting 1.5 km to meters:
 * ```
 * 1.5 * 1000 / 1 = 1500 m
 * ```
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
    _v: quantity._v * quantity._s / target._scale,
    _s: target._scale,
    _l: target._label,
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
 * - `<unit>` is one of the built-in unit labels: `m`, `km`, `cm`, `mm`,
 *   `s`, `ms`, `min`, `h`, `kg`, `g`, `scalar`
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
export function parse(input: string): Quantity {
  const trimmed = input.trim();
  if (trimmed === '') throw new TypeError('Invalid parse input: empty string');

  const factories: Record<string, UnitFactory<Dim, string>> = {
    m, km, cm, mm, s, ms, min, h, kg, g, scalar,
  };

  // Split on whitespace: first token is value, last token is unit.
  // We use lastIndexOf to handle "  5   m  " correctly after trim.
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) {
    throw new TypeError(`Invalid parse input: "${input}" — expected "<value> <unit>"`);
  }

  const valueStr = parts[0];
  const unitLabel = parts[parts.length - 1];
  const factory = factories[unitLabel];

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
   * Used to compare dimensions at runtime (e.g., `"1,0,0,0,0,0,0"`).
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
  const allFactories = [m, km, cm, mm, s, ms, min, h, kg, g, scalar];
  for (const f of allFactories) {
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
    m, km, cm, mm,
    s, ms, min, h,
    kg, g,
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
