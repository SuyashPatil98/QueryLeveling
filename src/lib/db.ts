import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { learningSeed } from '../data/learningSeed';
import { practiceSeed } from '../data/practiceSeed';

let SQL: SqlJsStatic | null = null;
const dbs: Record<string, Database> = {};

async function getSQL(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: () => 'https://sql.js.org/dist/sql-wasm.wasm',
  });
  return SQL;
}

export async function getDb(kind: 'learning' | 'practice'): Promise<Database> {
  if (dbs[kind]) return dbs[kind];
  const sql = await getSQL();
  const db = new sql.Database();
  const seed = kind === 'learning' ? learningSeed : practiceSeed;
  db.exec(seed);
  dbs[kind] = db;
  return db;
}

export function resetDb(kind: 'learning' | 'practice') {
  if (dbs[kind]) {
    dbs[kind].close();
    delete dbs[kind];
  }
}

export type QueryResult = {
  columns: string[];
  rows: any[][];
  rowCount: number;
  elapsedMs: number;
};

export async function runQuery(kind: 'learning' | 'practice', sql: string): Promise<QueryResult> {
  const db = await getDb(kind);
  const t0 = performance.now();
  const results = db.exec(sql);
  const elapsed = performance.now() - t0;
  if (!results.length) return { columns: [], rows: [], rowCount: 0, elapsedMs: elapsed };
  const last = results[results.length - 1];
  return {
    columns: last.columns,
    rows: last.values as any[][],
    rowCount: last.values.length,
    elapsedMs: elapsed,
  };
}
