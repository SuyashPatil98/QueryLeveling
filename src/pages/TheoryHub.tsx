import { useState } from 'react';
import { ALL_CONCEPTS } from '../content';
import { loadProgress, toggleTheory } from '../lib/progress';
import { Link } from 'react-router-dom';

export function TheoryHub() {
  const [, force] = useState(0);
  const p = loadProgress();
  const cards = ALL_CONCEPTS.flatMap((c) =>
    (c.theory ?? []).map((t) => ({ tier: c.tier, conceptId: c.id, conceptTitle: c.title, ...t })),
  );
  const done = cards.filter((c) => p.theoryCleared[c.id]).length;

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="hud-title">Theory Cards</div>
        <div className="text-sm text-slate-300 mt-1">
          {cards.length} senior-interview theory questions across all tiers. Mark each one mastered when you can answer it cleanly out loud.
        </div>
        <div className="mt-3 xp-bar"><div style={{ width: `${(done/Math.max(1,cards.length)*100).toFixed(0)}%` }} /></div>
        <div className="text-xs text-slate-400 mt-1">{done} / {cards.length} mastered</div>
      </div>
      <div className="space-y-3">
        {cards.map((c) => {
          const isDone = !!p.theoryCleared[c.id];
          return (
            <div key={c.id} className="panel p-4">
              <div className="flex items-center gap-2">
                <span className={`tag rank-${c.tier === 'National' ? 'N' : c.tier}`}>{c.tier}</span>
                <Link to={`/concept/${c.conceptId}`} className="text-xs text-accent hover:underline">{c.conceptTitle}</Link>
                <button
                  className={`ml-auto btn ${isDone ? 'primary' : ''}`}
                  onClick={() => { toggleTheory(c.id); force((n) => n + 1); }}
                >
                  {isDone ? 'Mastered (+20 XP)' : 'Mark mastered'}
                </button>
              </div>
              <div className="text-sm text-slate-100 mt-2 font-medium">{c.q}</div>
              <p className="text-sm text-slate-300 mt-2 whitespace-pre-line">{c.a}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
