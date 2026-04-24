import type { Concept, Quest, TheoryCard } from './types';
import { tierE } from './tier_E';
import { tierD } from './tier_D';
import { tierC } from './tier_C';
import { tierB } from './tier_B';
import { tierA } from './tier_A';
import { tierS } from './tier_S';
import { tierNational } from './tier_National';

export const ALL_CONCEPTS: Concept[] = [
  ...tierE, ...tierD, ...tierC, ...tierB, ...tierA, ...tierS, ...tierNational,
];

export function getConcept(id: string): Concept | undefined {
  return ALL_CONCEPTS.find((c) => c.id === id);
}

export function totalQuests(): number {
  return ALL_CONCEPTS.reduce((n, c) => n + c.quests.length, 0);
}

export function totalTheory(): number {
  return ALL_CONCEPTS.reduce((n, c) => n + (c.theory?.length ?? 0), 0);
}

export function allQuests(): Quest[] {
  return ALL_CONCEPTS.flatMap((c) => c.quests);
}

export function allTheory(): TheoryCard[] {
  return ALL_CONCEPTS.flatMap((c) => c.theory ?? []);
}

export function totalXpAvailable(): number {
  let xp = 0;
  for (const c of ALL_CONCEPTS) {
    for (const q of c.quests) xp += q.xp ?? 50;
    for (const _ of c.theory ?? []) xp += 20;
  }
  return xp;
}
