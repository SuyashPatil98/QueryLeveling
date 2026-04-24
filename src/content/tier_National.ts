import type { Concept } from './types';

export const tierNational: Concept[] = [
  {
    id: 'query-optimization',
    tier: 'National',
    title: 'Query optimization & EXPLAIN',
    intro:
      'A fast query reads few rows and avoids unnecessary work (sort, hash, materialize). EXPLAIN (or EXPLAIN QUERY PLAN in SQLite) shows what the engine will do. Senior interviewers expect you to read a plan, identify the bottleneck, and propose a fix (index, rewrite, denormalize, materialize).',
    examples: [
      {
        prompt: 'EXPLAIN QUERY PLAN on a join — see whether SQLite uses a SCAN or SEARCH.',
        query: `EXPLAIN QUERY PLAN
SELECT h.name, g.name FROM hunters h JOIN guilds g USING(guild_id) WHERE h.rank='S';`,
      },
      {
        prompt: 'Same query but with an explicit index — note the SEARCH vs SCAN change in the plan.',
        query: `CREATE INDEX IF NOT EXISTS ix_hunters_rank ON hunters(rank);
EXPLAIN QUERY PLAN
SELECT h.name, g.name FROM hunters h JOIN guilds g USING(guild_id) WHERE h.rank='S';`,
      },
    ],
    quests: [
      {
        id: 'q-n-1',
        prompt:
          'Run EXPLAIN QUERY PLAN for: SELECT * FROM mission_participants WHERE shadow_id = 1. Submit your query verbatim — the grader just compares to a known plan-ish output. (Trick: just match the expected SQL.)',
        expected: `EXPLAIN QUERY PLAN SELECT * FROM mission_participants WHERE shadow_id = 1;`,
        check: { columnOrderInsensitive: true, orderInsensitive: true },
        xp: 60,
      },
    ],
    theory: [
      {
        id: 't-n-1',
        q: 'A query is slow. Walk me through your debugging.',
        a:
          '1) Reproduce on a representative dataset. 2) Run EXPLAIN — identify full table scans, big sorts, nested loops on huge tables, missing index hints. 3) Check stats freshness (ANALYZE). 4) Look at predicates: are they sargable (column = value, not func(column) = value)? 5) Are joins on the right keys with the right cardinalities? 6) Could a covering index eliminate a heap lookup? 7) For aggregate queries: pre-aggregate via materialized view or summary table. 8) For repeated patterns: denormalize, partition, or move to columnar (Parquet/ClickHouse). Always measure before/after with realistic data volume.',
      },
      {
        id: 't-n-2',
        q: 'B-tree vs Hash vs Bitmap indexes — when to use each?',
        a:
          'B-tree: default. Range queries, equality, ORDER BY, prefix LIKE. Most engines use this for primary indexes. Hash: equality only, very fast point lookups, no range or sort support (Postgres has it; rarely chosen). Bitmap: low-cardinality columns (gender, status flags), great for analytical AND/OR over many flags — common in OLAP / DW (Oracle, BigQuery internals). Wrong choice = scans where you wanted seeks.',
      },
      {
        id: 't-n-3',
        q: 'What is a covering index?',
        a:
          'An index that contains every column the query needs (in WHERE, JOIN, SELECT), so the engine can answer the query from the index alone — no heap (table) lookup. Created either by adding INCLUDE columns (Postgres, SQL Server) or by widening the key. Trade-off: bigger index, slower writes.',
      },
      {
        id: 't-n-4',
        q: 'When does an index NOT help?',
        a:
          '(a) The predicate is non-sargable (e.g. WHERE LOWER(col) = ...). (b) Selectivity is poor (>~10% of rows match — engine prefers a sequential scan). (c) The query is bounded by IO/sort, not lookup (e.g. GROUP BY everything). (d) The optimizer has stale stats. (e) Multi-column index used in wrong key order. (f) Function-based index needed but missing.',
      },
    ],
  },
  {
    id: 'normalization-acid',
    tier: 'National',
    title: 'Normalization & ACID',
    intro:
      'OLTP databases lean on normal forms to eliminate update anomalies. ACID describes transactional guarantees. Both come up constantly in DE / SWE interviews — be able to define them crisply and explain trade-offs.',
    examples: [],
    quests: [],
    theory: [
      {
        id: 't-n-5',
        q: 'Define 1NF, 2NF, 3NF, BCNF in one breath each.',
        a:
          '1NF: atomic columns, no repeating groups (no comma-separated lists in a single column). 2NF: 1NF + every non-key column depends on the WHOLE primary key (matters for composite keys). 3NF: 2NF + no transitive dependencies (a non-key column depends only on the key, not on other non-key columns). BCNF: 3NF + every functional dependency’s left side is a superkey (handles edge cases 3NF allows).',
      },
      {
        id: 't-n-6',
        q: 'Why might you intentionally denormalize?',
        a:
          'Read-heavy systems: joining 6 tables per page-load is expensive. Denormalize when (a) the read pattern is fixed and well-known, (b) write amplification is acceptable, (c) the staleness window is tolerable, (d) joins dominate response time. Common in OLAP/star schemas, materialized views, search indexes, and cache layers. Always document the source-of-truth column to avoid divergent updates.',
      },
      {
        id: 't-n-7',
        q: 'ACID — define each letter and what isolation guarantees buy you.',
        a:
          'Atomicity: all-or-nothing. Consistency: transitions move the DB from one valid state to another (constraints hold). Isolation: concurrent transactions appear serial (level varies). Durability: committed data survives crash. Isolation levels (weakest → strongest): READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ → SERIALIZABLE. Each step removes a class of anomalies (dirty reads, non-repeatable reads, phantoms, write skew). Higher isolation = more locking/MVCC overhead.',
      },
      {
        id: 't-n-8',
        q: 'Explain phantom read and which isolation level prevents it.',
        a:
          'A phantom read: in transaction T1 you run SELECT count(*) WHERE x>10 → 5; T2 inserts a new matching row and commits; T1 reruns the same SELECT → 6. The PREDICATE result changed even though no row T1 had read changed. REPEATABLE READ prevents non-repeatable reads but in standard SQL still allows phantoms; only SERIALIZABLE prevents them. Postgres’s SERIALIZABLE uses SSI (serializable snapshot isolation).',
      },
    ],
  },
  {
    id: 'olap-modeling',
    tier: 'National',
    title: 'OLTP vs OLAP, star/snowflake, SCD',
    intro:
      'Senior DE interviews always probe modeling. Know when to choose row-store vs column-store, the shape of a Kimball star schema, and how to handle slowly-changing dimensions.',
    examples: [],
    quests: [],
    theory: [
      {
        id: 't-n-9',
        q: 'OLTP vs OLAP — quick comparison.',
        a:
          'OLTP (Postgres, MySQL): row-store, normalized, indexed for point lookups, transactional, low-latency single-row reads/writes. OLAP (Snowflake, BigQuery, Redshift, ClickHouse): column-store, denormalized (star/snowflake), tuned for full-column scans across billions of rows, batch/append workloads, columnar compression, vectorized execution. You ETL/ELT data from OLTP into OLAP for analytics.',
      },
      {
        id: 't-n-10',
        q: 'Star vs snowflake schema.',
        a:
          'Star: one fact table in the middle, dimension tables hanging off it (denormalized — dim tables hold ALL their attributes flat). Fewer joins per query, simpler analyst experience. Snowflake: dimensions are normalized into multiple linked tables (e.g. product → category → department). Smaller storage, more joins. Star is the default for analytics; snowflake when dim cardinality and update patterns demand it.',
      },
      {
        id: 't-n-11',
        q: 'Slowly Changing Dimensions: types 1, 2, 3.',
        a:
          'Type 1: overwrite — no history, just the latest value. Type 2: append a new row with effective_from / effective_to (and is_current flag); historical facts join to the version live at that time. Type 3: keep a "previous" column alongside the current one — only one prior value preserved. Type 2 is by far the most common; it costs storage but preserves perfect point-in-time joins.',
      },
      {
        id: 't-n-12',
        q: 'Fact table grain — what does it mean and why does it matter?',
        a:
          'Grain = what one row in the fact table represents. "One row per order line item per day" is different from "one row per order." Choosing too coarse a grain loses analytical flexibility; too fine wastes storage. Decide grain BEFORE columns. Mixed grains in one table (a daily summary row alongside per-event rows) almost always lead to double-counting bugs.',
      },
      {
        id: 't-n-13',
        q: 'Partitioning vs sharding.',
        a:
          'Partitioning: splitting one table inside ONE database into chunks (by date, range, hash) for query pruning and lifecycle management — the engine still sees one table. Sharding: splitting one logical dataset across MANY databases/nodes — the application or routing layer must route reads/writes. Partitioning helps with scan cost and old-data management; sharding helps with write/storage scale. They compose: a sharded DB with each shard partitioned by month.',
      },
    ],
  },
  {
    id: 'interview-classics',
    tier: 'National',
    title: 'Interview classics (FAANG-flavored)',
    intro:
      'A grab-bag of patterns that appear over and over in senior interviews. If you can build any of these from scratch in 5 minutes, you\'re combat-ready.',
    examples: [
      {
        prompt: 'Nth highest salary — generalize with DENSE_RANK().',
        query: `WITH r AS (
  SELECT name, level, DENSE_RANK() OVER (ORDER BY level DESC) AS dr
  FROM hunters
)
SELECT name, level FROM r WHERE dr = 3 ORDER BY name;`,
      },
      {
        prompt:
          'Consecutive logins — Nth-day retention via self-join (D+1 retention here).',
        query: `WITH days AS (
  SELECT DISTINCT hunter_id, DATE(occurred_at) AS d FROM gold_transactions
)
SELECT a.hunter_id, a.d AS first_day
FROM days a JOIN days b
  ON a.hunter_id = b.hunter_id
 AND DATE(a.d, '+1 day') = b.d
ORDER BY a.hunter_id, first_day LIMIT 10;`,
      },
    ],
    quests: [
      {
        id: 'q-n-2',
        prompt:
          '3rd highest level among shadows (use DENSE_RANK so ties share the same rank). Return all shadows tied at dense_rank=3. Columns name, level. Order by name.',
        expected: `WITH r AS (
  SELECT name, level, DENSE_RANK() OVER (ORDER BY level DESC) AS dr FROM shadows
)
SELECT name, level FROM r WHERE dr = 3 ORDER BY name;`,
        xp: 100,
      },
      {
        id: 'q-n-3',
        prompt:
          'Find shadows that were active on TWO consecutive calendar days at any point. Columns shadow_id, first_day. Use mana_transactions.occurred_at as activity. Order by shadow_id, first_day. Limit 15.',
        expected: `WITH days AS (
  SELECT DISTINCT shadow_id, DATE(occurred_at) AS d FROM mana_transactions
)
SELECT a.shadow_id, a.d AS first_day
FROM days a
JOIN days b
  ON a.shadow_id = b.shadow_id
 AND DATE(a.d, '+1 day') = b.d
ORDER BY a.shadow_id, first_day
LIMIT 15;`,
        xp: 130,
      },
      {
        id: 'q-n-4',
        prompt:
          'Per-month new shadow activations on mana_transactions: month = strftime("%Y-%m", first occurrence per shadow). Return month, new_shadows. Order by month.',
        expected: `WITH first_evt AS (
  SELECT shadow_id, MIN(occurred_at) AS first_at FROM mana_transactions GROUP BY shadow_id
)
SELECT strftime('%Y-%m', first_at) AS month, COUNT(*) AS new_shadows
FROM first_evt
GROUP BY strftime('%Y-%m', first_at)
ORDER BY month;`,
        xp: 110,
      },
      {
        id: 'q-n-5',
        prompt:
          'Compute longest streak of consecutive cleared mission_ids across the entire table (ignore army). Single column streak (an integer).',
        hints: ['Gaps and islands without partition; take MAX(run_len).'],
        expected: `WITH base AS (
  SELECT mission_id,
    mission_id - ROW_NUMBER() OVER (ORDER BY mission_id) AS grp
  FROM missions WHERE status='cleared'
),
runs AS (
  SELECT grp, COUNT(*) AS run_len FROM base GROUP BY grp
)
SELECT MAX(run_len) AS streak FROM runs;`,
        xp: 130,
      },
    ],
    theory: [
      {
        id: 't-n-14',
        q: '"Find the median order value per customer." How would you do it portably?',
        a:
          'Postgres/Snowflake/BQ: PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount). Engine-portable: per partition, ROW_NUMBER + COUNT, then average rows where rn IN ((n+1)/2, (n+2)/2). For approximations on huge data: APPROX_PERCENTILE / TDIGEST functions (BigQuery, Snowflake, Spark) — much cheaper, acceptable for dashboards.',
      },
      {
        id: 't-n-15',
        q: 'How would you detect duplicate records in a 10-billion-row event table?',
        a:
          'Define "duplicate" precisely: same (event_id) is easy; same (user_id, event_type, ts within 1s) is fuzzy. Then: GROUP BY the dedup keys with HAVING COUNT(*) > 1 — but on a 10B table you partition the work (date partition or hash bucket). For idempotent ingestion, prefer producing event_ids upstream and a UNIQUE constraint at write time. For after-the-fact: incremental dedup with watermarked windows + DISTINCT ON (Postgres) / ROW_NUMBER (everywhere) keeping the canonical row.',
      },
    ],
  },
];
