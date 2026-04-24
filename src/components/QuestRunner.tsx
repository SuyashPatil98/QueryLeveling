import { useEffect, useState } from 'react';
import { runQuery, type QueryResult } from '../lib/db';
import { checkResult, type CheckResult } from '../lib/checker';
import { SqlEditor } from './SqlEditor';
import { ResultTable } from './ResultTable';
import type { Quest } from '../content/types';
import { clearQuest, loadProgress, recordAttempt, saveNote } from '../lib/progress';

export function QuestRunner({ quest, onCleared }: { quest: Quest; onCleared?: () => void }) {
  const [sqlText, setSqlText] = useState(quest.starter || '-- Write your SQL here\nSELECT 1;');
  const [actual, setActual] = useState<QueryResult | null>(null);
  const [expected, setExpected] = useState<QueryResult | null>(null);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(0);
  const [showExpected, setShowExpected] = useState(false);
  const [note, setNote] = useState(loadProgress().notes[quest.id] || '');
  const [cleared, setCleared] = useState(!!loadProgress().clearedQuests[quest.id]);

  useEffect(() => {
    runQuery('practice', quest.expected).then(setExpected).catch(() => {});
  }, [quest.id, quest.expected]);

  async function submit() {
    setError(null);
    setCheck(null);
    try {
      const a = await runQuery('practice', sqlText);
      setActual(a);
      if (!expected) return;
      const c = checkResult(a, expected, quest.check);
      setCheck(c);
      if (c.ok) {
        clearQuest(quest.id, quest.xp ?? 50);
        setCleared(true);
        onCleared?.();
      } else {
        recordAttempt(quest.id);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
      recordAttempt(quest.id);
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{quest.prompt}</div>

      {!!quest.hints?.length && (
        <div className="space-y-1">
          {quest.hints.slice(0, showHint).map((h, i) => (
            <div key={i} className="text-xs text-slate-300 bg-white/5 border border-white/10 rounded px-3 py-2">
              <span className="text-accent">Hint {i + 1}:</span> {h}
            </div>
          ))}
          {showHint < (quest.hints?.length ?? 0) && (
            <button className="btn" onClick={() => setShowHint((h) => h + 1)}>
              Reveal hint {showHint + 1}/{quest.hints.length}
            </button>
          )}
        </div>
      )}

      <SqlEditor value={sqlText} onChange={setSqlText} height="220px" />

      <div className="flex flex-wrap items-center gap-2">
        <button className="btn primary" onClick={submit}>Submit (+{quest.xp ?? 50} XP)</button>
        <button className="btn" onClick={() => setShowExpected((s) => !s)}>
          {showExpected ? 'Hide' : 'Show'} expected output
        </button>
        <button className="btn" onClick={() => setShowSolution((s) => !s)}>
          {showSolution ? 'Hide' : 'Reveal'} solution
        </button>
        {cleared && <span className="tag rank-A">Cleared</span>}
      </div>

      {error && (
        <pre className="text-xs text-red-300 bg-red-900/20 border border-red-500/30 rounded p-2 whitespace-pre-wrap">{error}</pre>
      )}

      {check && !check.ok && (
        <pre className="text-xs text-amber-200 bg-amber-900/20 border border-amber-500/30 rounded p-2 whitespace-pre-wrap">{check.reason}</pre>
      )}
      {check && check.ok && (
        <div className="text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-500/30 rounded p-2">
          [SYSTEM] Quest cleared. Rewards granted.
        </div>
      )}

      {actual && (
        <div>
          <div className="hud-title mb-1">Your output</div>
          <ResultTable result={actual} />
        </div>
      )}

      {showExpected && expected && (
        <div>
          <div className="hud-title mb-1">Expected output</div>
          <ResultTable result={expected} />
        </div>
      )}

      {showSolution && (
        <div>
          <div className="hud-title mb-1">Reference solution</div>
          <pre className="text-xs bg-black/40 border border-white/10 rounded p-3 whitespace-pre-wrap font-mono">{quest.expected}</pre>
        </div>
      )}

      <div>
        <div className="hud-title mb-1">Notes (saved locally)</div>
        <textarea
          className="w-full bg-black/30 border border-white/10 rounded p-2 text-xs font-mono"
          rows={2}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            saveNote(quest.id, e.target.value);
          }}
          placeholder="Why this works, gotchas, alt approaches…"
        />
      </div>
    </div>
  );
}
