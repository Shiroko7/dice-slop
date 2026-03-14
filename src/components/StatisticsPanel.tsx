import type { Statistics } from '../lib/statistics';

interface StatisticsPanelProps {
  stats: Statistics;
  label?: string;
}

export function StatisticsPanel({ stats, label = 'Theoretical' }: StatisticsPanelProps) {
  return (
    <div className="statistics-panel">
      <h3>{label} Statistics</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Expected Value</span>
          <span className="stat-value">{stats.expectedValue.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Median</span>
          <span className="stat-value">{stats.median}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Standard Deviation</span>
          <span className="stat-value">{stats.standardDeviation.toFixed(2)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Min</span>
          <span className="stat-value">{stats.min}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max</span>
          <span className="stat-value">{stats.max}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Range</span>
          <span className="stat-value">{stats.range}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Variance</span>
          <span className="stat-value">{stats.variance.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
