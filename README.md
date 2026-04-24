# THE SYSTEM · Solo Leveling SQL

A Solo-Leveling-themed senior SQL interview prep app. Two SQLite datasets (Hunter Guild for learning, Shadow Army for practice), 36+ concepts from E-rank basics to National-level interview classics, a built-in editor, automatic answer checking, and progress tracking.

## Run it

```bash
cd C:/Projects/SoloLeveling
npm install
npm run dev
```

Open http://localhost:5173

## What's inside

- **Dashboard** — your rank, level, XP, per-tier progress.
- **Quest Codex** — concepts grouped by tier (E → National).
- **Concept page** — intro + worked examples on the Hunter Guild dataset, then practice quests on the Shadow Army dataset with auto-grading.
- **Free Sandbox** — run any SQL against either dataset.
- **Theory Cards** — senior-interview theory questions with model answers.

## Tiers

| Tier | Theme |
| --- | --- |
| E | SELECT, WHERE, ORDER BY, LIMIT, DISTINCT, operators |
| D | Aggregates, GROUP BY/HAVING, CASE, NULL handling, strings, dates |
| C | INNER, OUTER, self, cross joins |
| B | Subqueries, EXISTS / NOT EXISTS, set ops |
| A | CTEs, recursive CTEs, window functions (ranking, agg, lag/lead, frames) |
| S | Running totals, top-N per group, gaps & islands, sessionization, cohort retention, percentiles, pivot, dedup |
| National | Query optimization, normalization & ACID, OLAP/star/SCD, FAANG interview classics |

## Datasets

- **Hunter Guild (learning)** — `hunters`, `guilds`, `dungeons`, `raids`, `raid_participants`, `items`, `hunter_inventory`, `skills`, `hunter_skills`, `gold_transactions`, `hunter_mentors`.
- **Shadow Army (practice)** — `shadows`, `armies`, `territories`, `missions`, `mission_participants`, `artifacts`, `shadow_arsenal`, `abilities`, `shadow_abilities`, `mana_transactions`, `shadow_lineage`.

Same shape, different names — so you can't memorize a learning solution and paste it into the practice quest.

## Progress

All progress is stored in your browser's localStorage. Reset from the Dashboard.
