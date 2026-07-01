const KEY = "canvas-detective:v1";

export interface StartupStat {
  bestScore: number;
  bestPercent: number;
  bestTimeSec: number;
  attempts: number;
  hintsUsedTotal: number;
  completed: boolean;
}

export interface GameStore {
  stats: Record<string, StartupStat>;
  unlocked: Record<string, boolean>;
}

const empty: GameStore = { stats: {}, unlocked: {} };

export function loadStore(): GameStore {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

export function saveStore(store: GameStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

export function recordResult(startupId: string, score: number, percent: number, timeSec: number, hintsUsed: number, unlockNextId: string | null) {
  const store = loadStore();
  const prev = store.stats[startupId] ?? {
    bestScore: 0,
    bestPercent: 0,
    bestTimeSec: Infinity,
    attempts: 0,
    hintsUsedTotal: 0,
    completed: false,
  };
  const next: StartupStat = {
    bestScore: Math.max(prev.bestScore, score),
    bestPercent: Math.max(prev.bestPercent, percent),
    bestTimeSec: percent >= 90 ? Math.min(prev.bestTimeSec, timeSec) : prev.bestTimeSec,
    attempts: prev.attempts + 1,
    hintsUsedTotal: prev.hintsUsedTotal + hintsUsed,
    completed: prev.completed || percent >= 90,
  };
  store.stats[startupId] = next;
  if (next.completed && unlockNextId) store.unlocked[unlockNextId] = true;
  saveStore(store);
  return store;
}

export function isUnlocked(store: GameStore, startupId: string, firstId: string): boolean {
  if (startupId === firstId) return true;
  return !!store.unlocked[startupId];
}
