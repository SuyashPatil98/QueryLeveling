import type { CheckOptions } from '../lib/checker';

export type Tier = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National';

export const TIER_ORDER: Tier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'National'];

export type ConceptExample = {
  prompt: string;
  query: string;
  takeaway?: string;
};

export type Quest = {
  id: string;
  prompt: string;
  hints?: string[];
  expected: string;
  starter?: string;
  check?: CheckOptions;
  xp?: number;
};

export type TheoryCard = {
  id: string;
  q: string;
  a: string;
  followUps?: string[];
};

export type Concept = {
  id: string;
  tier: Tier;
  title: string;
  intro: string;
  syntax?: string;
  examples: ConceptExample[];
  quests: Quest[];
  pitfalls?: string[];
  realWorld?: string[];
  theory?: TheoryCard[];
};
