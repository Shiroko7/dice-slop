import { useState } from 'react';
import type { DiceSet } from '../lib/dice';
import { calculateThresholdProbabilities } from '../lib/statistics';

interface ThresholdCalculatorProps {
  diceSet: DiceSet;
}

export function ThresholdCalculator({ diceSet }: ThresholdCalculatorProps) {
  const [threshold, setThreshold] = useState<number>(10);
  
  if (diceSet.dice.length === 0 && diceSet.modifier === 0) {
    return null;
  }
  
  const probs = calculateThresholdProbabilities(diceSet, threshold);
  
  return (
    <div className="threshold-calculator">
      <h3>Probability Calculator</h3>
      <div className="threshold-input">
        <label>
          Threshold:
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="threshold-results">
        <div className="threshold-item">
          <span className="threshold-label">Roll &gt; {threshold}</span>
          <span className="threshold-value">{(probs.greaterThan * 100).toFixed(2)}%</span>
        </div>
        <div className="threshold-item">
          <span className="threshold-label">Roll ≥ {threshold}</span>
          <span className="threshold-value">{(probs.greaterOrEqual * 100).toFixed(2)}%</span>
        </div>
        <div className="threshold-item">
          <span className="threshold-label">Roll &lt; {threshold}</span>
          <span className="threshold-value">{(probs.lessThan * 100).toFixed(2)}%</span>
        </div>
        <div className="threshold-item">
          <span className="threshold-label">Roll ≤ {threshold}</span>
          <span className="threshold-value">{(probs.lessOrEqual * 100).toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}
