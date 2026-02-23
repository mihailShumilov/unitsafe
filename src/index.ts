// ═══════════════════════════════════════════════════════════════════════
// unitsafe — compile-time dimension safety with zero runtime cost
// ═══════════════════════════════════════════════════════════════════════

// ── Type-level integer arithmetic ───────────────────────────────────

type Int = -8 | -7 | -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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

type IntAdd<A extends Int, B extends Int> = AddMap[A][B];
type IntSub<A extends Int, B extends Int> = SubMap[A][B];

// ── Dimension Vectors ───────────────────────────────────────────────
// [Length, Mass, Time, Current, Temperature, Amount, LuminousIntensity]

type Dim = readonly [Int, Int, Int, Int, Int, Int, Int];

type DimMul<A extends Dim, B extends Dim> = [
  IntAdd<A[0], B[0]>, IntAdd<A[1], B[1]>, IntAdd<A[2], B[2]>,
  IntAdd<A[3], B[3]>, IntAdd<A[4], B[4]>, IntAdd<A[5], B[5]>, IntAdd<A[6], B[6]>,
];

type DimDiv<A extends Dim, B extends Dim> = [
  IntSub<A[0], B[0]>, IntSub<A[1], B[1]>, IntSub<A[2], B[2]>,
  IntSub<A[3], B[3]>, IntSub<A[4], B[4]>, IntSub<A[5], B[5]>, IntSub<A[6], B[6]>,
];

type DimScalar = [0, 0, 0, 0, 0, 0, 0];
type DimLength = [1, 0, 0, 0, 0, 0, 0];
type DimMass   = [0, 1, 0, 0, 0, 0, 0];
type DimTime   = [0, 0, 1, 0, 0, 0, 0];

// ── Quantity ────────────────────────────────────────────────────────
//
// Design: Quantities are tiny 3-property objects { _v, _s, _l }.
// V8 optimizes monomorphic access on same-shape objects to near
// plain-number speed. The shape is always identical (3 properties,
// same order, same types), enabling hidden-class optimization.

export interface Quantity<D extends Dim = Dim, L extends string = string> {
  readonly _v: number;
  readonly _s: number;
  readonly _l: string;
  readonly __phantom_dim?: D;
  readonly __phantom_label?: L;
}

// ── Unit Factory ────────────────────────────────────────────────────

export interface UnitFactory<D extends Dim, L extends string> {
  (value: number): Quantity<D, L>;
  readonly _scale: number;
  readonly _label: string;
  readonly _dim: D;
}

// ── Built-in Units (standalone functions for V8 inlining) ───────────

export const m: UnitFactory<DimLength, 'm'> = Object.assign(
  (v: number): Quantity<DimLength, 'm'> => ({ _v: v, _s: 1, _l: 'm' }),
  { _scale: 1, _label: 'm', _dim: [1,0,0,0,0,0,0] as DimLength },
);

export const km: UnitFactory<DimLength, 'km'> = Object.assign(
  (v: number): Quantity<DimLength, 'km'> => ({ _v: v, _s: 1000, _l: 'km' }),
  { _scale: 1000, _label: 'km', _dim: [1,0,0,0,0,0,0] as DimLength },
);

export const cm: UnitFactory<DimLength, 'cm'> = Object.assign(
  (v: number): Quantity<DimLength, 'cm'> => ({ _v: v, _s: 0.01, _l: 'cm' }),
  { _scale: 0.01, _label: 'cm', _dim: [1,0,0,0,0,0,0] as DimLength },
);

export const mm: UnitFactory<DimLength, 'mm'> = Object.assign(
  (v: number): Quantity<DimLength, 'mm'> => ({ _v: v, _s: 0.001, _l: 'mm' }),
  { _scale: 0.001, _label: 'mm', _dim: [1,0,0,0,0,0,0] as DimLength },
);

export const s: UnitFactory<DimTime, 's'> = Object.assign(
  (v: number): Quantity<DimTime, 's'> => ({ _v: v, _s: 1, _l: 's' }),
  { _scale: 1, _label: 's', _dim: [0,0,1,0,0,0,0] as DimTime },
);

export const ms: UnitFactory<DimTime, 'ms'> = Object.assign(
  (v: number): Quantity<DimTime, 'ms'> => ({ _v: v, _s: 0.001, _l: 'ms' }),
  { _scale: 0.001, _label: 'ms', _dim: [0,0,1,0,0,0,0] as DimTime },
);

export const min: UnitFactory<DimTime, 'min'> = Object.assign(
  (v: number): Quantity<DimTime, 'min'> => ({ _v: v, _s: 60, _l: 'min' }),
  { _scale: 60, _label: 'min', _dim: [0,0,1,0,0,0,0] as DimTime },
);

export const h: UnitFactory<DimTime, 'h'> = Object.assign(
  (v: number): Quantity<DimTime, 'h'> => ({ _v: v, _s: 3600, _l: 'h' }),
  { _scale: 3600, _label: 'h', _dim: [0,0,1,0,0,0,0] as DimTime },
);

export const kg: UnitFactory<DimMass, 'kg'> = Object.assign(
  (v: number): Quantity<DimMass, 'kg'> => ({ _v: v, _s: 1, _l: 'kg' }),
  { _scale: 1, _label: 'kg', _dim: [0,1,0,0,0,0,0] as DimMass },
);

export const g: UnitFactory<DimMass, 'g'> = Object.assign(
  (v: number): Quantity<DimMass, 'g'> => ({ _v: v, _s: 0.001, _l: 'g' }),
  { _scale: 0.001, _label: 'g', _dim: [0,1,0,0,0,0,0] as DimMass },
);

export const scalar: UnitFactory<DimScalar, 'scalar'> = Object.assign(
  (v: number): Quantity<DimScalar, 'scalar'> => ({ _v: v, _s: 1, _l: 'scalar' }),
  { _scale: 1, _label: 'scalar', _dim: [0,0,0,0,0,0,0] as DimScalar },
);

// ── Core Operations ─────────────────────────────────────────────────

export function add<D extends Dim, L extends string>(
  a: Quantity<D, L>,
  b: Quantity<D, L>,
): Quantity<D, L> {
  return { _v: a._v + b._v, _s: a._s, _l: a._l } as Quantity<D, L>;
}

export function sub<D extends Dim, L extends string>(
  a: Quantity<D, L>,
  b: Quantity<D, L>,
): Quantity<D, L> {
  return { _v: a._v - b._v, _s: a._s, _l: a._l } as Quantity<D, L>;
}

export function mul<DA extends Dim, LA extends string, DB extends Dim, LB extends string>(
  a: Quantity<DA, LA>,
  b: Quantity<DB, LB>,
): Quantity<DimMul<DA, DB>, `${LA}*${LB}`> {
  return { _v: a._v * b._v, _s: a._s * b._s, _l: a._l + '*' + b._l } as Quantity<DimMul<DA, DB>, `${LA}*${LB}`>;
}

export function div<DA extends Dim, LA extends string, DB extends Dim, LB extends string>(
  a: Quantity<DA, LA>,
  b: Quantity<DB, LB>,
): Quantity<DimDiv<DA, DB>, `${LA}/${LB}`> {
  return { _v: a._v / b._v, _s: a._s / b._s, _l: a._l + '/' + b._l } as Quantity<DimDiv<DA, DB>, `${LA}/${LB}`>;
}

// ── Conversion ──────────────────────────────────────────────────────

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

// ── Comparisons ─────────────────────────────────────────────────────

export function eq<D extends Dim, L extends string>(a: Quantity<D, L>, b: Quantity<D, L>): boolean {
  return a._v === b._v;
}

export function lt<D extends Dim, L extends string>(a: Quantity<D, L>, b: Quantity<D, L>): boolean {
  return a._v < b._v;
}

export function lte<D extends Dim, L extends string>(a: Quantity<D, L>, b: Quantity<D, L>): boolean {
  return a._v <= b._v;
}

export function gt<D extends Dim, L extends string>(a: Quantity<D, L>, b: Quantity<D, L>): boolean {
  return a._v > b._v;
}

export function gte<D extends Dim, L extends string>(a: Quantity<D, L>, b: Quantity<D, L>): boolean {
  return a._v >= b._v;
}

// ── Helpers ─────────────────────────────────────────────────────────

export function valueOf<D extends Dim, L extends string>(q: Quantity<D, L>): number {
  return q._v;
}

export function format<D extends Dim, L extends string>(
  q: Quantity<D, L>,
  options?: { precision?: number },
): string {
  const v = options?.precision != null ? q._v.toFixed(options.precision) : String(q._v);
  return v + ' ' + q._l;
}

// ── Checked Mode (Dev Runtime Validation) ───────────────────────────

export function createChecked() {
  function dimKey(dim: readonly number[]): string {
    return dim.join(',');
  }

  const dimByLabel: Record<string, string> = {};
  const allFactories = [m, km, cm, mm, s, ms, min, h, kg, g, scalar];
  for (const f of allFactories) {
    dimByLabel[f._label] = dimKey(f._dim);
  }

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
    m, km, cm, mm,
    s, ms, min, h,
    kg, g,
    scalar,
    add: checkedAdd,
    sub: checkedSub,
    mul,
    div,
    to: checkedTo,
    eq, lt, lte, gt, gte,
    valueOf,
    format,
  };
}
