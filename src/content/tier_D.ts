import type { Concept } from './types';

export const tierD: Concept[] = [
  {
    id: 'aggregates',
    tier: 'D',
    title: 'Aggregate functions',
    intro:
      'COUNT, SUM, AVG, MIN, MAX collapse rows. COUNT(*) counts rows including NULLs. COUNT(col) counts non-NULL values of col. COUNT(DISTINCT col) counts unique non-NULL values. AVG ignores NULLs (this can surprise you).',
    syntax: `SELECT COUNT(*),
       COUNT(col),
       COUNT(DISTINCT col),
       SUM(col), AVG(col), MIN(col), MAX(col)
FROM   t;`,
    examples: [
      {
        prompt: 'How many hunters do we have, and what is the average level?',
        query: `SELECT COUNT(*) AS total_hunters, AVG(level) AS avg_level FROM hunters;`,
      },
      {
        prompt: 'How many distinct classes exist? COUNT(DISTINCT) is the canonical way.',
        query: `SELECT COUNT(DISTINCT class) AS class_count FROM hunters;`,
      },
      {
        prompt: 'NULLs are ignored by AVG — this changes denominator.',
        query: `SELECT AVG(mana_capacity) AS avg_mana FROM hunters;`,
        takeaway:
          'If hunter 11 (Song Chiyul) has NULL mana_capacity, AVG divides by 29, not 30. Use COALESCE if you want NULL→0.',
      },
    ],
    pitfalls: [
      'COUNT(*) vs COUNT(col) — different answers if col has NULLs.',
      'SUM of an all-NULL column is NULL, not 0. Wrap in COALESCE(SUM(x), 0) when you need a number.',
      'AVG silently drops NULLs from the denominator.',
    ],
    quests: [
      {
        id: 'q-d-1',
        prompt:
          'Return total shadows, average level, max level, min level — single row with columns named total_shadows, avg_level, max_level, min_level.',
        expected: `SELECT COUNT(*) AS total_shadows, AVG(level) AS avg_level, MAX(level) AS max_level, MIN(level) AS min_level FROM shadows;`,
        xp: 30,
      },
      {
        id: 'q-d-2',
        prompt: 'Count of shadows that have a recorded last_active_at vs total. Columns: with_activity, total.',
        expected: `SELECT COUNT(last_active_at) AS with_activity, COUNT(*) AS total FROM shadows;`,
        xp: 30,
      },
      {
        id: 'q-d-3',
        prompt:
          'How many DISTINCT classes appear among the shadows of army_id 2? Single column distinct_classes.',
        expected: `SELECT COUNT(DISTINCT class) AS distinct_classes FROM shadows WHERE army_id = 2;`,
        xp: 30,
      },
    ],
    theory: [
      {
        id: 't-d-1',
        q: 'Why is COUNT(*) preferred over COUNT(1) or COUNT(col)?',
        a:
          'COUNT(*) is defined to count rows and is the same speed as COUNT(1) on every modern engine — neither dereferences a column. COUNT(col) is semantically different (skips NULLs) and may be slightly slower because it must inspect the column. Use COUNT(*) when you mean "row count," and COUNT(col)/COUNT(DISTINCT col) when you specifically want to ignore NULLs or count uniques.',
      },
    ],
  },
  {
    id: 'group-by-having',
    tier: 'D',
    title: 'GROUP BY and HAVING',
    intro:
      'GROUP BY collapses rows into buckets — every selected column must either be in the GROUP BY or wrapped in an aggregate. HAVING filters those buckets. WHERE filters rows BEFORE grouping; HAVING filters AFTER.',
    syntax: `SELECT bucket_col, AGG(x)
FROM   t
WHERE  row_predicate          -- rows in
GROUP  BY bucket_col
HAVING AGG(x) > threshold     -- buckets out
ORDER  BY ...;`,
    examples: [
      {
        prompt: 'Hunter count and average level per rank.',
        query: `SELECT rank, COUNT(*) AS hunters, AVG(level) AS avg_level
FROM hunters
GROUP BY rank
ORDER BY rank;`,
      },
      {
        prompt: 'Guilds with more than 4 hunters — HAVING filters the GROUPS.',
        query: `SELECT guild_id, COUNT(*) AS roster
FROM hunters
WHERE guild_id IS NOT NULL
GROUP BY guild_id
HAVING COUNT(*) > 4
ORDER BY roster DESC;`,
        takeaway:
          'You cannot use HAVING-equivalent COUNT(*) > 4 in WHERE — WHERE runs before grouping.',
      },
    ],
    pitfalls: [
      'Selecting a non-grouped, non-aggregated column is undefined (some engines reject; SQLite returns one arbitrary row per group).',
      'Filtering an aggregate in WHERE is a parse error — use HAVING.',
      'Filtering rows BEFORE grouping in HAVING (when WHERE would do) hurts performance.',
    ],
    quests: [
      {
        id: 'q-d-4',
        prompt:
          'For each rank, return: rank, headcount (COUNT), avg_level, total_strength. Order by headcount descending.',
        expected: `SELECT rank, COUNT(*) AS headcount, AVG(level) AS avg_level, SUM(strength) AS total_strength FROM shadows GROUP BY rank ORDER BY headcount DESC;`,
        xp: 40,
      },
      {
        id: 'q-d-5',
        prompt:
          'Find armies with at least 3 shadows. Return army_id and roster_size, ordered by roster_size descending then army_id ascending.',
        expected: `SELECT army_id, COUNT(*) AS roster_size FROM shadows WHERE army_id IS NOT NULL GROUP BY army_id HAVING COUNT(*) >= 3 ORDER BY roster_size DESC, army_id ASC;`,
        xp: 45,
      },
      {
        id: 'q-d-6',
        prompt:
          'Per class, return classes whose AVERAGE intellect is above 400. Columns: class, avg_intellect. Order by avg_intellect desc.',
        expected: `SELECT class, AVG(intellect) AS avg_intellect FROM shadows GROUP BY class HAVING AVG(intellect) > 400 ORDER BY avg_intellect DESC;`,
        xp: 40,
      },
    ],
    theory: [
      {
        id: 't-d-2',
        q: 'WHERE vs HAVING — when is the distinction important for performance?',
        a:
          'Always push predicates into WHERE when they only depend on row-level columns (not aggregates). The optimizer evaluates WHERE before grouping, often using indexes, so fewer rows reach the GROUP BY hash/sort. HAVING is mandatory only for predicates that reference an aggregate (e.g. SUM(amt) > 1000) or expressions on the grouped key after grouping.',
      },
    ],
  },
  {
    id: 'case-expressions',
    tier: 'D',
    title: 'CASE expressions',
    intro:
      'CASE is SQL\'s if/else. Two forms: simple (CASE col WHEN v THEN ...) and searched (CASE WHEN cond THEN ... ELSE ... END). Use it inside SELECT, WHERE, ORDER BY, and inside aggregates for conditional counting/summing — the bread and butter of analytical SQL.',
    syntax: `CASE WHEN cond1 THEN r1
     WHEN cond2 THEN r2
     ELSE r_default
END`,
    examples: [
      {
        prompt: 'Bucket hunters into "rookie", "veteran", "elite".',
        query: `SELECT name, level,
       CASE
         WHEN level < 30 THEN 'rookie'
         WHEN level < 70 THEN 'veteran'
         ELSE 'elite'
       END AS tier
FROM hunters
ORDER BY level;`,
      },
      {
        prompt:
          'Conditional aggregation: count hunters per guild, splitting by rank class.',
        query: `SELECT guild_id,
       SUM(CASE WHEN rank IN ('S','A') THEN 1 ELSE 0 END) AS top_tier,
       SUM(CASE WHEN rank IN ('B','C') THEN 1 ELSE 0 END) AS mid_tier,
       SUM(CASE WHEN rank IN ('D','E') THEN 1 ELSE 0 END) AS low_tier
FROM hunters
WHERE guild_id IS NOT NULL
GROUP BY guild_id
ORDER BY guild_id;`,
        takeaway:
          'SUM(CASE WHEN ... THEN 1 ELSE 0 END) is THE pivot/conditional-count idiom. Memorize this.',
      },
    ],
    pitfalls: [
      'Forgetting ELSE returns NULL when no branch matches — explicit ELSE 0 (or whatever) protects sums.',
      'Putting CASE in GROUP BY but selecting a different alias name — match the expression exactly or wrap in a subquery.',
    ],
    quests: [
      {
        id: 'q-d-7',
        prompt:
          'Bucket each shadow as "scout" (level<40), "knight" (40-79), "champion" (>=80). Return name, level, bucket. Order by level asc.',
        expected: `SELECT name, level,
  CASE WHEN level < 40 THEN 'scout' WHEN level < 80 THEN 'knight' ELSE 'champion' END AS bucket
FROM shadows
ORDER BY level ASC;`,
        xp: 40,
      },
      {
        id: 'q-d-8',
        prompt:
          'For each army, return: army_id, s_or_a (count of S+A rank), b_or_c (count of B+C), d_or_e (count of D+E). Order by army_id. Skip shadows with no army.',
        expected: `SELECT army_id,
  SUM(CASE WHEN rank IN ('S','A') THEN 1 ELSE 0 END) AS s_or_a,
  SUM(CASE WHEN rank IN ('B','C') THEN 1 ELSE 0 END) AS b_or_c,
  SUM(CASE WHEN rank IN ('D','E') THEN 1 ELSE 0 END) AS d_or_e
FROM shadows
WHERE army_id IS NOT NULL
GROUP BY army_id
ORDER BY army_id;`,
        xp: 55,
      },
    ],
  },
  {
    id: 'null-handling',
    tier: 'D',
    title: 'NULL handling: COALESCE, NULLIF, IFNULL, IS NULL',
    intro:
      'NULL means "unknown." NULL = NULL is itself NULL (treated as false). Arithmetic with NULL yields NULL. COALESCE returns the first non-NULL of its arguments. NULLIF(a,b) returns NULL if a=b, else a (handy for divide-by-zero guards).',
    syntax: `COALESCE(a, b, c, ...)   -- first non-null
NULLIF(a, b)             -- a if a<>b else NULL
IFNULL(a, b)             -- SQLite/MySQL alias for COALESCE(a,b)
col IS NULL / IS NOT NULL`,
    examples: [
      {
        prompt: 'Treat missing mana_capacity as 0 in average.',
        query: `SELECT AVG(COALESCE(mana_capacity, 0)) AS avg_mana_zerofill,
       AVG(mana_capacity) AS avg_mana_default
FROM hunters;`,
        takeaway: 'Different denominators produce different "averages." Always state the rule.',
      },
      {
        prompt: 'Safe division: avoid divide by zero with NULLIF.',
        query: `SELECT name, damage_dealt, healing_done,
       damage_dealt * 1.0 / NULLIF(healing_done, 0) AS dps_per_heal
FROM raid_participants
LIMIT 5;`,
      },
    ],
    pitfalls: [
      '`col != "X"` filters out rows where col IS NULL. Use `col IS DISTINCT FROM "X"` (Postgres) or `(col != "X" OR col IS NULL)` to keep them.',
      'COUNT, SUM, AVG ignore NULLs silently. ORDER BY treats NULLs as a sort group.',
      'Joining on a NULLable column never matches — NULL = NULL is unknown.',
    ],
    quests: [
      {
        id: 'q-d-9',
        prompt:
          'Return shadow name and effective_intellect, where effective_intellect is COALESCE(intellect, 0). Order by effective_intellect desc, then name. First 10 only.',
        expected: `SELECT name, COALESCE(intellect, 0) AS effective_intellect FROM shadows ORDER BY effective_intellect DESC, name LIMIT 10;`,
        xp: 35,
      },
      {
        id: 'q-d-10',
        prompt:
          'Return mission_id, damage_dealt, healing_done, and ratio = damage_dealt * 1.0 / healing_done — but return NULL safely when healing is 0. Limit to first 8 rows by mission_id then shadow_id.',
        hints: ['Use NULLIF(healing_done, 0).'],
        expected: `SELECT mission_id, damage_dealt, healing_done, damage_dealt * 1.0 / NULLIF(healing_done, 0) AS ratio FROM mission_participants ORDER BY mission_id, shadow_id LIMIT 8;`,
        xp: 40,
      },
    ],
  },
  {
    id: 'string-functions',
    tier: 'D',
    title: 'String functions: LENGTH, SUBSTR, UPPER, LOWER, REPLACE, ||, TRIM',
    intro:
      'SQLite uses || for concatenation (not +). Most engines have LENGTH/CHAR_LENGTH, SUBSTR/SUBSTRING, UPPER/LOWER, REPLACE, TRIM/LTRIM/RTRIM, INSTR/POSITION, and pattern functions like LIKE/GLOB. Senior interviews lean on these for parsing emails, names, JSON-as-text, and so on.',
    syntax: `LENGTH(s), SUBSTR(s, start, len), UPPER(s), LOWER(s),
TRIM(s), REPLACE(s, find, repl), INSTR(s, needle),
s1 || s2  -- concat`,
    examples: [
      {
        prompt: 'First name only — split at the first space.',
        query: `SELECT name, SUBSTR(name, 1, INSTR(name, ' ') - 1) AS first_name FROM hunters WHERE INSTR(name, ' ') > 0 LIMIT 5;`,
      },
      {
        prompt: 'Initials.',
        query: `SELECT name, UPPER(SUBSTR(name, 1, 1)) || '.' AS initial FROM hunters LIMIT 5;`,
      },
    ],
    quests: [
      {
        id: 'q-d-11',
        prompt:
          'Return shadow_id, name, name_length where name_length = LENGTH(name). Order by name_length desc, name asc. Limit 10.',
        expected: `SELECT shadow_id, name, LENGTH(name) AS name_length FROM shadows ORDER BY name_length DESC, name ASC LIMIT 10;`,
        xp: 30,
      },
      {
        id: 'q-d-12',
        prompt:
          'Return shadows whose name contains the letter "a" (case-insensitive). Columns name, rank. Order by name.',
        hints: ["LOWER(name) LIKE '%a%'."],
        expected: `SELECT name, rank FROM shadows WHERE LOWER(name) LIKE '%a%' ORDER BY name;`,
        xp: 30,
      },
    ],
  },
  {
    id: 'date-time',
    tier: 'D',
    title: 'Date and time',
    intro:
      'SQLite stores datetimes as TEXT in ISO format ("YYYY-MM-DD HH:MM:SS") and provides date(), time(), datetime(), strftime(), and julianday() for math. Other engines have richer types — same ideas: extract parts, truncate, diff, add intervals.',
    syntax: `date('now'), datetime('now', '-7 days'),
strftime('%Y-%m', col)        -- truncate to month
julianday(b) - julianday(a)   -- days between`,
    examples: [
      {
        prompt: 'Hunters who joined in 2021.',
        query: `SELECT name, awakened_at FROM hunters WHERE strftime('%Y', awakened_at) = '2021' ORDER BY awakened_at;`,
      },
      {
        prompt: 'Days since each hunter was last active.',
        query: `SELECT name, last_active_at,
       CAST(julianday('2026-04-23') - julianday(last_active_at) AS INTEGER) AS days_inactive
FROM hunters
WHERE last_active_at IS NOT NULL
ORDER BY days_inactive DESC
LIMIT 5;`,
      },
    ],
    quests: [
      {
        id: 'q-d-13',
        prompt:
          'Return shadows summoned in 2024. Columns name, summoned_at. Order by summoned_at ascending.',
        expected: `SELECT name, summoned_at FROM shadows WHERE strftime('%Y', summoned_at) = '2024' ORDER BY summoned_at ASC;`,
        xp: 30,
      },
      {
        id: 'q-d-14',
        prompt:
          'For each mission cleared in February 2026, return mission_id and duration_minutes (ended_at minus started_at, in whole minutes). Order by duration_minutes desc.',
        hints: ["status = 'cleared'", "strftime('%Y-%m', started_at) = '2026-02'", '(julianday(ended_at) - julianday(started_at)) * 24 * 60.'],
        expected: `SELECT mission_id, CAST((julianday(ended_at) - julianday(started_at)) * 24 * 60 AS INTEGER) AS duration_minutes
FROM missions
WHERE status = 'cleared' AND strftime('%Y-%m', started_at) = '2026-02'
ORDER BY duration_minutes DESC;`,
        xp: 50,
      },
    ],
  },
];
