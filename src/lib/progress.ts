export type QuestStatus = 'locked' | 'available' | 'attempted' | 'cleared';
export type Progress = {
  clearedQuests: Record<string, { at: number; attempts: number }>;
  attempts: Record<string, number>;
  theoryCleared: Record<string, number>;
  notes: Record<string, string>;
  xp: number;
  createdAt: number;
};

const KEY = 'solo-sql-progress-v1';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    clearedQuests: {},
    attempts: {},
    theoryCleared: {},
    notes: {},
    xp: 0,
    createdAt: Date.now(),
  };
}

export function saveProgress(p: Progress) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function resetProgress() {
  localStorage.removeItem(KEY);
}

export function clearQuest(id: string, xpReward: number): Progress {
  const p = loadProgress();
  if (!p.clearedQuests[id]) {
    p.xp += xpReward;
  }
  p.clearedQuests[id] = { at: Date.now(), attempts: (p.attempts[id] || 0) + 1 };
  saveProgress(p);
  return p;
}

export function recordAttempt(id: string): Progress {
  const p = loadProgress();
  p.attempts[id] = (p.attempts[id] || 0) + 1;
  saveProgress(p);
  return p;
}

export function toggleTheory(id: string): Progress {
  const p = loadProgress();
  if (p.theoryCleared[id]) {
    delete p.theoryCleared[id];
  } else {
    p.theoryCleared[id] = Date.now();
    p.xp += 20;
  }
  saveProgress(p);
  return p;
}

export function saveNote(id: string, note: string): Progress {
  const p = loadProgress();
  p.notes[id] = note;
  saveProgress(p);
  return p;
}

// Hunter rank thresholds based on XP
const RANKS: Array<{ rank: string; min: number; color: string }> = [
  { rank: 'E', min: 0, color: 'rank-E' },
  { rank: 'D', min: 200, color: 'rank-D' },
  { rank: 'C', min: 600, color: 'rank-C' },
  { rank: 'B', min: 1400, color: 'rank-B' },
  { rank: 'A', min: 2600, color: 'rank-A' },
  { rank: 'S', min: 4500, color: 'rank-S' },
  { rank: 'National', min: 7500, color: 'rank-N' },
];

export function rankFromXp(xp: number) {
  let current = RANKS[0];
  let next: typeof RANKS[number] | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].min) current = RANKS[i];
    if (xp < RANKS[i].min) {
      next = RANKS[i];
      break;
    }
  }
  const prev = current.min;
  const cap = next ? next.min : current.min + 2000;
  const progress = Math.min(1, Math.max(0, (xp - prev) / (cap - prev)));
  return { current, next, progress };
}

export function levelFromXp(xp: number): number {
  return 1 + Math.floor(Math.sqrt(xp / 25));
}
