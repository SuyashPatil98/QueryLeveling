import type { Concept } from './types';

export const tierS: Concept[] = [
  {
    id: 'running-totals',
    tier: 'S',
    title: 'Running totals & cumulative sums',
    intro:
      'Cumulative sums use SUM(...) OVER (PARTITION BY ... ORDER BY ...) with the default frame (UNBOUNDED PRECEDING → CURRENT ROW). Critical for revenue-to-date, balance histories, % of cumulative goal.',
    examples: [
      {
        prompt: 'Cumulative reward gold per hunter over time.',
        query: `SELECT hunter_id, occurred_at, amount,
       SUM(amount) OVER (PARTITION BY hunter_id ORDER BY occurred_at) AS running_total
FROM gold_transactions
WHERE type = 'reward'
ORDER BY hunter_id, occurred_at LIMIT 15;`,
      },
    ],
    quests: [
      {
        id: 'q-s-1',
        prompt:
          'For each shadow reward, return shadow_id, occurred_at, amount, running_total (cumulative sum of amount per shadow ordered by occurred_at). Order by shadow_id, occurred_at. Limit 15.',
        expected: `SELECT shadow_id, occurred_at, amount,
  SUM(amount) OVER (PARTITION BY shadow_id ORDER BY occurred_at) AS running_total
FROM mana_transactions
WHERE type = 'reward'
ORDER BY shadow_id, occurred_at
LIMIT 15;`,
        xp: 80,
      },
      {
        id: 'q-s-2',
        prompt:
          'Daily mission rewards per army. Per (army_id, date), sum the reward_mana of cleared missions, plus the cumulative total per army across days. Date = strftime(\'%Y-%m-%d\', started_at). Columns army_id, day, daily, cum_total. Order by army_id, day. Limit 25.',
        expected: `WITH d AS (
  SELECT army_id, strftime('%Y-%m-%d', started_at) AS day, SUM(reward_mana) AS daily
  FROM missions
  WHERE status='cleared' AND army_id IS NOT NULL
  GROUP BY army_id, strftime('%Y-%m-%d', started_at)
)
SELECT army_id, day, daily,
  SUM(daily) OVER (PARTITION BY army_id ORDER BY day) AS cum_total
FROM d
ORDER BY army_id, day
LIMIT 25;`,
        xp: 100,
      },
    ],
  },
  {
    id: 'top-n-per-group',
    tier: 'S',
    title: 'Top-N per group',
    intro:
      'The "top 3 customers per region" pattern. Two stable approaches:\n1) ROW_NUMBER inside CTE, filter rn <= N (deterministic top N exactly).\n2) RANK / DENSE_RANK if ties should all count (may return more than N).',
    examples: [
      {
        prompt: 'Top 2 hunters per guild by level.',
        query: `WITH ranked AS (
  SELECT guild_id, name, level,
         ROW_NUMBER() OVER (PARTITION BY guild_id ORDER BY level DESC, name ASC) AS rn
  FROM hunters WHERE guild_id IS NOT NULL
)
SELECT guild_id, name, level FROM ranked WHERE rn <= 2 ORDER BY guild_id, rn;`,
      },
    ],
    quests: [
      {
        id: 'q-s-3',
        prompt:
          'Top 3 shadows per army by total damage dealt across all missions. Columns army_id, shadow_name, total_damage, rk (1..3). Order by army_id, rk.',
        expected: `WITH per AS (
  SELECT s.army_id, s.name AS shadow_name, SUM(mp.damage_dealt) AS total_damage
  FROM mission_participants mp
  JOIN shadows s ON s.shadow_id = mp.shadow_id
  WHERE s.army_id IS NOT NULL
  GROUP BY s.army_id, s.shadow_id, s.name
),
ranked AS (
  SELECT army_id, shadow_name, total_damage,
         ROW_NUMBER() OVER (PARTITION BY army_id ORDER BY total_damage DESC, shadow_name ASC) AS rk
  FROM per
)
SELECT army_id, shadow_name, total_damage, rk
FROM ranked WHERE rk <= 3
ORDER BY army_id, rk;`,
        xp: 110,
      },
    ],
  },
  {
    id: 'gaps-and-islands',
    tier: 'S',
    title: 'Gaps and islands',
    intro:
      'Classic interview pattern: collapse runs of consecutive values into "islands" (or find the gaps between them). The trick: subtract a running counter from the value — equal differences belong to the same island.',
    examples: [
      {
        prompt: 'Find consecutive raid_id runs per guild (cleared raids only).',
        query: `WITH base AS (
  SELECT guild_id, raid_id,
         raid_id - ROW_NUMBER() OVER (PARTITION BY guild_id ORDER BY raid_id) AS grp
  FROM raids WHERE status='cleared' AND guild_id IS NOT NULL
)
SELECT guild_id, MIN(raid_id) AS run_start, MAX(raid_id) AS run_end, COUNT(*) AS run_len
FROM base GROUP BY guild_id, grp ORDER BY guild_id, run_start LIMIT 15;`,
        takeaway:
          'value − row_number is constant across consecutive integers → groups them.',
      },
    ],
    quests: [
      {
        id: 'q-s-4',
        prompt:
          'For each army, find runs of consecutive cleared mission_ids. Return army_id, run_start (min mission_id), run_end (max mission_id), run_len. Order by army_id, run_start.',
        expected: `WITH base AS (
  SELECT army_id, mission_id,
    mission_id - ROW_NUMBER() OVER (PARTITION BY army_id ORDER BY mission_id) AS grp
  FROM missions
  WHERE status='cleared' AND army_id IS NOT NULL
)
SELECT army_id, MIN(mission_id) AS run_start, MAX(mission_id) AS run_end, COUNT(*) AS run_len
FROM base
GROUP BY army_id, grp
ORDER BY army_id, run_start;`,
        xp: 120,
      },
    ],
    theory: [
      {
        id: 't-s-1',
        q: "Why does (value − ROW_NUMBER()) work to detect islands?",
        a:
          'ORDER BY value gives row numbers 1,2,3,... in the same order as the values themselves. If values are consecutive (e.g. 7,8,9), value − rn is constant (7-1=6, 8-2=6, 9-3=6) — all share group 6. The moment a gap appears (value jumps to 12 next, rn=4), value − rn changes (12-4=8) and a new group begins.',
      },
    ],
  },
  {
    id: 'sessionization',
    tier: 'S',
    title: 'Sessionization',
    intro:
      'Group events into sessions when consecutive events are within a threshold (typically 30 minutes idle ends the session). Pattern: use LAG to find inter-event gap, mark a "new session" when gap > threshold (or null), cumulative SUM that flag to assign session ids.',
    examples: [
      {
        prompt:
          'Sessionize a hunter\'s gold_transactions: a new session begins after 30+ days of inactivity.',
        query: `WITH ev AS (
  SELECT hunter_id, occurred_at,
    julianday(occurred_at) - julianday(LAG(occurred_at) OVER (PARTITION BY hunter_id ORDER BY occurred_at)) AS gap_days
  FROM gold_transactions
), flagged AS (
  SELECT hunter_id, occurred_at,
    CASE WHEN gap_days IS NULL OR gap_days > 30 THEN 1 ELSE 0 END AS is_new
  FROM ev
)
SELECT hunter_id, occurred_at,
  SUM(is_new) OVER (PARTITION BY hunter_id ORDER BY occurred_at) AS session_id
FROM flagged
ORDER BY hunter_id, occurred_at LIMIT 15;`,
      },
    ],
    quests: [
      {
        id: 'q-s-5',
        prompt:
          'Sessionize each shadow\'s mana_transactions where a new session starts after 14+ days of inactivity. Return shadow_id, occurred_at, session_id (1-based per shadow). Order by shadow_id, occurred_at. Limit 20.',
        expected: `WITH ev AS (
  SELECT shadow_id, occurred_at,
    julianday(occurred_at) - julianday(LAG(occurred_at) OVER (PARTITION BY shadow_id ORDER BY occurred_at)) AS gap_days
  FROM mana_transactions
), flagged AS (
  SELECT shadow_id, occurred_at,
    CASE WHEN gap_days IS NULL OR gap_days > 14 THEN 1 ELSE 0 END AS is_new
  FROM ev
)
SELECT shadow_id, occurred_at,
  SUM(is_new) OVER (PARTITION BY shadow_id ORDER BY occurred_at) AS session_id
FROM flagged
ORDER BY shadow_id, occurred_at
LIMIT 20;`,
        xp: 130,
      },
    ],
  },
  {
    id: 'cohort-retention',
    tier: 'S',
    title: 'Cohort retention',
    intro:
      'Cohort = group of users defined by their first-event date (e.g. signup month). Retention = of those users, how many returned in subsequent periods? Pattern: per-user first-period via MIN window, then for each (cohort, later period), count users with activity.',
    examples: [
      {
        prompt:
          'Cohort = month a hunter first received reward gold. Retention by month-offset (rough demo).',
        query: `WITH first_evt AS (
  SELECT hunter_id, MIN(occurred_at) AS first_at
  FROM gold_transactions WHERE type='reward'
  GROUP BY hunter_id
), evt AS (
  SELECT g.hunter_id,
         strftime('%Y-%m', f.first_at) AS cohort_month,
         strftime('%Y-%m', g.occurred_at) AS evt_month
  FROM gold_transactions g
  JOIN first_evt f ON f.hunter_id = g.hunter_id
  WHERE g.type='reward'
)
SELECT cohort_month, evt_month, COUNT(DISTINCT hunter_id) AS active
FROM evt
GROUP BY cohort_month, evt_month
ORDER BY cohort_month, evt_month
LIMIT 20;`,
      },
    ],
    quests: [
      {
        id: 'q-s-6',
        prompt:
          'Build a cohort table on mana_transactions (type=\'reward\'): cohort_month = strftime("%Y-%m") of each shadow\'s FIRST reward, evt_month = month of any subsequent reward. Return cohort_month, evt_month, active (count distinct shadows). Order by cohort_month, evt_month. Limit 20.',
        expected: `WITH first_evt AS (
  SELECT shadow_id, MIN(occurred_at) AS first_at
  FROM mana_transactions WHERE type='reward'
  GROUP BY shadow_id
),
evt AS (
  SELECT m.shadow_id,
    strftime('%Y-%m', f.first_at) AS cohort_month,
    strftime('%Y-%m', m.occurred_at) AS evt_month
  FROM mana_transactions m
  JOIN first_evt f ON f.shadow_id = m.shadow_id
  WHERE m.type='reward'
)
SELECT cohort_month, evt_month, COUNT(DISTINCT shadow_id) AS active
FROM evt
GROUP BY cohort_month, evt_month
ORDER BY cohort_month, evt_month
LIMIT 20;`,
        xp: 140,
      },
    ],
  },
  {
    id: 'percentiles-median',
    tier: 'S',
    title: 'Percentiles & median (engine-portable)',
    intro:
      'PERCENTILE_CONT exists in Postgres / Snowflake / BigQuery but not SQLite. Portable approach: PERCENT_RANK or NTILE for buckets; for the median specifically, use NTILE(2) or order + LIMIT/OFFSET tricks. Senior interviews usually want you to reason about how you\'d implement percentile in any engine.',
    examples: [
      {
        prompt: 'Median level using ROW_NUMBER + COUNT — engine-agnostic.',
        query: `WITH ranked AS (
  SELECT level,
    ROW_NUMBER() OVER (ORDER BY level) AS rn,
    COUNT(*) OVER () AS n
  FROM hunters
)
SELECT AVG(level * 1.0) AS median_level
FROM ranked
WHERE rn IN ((n+1)/2, (n+2)/2);`,
        takeaway:
          '(n+1)/2 and (n+2)/2 collapse to the same row for odd n and to the two middle rows for even n.',
      },
    ],
    quests: [
      {
        id: 'q-s-7',
        prompt:
          'Compute the median level across ALL shadows. Single column median_level (numeric — average of the two middle if even).',
        expected: `WITH ranked AS (
  SELECT level,
    ROW_NUMBER() OVER (ORDER BY level) AS rn,
    COUNT(*) OVER () AS n
  FROM shadows
)
SELECT AVG(level * 1.0) AS median_level
FROM ranked
WHERE rn IN ((n+1)/2, (n+2)/2);`,
        xp: 120,
      },
    ],
  },
  {
    id: 'pivot-unpivot',
    tier: 'S',
    title: 'Pivot / unpivot (engine-portable)',
    intro:
      'SQLite has no PIVOT. Build it manually with conditional aggregation: SUM(CASE WHEN col=v THEN x END) AS v_total. UNPIVOT: use UNION ALL of one SELECT per source column.',
    examples: [
      {
        prompt: 'Pivot raid count per (guild, status) into wide form.',
        query: `SELECT guild_id,
  SUM(CASE WHEN status='cleared' THEN 1 ELSE 0 END) AS cleared,
  SUM(CASE WHEN status='failed'  THEN 1 ELSE 0 END) AS failed,
  SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) AS in_progress
FROM raids
WHERE guild_id IS NOT NULL
GROUP BY guild_id
ORDER BY guild_id;`,
      },
    ],
    quests: [
      {
        id: 'q-s-8',
        prompt:
          'Pivot mission counts per (army_id, status) into wide form. Columns army_id, cleared, failed, in_progress. Order by army_id. Skip armyless missions.',
        expected: `SELECT army_id,
  SUM(CASE WHEN status='cleared' THEN 1 ELSE 0 END) AS cleared,
  SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed,
  SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) AS in_progress
FROM missions
WHERE army_id IS NOT NULL
GROUP BY army_id
ORDER BY army_id;`,
        xp: 100,
      },
    ],
  },
  {
    id: 'dedup-patterns',
    tier: 'S',
    title: 'Deduplication patterns',
    intro:
      'Three battle-tested ways to deduplicate:\n1) DISTINCT — when the entire row is the unit of dedup.\n2) GROUP BY + aggregate — when you want one row per key.\n3) ROW_NUMBER + filter — when you want a specific representative ("latest", "highest").',
    examples: [
      {
        prompt: 'Latest gold transaction per hunter — ROW_NUMBER pattern.',
        query: `WITH ranked AS (
  SELECT hunter_id, amount, occurred_at,
    ROW_NUMBER() OVER (PARTITION BY hunter_id ORDER BY occurred_at DESC) AS rn
  FROM gold_transactions
)
SELECT hunter_id, amount, occurred_at FROM ranked WHERE rn = 1 ORDER BY hunter_id LIMIT 10;`,
      },
    ],
    quests: [
      {
        id: 'q-s-9',
        prompt:
          'For each shadow with any mana_transactions, return their LATEST transaction (by occurred_at). Columns shadow_id, amount, occurred_at. Order by shadow_id. Limit 15.',
        expected: `WITH ranked AS (
  SELECT shadow_id, amount, occurred_at,
    ROW_NUMBER() OVER (PARTITION BY shadow_id ORDER BY occurred_at DESC, txn_id DESC) AS rn
  FROM mana_transactions
)
SELECT shadow_id, amount, occurred_at FROM ranked WHERE rn=1 ORDER BY shadow_id LIMIT 15;`,
        xp: 90,
      },
    ],
  },
];
