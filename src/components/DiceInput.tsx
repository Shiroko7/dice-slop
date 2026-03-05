import type { DiceSet, RollMode } from '../lib/dice';

interface DiceTrayProps {
  diceSet: DiceSet;
  onRemoveDie: (index: number) => void;
  onRemoveModifier: () => void;
  onClear: () => void;
}

export function DiceTray({ diceSet, onRemoveDie, onRemoveModifier, onClear }: DiceTrayProps) {
  const allDice: { sides: number; index: number }[] = [];
  
  diceSet.dice.forEach((group, groupIndex) => {
    let currentIndex = 0;
    diceSet.dice.slice(0, groupIndex).forEach(g => {
      currentIndex += g.count;
    });
    
    for (let i = 0; i < group.count; i++) {
      allDice.push({ sides: group.sides, index: currentIndex + i });
    }
  });

  const isEmpty = allDice.length === 0 && diceSet.modifier === 0;

  return (
    <div className={`dice-tray${isEmpty ? ' empty' : ''}`}>
      {isEmpty ? (
        <span>Add dice below to get started</span>
      ) : (
        <>
          <div className="tray-dice">
            {allDice.map((die, i) => (
              <button
                key={i}
                className="tray-die"
                onClick={() => onRemoveDie(die.index)}
                title="Click to remove"
              >
                <span className="die-label">d{die.sides}</span>
              </button>
            ))}
            {diceSet.modifier !== 0 && (
              <button
                className="tray-modifier"
                onClick={onRemoveModifier}
                title="Click to remove modifier"
              >
                <span>{diceSet.modifier > 0 ? `+${diceSet.modifier}` : diceSet.modifier}</span>
              </button>
            )}
          </div>
          <button className="clear-tray" onClick={onClear}>Clear</button>
        </>
      )}
    </div>
  );
}

const diceButtons = [4, 6, 8, 10, 12, 20, 100];

interface DiceButtonsProps {
  onAddDie: (sides: number) => void;
}

export function DiceButtons({ onAddDie }: DiceButtonsProps) {
  return (
    <div className="dice-buttons">
      {diceButtons.map(sides => (
        <button
          key={sides}
          className={`dice-btn dice-btn-d${sides}`}
          onClick={() => onAddDie(sides)}
          title={`Add d${sides}`}
        >
          <span className="dice-btn-label">d{sides}</span>
        </button>
      ))}
    </div>
  );
}

interface ModifierInputProps {
  modifier: number;
  onChange: (mod: number) => void;
}

export function ModifierInput({ modifier, onChange }: ModifierInputProps) {
  const display = modifier > 0 ? `+${modifier}` : `${modifier}`;
  return (
    <div className="modifier-input">
      <span className="modifier-label">Mod</span>
      <div className="modifier-stepper">
        <button className="modifier-step" onClick={() => onChange(modifier - 1)}>−</button>
        <span className="modifier-value">{display}</span>
        <button className="modifier-step" onClick={() => onChange(modifier + 1)}>+</button>
      </div>
    </div>
  );
}

interface DiceTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
}

export function DiceTextInput({ value, onChange, onParse }: DiceTextInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onParse();
    }
  };

  return (
    <div className="dice-text-input">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., 2d20+5 or d6+3"
      />
      <button onClick={onParse}>Add</button>
    </div>
  );
}

interface RollModeToggleProps {
  rollMode: RollMode;
  onChange: (mode: RollMode) => void;
}

export function RollModeToggle({ rollMode, onChange }: RollModeToggleProps) {
  const modes: { value: RollMode; label: string; title: string }[] = [
    { value: 'normal', label: 'Normal', title: 'Roll once' },
    { value: 'advantage', label: 'Advantage', title: 'Roll twice, keep higher' },
    { value: 'disadvantage', label: 'Disadvantage', title: 'Roll twice, keep lower' },
  ];

  return (
    <div className="roll-mode-toggle">
      {modes.map(({ value, label, title }) => (
        <button
          key={value}
          className={`roll-mode-btn roll-mode-${value}${rollMode === value ? ' active' : ''}`}
          onClick={() => onChange(value)}
          title={title}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
