/** Isolated compatibility evidence; no .env loading, no network database, no external calls. */
import './environment';
import 'reflect-metadata';
import { writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { getPGliteInstance } from 'typeorm-pglite';
import ds from '../src/data-source';
import { runSeed } from '../src/seed';
import { exportSnapshot, restoreSnapshot } from './snapshot';
import { prepareSyntheticAccounts } from './synthetic-accounts';
import { httpSmoke } from './http-smoke';

const evidence: Record<string, unknown> = { startedAt: new Date().toISOString(), database: 'PGlite memory-only', networkDatabase: false };
const timed = async <T>(label: string, work: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await work();
    evidence[`${label}Ms`] = Math.round(performance.now() - start);
    process.stdout.write(`${label}: ${evidence[`${label}Ms`]} ms\n`);
    return result;
  } catch (error) {
    evidence.failedPhase = label;
    evidence[`${label}Ms`] = Math.round(performance.now() - start);
    throw error;
  }
};

async function main(): Promise<void> {
  await timed('initialize', () => ds.initialize());
  const applied = await timed('migrations', () => ds.runMigrations({ transaction: 'each' }));
  evidence.migrations = applied.map((m) => m.name);
  evidence.migrationCount = applied.length;
  evidence.seed = await timed('seed', () => runSeed(ds, { reset: false }));
  await timed('syntheticAccounts', () => prepareSyntheticAccounts(ds));
  const pg = await getPGliteInstance();
  if (process.argv.includes('--physical-dump')) {
    const snapshot = await timed('dump', () => pg.dumpDataDir('gzip'));
    evidence.dumpBytes = snapshot.size;
  }
  const logical = await timed('logicalExport', () => exportSnapshot(ds));
  const json = JSON.stringify(logical);
  evidence.tableCount = Object.keys(logical.tables).length;
  evidence.logicalBytes = Buffer.byteLength(json);
  evidence.logicalGzipBytes = gzipSync(json).byteLength;
  await ds.query("UPDATE staff SET name='Visitor B only' WHERE id=1");
  const visitorB = await exportSnapshot(ds);
  await timed('logicalRestoreA', () => restoreSnapshot(ds, logical));
  const restoredA = await exportSnapshot(ds);
  evidence.restoreAEqual = JSON.stringify(restoredA) === json;
  await timed('logicalRestoreB', () => restoreSnapshot(ds, visitorB));
  const restoredB = await exportSnapshot(ds);
  evidence.restoreBEqual = JSON.stringify(restoredB) === JSON.stringify(visitorB);
  await restoreSnapshot(ds, logical);
  evidence.replicationRole = await ds.query('SHOW session_replication_role');
  evidence.http = await timed('httpSmoke', () => httpSmoke(ds));
  evidence.heapUsedBytes = process.memoryUsage().heapUsed;
  evidence.rssBytes = process.memoryUsage().rss;
  evidence.success = true;
}

main().catch((error: unknown) => {
  const failure = error as { name?: string; message?: string; code?: string; query?: string };
  evidence.success = false;
  evidence.failure = { name: failure.name, message: failure.message, code: failure.code, query: failure.query?.slice(0, 800) };
  process.exitCode = 1;
}).finally(async () => {
  if (ds.isInitialized) { await ds.destroy(); }
  mkdirSync('evidence', { recursive: true });
  writeFileSync('evidence/spike.json', `${JSON.stringify(evidence, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
});
