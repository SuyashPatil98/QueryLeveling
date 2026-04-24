import type { Concept } from './types';

export const tierE: Concept[] = [
  {
    id: 'select-basics',
    tier: 'E',
    title: 'SELECT, FROM, WHERE, ORDER BY, LIMIT',
    intro:
      'Every SQL query starts here. SELECT chooses columns, FROM chooses the table, WHERE filters rows, ORDER BY sorts the result, LIMIT caps it. SQLite has no NULLS FIRST/LAST by default — NULLs sort first ASC and last DESC.',
    syntax: `SELECT col1, col2, ...
FROM   table
WHERE  predicate
ORDER  BY col [ASC|DESC]
LIMIT  n [OFFSET m];`,
    examples: [
      {
        prompt: 'Show every S-rank hunter, highest level first.',
        query: `SELECT name, rank, level\nFROM hunters\nWHERE rank = 'S'\nORDER BY level DESC;`,
        takeaway: 'WHERE filters rows BEFORE ORDER BY runs, ORDER BY decides ranking, LIMIT slices.',
      },
      {
        prompt: 'Top 3 strongest hunters by strength stat.',
        query: `SELECT name, strength\nFROM hunters\nORDER BY strength DESC\nLIMIT 3;`,
      },
      {
        prompt: 'Hunters with no last_active_at recorded.',
        query: `SELECT name FROM hunters WHERE last_active_at IS NULL;`,
        takeaway: 'NULL is not equal to anything (not even itself). Use IS NULL / IS NOT NULL — never = NULL.',
      },
    ],
    pitfalls: [
      '`WHERE col = NULL` returns no rows. Use IS NULL.',
      'ORDER BY without LIMIT on huge tables can be expensive — always pair with LIMIT in production probes.',
      'SELECT * is fine for exploration; never ship it in views or app queries — column adds break code.',
    ],
    realWorld: [
      'Quick exploratory pulls (the first SQL anyone writes for a new table).',
      '"Top N" reports: top customers, top errors, top cohorts.',
    ],
    quests: [
      {
        id: 'q-e-1',
        prompt: 'List all S-rank shadows. Return name and level, ordered by level descending.',
        hints: ["Filter on rank = 'S'.", 'ORDER BY level DESC.'],
        expected: `SELECT name, level FROM shadows WHERE rank = 'S' ORDER BY level DESC;`,
        xp: 25,
      },
      {
        id: 'q-e-2',
        prompt:
          'Find the 5 most agile shadows. Return name and agility, highest first. Break ties on level descending.',
        hints: ['Two-key ORDER BY.', 'LIMIT 5.'],
        expected: `SELECT name, agility FROM shadows ORDER BY agility DESC, level DESC LIMIT 5;`,
        xp: 30,
      },
      {
        id: 'q-e-3',
        prompt: 'Return shadows summoned in 2023 (any month). Just their names, alphabetical.',
        hints: ["substr(summoned_at, 1, 4) = '2023' or summoned_at LIKE '2023-%'.", 'ORDER BY name ASC.'],
        expected: `SELECT name FROM shadows WHERE summoned_at LIKE '2023-%' ORDER BY name ASC;`,
        xp: 30,
      },
      {
        id: 'q-e-4',
        prompt: 'List shadows that have NEVER been seen active (last_active_at is missing). Return name and rank.',
        expected: `SELECT name, rank FROM shadows WHERE last_active_at IS NULL ORDER BY name;`,
        check: { orderInsensitive: true },
        xp: 25,
      },
    ],
    theory: [
      {
        id: 't-e-1',
        q: 'What is the logical execution order of a SELECT query?',
        a:
          'FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT/OFFSET. This is *logical* order; the optimizer is free to physically reorder anything as long as the result is identical. Knowing it explains why (a) you can\'t use a SELECT alias in WHERE, (b) you CAN use it in ORDER BY in most engines, (c) HAVING runs on grouped rows.',
      },
    ],
  },
  {
    id: 'operators-filtering',
    tier: 'E',
    title: 'Operators, BETWEEN, IN, LIKE, DISTINCT',
    intro:
      'Predicates beyond plain equality. BETWEEN is inclusive on both ends. IN is faster-to-read than chained ORs. LIKE uses % (any chars) and _ (one char). DISTINCT de-dupes whole rows of the SELECT list.',
    syntax: `WHERE col BETWEEN a AND b   -- inclusive
WHERE col IN (v1, v2, v3)
WHERE col LIKE 'Sung%'      -- starts with 'Sung'
WHERE col NOT LIKE '%a_a%'  -- glob with wildcards`,
    examples: [
      {
        prompt: 'Hunters between level 50 and 80 inclusive.',
        query: `SELECT name, level FROM hunters WHERE level BETWEEN 50 AND 80 ORDER BY level;`,
      },
      {
        prompt: 'Hunters whose class is Mage, Healer, or Archer (avoid OR chain).',
        query: `SELECT name, class FROM hunters WHERE class IN ('Mage','Healer','Archer') ORDER BY class, name;`,
      },
      {
        prompt: 'Distinct ranks present in the guild.',
        query: `SELECT DISTINCT rank FROM hunters ORDER BY rank;`,
      },
    ],
    pitfalls: [
      'BETWEEN is inclusive — easy to off-by-one when boundaries are dates with time components.',
      "LIKE '%foo%' on huge tables can't use a B-tree index — requires full scan or trigram index.",
      'DISTINCT is a sort/hash — never use it to "fix" duplicates from a bad join. Fix the join.',
    ],
    quests: [
      {
        id: 'q-e-5',
        prompt: 'Shadows with level between 60 and 90 inclusive. Name + level, ordered by level desc.',
        expected: `SELECT name, level FROM shadows WHERE level BETWEEN 60 AND 90 ORDER BY level DESC;`,
        xp: 25,
      },
      {
        id: 'q-e-6',
        prompt: 'All distinct classes that exist in the shadow roster, alphabetical.',
        expected: `SELECT DISTINCT class FROM shadows ORDER BY class;`,
        xp: 25,
      },
      {
        id: 'q-e-7',
        prompt: "Shadows whose name starts with the letter 'B'. Return name and rank, alphabetical by name.",
        hints: ["LIKE 'B%'."],
        expected: `SELECT name, rank FROM shadows WHERE name LIKE 'B%' ORDER BY name;`,
        xp: 25,
      },
      {
        id: 'q-e-8',
        prompt:
          "Shadows whose class is Tank, Healer, or Mage AND who belong to an army (army_id is not null). Return name, class, army_id ordered by class then name.",
        expected: `SELECT name, class, army_id FROM shadows WHERE class IN ('Tank','Healer','Mage') AND army_id IS NOT NULL ORDER BY class, name;`,
        xp: 35,
      },
    ],
  },
];
