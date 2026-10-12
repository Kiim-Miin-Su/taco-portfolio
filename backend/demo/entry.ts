/** Entire request (restore → original Nest handler → export) owns one exclusive runtime turn. */
import './environment';
import { gzipSync, gunzipSync } from 'node:zlib';
import type { RequestListener } from 'node:http';
import inject from 'light-my-request';
import ds from '../src/data-source';
import { runSeed } from '../src/seed';
import { createApp } from '../src/app.factory';
import { exportSnapshot, restoreSnapshot, type LogicalSnapshot } from './snapshot';
import { prepareSyntheticAccounts } from './synthetic-accounts';
import { sanitizeSyntheticData } from './synthetic-data';

export interface DemoEnvelope {
  version: 1;
  method: string;
  path: string;
  headers?: { authorization?: string };
  body?: unknown;
  state?: string;
  cookies?: Record<string, string>;
}
export interface DemoResponse {
  version: 1;
  status: number;
  headers: Record<string, string>;
  body: unknown;
  encoding?: 'base64';
  state: string;
  cookies: Record<string, string>;
}
interface Runtime { handler: RequestListener; baseline: LogicalSnapshot }
const MAX_COMPRESSED = 1024 * 1024;
const MAX_LOGICAL = 4 * 1024 * 1024;
export const DEMO_FILE_MAX_BYTES = 512 * 1024;
let booting: Promise<Runtime> | undefined;
let turn: Promise<void> = Promise.resolve();
const MAX_PENDING = 20;
let pending = 0;

function encode(snapshot: LogicalSnapshot): string {
  const json = JSON.stringify(snapshot);
  if (Buffer.byteLength(json) > MAX_LOGICAL) { throw new Error('DEMO_STATE_LIMIT'); }
  const bytes = gzipSync(json);
  if (bytes.length > MAX_COMPRESSED) { throw new Error('DEMO_STATE_LIMIT'); }
  return bytes.toString('base64');
}
function decode(value: string): LogicalSnapshot {
  if (value.length > Math.ceil(MAX_COMPRESSED * 4 / 3) + 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error('DEMO_STATE_INVALID');
  }
  const bytes = Buffer.from(value, 'base64');
  if (bytes.length > MAX_COMPRESSED) { throw new Error('DEMO_STATE_LIMIT'); }
  let parsed: unknown;
  try { parsed = JSON.parse(gunzipSync(bytes, { maxOutputLength: MAX_LOGICAL }).toString('utf8')); }
  catch (error) {
    if ((error as { code?: string }).code === 'ERR_BUFFER_TOO_LARGE') { throw new Error('DEMO_STATE_LIMIT'); }
    throw new Error('DEMO_STATE_INVALID');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) { throw new Error('DEMO_STATE_INVALID'); }
  const candidate = parsed as Partial<LogicalSnapshot>;
  if (candidate.version !== 1 || !candidate.tables || !candidate.sequences || Array.isArray(candidate.tables) || Array.isArray(candidate.sequences)) {
    throw new Error('DEMO_STATE_INVALID');
  }
  return candidate as LogicalSnapshot;
}

async function boot(): Promise<Runtime> {
  if (!ds.isInitialized) { await ds.initialize(); }
  await ds.runMigrations({ transaction: 'each' });
  await runSeed(ds, { reset: false });
  await prepareSyntheticAccounts(ds);
  const baseline = await sanitizeSyntheticData(ds);
  const app = await createApp();
  await app.init();
  return { handler: app.getHttpAdapter().getInstance() as RequestListener, baseline };
}

function validateFileSizes(value: unknown, depth = 0): void {
  if (depth > 40) { throw new Error('DEMO_REQUEST_INVALID'); }
  if (Array.isArray(value)) { value.forEach((item) => validateFileSizes(item, depth + 1)); return; }
  if (!value || typeof value !== 'object') { return; }
  for (const [key, item] of Object.entries(value)) {
    if ((key === 'base64' || key === 'pngDataUrl') && typeof item === 'string') {
      const encoded = item.startsWith('data:') ? item.slice(item.indexOf(',') + 1) : item;
      if (Buffer.byteLength(encoded, 'base64') > DEMO_FILE_MAX_BYTES) { throw new Error('DEMO_FILE_TOO_LARGE'); }
    } else { validateFileSizes(item, depth + 1); }
  }
}

function validateEnvelope(envelope: DemoEnvelope): void {
  if (envelope.version !== 1 || !['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(envelope.method)) {
    throw new Error('DEMO_REQUEST_INVALID');
  }
  if (!envelope.path.startsWith('/') || envelope.path.startsWith('//') || envelope.path.includes('://') || envelope.path.includes('\\') || /[\r\n]/.test(envelope.path)) {
    throw new Error('DEMO_PATH_INVALID');
  }
  if (envelope.path.length > 4096 || Buffer.byteLength(JSON.stringify(envelope.body ?? null)) > MAX_LOGICAL) {
    throw new Error('DEMO_REQUEST_LIMIT');
  }
  validateFileSizes(envelope.body);
}

async function handle(envelope: DemoEnvelope): Promise<DemoResponse> {
  validateEnvelope(envelope);
  booting ??= boot().catch((error: unknown) => { booting = undefined; throw error; });
  const runtime = await booting;
  const input = envelope.state ? decode(envelope.state) : runtime.baseline;
  try {
    try { await restoreSnapshot(ds, input); }
    catch (error) {
      if (envelope.state) { throw new Error('DEMO_STATE_INVALID'); }
      throw error;
    }
    const response = await inject(runtime.handler, {
      method: envelope.method,
      url: envelope.path.startsWith('/api/v1/') ? envelope.path : `/api/v1${envelope.path}`,
      headers: envelope.headers?.authorization ? { authorization: envelope.headers.authorization } : {},
      cookies: envelope.cookies ?? {},
      ...(envelope.body === undefined || envelope.body === null ? {} : { payload: JSON.stringify(envelope.body), headers: { ...(envelope.headers?.authorization ? { authorization: envelope.headers.authorization } : {}), 'content-type': 'application/json' } }),
    });
    const headers: Record<string, string> = {};
    for (const name of ['content-type', 'content-disposition', 'cache-control']) {
      const value = response.headers[name];
      if (typeof value === 'string') { headers[name] = value; }
    }
    const cookies = { ...(envelope.cookies ?? {}) };
    for (const cookie of response.cookies) {
      if (cookie.maxAge === 0 || (cookie.expires && new Date(cookie.expires).getTime() <= Date.now())) { delete cookies[cookie.name]; }
      else { cookies[cookie.name] = cookie.value; }
    }
    const state = encode(await exportSnapshot(ds));
    const contentType = headers['content-type'] ?? '';
    let body: unknown;
    let encoding: 'base64' | undefined;
    if (contentType.includes('application/json')) { body = response.payload ? JSON.parse(response.payload) : null; }
    else if (contentType.startsWith('text/') || response.rawPayload.length === 0) { body = response.payload; }
    else { body = response.rawPayload.toString('base64'); encoding = 'base64'; }
    return { version: 1, status: response.statusCode, headers, body, ...(encoding ? { encoding } : {}), state, cookies };
  } finally {
    // No visitor data survives into the next request, including failed requests.
    await restoreSnapshot(ds, runtime.baseline);
  }
}

export async function handleDemoRequest(envelope: DemoEnvelope): Promise<DemoResponse> {
  // 한 인스턴스의 무제한 대기로 메모리가 늘지 않게 한다. 거절된 요청의 방문자 상태는 그대로 보존한다.
  if (pending >= MAX_PENDING) {
    return {
      version: 1, status: 429, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: { code: 'DEMO_BUSY', message: '체험 요청이 많습니다. 잠시 뒤 다시 시도해 주세요.' },
      state: envelope.state ?? '', cookies: envelope.cookies ?? {},
    };
  }
  pending += 1;
  const previous = turn;
  let release: () => void = () => undefined;
  turn = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try { return await handle(envelope); }
  catch (error) {
    const code = error instanceof Error && /^DEMO_[A-Z_]+$/.test(error.message) ? error.message : 'DEMO_RUNTIME_ERROR';
    const limited = ['DEMO_FILE_TOO_LARGE', 'DEMO_STATE_LIMIT', 'DEMO_REQUEST_LIMIT'].includes(code);
    const invalid = code.startsWith('DEMO_SNAPSHOT_') || code === 'DEMO_STATE_INVALID';
    return {
      version: 1,
      status: limited ? 413 : code === 'DEMO_RUNTIME_ERROR' ? 500 : 400,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      body: { code, message: code === 'DEMO_FILE_TOO_LARGE' ? '체험판에서는 파일 한 개당 512KB까지 올릴 수 있습니다.' : limited ? '체험 데이터 용량 한도를 넘었습니다. 입력을 줄이거나 체험을 초기화해 주세요.' : '체험 요청을 처리하지 못했습니다. 입력을 확인하거나 체험을 초기화해 주세요.' },
      state: invalid ? '' : envelope.state ?? '',
      cookies: invalid ? {} : envelope.cookies ?? {},
    };
  }
  finally { pending -= 1; release(); }
}
