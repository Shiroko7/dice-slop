import { useState, useMemo } from 'react';
import { DiceTray, DiceButtons, ModifierInput, DiceTextInput, RollModeToggle } from './components/DiceInput';
import { DiceDisplay } from './components/DiceDisplay';
import { StatisticsPanel } from './components/StatisticsPanel';
import { DistributionChart } from './components/DistributionChart';
import { ThresholdCalculator } from './components/ThresholdCalculator';
import { DistributionComparison } from './components/DistributionComparison';
import type { DiceSet, DiceGroup, RollMode } from './lib/dice';
import { parseDiceExpression, rollDiceSet, diceSetToString } from './lib/dice';
import { calculateAllStatistics, type Statistics } from './lib/statistics';
import { runSimulation, calculateSimulationStatistics, getSimulationDistribution, type SimulationStatistics } from './lib/simulation';
import './App.css';

function App() {
  const [diceSet, setDiceSet] = useState<DiceSet>({ dice: [], modifier: 0 });
  const [rollMode, setRollMode] = useState<RollMode>('normal');
  const [textInput, setTextInput] = useState('');
  const [lastRoll, setLastRoll] = useState<{
    dice: { sides: number; value: number }[];
    total: number;
    altDice?: { sides: number; value: number }[];
    altTotal?: number;
    rollMode?: RollMode;
  } | null>(null);
  const [simulationCount, setSimulationCount] = useState(10000);
  const [simulationResults, setSimulationResults] = useState<{ stats: SimulationStatistics; distribution: { value: number; frequency: number; probability: number }[] } | null>(null);
  const [showCumulative, setShowCumulative] = useState(false);

  const diceSetWithMode = useMemo<DiceSet>(() => ({ ...diceSet, rollMode }), [diceSet, rollMode]);

  const theoreticalStats = useMemo<Statistics | null>(() => {
    if (diceSet.dice.length === 0 && diceSet.modifier === 0) return null;
    return calculateAllStatistics(diceSetWithMode);
  }, [diceSetWithMode]);

  const handleAddDie = (sides: number) => {
    const existing = diceSet.dice.find(d => d.sides === sides);
    if (existing) {
      setDiceSet({
        ...diceSet,
        dice: diceSet.dice.map(d => 
          d.sides === sides ? { ...d, count: d.count + 1 } : d
        ),
      });
    } else {
      setDiceSet({
        ...diceSet,
        dice: [...diceSet.dice, { count: 1, sides }],
      });
    }
  };

  const handleRemoveDie = (index: number) => {
    let currentIndex = 0;
    const newDice: DiceGroup[] = [];
    
    for (const group of diceSet.dice) {
      if (index >= currentIndex && index < currentIndex + group.count) {
        if (group.count > 1) {
          newDice.push({ ...group, count: group.count - 1 });
        }
      } else {
        newDice.push(group);
      }
      currentIndex += group.count;
    }
    
    setDiceSet({ ...diceSet, dice: newDice });
  };

  const handleRemoveModifier = () => {
    setDiceSet({ ...diceSet, modifier: 0 });
  };

  const handleClear = () => {
    setDiceSet({ dice: [], modifier: 0 });
    setLastRoll(null);
  };

  const handleModifierChange = (mod: number) => {
    setDiceSet({ ...diceSet, modifier: mod });
  };

  const handleTextParse = () => {
    const parsed = parseDiceExpression(textInput);
    if (parsed) {
      setDiceSet(parsed);
      setTextInput('');
    }
  };

  const handleRoll = () => {
    const result = rollDiceSet(diceSetWithMode);
    setLastRoll({ ...result, rollMode });
  };

  const handleRunSimulation = () => {
    if (!theoreticalStats) return;
    const result = runSimulation(diceSetWithMode, simulationCount);
    const stats = calculateSimulationStatistics(result.rolls);
    const distribution = getSimulationDistribution(
      result.distribution,
      result.totalRolls,
      theoreticalStats.min,
      theoreticalStats.max
    );
    setSimulationResults({ stats, distribution });
  };

  const currentExpression = diceSetToString(diceSet);
  const hasDice = diceSet.dice.length > 0 || diceSet.modifier !== 0;

  return (
    <div className="app">
      <header>
        <h1>Dice Slop</h1>
        <p>Dice roller with statistical analysis</p>
      </header>

      <main>
        <section className="input-section">
          <DiceTextInput
            value={textInput}
            onChange={setTextInput}
            onParse={handleTextParse}
          />

          <DiceButtons onAddDie={handleAddDie} />

          <div className="dice-options-row">
            <ModifierInput
              modifier={diceSet.modifier}
              onChange={handleModifierChange}
            />
            <RollModeToggle rollMode={rollMode} onChange={setRollMode} />
          </div>

          <DiceTray
            diceSet={diceSet}
            onRemoveDie={handleRemoveDie}
            onRemoveModifier={handleRemoveModifier}
            onClear={handleClear}
          />

          {hasDice && (
            <button className="roll-button" onClick={handleRoll}>
              {rollMode === 'advantage' ? 'Roll with Advantage: ' : rollMode === 'disadvantage' ? 'Roll with Disadvantage: ' : 'Roll '}
              {currentExpression || 'Dice'}
            </button>
          )}
        </section>

        {lastRoll && (
          <section className="result">
            <DiceDisplay
              dice={lastRoll.dice}
              modifier={diceSet.modifier}
              total={lastRoll.total}
              altDice={lastRoll.altDice}
              altTotal={lastRoll.altTotal}
              rollMode={lastRoll.rollMode}
            />
          </section>
        )}

        {theoreticalStats && (
          <>
            <section className="statistics">
              <StatisticsPanel stats={theoreticalStats} label="Theoretical" />
            </section>

            <section className="threshold-section">
              <ThresholdCalculator diceSet={diceSet} />
            </section>

            <section className="chart">
              <DistributionChart
                data={theoreticalStats.distribution}
                expectedValue={theoreticalStats.expectedValue}
                median={theoreticalStats.median}
                showCumulative={showCumulative}
              />
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
            </section>
          </>
        )}

        <section className="simulation">
          <h2>Monte Carlo Simulation</h2>
          <div className="simulation-controls">
            <label>
              Number of rolls:
              <select
                value={simulationCount}
                onChange={(e) => setSimulationCount(Number(e.target.value))}
              >
                <option value={1000}>1,000</option>
                <option value={10000}>10,000</option>
                <option value={100000}>100,000</option>
                <option value={1000000}>1,000,000</option>
              </select>
            </label>
            <button onClick={handleRunSimulation} disabled={!hasDice}>Run Simulation</button>
          </div>

          {simulationResults && theoreticalStats && (
            <>
              <StatisticsPanel
                stats={{
                  ...simulationResults.stats,
                  expectedValue: simulationResults.stats.mean,
                  variance: Math.pow(simulationResults.stats.standardDeviation, 2),
                  range: simulationResults.stats.max - simulationResults.stats.min,
                  distribution: simulationResults.stats as any,
                }}
                label="Simulation"
              />
              <div className="simulation-comparison">
                <h3>Comparison</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Theoretical</th>
                      <th>Simulation</th>
                      <th>Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Mean</td>
                      <td>{theoreticalStats.expectedValue.toFixed(4)}</td>
                      <td>{simulationResults.stats.mean.toFixed(4)}</td>
                      <td>{Math.abs(theoreticalStats.expectedValue - simulationResults.stats.mean).toFixed(4)}</td>
                    </tr>
                    <tr>
                      <td>Median</td>
                      <td>{theoreticalStats.median}</td>
                      <td>{simulationResults.stats.median.toFixed(1)}</td>
                      <td>{Math.abs(theoreticalStats.median - simulationResults.stats.median).toFixed(1)}</td>
                    </tr>
                    <tr>
                      <td>Std Dev</td>
                      <td>{theoreticalStats.standardDeviation.toFixed(4)}</td>
                      <td>{simulationResults.stats.standardDeviation.toFixed(4)}</td>
                      <td>{Math.abs(theoreticalStats.standardDeviation - simulationResults.stats.standardDeviation).toFixed(4)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <DistributionComparison />
      </main>
    </div>
  );
}

export default App;
