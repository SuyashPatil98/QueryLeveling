import type { QueryResult } from '../lib/db';

export function ResultTable({ result }: { result: QueryResult | null }) {
  if (!result) return null;
  if (!result.columns.length) {
    return (
      <div className="text-xs text-slate-400 italic px-3 py-4">
        Query returned no result set ({result.elapsedMs.toFixed(1)} ms).
      </div>
    );
  }
  return (
    <div className="max-h-[320px] overflow-auto border border-white/10 rounded-md">
      <table className="result-table">
        <thead>
          <tr>
            {result.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j} className={v === null ? 'text-slate-500 italic' : ''}>
                  {v === null ? 'NULL' : String(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 text-[11px] text-slate-400 border-t border-white/5">
        {result.rowCount} row{result.rowCount === 1 ? '' : 's'} · {result.elapsedMs.toFixed(1)} ms
      </div>
    </div>
  );
}
