import type { DiceSet } from './dice';
import { rollDiceSet } from './dice';

export interface SimulationResult {
  rolls: number[];
  distribution: Map<number, number>;
  totalRolls: number;
}

export interface SimulationStatistics {
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  standardDeviation: number;
}

export function runSimulation(set: DiceSet, numRolls: number = 10000): SimulationResult {
  const rolls: number[] = [];
  const distribution = new Map<number, number>();
  
  for (let i = 0; i < numRolls; i++) {
    const result = rollDiceSet(set);
    rolls.push(result.total);
    distribution.set(result.total, (distribution.get(result.total) || 0) + 1);
  }
  
  return {
    rolls,
    distribution,
    totalRolls: numRolls,
  };
}

function calculateModeFromRolls(rolls: number[]): number[] {
  const counts = new Map<number, number>();
  let maxCount = 0;
  
  for (const roll of rolls) {
    const count = (counts.get(roll) || 0) + 1;
    counts.set(roll, count);
    maxCount = Math.max(maxCount, count);
  }
  
  const mode: number[] = [];
  for (const [value, count] of counts) {
    if (count === maxCount) {
      mode.push(value);
    }
  }
  
  return mode.sort((a, b) => a - b);
}

export function calculateSimulationStatistics(rolls: number[]): SimulationStatistics {
  const sorted = [...rolls].sort((a, b) => a - b);
  const n = sorted.length;
  
  const sum = rolls.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  
  const squaredDiffs = rolls.map(x => Math.pow(x - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    mean,
    median,
    mode: calculateModeFromRolls(rolls),
    min: sorted[0],
    max: sorted[n - 1],
    standardDeviation,
  };
}

export function getSimulationDistribution(
  distribution: Map<number, number>,
  totalRolls: number,
  min: number,
  max: number
): { value: number; frequency: number; probability: number }[] {
  const result: { value: number; frequency: number; probability: number }[] = [];
  
  for (let i = min; i <= max; i++) {
    const frequency = distribution.get(i) || 0;
    result.push({
      value: i,
      frequency,
      probability: frequency / totalRolls,
    });
  }
  
  return result;
}
