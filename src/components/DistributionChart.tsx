import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import type { DistributionPoint } from '../lib/statistics';

interface DistributionChartProps {
  data: DistributionPoint[];
  expectedValue: number;
  median: number;
  showCumulative?: boolean;
}

export function DistributionChart({
  data,
  expectedValue,
  median,
  showCumulative = false,
}: DistributionChartProps) {
  const minValue = data[0]?.value ?? 0;
  const maxValue = data[data.length - 1]?.value ?? 0;
  
  // Generate all integer values in the range for proper tick marks
  const allValues: number[] = [];
  for (let v = minValue; v <= maxValue; v++) {
    allValues.push(v);
  }
  
  // Create a lookup map for probabilities
  const probMap = new Map<number, number>();
  const cumulMap = new Map<number, number>();
  data.forEach(d => {
    probMap.set(d.value, d.probability * 100);
    cumulMap.set(d.value, d.cumulative * 100);
  });
  
  // Build complete chart data with all values
  const chartData = allValues.map(v => ({
    value: v,
    probability: probMap.get(v) ?? 0,
    cumulative: cumulMap.get(v) ?? 0,
  }));

  // Calculate tick interval to avoid overcrowding
  const tickCount = allValues.length;
  const tickInterval = tickCount > 20 ? Math.ceil(tickCount / 20) : 0;
  const ticks = tickInterval > 0 
    ? allValues.filter((_, i) => i % tickInterval === 0)
    : allValues;

  return (
    <div className="distribution-chart">
      <h3>{showCumulative ? 'Cumulative Distribution' : 'Probability Distribution'}</h3>
      <ResponsiveContainer width="100%" height={350}>
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
              formatter={(value: unknown) => [`${(value as number)?.toFixed(2) ?? 0}%`, 'Cumulative Probability']}
              labelFormatter={(label: unknown) => `Result: ${label}`}
            />
            <ReferenceLine x={expectedValue} stroke="orange" strokeDasharray="5 5" label={{ value: 'Expected', position: 'top' }} />
            <ReferenceLine x={median} stroke="green" strokeDasharray="5 5" label={{ value: 'Median', position: 'bottom' }} />
            <Line 
              type="stepAfter" 
              dataKey="cumulative" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ r: 3 }} 
              activeDot={{ r: 5 }}
            />
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
              formatter={(value: unknown) => [`${(value as number)?.toFixed(2) ?? 0}%`, 'Probability']}
              labelFormatter={(label: unknown) => `Result: ${label}`}
            />
            <ReferenceLine x={expectedValue} stroke="orange" strokeDasharray="5 5" label={{ value: 'Expected', position: 'top' }} />
            <Bar dataKey="probability" fill="#82ca9d" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
