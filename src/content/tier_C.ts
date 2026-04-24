import type { Concept } from './types';

export const tierC: Concept[] = [
  {
    id: 'inner-join',
    tier: 'C',
    title: 'INNER JOIN',
    intro:
      'INNER JOIN returns rows where the join predicate is true on both sides. Rows with no match are dropped from BOTH sides. The most common join — and the easiest to silently break by joining on a NULLable key.',
    syntax: `SELECT a.col, b.col
FROM   a
JOIN   b ON a.k = b.k;`,
    examples: [
      {
        prompt: 'Hunter name with their guild name.',
        query: `SELECT h.name AS hunter, g.name AS guild
FROM hunters h
JOIN guilds g ON g.guild_id = h.guild_id
ORDER BY guild, hunter
LIMIT 10;`,
        takeaway:
          'Hunter 12 (Go Gunhee) is dropped — his guild_id is NULL. INNER JOIN silently filters him out.',
      },
      {
        prompt: 'Raid + dungeon together — pulling labels from a dimension table.',
        query: `SELECT r.raid_id, d.name AS dungeon, d.rank, r.status, r.reward_gold
FROM raids r
JOIN dungeons d ON d.dungeon_id = r.dungeon_id
ORDER BY r.raid_id
LIMIT 5;`,
      },
    ],
    pitfalls: [
      'Joining on a NULL-bearing key drops those rows silently — confirm with COUNT(*) before/after.',
      'Multiple matches per left row multiply rows (Cartesian product per key) — beware of fan-out before aggregating.',
      'Always alias tables for readability and to disambiguate columns of the same name.',
    ],
    quests: [
      {
        id: 'q-c-1',
        prompt:
          'Return shadow name and army name for every shadow that belongs to an army. Columns: shadow_name, army_name. Order by army_name then shadow_name.',
        expected: `SELECT s.name AS shadow_name, a.name AS army_name
FROM shadows s
JOIN armies a ON a.army_id = s.army_id
ORDER BY army_name, shadow_name;`,
        xp: 35,
      },
      {
        id: 'q-c-2',
        prompt:
          'For each cleared mission, return mission_id, territory_name, reward_mana. Order by reward_mana desc, then mission_id. Limit 10.',
        expected: `SELECT m.mission_id, t.name AS territory_name, m.reward_mana
FROM missions m
JOIN territories t ON t.territory_id = m.territory_id
WHERE m.status = 'cleared'
ORDER BY m.reward_mana DESC, m.mission_id
LIMIT 10;`,
        xp: 45,
      },
      {
        id: 'q-c-3',
        prompt:
          'Total damage dealt PER SHADOW across all missions. Return shadow_name, total_damage. Top 10 by total_damage desc, then name.',
        hints: ['Join shadows to mission_participants on shadow_id, then GROUP BY.'],
        expected: `SELECT s.name AS shadow_name, SUM(mp.damage_dealt) AS total_damage
FROM shadows s
JOIN mission_participants mp ON mp.shadow_id = s.shadow_id
GROUP BY s.shadow_id, s.name
ORDER BY total_damage DESC, shadow_name
LIMIT 10;`,
        xp: 60,
      },
    ],
    theory: [
      {
        id: 't-c-1',
        q: 'Inner join vs WHERE clause join — are they the same?',
        a:
          'For inner joins yes, the optimizer treats `FROM a, b WHERE a.k = b.k` and `FROM a JOIN b ON a.k = b.k` identically. Modern style strongly prefers explicit JOIN syntax: it separates join logic (ON) from row filtering (WHERE), supports outer joins (which the comma syntax cannot express), and is unambiguous to read.',
      },
    ],
  },
  {
    id: 'outer-joins',
    tier: 'C',
    title: 'LEFT, RIGHT, FULL OUTER JOIN',
    intro:
      'OUTER joins keep unmatched rows from one or both sides, filling missing columns with NULL. LEFT keeps everything on the left; RIGHT (rare in practice) keeps the right; FULL OUTER keeps both sides. SQLite supports LEFT and (since 3.39) FULL OUTER and RIGHT.',
    syntax: `FROM a LEFT  JOIN b ON a.k = b.k
FROM a RIGHT JOIN b ON a.k = b.k
FROM a FULL  OUTER JOIN b ON a.k = b.k`,
    examples: [
      {
        prompt: 'All hunters, with guild name if any (NULL otherwise).',
        query: `SELECT h.name, g.name AS guild
FROM hunters h
LEFT JOIN guilds g ON g.guild_id = h.guild_id
ORDER BY h.name
LIMIT 10;`,
      },
      {
        prompt: 'Anti-join: hunters who own NO inventory items at all.',
        query: `SELECT h.name
FROM hunters h
LEFT JOIN hunter_inventory hi ON hi.hunter_id = h.hunter_id
WHERE hi.hunter_id IS NULL
ORDER BY h.name;`,
        takeaway: 'LEFT JOIN + WHERE right-side IS NULL is the canonical anti-join pattern.',
      },
    ],
    pitfalls: [
      'Putting a filter on the RIGHT table in WHERE turns LEFT JOIN back into INNER JOIN. Move the filter into the ON clause to preserve unmatched left rows.',
      'COUNT(b.col) in a LEFT JOIN aggregates ignores NULLs — useful, but COUNT(*) would inflate by 1 for unmatched rows.',
    ],
    quests: [
      {
        id: 'q-c-4',
        prompt:
          'List ALL shadows with their army name (or NULL if unaffiliated). Columns shadow_name, army_name. Order by shadow_name.',
        expected: `SELECT s.name AS shadow_name, a.name AS army_name
FROM shadows s
LEFT JOIN armies a ON a.army_id = s.army_id
ORDER BY shadow_name;`,
        xp: 40,
      },
      {
        id: 'q-c-5',
        prompt:
          'Return shadows that have NEVER appeared in mission_participants. Columns shadow_id, name. Order by name.',
        hints: ['LEFT JOIN mission_participants and filter where right side IS NULL.'],
        expected: `SELECT s.shadow_id, s.name
FROM shadows s
LEFT JOIN mission_participants mp ON mp.shadow_id = s.shadow_id
WHERE mp.shadow_id IS NULL
ORDER BY s.name;`,
        xp: 50,
      },
      {
        id: 'q-c-6',
        prompt:
          'For each army, return army_id, name, and roster (count of shadows). Include armies with zero shadows. Order by roster desc, name.',
        hints: [
          'LEFT JOIN armies to shadows. COUNT(s.shadow_id) — not COUNT(*) — to get 0 for empty armies.',
        ],
        expected: `SELECT a.army_id, a.name, COUNT(s.shadow_id) AS roster
FROM armies a
LEFT JOIN shadows s ON s.army_id = a.army_id
GROUP BY a.army_id, a.name
ORDER BY roster DESC, a.name;`,
        xp: 55,
      },
    ],
  },
  {
    id: 'self-join',
    tier: 'C',
    title: 'Self-joins',
    intro:
      'A table joined to itself, with two aliases. Common for hierarchical data (manager-employee), pairs (find duplicate-ish rows, "who shares an attribute"), and adjacency relationships.',
    syntax: `FROM t a JOIN t b ON a.parent_id = b.id
FROM t a JOIN t b ON a.x = b.x AND a.id < b.id   -- pairs without dupes`,
    examples: [
      {
        prompt: 'Hunter + their mentor name.',
        query: `SELECT h.name AS hunter, m.name AS mentor
FROM hunters h
JOIN hunter_mentors hm ON hm.hunter_id = h.hunter_id
LEFT JOIN hunters m ON m.hunter_id = hm.mentor_id
ORDER BY mentor, hunter
LIMIT 10;`,
      },
      {
        prompt: 'Pairs of hunters in the SAME guild and SAME class — without (a,b) and (b,a) duplicates.',
        query: `SELECT a.name AS hunter_a, b.name AS hunter_b, a.class, a.guild_id
FROM hunters a
JOIN hunters b
  ON a.guild_id = b.guild_id
 AND a.class    = b.class
 AND a.hunter_id < b.hunter_id
ORDER BY a.guild_id, a.class
LIMIT 10;`,
        takeaway:
          'a.id < b.id is the trick that yields each unordered pair exactly once.',
      },
    ],
    quests: [
      {
        id: 'q-c-7',
        prompt:
          'For each shadow, return shadow_name and sire_name (the shadow that summoned it, via shadow_lineage). NULL when no sire. Order by shadow_name. Limit 10.',
        expected: `SELECT s.name AS shadow_name, p.name AS sire_name
FROM shadows s
LEFT JOIN shadow_lineage sl ON sl.shadow_id = s.shadow_id
LEFT JOIN shadows p ON p.shadow_id = sl.sire_id
ORDER BY shadow_name
LIMIT 10;`,
        xp: 50,
      },
      {
        id: 'q-c-8',
        prompt:
          'Find pairs of shadows in the SAME army with the SAME class. Return shadow_a, shadow_b, class, army_id with shadow_a name < shadow_b name (lexicographic). Order by army_id, class, shadow_a.',
        hints: ['Self-join shadows on army_id and class, with a.name < b.name to avoid dupes and self-pairs.'],
        expected: `SELECT a.name AS shadow_a, b.name AS shadow_b, a.class, a.army_id
FROM shadows a
JOIN shadows b
  ON a.army_id = b.army_id
 AND a.class = b.class
 AND a.name < b.name
WHERE a.army_id IS NOT NULL
ORDER BY a.army_id, a.class, shadow_a;`,
        xp: 65,
      },
    ],
  },
  {
    id: 'cross-join',
    tier: 'C',
    title: 'CROSS JOIN, Cartesian products, calendar tables',
    intro:
      'CROSS JOIN returns the Cartesian product. Almost always a bug when accidental — but deliberately useful to generate every (entity × bucket) combination, e.g. plotting daily activity even on days with zero events.',
    syntax: `FROM a CROSS JOIN b   -- |a| * |b| rows`,
    examples: [
      {
        prompt:
          'Generate a (rank × class) grid with the count of hunters in each cell, including 0s.',
        query: `WITH ranks(rank) AS (SELECT DISTINCT rank FROM hunters),
     classes(class) AS (SELECT DISTINCT class FROM hunters)
SELECT r.rank, c.class, COUNT(h.hunter_id) AS cnt
FROM ranks r
CROSS JOIN classes c
LEFT JOIN hunters h ON h.rank = r.rank AND h.class = c.class
GROUP BY r.rank, c.class
ORDER BY r.rank, c.class;`,
      },
    ],
    quests: [
      {
        id: 'q-c-9',
        prompt:
          'For every combination of army_id (from armies) and class (distinct values from shadows), return army_id, class, and the count of shadows in that bucket — including zero. Order by army_id, class.',
        expected: `WITH classes(class) AS (SELECT DISTINCT class FROM shadows)
SELECT a.army_id, c.class, COUNT(s.shadow_id) AS cnt
FROM armies a
CROSS JOIN classes c
LEFT JOIN shadows s ON s.army_id = a.army_id AND s.class = c.class
GROUP BY a.army_id, c.class
ORDER BY a.army_id, c.class;`,
        xp: 70,
      },
    ],
  },
];
