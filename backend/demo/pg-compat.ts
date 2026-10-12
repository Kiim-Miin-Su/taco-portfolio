/** node-postgres compatibility gaps in typeorm-pglite 0.3.4; keep application SQL unchanged. */
import type { Results } from '@electric-sql/pglite';
import { getPGliteInstance, PGliteDriver } from 'typeorm-pglite';
import { createRequire } from 'node:module';

const load = createRequire(__filename);
const { prepareValue } = load('pg/lib/utils') as { prepareValue(value: unknown): unknown };
type PgResult = Results<unknown> & { rowCount: number; command: string };
type Callback = (error: unknown, result: PgResult | null) => void;

/** node-postgres returns Buffer for bytea; domain fingerprints depend on toString('hex'). */
function postgresValues(value: unknown): unknown {
  if (value instanceof Uint8Array) { return Buffer.from(value); }
  if (Array.isArray(value)) { return value.map(postgresValues); }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, postgresValues(item)]));
  }
  return value;
}

/** PostgreSQL command tags after a CTE refer to the outer statement, not WITH. */
export function statementCommand(sql: string): string {
  const text = sql.replace(/--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/|"(?:""|[^"])*"|'(?:''|[^'])*'/g, ' ');
  const first = text.match(/^\s*(\w+)/)?.[1]?.toUpperCase() ?? '';
  if (first !== 'WITH') { return first; }
  let depth = 0;
  for (const match of text.matchAll(/[()]|[a-z_]+/gi)) {
    const token = match[0].toUpperCase();
    if (token === '(') { depth += 1; }
    else if (token === ')') { depth -= 1; }
    else if (depth === 0 && ['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(token)) { return token; }
  }
  return first;
}

export function compatibleDriver(driver: PGliteDriver['driver']): PGliteDriver['driver'] {
  class CompatiblePool extends driver.Pool {
    override async query(sql: string, parameters?: unknown[], callback?: Callback): Promise<PgResult> {
      const pg = await getPGliteInstance();
      try {
        // pg already serializes custom enum arrays; PGlite cannot infer their element serializer.
        const values = parameters?.map((value) => Array.isArray(value) ? prepareValue(value) : value);
        const result: Results<unknown> = values?.length
          ? await pg.query(sql, values)
          : (await pg.exec(sql)).at(-1) ?? { rows: [], fields: [] };
        const command = statementCommand(sql);
        const compatible = { ...result, rows: result.rows.map(postgresValues), command, rowCount: result.affectedRows ?? result.rows.length };
        callback?.(null, compatible);
        return compatible;
      } catch (error) {
        callback?.(error, null);
        throw error;
      }
    }
  }
  return { Pool: CompatiblePool } as PGliteDriver['driver'];
}
