import { useState } from 'react';
import { SqlRunner } from '../components/SqlRunner';
import { learningSchemaDoc, practiceSchemaDoc } from '../data/schema';

export function Sandbox() {
  const [kind, setKind] = useState<'learning' | 'practice'>('practice');
  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="hud-title">Free Sandbox</div>
        <div className="text-sm text-slate-300 mt-1">
          Run any SQL against either dataset. Useful when you want to explore tables before tackling a quest, or to test variations of a query.
        </div>
        <div className="mt-3 flex gap-2">
          <button className={`btn ${kind === 'learning' ? 'primary' : ''}`} onClick={() => setKind('learning')}>Hunter Guild</button>
          <button className={`btn ${kind === 'practice' ? 'primary' : ''}`} onClick={() => setKind('practice')}>Shadow Army</button>
        </div>
      </div>
      <div className="panel p-5">
        <SqlRunner
          kind={kind}
          height="280px"
          initialSql={
            kind === 'learning'
              ? `-- Hunter Guild sandbox\nSELECT name, rank, level FROM hunters ORDER BY level DESC LIMIT 10;`
              : `-- Shadow Army sandbox\nSELECT name, rank, level FROM shadows ORDER BY level DESC LIMIT 10;`
          }
        />
      </div>
      <div className="panel p-5">
        <div className="hud-title mb-2">Schema reference</div>
        <pre className="text-xs whitespace-pre-wrap font-mono text-slate-300">
          {kind === 'learning' ? learningSchemaDoc : practiceSchemaDoc}
        </pre>
      </div>
    </div>
  );
}
