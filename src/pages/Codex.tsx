import { Link } from 'react-router-dom';
import { ALL_CONCEPTS } from '../content';
import { TIER_ORDER } from '../content/types';
import { loadProgress } from '../lib/progress';

export function Codex() {
  const p = loadProgress();
  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="hud-title">Quest Codex</div>
        <div className="text-sm text-slate-300 mt-1">
          All concepts, organized by tier. Each concept ships with worked examples on the Hunter Guild dataset and quests on the Shadow Army dataset.
        </div>
      </div>
      {TIER_ORDER.map((tier) => {
        const concepts = ALL_CONCEPTS.filter((c) => c.tier === tier);
        if (!concepts.length) return null;
        return (
          <section key={tier} className="panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className={`tag rank-${tier === 'National' ? 'N' : tier}`}>{tier}-rank</span>
              <div className="hud-title">{tierLabel(tier)}</div>
            </div>
            <ul className="grid md:grid-cols-2 gap-2">
              {concepts.map((c) => {
                const cleared = c.quests.filter((q) => p.clearedQuests[q.id]).length;
                const theoryDone = (c.theory ?? []).filter((t) => p.theoryCleared[t.id]).length;
                return (
                  <li key={c.id} className="border border-white/10 rounded px-3 py-2 hover:bg-white/5">
                    <Link to={`/concept/${c.id}`} className="block">
                      <div className="text-slate-100 text-sm">{c.title}</div>
                      <div className="text-[11px] text-slate-400 mt-1 truncate">{c.intro.slice(0, 110)}…</div>
                      <div className="flex gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Quests: <span className="text-accent">{cleared}/{c.quests.length}</span></span>
                        {!!(c.theory?.length) && <span>Theory: <span className="text-accent">{theoryDone}/{c.theory.length}</span></span>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function tierLabel(t: string) {
  switch (t) {
    case 'E': return 'E-rank · Awakening (basics)';
    case 'D': return 'D-rank · Aggregation & expressions';
    case 'C': return 'C-rank · Joins';
    case 'B': return 'B-rank · Subqueries & set operations';
    case 'A': return 'A-rank · CTEs & window functions';
    case 'S': return 'S-rank · Advanced patterns';
    case 'National': return 'National-level · Theory & interview classics';
    default: return t;
  }
}
