import type { DiceSet } from './dice';

export interface DistributionPoint {
  value: number;
  probability: number;
  cumulative: number;
}

// Convolve two distributions: result[i+j] += a[i] * b[j]
function convolve(a: number[], b: number[]): number[] {
  const result = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] += a[i] * b[j];
    }
  }
  return result;
}

// Get distribution for a single die (1 to sides, each with probability 1/sides)
function getSingleDieDistribution(sides: number): number[] {
  return new Array(sides).fill(1);
}

// Get distribution for rolling 'count' dice with 'sides' sides
function getGroupDistribution(count: number, sides: number): number[] {
  // Start with 0 dice: 100% chance of sum 0
  let dist = [1];

  for (let i = 0; i < count; i++) {
    const dieDist = getSingleDieDistribution(sides);
    dist = convolve(dist, dieDist);
  }

  return dist;
}

export function calculateDistribution(set: DiceSet): DistributionPoint[] {
  const { min, max } = getDiceSetRange(set);

  // Calculate total outcomes
  let totalOutcomes = 1;
  for (const group of set.dice) {
    totalOutcomes *= Math.pow(group.sides, group.count);
  }

  // Start with 0 dice: 100% chance of sum 0
  let combinedDist: number[] = [1];

  for (const group of set.dice) {
    const groupDist = getGroupDistribution(group.count, group.sides);
    combinedDist = convolve(combinedDist, groupDist);
  }

  const numDice = set.dice.reduce((sum, g) => sum + g.count, 0);
  const offset = numDice + set.modifier;

  // Build base PMF array
  const basePmf: number[] = [];
  for (let i = min; i <= max; i++) {
    const distIndex = i - offset;
    const count = (distIndex >= 0 && distIndex < combinedDist.length) ? combinedDist[distIndex] : 0;
    basePmf.push(count / totalOutcomes);
  }

  // Apply advantage/disadvantage transformation via CDF
  let finalPmf: number[];
  if (set.rollMode === 'advantage' || set.rollMode === 'disadvantage') {
    // Build CDF: F(k) = P(X <= k)
    const cdf: number[] = [];
    let cumul = 0;
    for (const p of basePmf) {
      cumul += p;
      cdf.push(cumul);
    }
    cdf[cdf.length - 1] = 1; // clamp to avoid floating point drift

    finalPmf = basePmf.map((_, i) => {
      const Fk = cdf[i];
      const Fkm1 = i > 0 ? cdf[i - 1] : 0;
      if (set.rollMode === 'advantage') {
        // P(max(X,Y) = k) = F(k)^2 - F(k-1)^2
        return Fk * Fk - Fkm1 * Fkm1;
      } else {
        // P(min(X,Y) = k) = (1-F(k-1))^2 - (1-F(k))^2
        return (1 - Fkm1) * (1 - Fkm1) - (1 - Fk) * (1 - Fk);
      }
    });
  } else {
    finalPmf = basePmf;
  }

  const distribution: DistributionPoint[] = [];
  let cumulative = 0;
  for (let i = 0; i < finalPmf.length; i++) {
    cumulative += finalPmf[i];
    distribution.push({
      value: min + i,
      probability: finalPmf[i],
      cumulative: Math.min(cumulative, 1),
    });
  }

  return distribution;
}

export function getDiceSetRange(set: DiceSet): { min: number; max: number } {
  let min = set.modifier;
  let max = set.modifier;
  
  for (const group of set.dice) {
    min += group.count * 1;
    max += group.count * group.sides;
  }
  
  return { min, max };
}

export function calculateExpectedValue(set: DiceSet): number {
  let expected = set.modifier;
  
  for (const group of set.dice) {
    const averageDie = (group.sides + 1) / 2;
    expected += group.count * averageDie;
  }
  
  return expected;
}

export function calculateVariance(set: DiceSet): number {
  let variance = 0;
  
  for (const group of set.dice) {
    const dieVariance = (Math.pow(group.sides, 2) - 1) / 12;
    variance += group.count * dieVariance;
  }
  
  return variance;
}

export function calculateStandardDeviation(set: DiceSet): number {
  return Math.sqrt(calculateVariance(set));
}

export function calculateMedian(set: DiceSet): number {
  const dist = calculateDistribution(set);
  for (const point of dist) {
    if (point.cumulative >= 0.5) {
      return point.value;
    }
  }
  return dist[Math.floor(dist.length / 2)].value;
}

export function calculateMode(set: DiceSet): number[] {
  const dist = calculateDistribution(set);
  const maxProb = Math.max(...dist.map(d => d.probability));
  return dist.filter(d => d.probability === maxProb).map(d => d.value);
}

export function calculatePercentile(set: DiceSet, percentile: number): number {
  const dist = calculateDistribution(set);
  for (const point of dist) {
    if (point.cumulative >= percentile) {
      return point.value;
    }
  }
  return dist[dist.length - 1].value;
}

export function calculateProbabilityGreaterThan(set: DiceSet, threshold: number): number {
  const dist = calculateDistribution(set);
  let prob = 0;
  
  for (const point of dist) {
    if (point.value > threshold) {
      prob += point.probability;
    }
  }
  
  return prob;
}

export function calculateProbabilityGreaterOrEqual(set: DiceSet, threshold: number): number {
  const dist = calculateDistribution(set);
  let prob = 0;
  
  for (const point of dist) {
    if (point.value >= threshold) {
      prob += point.probability;
    }
  }
  
  return prob;
}

export function calculateProbabilityLessThan(set: DiceSet, threshold: number): number {
  const dist = calculateDistribution(set);
  let prob = 0;
  
  for (const point of dist) {
    if (point.value < threshold) {
      prob += point.probability;
    }
  }
  
  return prob;
}

export function calculateProbabilityLessOrEqual(set: DiceSet, threshold: number): number {
  const dist = calculateDistribution(set);
  let prob = 0;
  
  for (const point of dist) {
    if (point.value <= threshold) {
      prob += point.probability;
    }
  }
  
  return prob;
}

export interface ThresholdProbabilities {
  greaterThan: number;
  greaterOrEqual: number;
  lessThan: number;
  lessOrEqual: number;
}

export function calculateThresholdProbabilities(set: DiceSet, threshold: number): ThresholdProbabilities {
  return {
    greaterThan: calculateProbabilityGreaterThan(set, threshold),
    greaterOrEqual: calculateProbabilityGreaterOrEqual(set, threshold),
    lessThan: calculateProbabilityLessThan(set, threshold),
    lessOrEqual: calculateProbabilityLessOrEqual(set, threshold),
  };
}

export interface Statistics {
  expectedValue: number;
  variance: number;
  standardDeviation: number;
  median: number;
  mode?: number[];
  min: number;
  max: number;
  range: number;
  distribution: DistributionPoint[];
}

export function calculateAllStatistics(set: DiceSet): Statistics {
  const distribution = calculateDistribution(set);
  const min = distribution[0].value;
  const max = distribution[distribution.length - 1].value;

  const expectedValue = distribution.reduce((sum, p) => sum + p.value * p.probability, 0);
  const variance = distribution.reduce((sum, p) => sum + p.probability * Math.pow(p.value - expectedValue, 2), 0);
  const standardDeviation = Math.sqrt(variance);
  const median = distribution.find(p => p.cumulative >= 0.5)?.value ?? distribution[Math.floor(distribution.length / 2)].value;
  const maxProb = Math.max(...distribution.map(p => p.probability));
  const mode = distribution.filter(p => p.probability === maxProb).map(p => p.value);

  return {
    expectedValue,
    variance,
    standardDeviation,
    median,
    mode,
    min,
    max,
    range: max - min,
    distribution,
  };
}
