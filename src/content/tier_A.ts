import type { Concept } from './types';

export const tierA: Concept[] = [
  {
    id: 'ctes',
    tier: 'A',
    title: 'CTEs (WITH clauses)',
    intro:
      'A CTE is a named, scoped subquery: WITH name AS (...) SELECT ... FROM name. Use them to (a) name an intermediate result for clarity, (b) reuse a result multiple times in one query, (c) build complex queries in stages. Multiple CTEs can be chained, comma-separated.',
    syntax: `WITH a AS (...), b AS (... uses a ...)
SELECT * FROM b;`,
    examples: [
      {
        prompt: 'Two-stage: per-hunter total reward, then top 5.',
        query: `WITH per_hunter AS (
  SELECT hunter_id, SUM(amount) AS total_reward
  FROM gold_transactions
  WHERE type = 'reward'
  GROUP BY hunter_id
)
SELECT h.name, p.total_reward
FROM per_hunter p
JOIN hunters h USING(hunter_id)
ORDER BY p.total_reward DESC
LIMIT 5;`,
        takeaway:
          'CTEs flatten "subquery onion" code into top-down readable steps.',
      },
    ],
    quests: [
      {
        id: 'q-a-1',
        prompt:
          'Use a CTE to compute per-shadow total mana reward, then return top 5: shadow_name, total_reward. Order by total_reward desc, then name.',
        expected: `WITH per_shadow AS (
  SELECT shadow_id, SUM(amount) AS total_reward
  FROM mana_transactions
  WHERE type = 'reward'
  GROUP BY shadow_id
)
SELECT s.name AS shadow_name, p.total_reward
FROM per_shadow p
JOIN shadows s USING(shadow_id)
ORDER BY p.total_reward DESC, shadow_name
LIMIT 5;`,
        xp: 65,
      },
      {
        id: 'q-a-2',
        prompt:
          'Two chained CTEs: (1) per_army totals (sum of damage by all shadows in that army across all missions), (2) average across armies. Then return armies whose total > average. Columns army_id, total_damage. Order by total_damage desc.',
        expected: `WITH per_army AS (
  SELECT s.army_id, SUM(mp.damage_dealt) AS total_damage
  FROM mission_participants mp
  JOIN shadows s ON s.shadow_id = mp.shadow_id
  WHERE s.army_id IS NOT NULL
  GROUP BY s.army_id
),
avg_army AS (
  SELECT AVG(total_damage) AS avg_total FROM per_army
)
SELECT p.army_id, p.total_damage
FROM per_army p, avg_army a
WHERE p.total_damage > a.avg_total
ORDER BY p.total_damage DESC;`,
        xp: 80,
      },
    ],
  },
  {
    id: 'recursive-ctes',
    tier: 'A',
    title: 'Recursive CTEs',
    intro:
      'A CTE that references itself. Pattern: anchor SELECT (the seed), UNION ALL, recursive SELECT (the next layer). The recursion ends when the recursive part returns no rows. Used for hierarchies (org charts, mentorship trees, parts BOM), graph traversal, and generating sequences.',
    syntax: `WITH RECURSIVE walk(...) AS (
  SELECT ...                       -- anchor
  UNION ALL
  SELECT ... FROM walk JOIN ...    -- recursive
)
SELECT ... FROM walk;`,
    examples: [
      {
        prompt:
          'Mentorship chain rooted at the top — each hunter, their depth in the tree, and the path from root.',
        query: `WITH RECURSIVE tree AS (
  SELECT hm.hunter_id, hm.mentor_id, 0 AS depth, h.name AS path
  FROM hunter_mentors hm
  JOIN hunters h ON h.hunter_id = hm.hunter_id
  WHERE hm.mentor_id IS NULL
  UNION ALL
  SELECT child.hunter_id, child.mentor_id, t.depth + 1,
         t.path || ' > ' || hc.name
  FROM hunter_mentors child
  JOIN tree t ON t.hunter_id = child.mentor_id
  JOIN hunters hc ON hc.hunter_id = child.hunter_id
)
SELECT depth, path FROM tree ORDER BY depth, path LIMIT 15;`,
      },
      {
        prompt: 'Generate numbers 1..10.',
        query: `WITH RECURSIVE n(x) AS (
  SELECT 1
  UNION ALL
  SELECT x + 1 FROM n WHERE x < 10
)
SELECT x FROM n;`,
      },
    ],
    pitfalls: [
      'Forget the terminating predicate → infinite loop. Most engines have a recursion depth limit; some have a MAXRECURSION hint.',
      'UNION (without ALL) deduplicates each iteration — usually you want UNION ALL for performance, then DISTINCT outside if needed.',
    ],
    quests: [
      {
        id: 'q-a-3',
        prompt:
          'Walk the shadow_lineage tree starting from the root (sire_id IS NULL). Return shadow_id, depth, name — depth 0 at root. Order by depth, name.',
        expected: `WITH RECURSIVE tree AS (
  SELECT sl.shadow_id, sl.sire_id, 0 AS depth
  FROM shadow_lineage sl
  WHERE sl.sire_id IS NULL
  UNION ALL
  SELECT child.shadow_id, child.sire_id, t.depth + 1
  FROM shadow_lineage child
  JOIN tree t ON t.shadow_id = child.sire_id
)
SELECT t.shadow_id, t.depth, s.name
FROM tree t
JOIN shadows s ON s.shadow_id = t.shadow_id
ORDER BY t.depth, s.name;`,
        xp: 90,
      },
      {
        id: 'q-a-4',
        prompt: 'Generate the integers 1 through 12, single column n.',
        expected: `WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<12) SELECT x AS n FROM n;`,
        xp: 50,
      },
    ],
  },
  {
    id: 'window-ranking',
    tier: 'A',
    title: 'Window functions: ranking (ROW_NUMBER, RANK, DENSE_RANK, NTILE)',
    intro:
      'Window functions compute a value PER ROW using a window of related rows, WITHOUT collapsing rows like GROUP BY does. Ranking variants:\n- ROW_NUMBER: 1,2,3,4 (unique, arbitrary tie-break unless you order)\n- RANK: 1,2,2,4 (ties share, gap)\n- DENSE_RANK: 1,2,2,3 (ties share, no gap)\n- NTILE(n): assigns rows to n equal-ish buckets',
    syntax: `RANK() OVER (PARTITION BY p ORDER BY o)`,
    examples: [
      {
        prompt:
          'Rank hunters within each guild by level (highest = rank 1).',
        query: `SELECT guild_id, name, level,
       RANK() OVER (PARTITION BY guild_id ORDER BY level DESC) AS rk
FROM hunters
WHERE guild_id IS NOT NULL
ORDER BY guild_id, rk
LIMIT 15;`,
      },
      {
        prompt:
          'Top-1 per group via ROW_NUMBER — the canonical "highest X per Y" pattern.',
        query: `WITH ranked AS (
  SELECT guild_id, name, level,
         ROW_NUMBER() OVER (PARTITION BY guild_id ORDER BY level DESC, name ASC) AS rn
  FROM hunters
  WHERE guild_id IS NOT NULL
)
SELECT guild_id, name, level FROM ranked WHERE rn = 1 ORDER BY guild_id;`,
      },
    ],
    pitfalls: [
      'PARTITION BY defines the group, ORDER BY inside OVER defines the row order — easy to swap them mentally.',
      'Without an ORDER BY in OVER, ranking functions are non-deterministic.',
    ],
    quests: [
      {
        id: 'q-a-5',
        prompt:
          'Within each army, rank shadows by level descending using DENSE_RANK. Return army_id, name, level, rk. Order by army_id, rk, name. Skip armyless shadows.',
        expected: `SELECT army_id, name, level,
       DENSE_RANK() OVER (PARTITION BY army_id ORDER BY level DESC) AS rk
FROM shadows
WHERE army_id IS NOT NULL
ORDER BY army_id, rk, name;`,
        xp: 70,
      },
      {
        id: 'q-a-6',
        prompt:
          'Pick the TOP shadow (highest level) per army. Tie-break by name asc. Return army_id, name, level. Order by army_id.',
        hints: ['ROW_NUMBER() with PARTITION BY army_id and ORDER BY level DESC, name ASC; keep rn=1.'],
        expected: `WITH ranked AS (
  SELECT army_id, name, level,
         ROW_NUMBER() OVER (PARTITION BY army_id ORDER BY level DESC, name ASC) AS rn
  FROM shadows
  WHERE army_id IS NOT NULL
)
SELECT army_id, name, level FROM ranked WHERE rn = 1 ORDER BY army_id;`,
        xp: 75,
      },
      {
        id: 'q-a-7',
        prompt:
          'Bucket all shadows into 4 quartiles by level desc using NTILE(4). Return name, level, quartile. Order by quartile, level desc, name.',
        expected: `SELECT name, level, NTILE(4) OVER (ORDER BY level DESC, name ASC) AS quartile FROM shadows ORDER BY quartile, level DESC, name;`,
        xp: 60,
      },
    ],
    theory: [
      {
        id: 't-a-1',
        q: 'When does ROW_NUMBER beat RANK in interviews?',
        a:
          'When you need exactly one row per group ("the most recent order per customer," "the top earner per department"). ROW_NUMBER guarantees a single rn=1 per partition — RANK can return multiple rows for ties (rk=1,1,3) which breaks "top 1" intent. Add an explicit tie-breaker in ORDER BY (e.g. created_at DESC, id DESC) to make the choice deterministic.',
      },
    ],
  },
  {
    id: 'window-aggregates',
    tier: 'A',
    title: 'Window aggregates: SUM/AVG OVER, PARTITION BY',
    intro:
      'Any aggregate can be a window function: SUM(...) OVER (PARTITION BY ...). The aggregate is computed over the window for each row WITHOUT collapsing rows. Lets you put group totals next to row detail (each row + that row\'s share of the group).',
    syntax: `SUM(x) OVER (PARTITION BY g)
AVG(x) OVER (PARTITION BY g)
COUNT(*) OVER (PARTITION BY g)`,
    examples: [
      {
        prompt:
          'Each hunter\'s damage in a raid + the team\'s total damage in that raid.',
        query: `SELECT raid_id, hunter_id, damage_dealt,
       SUM(damage_dealt) OVER (PARTITION BY raid_id) AS team_total,
       1.0 * damage_dealt / NULLIF(SUM(damage_dealt) OVER (PARTITION BY raid_id), 0) AS share
FROM raid_participants
ORDER BY raid_id, damage_dealt DESC
LIMIT 12;`,
      },
    ],
    quests: [
      {
        id: 'q-a-8',
        prompt:
          "For each (mission_id, shadow_id) row in mission_participants, return mission_id, shadow_id, damage_dealt, mission_total (sum of damage in that mission), and share = damage_dealt * 1.0 / mission_total. Order by mission_id, share desc. Limit 15.",
        expected: `SELECT mission_id, shadow_id, damage_dealt,
  SUM(damage_dealt) OVER (PARTITION BY mission_id) AS mission_total,
  damage_dealt * 1.0 / NULLIF(SUM(damage_dealt) OVER (PARTITION BY mission_id), 0) AS share
FROM mission_participants
ORDER BY mission_id, share DESC
LIMIT 15;`,
        xp: 85,
      },
    ],
  },
  {
    id: 'window-lag-lead',
    tier: 'A',
    title: 'LAG and LEAD',
    intro:
      'LAG(col, n, default) returns the value n rows BEFORE the current row in the window order. LEAD does the same forward. Indispensable for period-over-period changes, time-between-events, prev/next comparisons.',
    syntax: `LAG(col, 1, default) OVER (PARTITION BY p ORDER BY o)
LEAD(col, 1) OVER (PARTITION BY p ORDER BY o)`,
    examples: [
      {
        prompt: 'For each gold reward, show prior reward and the diff per hunter.',
        query: `SELECT hunter_id, occurred_at, amount,
       LAG(amount) OVER (PARTITION BY hunter_id ORDER BY occurred_at) AS prev_amount,
       amount - LAG(amount) OVER (PARTITION BY hunter_id ORDER BY occurred_at) AS diff
FROM gold_transactions
WHERE type = 'reward'
ORDER BY hunter_id, occurred_at
LIMIT 12;`,
      },
    ],
    quests: [
      {
        id: 'q-a-9',
        prompt:
          'For each shadow\'s reward mana_transactions, return shadow_id, occurred_at, amount, prev_amount (LAG), and diff = amount - prev_amount. Order by shadow_id, occurred_at. Limit 15.',
        expected: `SELECT shadow_id, occurred_at, amount,
  LAG(amount) OVER (PARTITION BY shadow_id ORDER BY occurred_at) AS prev_amount,
  amount - LAG(amount) OVER (PARTITION BY shadow_id ORDER BY occurred_at) AS diff
FROM mana_transactions
WHERE type = 'reward'
ORDER BY shadow_id, occurred_at
LIMIT 15;`,
        xp: 75,
      },
      {
        id: 'q-a-10',
        prompt:
          "For each cleared mission per army, return army_id, mission_id, started_at, and gap_days_since_prev = whole-days between this mission's started_at and the army's previous cleared mission. NULL for the first per army. Order by army_id, started_at. Limit 15.",
        expected: `WITH base AS (
  SELECT m.mission_id, m.army_id, m.started_at,
         LAG(m.started_at) OVER (PARTITION BY m.army_id ORDER BY m.started_at) AS prev_start
  FROM missions m
  WHERE m.status = 'cleared' AND m.army_id IS NOT NULL
)
SELECT army_id, mission_id, started_at,
  CAST(julianday(started_at) - julianday(prev_start) AS INTEGER) AS gap_days_since_prev
FROM base
ORDER BY army_id, started_at
LIMIT 15;`,
        xp: 95,
      },
    ],
  },
  {
    id: 'window-frames',
    tier: 'A',
    title: 'Window frames: ROWS / RANGE BETWEEN, FIRST_VALUE, LAST_VALUE',
    intro:
      'A window frame restricts the rows the aggregate sees, within the partition. Default for ranking: whole partition. Default for aggregates with ORDER BY: RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW (a running aggregate). Use ROWS for row-precise sliding windows; RANGE for value-based.',
    syntax: `SUM(x) OVER (
  PARTITION BY g
  ORDER BY o
  ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
)
FIRST_VALUE(x) OVER (...)
LAST_VALUE(x) OVER (... ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)`,
    examples: [
      {
        prompt: '7-day moving average gold reward per hunter.',
        query: `SELECT hunter_id, occurred_at, amount,
       AVG(amount) OVER (
         PARTITION BY hunter_id ORDER BY occurred_at
         ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
       ) AS ma_7
FROM gold_transactions
WHERE type = 'reward'
ORDER BY hunter_id, occurred_at
LIMIT 12;`,
      },
      {
        prompt: 'Each row\'s amount alongside the partition\'s first and last amounts.',
        query: `SELECT hunter_id, occurred_at, amount,
       FIRST_VALUE(amount) OVER (PARTITION BY hunter_id ORDER BY occurred_at) AS first_amt,
       LAST_VALUE(amount) OVER (
         PARTITION BY hunter_id ORDER BY occurred_at
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
       ) AS last_amt
FROM gold_transactions
WHERE type='reward'
ORDER BY hunter_id, occurred_at LIMIT 10;`,
        takeaway:
          'LAST_VALUE without an explicit frame returns the CURRENT row — the default frame ends at CURRENT ROW. Always set the frame.',
      },
    ],
    pitfalls: [
      'LAST_VALUE without a full-partition frame returns the current row, not the last in the partition.',
      'ROWS frames are row-count based; RANGE frames are value-range based — different answers when ties exist.',
    ],
    quests: [
      {
        id: 'q-a-11',
        prompt:
          'For each shadow\'s reward mana_transactions, return shadow_id, occurred_at, amount, and trailing_3_avg (avg of current row + 2 previous rows ordered by occurred_at). Order by shadow_id, occurred_at. Limit 15.',
        expected: `SELECT shadow_id, occurred_at, amount,
  AVG(amount) OVER (
    PARTITION BY shadow_id ORDER BY occurred_at
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS trailing_3_avg
FROM mana_transactions
WHERE type = 'reward'
ORDER BY shadow_id, occurred_at
LIMIT 15;`,
        xp: 95,
      },
    ],
  },
];
