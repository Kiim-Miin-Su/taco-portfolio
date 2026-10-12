/** Private demo DB transfer. Table/column identifiers always come from the initialized schema. */
import type { DataSource } from 'typeorm';

type Row = Record<string, unknown>;
export interface LogicalSnapshot {
  version: 1;
  tables: Record<string, Row[]>;
  sequences: Record<string, { lastValue: string; isCalled: boolean }>;
}
const quote = (value: string): string => `"${value.replaceAll('"', '""')}"`;

export async function schemaTables(ds: DataSource): Promise<Array<{ tablename: string }>> {
  return ds.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename") as Promise<Array<{ tablename: string }>>;
}

export async function exportSnapshot(ds: DataSource): Promise<LogicalSnapshot> {
  const snapshot: LogicalSnapshot = { version: 1, tables: {}, sequences: {} };
  for (const { tablename } of await schemaTables(ds)) {
    const rows = await ds.query(`SELECT to_jsonb(t) AS row FROM ${quote(tablename)} t ORDER BY to_jsonb(t)::text`) as Array<{ row: Row }>;
    snapshot.tables[tablename] = rows.map(({ row }) => row);
  }
  const sequences = await ds.query("SELECT sequencename FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename") as Array<{ sequencename: string }>;
  for (const { sequencename } of sequences) {
    const [value] = await ds.query(`SELECT last_value::text AS "lastValue",is_called AS "isCalled" FROM ${quote(sequencename)}`) as Array<{ lastValue: string; isCalled: boolean }>;
    snapshot.sequences[sequencename] = value;
  }
  return snapshot;
}

export async function restoreSnapshot(ds: DataSource, snapshot: LogicalSnapshot): Promise<void> {
  const tables = await schemaTables(ds);
  const names = tables.map(({ tablename }) => tablename);
  if (snapshot.version !== 1 || Object.keys(snapshot.tables).sort().join('|') !== names.join('|')) {
    throw new Error('DEMO_SNAPSHOT_SCHEMA_MISMATCH');
  }
  const sequences = await ds.query("SELECT sequencename FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename") as Array<{ sequencename: string }>;
  if (Object.keys(snapshot.sequences).sort().join('|') !== sequences.map(({ sequencename }) => sequencename).join('|')) {
    throw new Error('DEMO_SNAPSHOT_SEQUENCE_MISMATCH');
  }
  await ds.transaction(async (manager) => {
    // LOCAL resets on commit or rollback; visitors never provide SQL or select a schema.
    await manager.query("SET LOCAL session_replication_role='replica'");
    await manager.query(`TRUNCATE ${names.map(quote).join(',')} RESTART IDENTITY CASCADE`);
    for (const name of names) {
      const rows = snapshot.tables[name];
      if (!Array.isArray(rows)) { throw new Error('DEMO_SNAPSHOT_INVALID_ROWS'); }
      if (rows.length === 0) { continue; }
      const columns = await manager.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND is_generated='NEVER' ORDER BY ordinal_position", [name],
      ) as Array<{ column_name: string }>;
      const list = columns.map(({ column_name }) => quote(column_name)).join(',');
      await manager.query(`INSERT INTO ${quote(name)} (${list}) SELECT ${list} FROM json_populate_recordset(NULL::${quote(name)},$1::json)`, [JSON.stringify(rows)]);
    }
    for (const { sequencename } of sequences) {
      const value = snapshot.sequences[sequencename];
      if (!value || !/^[0-9]+$/.test(value.lastValue) || typeof value.isCalled !== 'boolean') {
        throw new Error('DEMO_SNAPSHOT_INVALID_SEQUENCE');
      }
      await manager.query('SELECT setval($1::regclass,$2::bigint,$3::boolean)', [sequencename, value.lastValue, value.isCalled]);
    }
  });
}
