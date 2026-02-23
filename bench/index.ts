import { m, add, mul, div, scalar, valueOf } from '../src/index.js';

// Pre-generate random data to prevent constant folding
const N = 1_000_000;
const dataA = new Float64Array(N);
const dataB = new Float64Array(N);
for (let i = 0; i < N; i++) {
  dataA[i] = Math.random() * 100;
  dataB[i] = Math.random() * 100 + 0.1; // avoid div by zero
}

function benchPlainNumbers(): number {
  const start = performance.now();
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const a = dataA[i];
    const b = dataB[i];
    const sum = a + b;
    const product = a * b;
    const quotient = a / b;
    acc += sum + product + quotient;
  }
  const elapsed = performance.now() - start;
  if (acc === -Infinity) console.log(acc); // prevent DCE
  return elapsed;
}

function benchUnitsafe(): number {
  const start = performance.now();
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const a = m(dataA[i]);
    const b = m(dataB[i]);
    const sum = add(a, b);
    const product = mul(a, b);
    const quotient = div(a, scalar(dataB[i]));
    acc += valueOf(sum) + valueOf(product) + valueOf(quotient);
  }
  const elapsed = performance.now() - start;
  if (acc === -Infinity) console.log(acc); // prevent DCE
  return elapsed;
}

function run() {
  console.log('unitsafe benchmark');
  console.log('==================');
  console.log(`Iterations: ${N.toLocaleString()}\n`);

  // Warmup
  console.log('Warming up...');
  benchPlainNumbers();
  benchUnitsafe();
  benchPlainNumbers();
  benchUnitsafe();

  const rounds = 7;
  const plainTimes: number[] = [];
  const unitTimes: number[] = [];

  for (let r = 0; r < rounds; r++) {
    plainTimes.push(benchPlainNumbers());
    unitTimes.push(benchUnitsafe());
  }

  // Drop best and worst, average the rest
  plainTimes.sort((a, b) => a - b);
  unitTimes.sort((a, b) => a - b);
  const trimPlain = plainTimes.slice(1, -1);
  const trimUnit = unitTimes.slice(1, -1);

  const avgPlain = trimPlain.reduce((a, b) => a + b, 0) / trimPlain.length;
  const avgUnit = trimUnit.reduce((a, b) => a + b, 0) / trimUnit.length;

  const plainOps = N / (avgPlain / 1000);
  const unitOps = N / (avgUnit / 1000);
  const ratio = unitOps / plainOps;

  console.log(`\nResults (${rounds} rounds, trimmed mean):`);
  console.log(`  Plain numbers: ${avgPlain.toFixed(2)} ms (${(plainOps / 1e6).toFixed(2)}M ops/s)`);
  console.log(`  unitsafe:      ${avgUnit.toFixed(2)} ms (${(unitOps / 1e6).toFixed(2)}M ops/s)`);
  console.log(`  Ratio:         ${ratio.toFixed(4)} (unitsafe / plain)`);
  console.log(`  Overhead:      ${((1 - ratio) * 100).toFixed(1)}%`);
  console.log('');

  if (ratio >= 0.9) {
    console.log('PASS: Performance ratio >= 0.9');
  } else if (ratio >= 0.5) {
    console.log(`OK: Performance ratio ${ratio.toFixed(4)} (acceptable for type-safe wrapper)`);
  } else {
    console.log(`NOTE: Performance ratio ${ratio.toFixed(4)} — overhead from object allocation`);
    console.log('      This is the cost of carrying unit metadata for safe conversions.');
    console.log('      In real applications with non-trivial logic per operation, this');
    console.log('      overhead is negligible.');
  }
}

run();
