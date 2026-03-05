import type { RollMode } from '../lib/dice';

interface DiceDisplayProps {
  dice: { sides: number; value: number }[];
  modifier: number;
  total: number;
  altDice?: { sides: number; value: number }[];
  altTotal?: number;
  rollMode?: RollMode;
}

export function DiceDisplay({ dice, modifier, total, altDice, altTotal, rollMode }: DiceDisplayProps) {
  const hasAlt = rollMode && rollMode !== 'normal' && altDice && altTotal !== undefined;
  const modeLabel = rollMode === 'advantage' ? 'Advantage' : rollMode === 'disadvantage' ? 'Disadvantage' : null;

  return (
    <div className="dice-display">
      {modeLabel && (
        <div className={`roll-mode-label roll-mode-label-${rollMode}`}>{modeLabel} — kept</div>
      )}
      <div className="dice-results">
        {dice.map((die, index) => (
          <div key={index} className="die">
            <span className="die-sides">d{die.sides}</span>
            <span className="die-value">{die.value}</span>
          </div>
        ))}
        {modifier !== 0 && (
          <div className="modifier">
            <span>{modifier >= 0 ? `+${modifier}` : modifier}</span>
          </div>
        )}
      </div>
      <div className="total">
        <span className="total-label">Total</span>
        <span className="total-value">{total}</span>
      </div>
      {hasAlt && (
        <>
          <div className="roll-mode-label roll-mode-label-discarded">discarded</div>
          <div className="dice-results dice-results-discarded">
            {altDice!.map((die, index) => (
              <div key={index} className="die die-discarded">
                <span className="die-sides">d{die.sides}</span>
                <span className="die-value">{die.value}</span>
              </div>
            ))}
            {modifier !== 0 && (
              <div className="modifier modifier-discarded">
                <span>{modifier >= 0 ? `+${modifier}` : modifier}</span>
              </div>
            )}
          </div>
          <div className="total total-discarded">
            <span className="total-label">Total</span>
            <span className="total-value">{altTotal}</span>
          </div>
        </>
      )}
    </div>
  );
}
