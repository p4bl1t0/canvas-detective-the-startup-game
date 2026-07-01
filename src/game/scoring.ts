import type { ValidationResult } from "./validation";

export interface ScoreInput {
  validation: ValidationResult;
  timeSec: number;
  hintsUsed: number;
  validationAttempts: number;
  moves: number;
  startupGuessed: boolean;
}

const PER_CORRECT = 100;
const TRAP_BONUS = 50; // implicit within correct for traps
const NO_HINT_BONUS = 200;
const TIME_BONUS_MAX = 300;
const TIME_TARGET_SEC = 120;
const HINT_PENALTY = [0, 40, 90, 160, 300];
const ATTEMPT_PENALTY = 25;
const OVER_MOVES_PENALTY = 5;

export function computeScore(input: ScoreInput): number {
  const { validation, timeSec, hintsUsed, validationAttempts, moves, startupGuessed } = input;

  let score = validation.correct * PER_CORRECT;
  if (startupGuessed) score += 300;

  // Time bonus decays after target
  const timeBonus = Math.max(0, Math.round(TIME_BONUS_MAX * (TIME_TARGET_SEC / Math.max(TIME_TARGET_SEC, timeSec))));
  score += timeBonus;

  if (hintsUsed === 0) score += NO_HINT_BONUS;
  score -= HINT_PENALTY[Math.min(hintsUsed, HINT_PENALTY.length - 1)];

  score -= Math.max(0, validationAttempts - 1) * ATTEMPT_PENALTY;

  const idealMoves = validation.totalCards * 2;
  if (moves > idealMoves) score -= (moves - idealMoves) * OVER_MOVES_PENALTY;

  return Math.max(0, Math.round(score));
}

export { TRAP_BONUS };
