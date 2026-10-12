/* Ensure normalized registration values survive snapshot restore and reach the existing read screens. */
const net = require('node:net');
net.Socket.prototype.connect = function forbiddenConnect() { throw new Error('DEMO_TEST_NETWORK_FORBIDDEN'); };
global.fetch = async () => { throw new Error('DEMO_TEST_FETCH_FORBIDDEN'); };
process.env.NODE_ENV = 'production';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { gunzipSync } = require('node:zlib');
const { handleDemoRequest } = require('../dist/demo/entry.js');
const results = { startedAt: new Date().toISOString(), networkDisabled: true, checks: [] };
const visitor = { state: undefined, cookies: {}, accessToken: undefined };
async function call(method, path, body) {
  const response = await handleDemoRequest({ version: 1, method, path, body, state: visitor.state, cookies: visitor.cookies,
    headers: visitor.accessToken ? { authorization: `Bearer ${visitor.accessToken}` } : {} });
  visitor.state = response.state;
  visitor.cookies = response.cookies;
  results.checks.push({ method, path, status: response.status });
  return response;
}
async function main() {
  const login = await call('POST', '/auth/login', { loginId: 'demo-ceo', password: 'PortfolioDemo!2026' });
  assert.equal(login.status, 201);
  visitor.accessToken = login.body.accessToken;
  const baseline = JSON.parse(gunzipSync(Buffer.from(visitor.state, 'base64')).toString());
  const madeSchool = await call('POST', '/students/schools', { requestKey: randomUUID(), name: '체험 조회 학교', countryCode: 'KR', region: null, campus: null });
  assert.equal(madeSchool.status, 201);
  const school = madeSchool.body;
  const legacy = baseline.tables.stu.find((row) => row.school && row.grade);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  const period = { from: today, fromPrecision: 'day', to: null, toPrecision: null };
  const command = {
    requestKey: randomUUID(), entrySource: 'students', leadId: null, name: '새 등록 조회 검수', englishName: null, gender: 'female',
    schoolHistory: [{ ...period, schoolId: Number(school.id) }],
    gradeHistory: [{ ...period, educationSystem: 'US', gradeCode: 'G5' }],
    residenceHistory: [{ ...period, countryCode: 'KR', timezone: 'Asia/Seoul' }],
    textHistory: [{ ...period, field: 'guidance', value: '합성 지도 내용' }], contacts: [], birthDate: null, hasCitizenship: null,
    guardians: [{ relation: 'mother', relationOther: null, name: '합성 어머니', countryCode: 'KR', isPrimary: true, isPayer: true,
      contacts: [{ kind: 'email', value: 'projection-qa@example.com', label: null }] }],
    cashReceiptNumber: null, siblingIds: [], source: null, assigneeIds: [login.body.user.id], notes: null, allowSameName: false,
  };
  const created = await call('POST', '/students', command);
  assert.equal(created.status, 201);
  const id = created.body.studentId;
  const detail = await call('GET', `/students/${id}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.school, school.name, 'current school period must reach student detail');
  assert.equal(detail.body.grade, 'G5');
  assert.equal(detail.body.guidance, '합성 지도 내용');
  assert.equal(detail.body.guardians[0].relation, '어머니');
  const list = await call('GET', `/students?q=${encodeURIComponent(command.name)}&grade=G5`);
  assert.equal(list.body.items[0].id, id);
  assert.equal(list.body.items[0].school, school.name);
  assert.ok(list.body.grades.includes('G5'));
  const meta = await call('GET', '/meta');
  assert.equal(meta.body.students.find((row) => row.id === id).grade, 'G5');
  assert.equal(meta.body.students.find((row) => row.id === id).school, school.name);
  const guardians = await call('GET', `/students/${id}/guardians`);
  assert.equal(guardians.body.guardians[0].relation, '어머니');
  const guardianId = guardians.body.guardians[0].id;
  assert.equal((await call('PATCH', `/guardians/${guardianId}`, { relation: '체험 관계 수정' })).body.relation, '체험 관계 수정');
  assert.equal((await call('PATCH', `/guardians/${guardianId}`, { relation: null })).body.relation, null);
  assert.equal((await call('GET', `/students/${id}`)).body.guardians[0].relation, null);
  if (legacy) {
    const old = await call('GET', `/students/${legacy.id}`);
    assert.equal(old.body.school, legacy.school);
    assert.equal(old.body.grade, legacy.grade);
  }
  results.success = true;
}
main().catch((error) => { results.success = false; results.failure = error.message; process.exitCode = 1; }).finally(() => {
  fs.mkdirSync('evidence', { recursive: true });
  fs.writeFileSync('evidence/student-projection-smoke.json', JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
  process.exit(process.exitCode ?? 0);
});
