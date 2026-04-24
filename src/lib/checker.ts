import { QueryResult } from './db';

export type CheckOptions = {
  orderInsensitive?: boolean;
  columnOrderInsensitive?: boolean;
  caseInsensitiveColumns?: boolean;
};

export type CheckResult =
  | { ok: true }
  | { ok: false; reason: string };

function normalizeValue(v: any): string {
  if (v === null || v === undefined) return '∅NULL';
  if (typeof v === 'number') {
    // collapse floats to 6 decimals, strip trailing zeros
    if (!Number.isInteger(v)) return parseFloat(v.toFixed(6)).toString();
    return v.toString();
  }
  return String(v);
}

export function checkResult(actual: QueryResult, expected: QueryResult, opts: CheckOptions = {}): CheckResult {
  const {
    orderInsensitive = false,
    columnOrderInsensitive = false,
    caseInsensitiveColumns = true,
  } = opts;

  if (!actual.columns.length) {
    return { ok: false, reason: 'Your query returned no result set. Did you forget SELECT?' };
  }

  const normCol = (c: string) => (caseInsensitiveColumns ? c.toLowerCase() : c);
  const aCols = actual.columns.map(normCol);
  const eCols = expected.columns.map(normCol);

  if (aCols.length !== eCols.length) {
    return {
      ok: false,
      reason: `Column count mismatch. Expected ${eCols.length} (${expected.columns.join(', ')}), got ${aCols.length} (${actual.columns.join(', ')}).`,
    };
  }

  let colMap: number[]; // actual index for each expected position
  if (columnOrderInsensitive) {
    colMap = [];
    const taken = new Set<number>();
    for (const ec of eCols) {
      const idx = aCols.findIndex((ac, i) => ac === ec && !taken.has(i));
      if (idx === -1) {
        return { ok: false, reason: `Missing column "${ec}" in result.` };
      }
      colMap.push(idx);
      taken.add(idx);
    }
  } else {
    for (let i = 0; i < eCols.length; i++) {
      if (aCols[i] !== eCols[i]) {
        return {
          ok: false,
          reason: `Column ${i + 1} mismatch. Expected "${expected.columns[i]}", got "${actual.columns[i]}". (Use AS alias.)`,
        };
      }
    }
    colMap = eCols.map((_, i) => i);
  }

  if (actual.rowCount !== expected.rowCount) {
    return {
      ok: false,
      reason: `Row count mismatch. Expected ${expected.rowCount}, got ${actual.rowCount}.`,
    };
  }

  const serializeRow = (row: any[], map: number[]) =>
    map.map((i) => normalizeValue(row[i])).join('||');

  const expectedRows = expected.rows.map((r) => serializeRow(r, eCols.map((_, i) => i)));
  const actualRows = actual.rows.map((r) => serializeRow(r, colMap));

  if (orderInsensitive) {
    const eSorted = [...expectedRows].sort();
    const aSorted = [...actualRows].sort();
    for (let i = 0; i < eSorted.length; i++) {
      if (eSorted[i] !== aSorted[i]) {
        return {
          ok: false,
          reason: `Row values differ (order-insensitive). First diff at sorted position ${i + 1}.\nExpected: ${eSorted[i]}\nGot:      ${aSorted[i]}`,
        };
      }
    }
  } else {
    for (let i = 0; i < expectedRows.length; i++) {
      if (expectedRows[i] !== actualRows[i]) {
        return {
          ok: false,
          reason: `Row ${i + 1} differs.\nExpected: ${expectedRows[i]}\nGot:      ${actualRows[i]}\n(If order doesn't matter, add ORDER BY — or the grader expects a specific order.)`,
        };
      }
    }
  }

  return { ok: true };
}
