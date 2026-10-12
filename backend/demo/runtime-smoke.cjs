/* Executes the built demo without allowing a socket connection or external fetch. */
const net = require('node:net');
net.Socket.prototype.connect = function forbiddenConnect() { throw new Error('DEMO_TEST_NETWORK_FORBIDDEN'); };
global.fetch = async () => { throw new Error('DEMO_TEST_FETCH_FORBIDDEN'); };
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { performance: perf } = require('node:perf_hooks');
const { gunzipSync } = require('node:zlib');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { handleDemoRequest } = require('../dist/demo/entry.js');
const results = { startedAt: new Date().toISOString(), networkDisabled: true, checks: [] };

function visitor() { return { state: undefined, cookies: {}, accessToken: undefined }; }
async function call(session, method, path, body) {
  const start = perf.now();
  const res = await handleDemoRequest({ version: 1, method, path: `/api/v1${path}`, body, state: session.state, cookies: session.cookies, headers: session.accessToken ? { authorization: `Bearer ${session.accessToken}` } : {} });
  session.state = res.state;
  session.cookies = res.cookies;
  results.checks.push({ method, path, status: res.status, ms: Math.round(perf.now() - start) });
  return res;
}
async function login(role) {
  const session = visitor();
  const response = await call(session, 'POST', '/auth/login', { loginId: `demo-${role}`, password: 'PortfolioDemo!2026' });
  assert.equal(response.status, 201);
  session.accessToken = response.body.accessToken;
  assert.ok(session.accessToken);
  assert.ok(session.cookies.taco_rt);
  return session;
}
async function main() {
  const a = await login('ceo');
  const b = await login('ceo');
  for (const role of ['manager', 'admin', 'teacher']) {
    const session = await login(role);
    assert.equal((await call(session, 'GET', '/meta')).status, 200);
    assert.equal((await call(session, 'GET', '/students')).status, role === 'teacher' ? 403 : 200);
  }
  assert.equal((await call(visitor(), 'GET', '/students')).status, 401);
  const created = await call(a, 'POST', '/drawer/todos', { title: 'Demo isolated CRUD', toId: 1 });
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.ok(id);
  assert.equal((await call(a, 'PATCH', `/drawer/todos/${id}`, { done: true })).status, 200);
  const afterA = JSON.parse(gunzipSync(Buffer.from(a.state, 'base64')).toString());
  assert.equal(afterA.tables.todo.find((row) => Number(row.id) === Number(id)).done, true);
  const [readA, readB] = await Promise.all([call(a, 'GET', '/drawer'), call(b, 'GET', '/drawer')]);
  assert.equal(readA.status, 200); assert.equal(readB.status, 200);
  const afterB = JSON.parse(gunzipSync(Buffer.from(b.state, 'base64')).toString());
  assert.equal(afterB.tables.todo.some((row) => row.title === 'Demo isolated CRUD'), false);
  const removed = await call(a, 'DELETE', '/drawer/todos/completed', { ids: [id] });
  assert.equal(removed.status, 200); assert.equal(removed.body.deleted, 1);
  const payload = Buffer.from('public demo binary fixture');
  const uploaded = await call(a, 'POST', '/files', { kind: 'cons-item', name: 'demo.bin', base64: payload.toString('base64') });
  assert.equal(uploaded.status, 201);
  const downloaded = await call(a, 'GET', `/files/${uploaded.body.id}`);
  assert.equal(downloaded.status, 200); assert.equal(downloaded.encoding, 'base64');
  assert.deepEqual(Buffer.from(downloaded.body, 'base64'), payload);
  const coldStart = perf.now();
  const cold = spawnSync(process.execPath, ['demo/cold-readback.cjs'], { input: JSON.stringify({ state: a.state, cookies: a.cookies, token: a.accessToken, fileId: uploaded.body.id }), encoding: 'utf8', timeout: 60000 });
  assert.equal(cold.status, 0);
  const coldResult = JSON.parse(cold.stdout.trim());
  assert.equal(coldResult.status, 200);
  assert.equal(coldResult.sha256, createHash('sha256').update(payload).digest('hex'));
  results.coldStateReadback = { status: coldResult.status, sameFileBytes: true, ms: Math.round(perf.now() - coldStart) };
  assert.equal((await call(a, 'POST', '/auth/refresh')).status, 201);
  const invalid = await handleDemoRequest({ version: 1, method: 'GET', path: '/api/v1/meta', state: 'not valid' });
  assert.equal(invalid.status, 400); assert.equal(invalid.body.code, 'DEMO_STATE_INVALID');
  const foreignPath = await handleDemoRequest({ version: 1, method: 'GET', path: '//external.invalid/private' });
  assert.equal(foreignPath.status, 400);
  const burst = await Promise.all(Array.from({ length: 21 }, () => handleDemoRequest({ version: 1, method: 'GET', path: '//external.invalid/private' })));
  assert.equal(burst.filter((response) => response.status === 429 && response.body.code === 'DEMO_BUSY').length, 1);
  assert.equal(burst.filter((response) => response.status === 400).length, 20);
  results.queueBounded = true;
  const oversized = await call(a, 'POST', '/files', { kind: 'cons-item', name: 'oversized.bin', base64: Buffer.alloc(512 * 1024 + 1).toString('base64') });
  assert.equal(oversized.status, 413); assert.equal(oversized.body.code, 'DEMO_FILE_TOO_LARGE');
  assert.equal((await call(a, 'GET', '/meta')).status, 200);
  results.stateGzipBytes = Buffer.from(a.state, 'base64').length;
  results.rssBytes = process.memoryUsage().rss;
  results.heapUsedBytes = process.memoryUsage().heapUsed;
  results.success = true;
}
main().catch((error) => { results.success = false; results.failure = error.message; process.exitCode = 1; }).finally(() => {
  fs.mkdirSync('evidence', { recursive: true });
  fs.writeFileSync('evidence/runtime-smoke.json', JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
  process.exit(process.exitCode ?? 0);
});
