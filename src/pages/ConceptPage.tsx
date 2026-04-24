import { Link, useParams } from 'react-router-dom';
import { ALL_CONCEPTS, getConcept } from '../content';
import { SqlRunner } from '../components/SqlRunner';
import { QuestRunner } from '../components/QuestRunner';
import { useState } from 'react';
import { loadProgress, toggleTheory } from '../lib/progress';
import { learningSchemaDoc, practiceSchemaDoc } from '../data/schema';

export function ConceptPage() {
  const { id = '' } = useParams();
  const c = getConcept(id);
  const [, force] = useState(0);

  if (!c) return <div className="panel p-6">Unknown concept. <Link to="/concepts" className="text-accent">Back to codex</Link>.</div>;

  const idx = ALL_CONCEPTS.findIndex((x) => x.id === c.id);
  const prev = idx > 0 ? ALL_CONCEPTS[idx - 1] : null;
  const next = idx < ALL_CONCEPTS.length - 1 ? ALL_CONCEPTS[idx + 1] : null;
  const p = loadProgress();

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="flex items-center gap-2">
          <span className={`tag rank-${c.tier === 'National' ? 'N' : c.tier}`}>{c.tier}-rank</span>
          <h1 className="text-xl text-slate-100">{c.title}</h1>
          <Link to="/concepts" className="ml-auto text-xs text-accent">Codex</Link>
        </div>
        <p className="text-sm text-slate-300 mt-3 whitespace-pre-line">{c.intro}</p>
        {c.syntax && (
          <pre className="mt-3 text-xs bg-black/40 border border-white/10 rounded p-3 font-mono whitespace-pre-wrap">{c.syntax}</pre>
        )}
        {!!c.pitfalls?.length && (
          <div className="mt-3">
            <div className="hud-title">Pitfalls</div>
            <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1 mt-1">
              {c.pitfalls.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}
        {!!c.realWorld?.length && (
          <div className="mt-3">
            <div className="hud-title">Real-world uses</div>
            <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1 mt-1">
              {c.realWorld.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>

      {!!c.examples.length && (
        <section className="panel p-5">
          <div className="hud-title">Worked examples — Hunter Guild</div>
          <details className="mt-2 text-xs text-slate-400">
            <summary className="cursor-pointer text-slate-300">Show schema</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono">{learningSchemaDoc}</pre>
          </details>
          <div className="mt-4 space-y-6">
            {c.examples.map((ex, i) => (
              <div key={i} className="space-y-2">
                <div className="text-sm text-slate-200">{i + 1}. {ex.prompt}</div>
                <SqlRunner kind="learning" initialSql={ex.query} height="160px" />
                {ex.takeaway && (
                  <div className="text-xs text-accent2 bg-accent2/10 border border-accent2/30 rounded p-2">
                    Takeaway: {ex.takeaway}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!!c.quests.length && (
        <section className="panel p-5">
          <div className="hud-title">Quests — Shadow Army</div>
          <details className="mt-2 text-xs text-slate-400">
            <summary className="cursor-pointer text-slate-300">Show schema</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono">{practiceSchemaDoc}</pre>
          </details>
          <div className="mt-4 space-y-6">
            {c.quests.map((q, i) => (
              <div key={q.id} className="border-t border-white/10 pt-4">
                <div className="hud-title mb-2">Quest {i + 1} · {q.id}</div>
                <QuestRunner quest={q} onCleared={() => force((n) => n + 1)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!!c.theory?.length && (
        <section className="panel p-5">
          <div className="hud-title">Theory cards</div>
          <div className="mt-3 space-y-3">
            {c.theory.map((t) => {
              const done = !!p.theoryCleared[t.id];
              return (
                <div key={t.id} className="border border-white/10 rounded p-3">
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-slate-100 font-medium">{t.q}</div>
                    <button
                      className={`ml-auto btn ${done ? 'primary' : ''}`}
                      onClick={() => { toggleTheory(t.id); force((n) => n + 1); }}
                    >
                      {done ? 'Mastered (+20 XP)' : 'Mark mastered'}
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 mt-2 whitespace-pre-line">{t.a}</p>
                  {!!t.followUps?.length && (
                    <div className="mt-2 text-xs text-slate-400">
                      Follow-ups: {t.followUps.join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex justify-between">
        {prev ? <Link to={`/concept/${prev.id}`} className="btn">← {prev.title}</Link> : <span/>}
        {next ? <Link to={`/concept/${next.id}`} className="btn primary">{next.title} →</Link> : <span/>}
      </div>
    </div>
  );
}
