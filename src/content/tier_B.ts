import type { Concept } from './types';

export const tierB: Concept[] = [
  {
    id: 'subqueries',
    tier: 'B',
    title: 'Subqueries: scalar, derived tables, IN/ANY/ALL',
    intro:
      'A subquery is a SELECT inside another statement. Three flavors: (1) scalar — returns one value, used like a constant; (2) derived table — used in FROM, treated as a temp table; (3) row-level — used with IN, ANY, ALL, or comparison operators.',
    syntax: `-- scalar
SELECT name FROM hunters WHERE level = (SELECT MAX(level) FROM hunters);
-- derived table
SELECT g.name, t.cnt FROM (SELECT guild_id, COUNT(*) cnt FROM hunters GROUP BY guild_id) t JOIN guilds g USING(guild_id);
-- IN
WHERE col IN (SELECT k FROM other);`,
    examples: [
      {
        prompt: 'Hunter(s) with the highest level — scalar subquery.',
        query: `SELECT name, level FROM hunters WHERE level = (SELECT MAX(level) FROM hunters);`,
      },
      {
        prompt: 'Guilds with at least one S-rank hunter.',
        query: `SELECT name FROM guilds WHERE guild_id IN (SELECT guild_id FROM hunters WHERE rank = 'S' AND guild_id IS NOT NULL) ORDER BY name;`,
      },
      {
        prompt: 'Derived-table aggregate then join to enrich.',
        query: `SELECT g.name AS guild, t.roster
FROM   (SELECT guild_id, COUNT(*) AS roster FROM hunters WHERE guild_id IS NOT NULL GROUP BY guild_id) t
JOIN   guilds g ON g.guild_id = t.guild_id
ORDER  BY t.roster DESC;`,
      },
    ],
    pitfalls: [
      "IN with a subquery returning NULLs can yield surprising results — `x NOT IN (subq)` is NULL (= false) for any row when the subq contains NULL. Use NOT EXISTS to be safe.",
      'Scalar subqueries that return >1 row throw at runtime — guard with LIMIT 1 if intent is "any one."',
      'Repeated identical subqueries get re-executed — promote to CTE for clarity and (sometimes) reuse.',
    ],
    quests: [
      {
        id: 'q-b-1',
        prompt:
          "Return shadows whose level equals the maximum level overall. Columns name, level. Order by name.",
        expected: `SELECT name, level FROM shadows WHERE level = (SELECT MAX(level) FROM shadows) ORDER BY name;`,
        xp: 40,
      },
      {
        id: 'q-b-2',
        prompt:
          "Return armies that have at least one S-rank shadow. Columns army_id, name. Order by army_id.",
        hints: ['Subquery with IN.'],
        expected: `SELECT army_id, name FROM armies WHERE army_id IN (SELECT army_id FROM shadows WHERE rank = 'S' AND army_id IS NOT NULL) ORDER BY army_id;`,
        xp: 45,
      },
      {
        id: 'q-b-3',
        prompt:
          'For each army, return army_id, total_damage = sum of damage_dealt by its shadows across all missions. Use a derived table. Order by total_damage desc, army_id asc.',
        expected: `SELECT a.army_id, COALESCE(t.total_damage, 0) AS total_damage
FROM armies a
LEFT JOIN (
  SELECT s.army_id, SUM(mp.damage_dealt) AS total_damage
  FROM mission_participants mp
  JOIN shadows s ON s.shadow_id = mp.shadow_id
  WHERE s.army_id IS NOT NULL
  GROUP BY s.army_id
) t ON t.army_id = a.army_id
ORDER BY total_damage DESC, a.army_id ASC;`,
        xp: 65,
      },
    ],
  },
  {
    id: 'correlated-exists',
    tier: 'B',
    title: 'Correlated subqueries, EXISTS / NOT EXISTS',
    intro:
      'A correlated subquery references the outer row — conceptually re-evaluated per outer row. EXISTS returns true as soon as any matching row is found; cheap when the optimizer can short-circuit. NOT EXISTS is the NULL-safe alternative to NOT IN.',
    syntax: `WHERE EXISTS  (SELECT 1 FROM b WHERE b.k = a.k)
WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.k = a.k)`,
    examples: [
      {
        prompt: 'Hunters who have participated in at least one CLEARED raid.',
        query: `SELECT h.name FROM hunters h
WHERE EXISTS (
  SELECT 1
  FROM raid_participants rp
  JOIN raids r ON r.raid_id = rp.raid_id
  WHERE rp.hunter_id = h.hunter_id AND r.status = 'cleared'
)
ORDER BY h.name LIMIT 10;`,
      },
      {
        prompt: 'Hunters who have NEVER cleared any raid (NOT EXISTS pattern).',
        query: `SELECT h.name FROM hunters h
WHERE NOT EXISTS (
  SELECT 1
  FROM raid_participants rp
  JOIN raids r ON r.raid_id = rp.raid_id
  WHERE rp.hunter_id = h.hunter_id AND r.status = 'cleared'
)
ORDER BY h.name;`,
        takeaway:
          'NOT EXISTS handles NULLs correctly; NOT IN does not when the subquery may return NULL.',
      },
    ],
    pitfalls: [
      'Optimizers usually rewrite EXISTS into a semi-join — performance is generally great. NOT IN is the dangerous one.',
      'Correlated subqueries CAN be slow if the optimizer fails to rewrite them — check the plan if pulling huge tables.',
    ],
    quests: [
      {
        id: 'q-b-4',
        prompt:
          'Return shadows that have at least one cleared mission to their name. Columns shadow_id, name. Order by name.',
        expected: `SELECT s.shadow_id, s.name
FROM shadows s
WHERE EXISTS (
  SELECT 1 FROM mission_participants mp
  JOIN missions m ON m.mission_id = mp.mission_id
  WHERE mp.shadow_id = s.shadow_id AND m.status = 'cleared'
)
ORDER BY s.name;`,
        xp: 55,
      },
      {
        id: 'q-b-5',
        prompt:
          'Return shadows that have NEVER participated in a FAILED mission. Use NOT EXISTS. Columns shadow_id, name. Order by name. Limit 15.',
        expected: `SELECT s.shadow_id, s.name
FROM shadows s
WHERE NOT EXISTS (
  SELECT 1 FROM mission_participants mp
  JOIN missions m ON m.mission_id = mp.mission_id
  WHERE mp.shadow_id = s.shadow_id AND m.status = 'failed'
)
ORDER BY s.name LIMIT 15;`,
        xp: 60,
      },
    ],
    theory: [
      {
        id: 't-b-1',
        q: 'NOT IN vs NOT EXISTS — when do they diverge?',
        a:
          'When the subquery can return NULL. `x NOT IN (NULL, 1, 2)` is `x <> NULL AND x <> 1 AND x <> 2`. The first comparison is NULL; AND with NULL is NULL → row excluded. So an unexpected NULL in the subquery silently empties your result. NOT EXISTS is row-by-row boolean: a non-matching row is just absent from the inner result, NULLs included. Always reach for NOT EXISTS unless you have a hard guarantee the subquery is NULL-free.',
      },
    ],
  },
  {
    id: 'set-operations',
    tier: 'B',
    title: 'UNION, UNION ALL, INTERSECT, EXCEPT',
    intro:
      'Vertical combinators. UNION removes duplicates (extra sort/hash step). UNION ALL keeps every row and is faster — use it whenever you know there are no dupes (or you want them). INTERSECT keeps rows present in both; EXCEPT keeps rows in the first but not the second. All require matching column counts and compatible types.',
    syntax: `SELECT ... UNION     SELECT ...   -- distinct
SELECT ... UNION ALL SELECT ...   -- keep dupes
SELECT ... INTERSECT SELECT ...
SELECT ... EXCEPT    SELECT ...`,
    examples: [
      {
        prompt:
          'All distinct names that appear as either hunters or guild masters (just to show vertical combine).',
        query: `SELECT name FROM hunters
UNION
SELECT h.name FROM guilds g JOIN hunters h ON h.hunter_id = g.master_id
ORDER BY name LIMIT 15;`,
      },
      {
        prompt:
          'Hunter classes that exist as both DPS and non-DPS roles among raid_participants.',
        query: `SELECT DISTINCT h.class FROM hunters h JOIN raid_participants rp ON rp.hunter_id = h.hunter_id WHERE rp.role = 'DPS'
INTERSECT
SELECT DISTINCT h.class FROM hunters h JOIN raid_participants rp ON rp.hunter_id = h.hunter_id WHERE rp.role <> 'DPS'
ORDER BY class;`,
      },
    ],
    pitfalls: [
      "Default UNION is SLOW vs UNION ALL — always think 'do I really need de-dup?'.",
      'ORDER BY at the end applies to the COMBINED result — wrap in subqueries for per-leg ordering.',
      'Column types must align — pad with NULL or CAST if necessary.',
    ],
    quests: [
      {
        id: 'q-b-6',
        prompt:
          'Combine two lists into one DISTINCT result: shadows of class Mage AND shadows of class Healer. Return name, class. Order by class then name.',
        hints: ['UNION (not UNION ALL) for DISTINCT.'],
        expected: `SELECT name, class FROM shadows WHERE class = 'Mage'
UNION
SELECT name, class FROM shadows WHERE class = 'Healer'
ORDER BY class, name;`,
        xp: 45,
      },
      {
        id: 'q-b-7',
        prompt:
          'Find shadow names that appear in both armies 1 AND 2 (impossible by data design — but show the pattern). Use INTERSECT. Return one column "name" alphabetical.',
        expected: `SELECT name FROM shadows WHERE army_id = 1
INTERSECT
SELECT name FROM shadows WHERE army_id = 2
ORDER BY name;`,
        xp: 40,
      },
      {
        id: 'q-b-8',
        prompt:
          'Find classes that have at least one S-rank shadow but NO A-rank shadow. Use EXCEPT. Single column "class", alphabetical.',
        expected: `SELECT DISTINCT class FROM shadows WHERE rank = 'S'
EXCEPT
SELECT DISTINCT class FROM shadows WHERE rank = 'A'
ORDER BY class;`,
        xp: 55,
      },
    ],
  },
];
