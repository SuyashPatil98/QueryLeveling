import { Link } from 'react-router-dom';
import { ALL_CONCEPTS, totalQuests, totalTheory, totalXpAvailable } from '../content';
import { TIER_ORDER, type Tier } from '../content/types';
import { loadProgress, rankFromXp, levelFromXp, resetProgress } from '../lib/progress';

export function Dashboard() {
  const p = loadProgress();
  const cleared = Object.keys(p.clearedQuests).length;
  const totalQ = totalQuests();
  const theoryDone = Object.keys(p.theoryCleared).length;
  const totalT = totalTheory();
  const xpCap = totalXpAvailable();
  const { current, next, progress } = rankFromXp(p.xp);
  const level = levelFromXp(p.xp);

  // Per-tier progress
  const tierStats: Record<Tier, { quests: number; cleared: number; concepts: number }> = {} as any;
  for (const t of TIER_ORDER) tierStats[t] = { quests: 0, cleared: 0, concepts: 0 };
  for (const c of ALL_CONCEPTS) {
    tierStats[c.tier].concepts += 1;
    for (const q of c.quests) {
      tierStats[c.tier].quests += 1;
      if (p.clearedQuests[q.id]) tierStats[c.tier].cleared += 1;
    }
  }

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <div className="hud-title">Status Window</div>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Rank" value={current.rank} sub={next ? `${next.min - p.xp} XP to ${next.rank}` : 'MAX'} />
          <Stat label="Level" value={String(level)} sub={`${p.xp} / ${xpCap} XP cap`} />
          <Stat label="Quests" value={`${cleared} / ${totalQ}`} sub={`${((cleared / Math.max(1,totalQ)) * 100).toFixed(0)}%`} />
          <Stat label="Theory" value={`${theoryDone} / ${totalT}`} sub={`${((theoryDone / Math.max(1,totalT)) * 100).toFixed(0)}%`} />
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{current.rank} → {next ? next.rank : 'MAX'}</span><span>{(progress*100).toFixed(0)}%</span></div>
          <div className="xp-bar"><div style={{ width: `${(progress*100).toFixed(0)}%` }} /></div>
        </div>
      </section>

      <section className="panel p-5">
        <div className="hud-title mb-3">Tier progress</div>
        <div className="grid md:grid-cols-2 gap-3">
          {TIER_ORDER.map((t) => {
            const s = tierStats[t];
            const pct = s.quests ? s.cleared / s.quests : 0;
            return (
              <div key={t} className="border border-white/10 rounded-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`tag rank-${t === 'National' ? 'N' : t}`}>{t}-rank</span>
                  <span className="text-slate-300 text-sm">{s.concepts} concept{s.concepts === 1 ? '' : 's'}</span>
                  <span className="ml-auto text-xs text-slate-400">{s.cleared}/{s.quests} quests</span>
                </div>
                <div className="xp-bar mt-2"><div style={{ width: `${(pct * 100).toFixed(0)}%` }} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center">
          <div className="hud-title">Concept codex</div>
          <Link to="/concepts" className="ml-auto text-xs text-accent">Open full codex →</Link>
        </div>
        <ul className="mt-3 grid md:grid-cols-2 gap-2">
          {ALL_CONCEPTS.slice(0, 12).map((c) => {
            const cleared = c.quests.filter((q) => p.clearedQuests[q.id]).length;
            return (
              <li key={c.id} className="border border-white/10 rounded px-3 py-2 hover:bg-white/5">
                <Link to={`/concept/${c.id}`} className="flex items-center gap-2">
                  <span className={`tag rank-${c.tier === 'National' ? 'N' : c.tier}`}>{c.tier}</span>
                  <span className="text-slate-200 text-sm">{c.title}</span>
                  <span className="ml-auto text-xs text-slate-400">{cleared}/{c.quests.length}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel p-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>Reset all progress (local-only):</span>
          <button className="btn" onClick={() => { if (confirm('Wipe all progress?')) { resetProgress(); location.reload(); } }}>
            Reset
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-white/10 rounded-md px-4 py-3 bg-black/20">
      <div className="hud-title">{label}</div>
      <div className="text-2xl font-mono text-accent mt-1">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
