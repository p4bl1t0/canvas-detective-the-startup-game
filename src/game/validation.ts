import type { BlockId, GameCard, Placement } from "./types";
import { BLOCKS } from "./types";

export interface ValidationResult {
  totalCards: number;
  correct: number;
  misplaced: number;
  undiscoveredTraps: number;
  wronglyDiscardedModels: number;
  incompleteBlocks: BlockId[];
  overfullBlocks: BlockId[];
  percent: number;
  hints: string[];
  perCard: Record<string, "correct" | "wrong_block" | "should_discard" | "wrong_discard" | "missing">;
}

export function validate(cards: GameCard[], placement: Placement): ValidationResult {
  const perCard: ValidationResult["perCard"] = {};
  let correct = 0;
  let misplaced = 0;
  let undiscoveredTraps = 0;
  let wronglyDiscardedModels = 0;
  const countsByBlock: Record<string, number> = {};
  const correctByBlock: Record<string, number> = {};

  for (const card of cards) {
    const pos = placement[card.id] ?? "hand";
    const isTrap = card.type === "trap" || card.type === "event";

    if (isTrap) {
      if (pos === "discarded") {
        perCard[card.id] = "correct";
        correct++;
      } else if (pos === "hand") {
        perCard[card.id] = "missing";
        undiscoveredTraps++;
      } else {
        perCard[card.id] = "should_discard";
        misplaced++;
        countsByBlock[pos] = (countsByBlock[pos] ?? 0) + 1;
      }
    } else {
      // model card
      if (pos === "hand") {
        perCard[card.id] = "missing";
      } else if (pos === "discarded") {
        perCard[card.id] = "wrong_discard";
        wronglyDiscardedModels++;
      } else if (pos === card.block) {
        perCard[card.id] = "correct";
        correct++;
        correctByBlock[pos] = (correctByBlock[pos] ?? 0) + 1;
        countsByBlock[pos] = (countsByBlock[pos] ?? 0) + 1;
      } else {
        perCard[card.id] = "wrong_block";
        misplaced++;
        countsByBlock[pos] = (countsByBlock[pos] ?? 0) + 1;
      }
    }
  }

  // Expected counts per block from model cards
  const expected: Record<string, number> = {};
  for (const c of cards) {
    if (c.type === "model" && c.block) expected[c.block] = (expected[c.block] ?? 0) + 1;
  }
  const incompleteBlocks: BlockId[] = [];
  const overfullBlocks: BlockId[] = [];
  for (const b of BLOCKS) {
    const exp = expected[b.id] ?? 0;
    const got = countsByBlock[b.id] ?? 0;
    if (exp > 0 && (correctByBlock[b.id] ?? 0) < exp) incompleteBlocks.push(b.id);
    if (got > exp) overfullBlocks.push(b.id);
  }

  const totalCards = cards.length;
  const percent = Math.round((correct / totalCards) * 100);

  const hints: string[] = [];
  if (misplaced > 0) hints.push(`Hay ${misplaced} carta${misplaced > 1 ? "s" : ""} ubicada${misplaced > 1 ? "s" : ""} en un bloque incorrecto.`);
  if (undiscoveredTraps > 0) hints.push(`Existe${undiscoveredTraps > 1 ? "n" : ""} ${undiscoveredTraps} carta${undiscoveredTraps > 1 ? "s" : ""} trampa que todavía no descubriste.`);
  if (wronglyDiscardedModels > 0) hints.push(`Descartaste ${wronglyDiscardedModels} carta${wronglyDiscardedModels > 1 ? "s" : ""} que sí forma${wronglyDiscardedModels > 1 ? "n" : ""} parte del modelo.`);
  for (const b of incompleteBlocks) {
    const def = BLOCKS.find((x) => x.id === b)!;
    hints.push(`El bloque "${def.name}" todavía no está completo.`);
  }
  for (const b of overfullBlocks) {
    const def = BLOCKS.find((x) => x.id === b)!;
    hints.push(`Hay demasiadas cartas en "${def.name}".`);
  }
  if (hints.length === 0) hints.push("¡Modelo perfecto! Reconstruiste el Business Model Canvas.");

  return {
    totalCards,
    correct,
    misplaced,
    undiscoveredTraps,
    wronglyDiscardedModels,
    incompleteBlocks,
    overfullBlocks,
    percent,
    hints,
    perCard,
  };
}
