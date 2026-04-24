import { useState } from 'react';
import { runQuery, type QueryResult } from '../lib/db';
import { SqlEditor } from './SqlEditor';
import { ResultTable } from './ResultTable';

export function SqlRunner({
  kind,
  initialSql,
  height = '180px',
  label,
}: {
  kind: 'learning' | 'practice';
  initialSql: string;
  height?: string;
  label?: string;
}) {
  const [sqlText, setSqlText] = useState(initialSql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function execute() {
    setRunning(true);
    setError(null);
    try {
      const r = await runQuery(kind, sqlText);
      setResult(r);
    } catch (e: any) {
      setResult(null);
      setError(e?.message || String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-2">
      {label && <div className="hud-title">{label}</div>}
      <SqlEditor value={sqlText} onChange={setSqlText} height={height} />
      <div className="flex items-center gap-2">
        <button className="btn primary" onClick={execute} disabled={running}>
          {running ? 'Casting…' : 'Run on ' + (kind === 'learning' ? 'Hunter Guild' : 'Shadow Army')}
        </button>
        <button className="btn" onClick={() => setSqlText(initialSql)}>Reset</button>
      </div>
      {error && (
        <pre className="text-xs text-red-300 bg-red-900/20 border border-red-500/30 rounded p-2 whitespace-pre-wrap">{error}</pre>
      )}
      <ResultTable result={result} />
    </div>
  );
}
