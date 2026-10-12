/* 공개 데모 OTP 회귀. 기본은 외부 통신 차단, DEMO_BASE_URL 지정 시 허용된 데모 /api/demo만 호출한다. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const filePath = require('node:path');
function allowedTarget(value) {
  if (!value) { return undefined; }
  let url;
  try { url = new URL(value); } catch { throw new Error('DEMO_QA_TARGET_INVALID'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    && ['http:', 'https:'].includes(url.protocol);
  const publicDemo = url.origin === 'https://taco-portfolio.vercel.app';
  if ((!local && !publicDemo) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('DEMO_QA_TARGET_INVALID');
  }
  return url.origin;
}
const target = allowedTarget(process.env.DEMO_BASE_URL);
if (!target) {
  const net = require('node:net');
  net.Socket.prototype.connect = function forbiddenConnect() { throw new Error('DEMO_TEST_NETWORK_FORBIDDEN'); };
  global.fetch = async () => { throw new Error('DEMO_TEST_FETCH_FORBIDDEN'); };
}
process.env.NODE_ENV = 'production';
const handleDemoRequest = target ? undefined : require('../dist/demo/entry.js').handleDemoRequest;
const results = {
  startedAt: new Date().toISOString(), nodeEnv: 'production', networkDisabled: !target,
  mode: target ? 'http-memory-runtime' : 'memory-runtime', ...(target ? { target } : {}), checks: [],
  boundaries: ['방문자별 메모리 상태만 변경하며 실제 메일·문자 발송과 운영 계정은 검증하지 않는다.',
    '토큰·쿠키·snapshot·OTP·요청/응답 본문은 영수증에 기록하지 않는다.'],
};
const session = () => ({ state: undefined, cookies: {}, accessToken: undefined });
async function call(visitor, method, path, body) {
  const envelope = { version: 1, method, path, body, state: visitor.state, cookies: visitor.cookies,
    headers: visitor.accessToken ? { authorization: `Bearer ${visitor.accessToken}` } : {} };
  let response;
  let httpStatus;
  if (target) {
    // 리다이렉트는 따라가지 않는다. 자격·상태를 허용된 데모 외 주소로 보내지 않는다.
    const http = await fetch(`${target}/api/demo`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(envelope),
      redirect: 'error', signal: AbortSignal.timeout(120_000),
    });
    httpStatus = http.status;
    if (!http.ok) {
      results.checks.push({ method, path, httpStatus });
      throw new Error('DEMO_QA_HTTP_FAILED');
    }
    response = await http.json();
    if (!response || response.version !== 1 || !Number.isInteger(response.status)
      || typeof response.state !== 'string' || !response.cookies || typeof response.cookies !== 'object') {
      throw new Error('DEMO_QA_RESPONSE_INVALID');
    }
  } else {
    response = await handleDemoRequest(envelope);
  }
  visitor.state = response.state;
  visitor.cookies = response.cookies;
  results.checks.push({ method, path, ...(httpStatus === undefined ? {} : { httpStatus }), status: response.status });
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
main().catch((error) => {
  results.success = false;
  // AssertionError의 actual이나 fetch 오류 본문에 자격 값이 섞일 수 있어 고정 코드만 남긴다.
  results.failure = /^DEMO_[A-Z_]+$/.test(error.message) ? error.message : 'DEMO_AUTH_CHECK_FAILED';
  process.exitCode = 1;
}).finally(() => {
  const output = process.env.DEMO_QA_OUTPUT || (target ? 'evidence/auth-public-http.json' : 'evidence/auth-smoke.json');
  fs.mkdirSync(filePath.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
  process.exit(process.exitCode ?? 0);
});
