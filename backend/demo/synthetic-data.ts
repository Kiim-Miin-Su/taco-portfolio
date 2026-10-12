/** Transform committed development fixtures into an explicitly synthetic public-demo baseline. */
import { createHash } from 'node:crypto';
import type { DataSource } from 'typeorm';
import { STAFF } from '../src/seed/base';
import { exportSnapshot, restoreSnapshot, type LogicalSnapshot } from './snapshot';

const digest = (value: string): string => createHash('sha256').update(value).digest('hex').slice(0, 10);

export async function sanitizeSyntheticData(ds: DataSource): Promise<LogicalSnapshot> {
  const snapshot = await exportSnapshot(ds);
  const names = new Map<string, string>();
  for (const staff of STAFF) { names.set(staff.name, `체험 직원${staff.id}`); }
  for (const table of ['stu', 'guardian', 'lead']) {
    snapshot.tables[table]?.forEach((row, index) => {
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string' && /(^name$|parent_name$|english_name$)/.test(key) && value.length > 1) {
          names.set(value, `${table === 'stu' ? '학생' : table === 'guardian' ? '보호자' : '상담자'}${index + 1}`);
        }
      }
    });
  }
  const clean = (value: unknown): unknown => {
    if (typeof value === 'string') {
      let text = value;
      for (const [before, after] of names) { text = text.replaceAll(before, after); }
      return text
        .replace(/https?:\/\/[^\s<>"']+/g, (url) => `https://example.com/demo/${digest(url)}`)
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => `demo-${digest(email)}@example.com`)
        .replace(/010[- ]?\d{4}[- ]?\d{4}/g, (phone) => `0100000${Number.parseInt(digest(phone).slice(0, 4), 16).toString().padStart(5, '0').slice(-4)}`);
    }
    if (Array.isArray(value)) { return value.map(clean); }
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]));
    }
    return value;
  };
  snapshot.tables = clean(snapshot.tables) as LogicalSnapshot['tables'];
  await restoreSnapshot(ds, snapshot);
  return exportSnapshot(ds);
}
