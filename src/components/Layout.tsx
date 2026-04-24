import { Link, NavLink, Outlet } from 'react-router-dom';
import { loadProgress, rankFromXp, levelFromXp } from '../lib/progress';

export function Layout() {
  const p = loadProgress();
  const { current, next, progress } = rankFromXp(p.xp);
  const level = levelFromXp(p.xp);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link to="/" className="font-mono text-accent text-lg tracking-widest">
            ⟁ THE SYSTEM
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to="/" end className={({isActive}) => isActive ? 'text-accent' : 'text-slate-300 hover:text-white'}>Dashboard</NavLink>
            <NavLink to="/concepts" className={({isActive}) => isActive ? 'text-accent' : 'text-slate-300 hover:text-white'}>Quest Codex</NavLink>
            <NavLink to="/sandbox" className={({isActive}) => isActive ? 'text-accent' : 'text-slate-300 hover:text-white'}>Free Sandbox</NavLink>
            <NavLink to="/theory" className={({isActive}) => isActive ? 'text-accent' : 'text-slate-300 hover:text-white'}>Theory Cards</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className={`tag rank-${current.rank === 'National' ? 'N' : current.rank}`}>{current.rank}-rank</span>
            <span className="text-slate-300">Lv {level}</span>
            <span className="text-slate-400">{p.xp} XP</span>
            <div className="w-32 xp-bar"><div style={{ width: `${(progress * 100).toFixed(0)}%` }} /></div>
            {next && <span className="text-slate-500">→ {next.rank}@{next.min}</span>}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 text-center text-[11px] text-slate-500 py-3">
        Two datasets: <span className="text-accent">Hunter Guild</span> for learning ·
        <span className="text-accent2"> Shadow Army</span> for practice. Progress saved locally.
      </footer>
    </div>
  );
}
