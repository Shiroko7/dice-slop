export interface DiceGroup {
  count: number;
  sides: number;
}

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export interface DiceSet {
  dice: DiceGroup[];
  modifier: number;
  rollMode?: RollMode;
}

export interface ParsedDiceExpression {
  dice: DiceGroup[];
  modifier: number;
}

export function parseDiceExpression(expr: string): ParsedDiceExpression | null {
  const normalized = expr.toLowerCase().replace(/\s/g, '');
  
  const regex = /((?:(\d+)d(\d+))|([+-]?\d+))(?!d)/g;
  const matches = normalized.matchAll(regex);
  
  const dice: DiceGroup[] = [];
  let modifier = 0;
  let hasValidDice = false;
  
  for (const match of matches) {
    if (match[2] && match[3]) {
      const count = parseInt(match[2], 10);
      const sides = parseInt(match[3], 10);
      if (count > 0 && sides > 0) {
        dice.push({ count, sides });
        hasValidDice = true;
      }
    } else if (match[4]) {
      modifier += parseInt(match[4], 10);
    }
  }
  
  if (!hasValidDice && modifier === 0) return null;
  if (dice.length === 0 && modifier === 0) return null;
  
  return { dice, modifier };
}

export function diceSetToString(set: DiceSet): string {
  const parts: string[] = [];
  
  for (const group of set.dice) {
    parts.push(`${group.count}d${group.sides}`);
  }
  
  if (set.modifier !== 0) {
    parts.push(set.modifier > 0 ? `+${set.modifier}` : `${set.modifier}`);
  }
  
  return parts.join(' ');
}

export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDiceGroup(count: number, sides: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += rollDice(sides);
  }
  return total;
}

function rollDiceSetOnce(set: DiceSet): { dice: { sides: number; value: number }[]; total: number } {
  const dice: { sides: number; value: number }[] = [];
  for (const group of set.dice) {
    for (let i = 0; i < group.count; i++) {
      dice.push({ sides: group.sides, value: rollDice(group.sides) });
    }
  }
  const total = dice.reduce((sum, d) => sum + d.value, 0) + set.modifier;
  return { dice, total };
}

export interface RollResult {
  dice: { sides: number; value: number }[];
  total: number;
  altDice?: { sides: number; value: number }[];
  altTotal?: number;
}

export function rollDiceSet(set: DiceSet): RollResult {
  if (!set.rollMode || set.rollMode === 'normal') {
    return rollDiceSetOnce(set);
  }

  const rollA = rollDiceSetOnce(set);
  const rollB = rollDiceSetOnce(set);
  const keepA =
    set.rollMode === 'advantage'
      ? rollA.total >= rollB.total
      : rollA.total <= rollB.total;

  return keepA
    ? { dice: rollA.dice, total: rollA.total, altDice: rollB.dice, altTotal: rollB.total }
    : { dice: rollB.dice, total: rollB.total, altDice: rollA.dice, altTotal: rollA.total };
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

export const COMMON_DICE = [4, 6, 8, 10, 12, 20, 100];
