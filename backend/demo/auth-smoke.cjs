/* Public demo OTP regression: real ledger and password writers, with all outbound I/O forbidden. */
const net = require('node:net');
net.Socket.prototype.connect = function forbiddenConnect() { throw new Error('DEMO_TEST_NETWORK_FORBIDDEN'); };
global.fetch = async () => { throw new Error('DEMO_TEST_FETCH_FORBIDDEN'); };
process.env.NODE_ENV = 'production';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { handleDemoRequest } = require('../dist/demo/entry.js');
const results = { startedAt: new Date().toISOString(), nodeEnv: 'production', networkDisabled: true, checks: [] };
const session = () => ({ state: undefined, cookies: {}, accessToken: undefined });
async function call(visitor, method, path, body) {
  const response = await handleDemoRequest({ version: 1, method, path, body, state: visitor.state, cookies: visitor.cookies,
    headers: visitor.accessToken ? { authorization: `Bearer ${visitor.accessToken}` } : {} });
  visitor.state = response.state;
  visitor.cookies = response.cookies;
  results.checks.push({ method, path, status: response.status });
  return response;
}
async function login(visitor, loginId, password) {
  const response = await call(visitor, 'POST', '/auth/login', { loginId, password });
  assert.equal(response.status, 201);
  visitor.accessToken = response.body.accessToken;
  return response;
}
async function issuedCode(visitor, path, body) {
  const response = await call(visitor, 'POST', path, body);
  assert.equal(response.status, 201);
  assert.match(response.body.devCode ?? '', /^\d{6}$/, 'public-memory demo must expose its simulated OTP');
  return response.body.devCode;
}
async function main() {
  const recovery = session();
  await login(recovery, 'demo-teacher', 'PortfolioDemo!2026');
  const oldToken = recovery.accessToken;
  const emailCode = await issuedCode(recovery, '/auth/password-reset/codes', { loginId: 'demo-teacher', channel: 'email' });
  const phoneCode = await issuedCode(recovery, '/auth/password-reset/codes', { loginId: 'demo-teacher', channel: 'sms' });
  const resetBody = { loginId: 'demo-teacher', emailCode, phoneCode, password: 'PortfolioChanged!2026' };
  const wrong = emailCode === '000000' ? '999999' : '000000';
  assert.equal((await call(recovery, 'POST', '/auth/password-reset/complete', { ...resetBody, emailCode: wrong })).status, 409);
  assert.equal((await call(recovery, 'POST', '/auth/password-reset/complete', resetBody)).status, 204);
  recovery.accessToken = oldToken;
  assert.equal((await call(recovery, 'GET', '/auth/me')).status, 401);
  recovery.accessToken = undefined;
  assert.equal((await call(recovery, 'POST', '/auth/login', { loginId: 'demo-teacher', password: 'PortfolioDemo!2026' })).status, 401);
  await login(recovery, 'demo-teacher', resetBody.password);
  assert.equal((await call(recovery, 'POST', '/auth/password-reset/complete', resetBody)).status, 409);
  await login(session(), 'demo-teacher', 'PortfolioDemo!2026');

  const onboarding = session();
  await login(onboarding, 'demo-manager', 'PortfolioDemo!2026');
  const account = { name: '체험 인증 강사', loginId: 'demo-onboarding-qa', password: 'DemoTemporary!2026', role: 'teacher' };
  assert.equal((await call(onboarding, 'POST', '/drawer/staff', account)).status, 201);
  const first = await login(onboarding, account.loginId, account.password);
  assert.equal(first.body.user.mustChangeCredentials, true);
  assert.equal((await call(onboarding, 'GET', '/meta')).status, 403);
  const email = 'demo-onboarding-qa@example.com';
  const phone = '+12025550199';
  const firstEmailCode = await issuedCode(onboarding, '/auth/onboarding/codes', { channel: 'email', target: email });
  const firstPhoneCode = await issuedCode(onboarding, '/auth/onboarding/codes', { channel: 'sms', target: phone });
  const finished = await call(onboarding, 'POST', '/auth/onboarding/complete', {
    email, phone, emailCode: firstEmailCode, phoneCode: firstPhoneCode, password: 'DemoOnboarded!2026',
  });
  assert.equal(finished.status, 201);
  assert.equal(finished.body.user.mustChangeCredentials, false);
  onboarding.accessToken = finished.body.accessToken;
  assert.equal((await call(onboarding, 'GET', '/meta')).status, 200);
  assert.equal((await call(onboarding, 'GET', '/auth/onboarding')).body.required, false);
  await login(onboarding, account.loginId, 'DemoOnboarded!2026');
  results.success = true;
}
main().catch((error) => { results.success = false; results.failure = error.message; process.exitCode = 1; }).finally(() => {
  fs.mkdirSync('evidence', { recursive: true });
  fs.writeFileSync('evidence/auth-smoke.json', JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
  process.exit(process.exitCode ?? 0);
});
