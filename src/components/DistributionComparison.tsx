import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { parseDiceExpression, diceSetToString, type DiceSet } from '../lib/dice';
import { calculateDistribution, calculateAllStatistics, type DistributionPoint, type Statistics } from '../lib/statistics';

interface ComparisonEntry {
  id: number;
  expression: string;
  diceSet: DiceSet;
  distribution: DistributionPoint[];
  stats: Statistics;
  color: string;
}

const COLORS = ['#4a90d9', '#ed8936', '#48bb78', '#9f7aea', '#f56565', '#38b2ac', '#ed64a6', '#ecc94b'];

export function DistributionComparison() {
  const [entries, setEntries] = useState<ComparisonEntry[]>([]);
  const [input, setInput] = useState('');
  const [nextId, setNextId] = useState(1);
  const [showCumulative, setShowCumulative] = useState(false);

  const handleAdd = () => {
    const parsed = parseDiceExpression(input);
    if (!parsed) return;
    
    const diceSet: DiceSet = { dice: parsed.dice, modifier: parsed.modifier };
    const distribution = calculateDistribution(diceSet);
    const stats = calculateAllStatistics(diceSet);
    
    const color = COLORS[(nextId - 1) % COLORS.length];
    
    setEntries([
      ...entries,
      {
        id: nextId,
        expression: diceSetToString(diceSet) || input,
        diceSet,
        distribution,
        stats,
        color,
      },
    ]);
    setNextId(nextId + 1);
    setInput('');
  };

  const handleRemove = (id: number) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const { chartData, ticks, minValue, maxValue } = useMemo(() => {
    if (entries.length === 0) return { chartData: [], ticks: [], minValue: 0, maxValue: 0 };
    
    let minValue = Infinity;
    let maxValue = -Infinity;
    entries.forEach(entry => {
      if (entry.stats.min < minValue) minValue = entry.stats.min;
      if (entry.stats.max > maxValue) maxValue = entry.stats.max;
    });
    
    // Create lookup maps for each entry
    const entryMaps = entries.map(entry => {
      const probMap = new Map<number, number>();
      const cumulMap = new Map<number, number>();
      entry.distribution.forEach(d => {
        probMap.set(d.value, d.probability * 100);
        cumulMap.set(d.value, d.cumulative * 100);
      });
      return { probMap, cumulMap };
    });
    
    const data = [];
    for (let v = minValue; v <= maxValue; v++) {
      const point: Record<string, number | string> = { value: v };
      entries.forEach((entry, idx) => {
        const { probMap, cumulMap } = entryMaps[idx];
        point[entry.expression] = showCumulative ? (cumulMap.get(v) ?? 0) : (probMap.get(v) ?? 0);
      });
      data.push(point);
    }
    
    // Calculate tick interval
    const allValues = data.map(d => d.value as number);
    const tickCount = allValues.length;
    const tickInterval = tickCount > 20 ? Math.ceil(tickCount / 20) : 1;
    const ticks = tickInterval > 1 
      ? allValues.filter((_, i) => i % tickInterval === 0)
      : allValues;
    
    return { chartData: data, ticks, minValue, maxValue };
  }, [entries, showCumulative]);

  return (
    <div className="distribution-comparison">
      <h2>Distribution Comparison</h2>
      
      <div className="comparison-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., 1d20, 2d6+3, 1d8+1d6"
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      {entries.length > 0 && (
        <>
          <div className="comparison-legend">
            {entries.map(entry => (
              <div key={entry.id} className="legend-item">
                <span 
                  className="legend-color" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="legend-expression">{entry.expression}</span>
                <button 
                  className="legend-remove"
                  onClick={() => handleRemove(entry.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="chart-toggle">
            <button
              className={!showCumulative ? 'active' : ''}
              onClick={() => setShowCumulative(false)}
            >
              Distribution
            </button>
            <button
              className={showCumulative ? 'active' : ''}
              onClick={() => setShowCumulative(true)}
            >
              Cumulative
            </button>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            {showCumulative ? (
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="value"
                  label={{ value: 'Result', position: 'insideBottom', offset: -25 }}
                  type="number"
                  domain={[minValue, maxValue]}
                  ticks={ticks}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{ value: 'Cumulative %', angle: -90, position: 'insideLeft' }}
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [`${(value as number)?.toFixed(2) ?? 0}%`, String(name)]}
                  labelFormatter={(label: unknown) => `Result: ${label}`}
                />
                <Legend />
                {entries.map(entry => (
                  <Line
                    key={entry.id}
                    type="stepAfter"
                    dataKey={entry.expression}
                    stroke={entry.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="value"
                  label={{ value: 'Result', position: 'insideBottom', offset: -25 }}
                  type="number"
                  domain={[minValue, maxValue]}
                  ticks={ticks}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{ value: 'Probability %', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [`${(value as number)?.toFixed(2) ?? 0}%`, String(name)]}
                  labelFormatter={(label: unknown) => `Result: ${label}`}
                />
                <Legend />
                {entries.map(entry => (
                  <Bar
                    key={entry.id}
                    dataKey={entry.expression}
                    fill={entry.color}
                    fillOpacity={0.7}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>

          <div className="comparison-stats">
            <h3>Statistics Comparison</h3>
            <table>
              <thead>
                <tr>
                  <th>Expression</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Expected</th>
                  <th>Median</th>
                  <th>Std Dev</th>
                  <th>Range</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ color: entry.color, fontWeight: 600 }}>{entry.expression}</td>
                    <td>{entry.stats.min}</td>
                    <td>{entry.stats.max}</td>
                    <td>{entry.stats.expectedValue.toFixed(2)}</td>
                    <td>{entry.stats.median}</td>
                    <td>{entry.stats.standardDeviation.toFixed(2)}</td>
                    <td>{entry.stats.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {entries.length === 0 && (
        <p className="comparison-hint">
          Add dice expressions above to compare their probability distributions
        </p>
      )}
    </div>
  );
}
