/**
 * 공개 데모 통합 검수. 원본 Nest controller/service를 메모리 runtime envelope로 호출한다.
 * 실행: node scripts/verify-demo-api.mjs --out=/tmp/demo-api-qa.json
 * HTTP 재검수: DEMO_BASE_URL=http://localhost:3300 node scripts/verify-demo-api.mjs
 * 정적 검사만: --static-only. 특정 기능군: --groups=students,books,isolation (인증은 항상 실행).
 * 성공 응답을 만들어 대체하지 않는다. 결과에는 토큰·쿠키·snapshot·본문을 기록하지 않는다.
 */
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { randomUUID, createHash } from 'node:crypto';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(
    'node scripts/verify-demo-api.mjs [--static-only] [--groups=students,books,isolation] [--out=/tmp/demo-api-qa.json]\nOptional: DEMO_BASE_URL=http://localhost:3300 (calls only /api/demo)',
  );
  process.exit(0);
}
const output = resolve(args.find((arg) => arg.startsWith('--out='))?.slice(6) ?? '/tmp/taco-demo-api-qa.json');
const selected = new Set((args.find((arg) => arg.startsWith('--groups='))?.slice(9) ?? '').split(',').filter(Boolean));
const staticOnly = args.includes('--static-only');
const demoBaseURL = process.env.DEMO_BASE_URL;
if (selected.has('consulting') || selected.has('schedule') || selected.has('reports')) {
  selected.add('students');
}
const report = {
  version: 1,
  startedAt: new Date().toISOString(),
  mode: staticOnly ? 'static-only' : demoBaseURL ? 'http-memory-runtime' : 'memory-runtime',
  staticCoverage: {},
  cases: [],
  calls: [],
  boundaries: [
    '정적 controller 매핑은 실제 CRUD 실행 성공을 뜻하지 않는다.',
    '원본 309개 계약에는 학생 기본 프로필 PATCH/PUT가 없다. 학생 생성·재조회와 보호자 수정은 별도 검증한다.',
    '외부 메일·문자·은행 송금·운영 DB·브라우저 화면은 이 스크립트의 검증 대상이 아니다.',
    '상태·쿠키·Access 토큰은 실행 프로세스 메모리에만 보존한다.',
  ],
};
const operations = [];
let spec;
let handler;
let activeCase;

class CheckFailure extends Error {}
function check(value, message) {
  if (!value) {
    throw new CheckFailure(message);
  }
}
function object(value, label) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), `${label}: object required`);
  return value;
}
function rows(value, key = 'items') {
  if (Array.isArray(value)) {
    return value;
  }
  const list = object(value, 'response')[key];
  check(Array.isArray(list), `response.${key}: array required`);
  return list;
}
function safeCode(value) {
  return typeof value === 'string' && /^[A-Z0-9_]{1,100}$/.test(value) ? value : null;
}
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : Promise.resolve([join(dir, entry.name)]))),
  );
  return nested.flat();
}
const decorators = (node) => (ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : []);
function decoration(node, name) {
  return decorators(node)
    .map((item) => item.expression)
    .find((item) => ts.isCallExpression(item) && ts.isIdentifier(item.expression) && item.expression.text === name);
}
function literal(node) {
  if (node === undefined) {
    return '';
  }
  return ts.isStringLiteralLike(node) ? node.text : null;
}
function normalizePath(path) {
  return `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}
function matchOperation(method, path) {
  const pathname = path.split('?')[0];
  return operations.find(
    (op) => op.method === method && new RegExp(`^${op.path.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(pathname),
  );
}
async function inspectStaticRoutes() {
  const specPath = join(ROOT, 'backend/openapi.json');
  check(existsSync(specPath), 'backend/openapi.json missing: committed API contract must be supplied');
  const bytes = await readFile(specPath);
  spec = JSON.parse(bytes.toString('utf8'));
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, contract] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
        operations.push({ method: method.toUpperCase(), path, contract });
      }
    }
  }
  const routes = [];
  const modules = new Map();
  for (const file of (await files(join(ROOT, 'backend/src'))).filter((path) => /(?:controller|module)\.ts$/.test(path))) {
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const node of source.statements) {
      if (!ts.isClassDeclaration(node) || !node.name) {
        continue;
      }
      const moduleDecorator = decoration(node, 'Module');
      if (moduleDecorator?.arguments[0] && ts.isObjectLiteralExpression(moduleDecorator.arguments[0])) {
        const refs = { imports: [], controllers: [] };
        for (const property of moduleDecorator.arguments[0].properties) {
          if (!ts.isPropertyAssignment(property)) {
            continue;
          }
          const name = property.name.getText(source);
          if (!(name in refs) || !ts.isArrayLiteralExpression(property.initializer)) {
            continue;
          }
          refs[name] = property.initializer.elements.filter(ts.isIdentifier).map((item) => item.text);
        }
        modules.set(node.name.text, refs);
      }
      const controller = decoration(node, 'Controller');
      if (!controller) {
        continue;
      }
      const prefix = literal(controller.arguments[0]);
      check(prefix !== null, `Unsupported dynamic controller prefix: ${relative(ROOT, file)}`);
      for (const member of node.members) {
        for (const method of ['Get', 'Post', 'Put', 'Patch', 'Delete', 'Head', 'Options']) {
          const route = decoration(member, method);
          if (!route) {
            continue;
          }
          const suffix = literal(route.arguments[0]);
          check(suffix !== null, `Unsupported dynamic route: ${relative(ROOT, file)}`);
          routes.push({
            method: method.toUpperCase(),
            path: normalizePath(`${prefix}/${suffix}`).replace(/:([^/]+)/g, '{$1}'),
            controller: node.name.text,
            handler: member.name?.getText(source),
            file: relative(ROOT, file),
            line: source.getLineAndCharacterOfPosition(member.getStart(source)).line + 1,
          });
        }
      }
    }
  }
  const visited = new Set();
  const reachable = new Set();
  function visit(name) {
    if (visited.has(name)) {
      return;
    }
    visited.add(name);
    const moduleRefs = modules.get(name);
    if (!moduleRefs) {
      return;
    }
    moduleRefs.controllers.forEach((controller) => reachable.add(controller));
    moduleRefs.imports.forEach(visit);
  }
  visit('AppModule');
  const mappings = operations.map(({ method, path, contract }) => {
    const found = routes.filter((route) => route.method === method && route.path === path);
    const connected = found.filter((route) => reachable.has(route.controller));
    return { method, path, operationId: contract.operationId, matched: connected.length === 1, candidates: found };
  });
  const entry = await readFile(join(ROOT, 'backend/demo/entry.ts'), 'utf8');
  report.staticCoverage = {
    contractSha256: createHash('sha256').update(bytes).digest('hex'),
    paths: Object.keys(spec.paths).length,
    operations: operations.length,
    mappedOperations: mappings.filter((item) => item.matched).length,
    dispatch: 'backend/demo/entry.ts → createApp → AppModule → original controllers/services',
    usesOriginalDispatcher: entry.includes('createApp') && entry.includes('inject(runtime.handler'),
    mappings,
  };
  check(
    mappings.every((item) => item.matched),
    'OpenAPI operation is missing or ambiguous in reachable original controllers',
  );
  check(report.staticCoverage.usesOriginalDispatcher, 'Demo entry does not dispatch through original Nest application');
}

async function runCase(group, id, work, dependency = true) {
  if (selected.size && group !== 'auth' && !selected.has(group)) {
    return;
  }
  const record = { group, id, result: 'running', startedAt: new Date().toISOString() };
  report.cases.push(record);
  if (!dependency) {
    record.result = 'blocked';
    record.reason = 'prior required scenario failed';
    return;
  }
  activeCase = id;
  try {
    await work();
    record.result = 'pass';
  } catch (error) {
    record.result = 'fail';
    record.reason = error instanceof CheckFailure ? error.message : `runtime threw ${error?.constructor?.name ?? 'unknown'}`;
    record.errorCode = safeCode(error?.code) ?? safeCode(error?.message);
  }
  record.finishedAt = new Date().toISOString();
  await saveReport();
}
function resolveSchema(schema) {
  if (schema?.$ref) {
    return spec.components.schemas[schema.$ref.split('/').at(-1)];
  }
  return schema;
}
function assertRootContract(op, status, body) {
  const schema = resolveSchema(op?.contract.responses?.[String(status)]?.content?.['application/json']?.schema);
  if (!schema) {
    return;
  }
  if (schema.type === 'array') {
    check(Array.isArray(body), 'Contract root response must be an array');
  }
  if (schema.type === 'object' || schema.required) {
    object(body, 'contract response');
    for (const key of schema.required ?? []) {
      check(Object.hasOwn(body, key), `Contract required response key missing: ${key}`);
    }
  }
}
class Session {
  state;
  cookies = {};
  token;
  user;
  constructor(name) {
    this.name = name;
  }
  reset() {
    this.state = undefined;
    this.cookies = {};
    this.token = undefined;
    this.user = undefined;
  }
  async call(method, path, body, expected = 200) {
    const op = matchOperation(method, path);
    const call = {
      case: activeCase,
      visitor: this.name,
      method,
      path: op?.path ?? path.split('?')[0],
      expected: Array.isArray(expected) ? expected : [expected],
      actual: null,
    };
    report.calls.push(call);
    const start = performance.now();
    const reply = await handler({
      version: 1,
      method,
      path: `/api/v1${path}`,
      body,
      headers: this.token ? { authorization: `Bearer ${this.token}` } : {},
      state: this.state,
      cookies: this.cookies,
    });
    call.durationMs = Math.round(performance.now() - start);
    call.actual = reply.status;
    call.errorCode = safeCode(reply.body?.code);
    check(
      reply.version === 1 && typeof reply.state === 'string' && reply.cookies && typeof reply.cookies === 'object',
      'Invalid state envelope',
    );
    this.state = reply.state;
    this.cookies = reply.cookies;
    check(
      call.expected.includes(reply.status),
      `${method} ${call.path}: expected ${call.expected.join('/')} received ${reply.status} (${call.errorCode ?? 'no code'})`,
    );
    if (reply.status >= 200 && reply.status < 300) {
      assertRootContract(op, reply.status, reply.body);
    }
    return reply.body;
  }
  async login(role) {
    const result = await this.call('POST', '/auth/login', { loginId: `demo-${role}`, password: 'PortfolioDemo!2026' }, 201);
    check(typeof result.accessToken === 'string', 'Login token missing');
    check(result.user?.role === role, 'Login role differs from selected demo role');
    this.token = result.accessToken;
    this.user = result.user;
  }
}
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const plus = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400e3).toISOString().slice(0, 10);
const ceo = new Session('visitor-a');
const manager = new Session('visitor-manager');
const admin = new Session('visitor-admin');
const teacher = new Session('visitor-teacher');
let studentId;
let createdBookId;

async function runtimeCases() {
  await runCase('auth', 'anonymous-health-and-denial', async () => {
    const visitor = new Session('anonymous');
    await visitor.call('GET', '/health');
    await visitor.call('GET', '/students', undefined, 401);
  });
  for (const [role, session] of [
    ['ceo', ceo],
    ['manager', manager],
    ['admin', admin],
    ['teacher', teacher],
  ]) {
    await runCase('auth', `login-${role}`, async () => {
      await session.login(role);
      const me = await session.call('GET', '/auth/me');
      check(me.id === session.user.id && me.role === role, 'Authenticated identity not stable');
    });
  }
  await runCase(
    'auth',
    'refresh-cookie-contract',
    async () => {
      const refresh = await ceo.call('POST', '/auth/refresh', undefined, 201);
      check(typeof refresh.accessToken === 'string', 'Refresh result token missing');
      ceo.token = refresh.accessToken;
      await ceo.call('GET', '/auth/me');
    },
    !!ceo.user,
  );

  // 조회 실패는 각 기능군의 개별 fail로 남긴다. 비어 있는 정상 목록을 저장 성공으로 세지 않는다.
  const readPaths = [
    '/meta',
    '/students',
    '/students/options',
    '/books',
    '/books/tracking',
    '/books/deliveries',
    '/books/history',
    '/reports',
    '/consulting',
    '/consulting/templates',
    '/consulting/students',
    '/consulting/accounting',
    '/accounting',
    '/accounting/board',
    '/accounting/rates',
    '/accounting/tuition',
    '/accounting/other-income',
    '/accounting/student-refunds',
    '/ops',
    '/ops/marketing-overview',
    '/guides',
    '/guides/templates',
    '/guides/students',
    '/drawer',
    '/drawer/staff-directory',
    '/permissions',
    '/catalog',
    '/zoom',
    '/material-requests',
    `/board?from=${today.slice(0, 7)}-01&to=${plus(today, 21)}`,
    `/exec?from=${today.slice(0, 7)}-01&to=${plus(today, 21)}`,
    `/schedule/occurrences?from=${plus(today, -7)}&to=${plus(today, 21)}`,
    `/schedule/holidays?from=${today.slice(0, 7)}-01&to=${plus(today, 21)}`,
  ];
  for (const path of readPaths) {
    await runCase('read', `read-${path.split('?')[0].slice(1).replaceAll('/', '-')}`, () => ceo.call('GET', path), !!ceo.user);
  }
  for (const path of [
    '/teacher/shell',
    '/teacher/home',
    '/teacher/history',
    '/teacher/guides',
    '/teacher/guides/received',
    '/teacher/suggestions',
    '/teacher/unavailable',
    '/material-requests/options',
    '/material-requests/mine',
  ]) {
    await runCase('teacher', `read-${path.slice(1).replaceAll('/', '-')}`, () => teacher.call('GET', path), !!teacher.user);
  }
  await runCase(
    'permissions',
    'teacher-cannot-admin-read-or-write',
    async () => {
      await teacher.call('GET', '/students', undefined, 403);
      await teacher.call('GET', '/permissions', undefined, 403);
      await teacher.call('POST', '/books', { code: 'DENIED', title: '권한 차단 확인' }, 403);
    },
    !!teacher.user,
  );
  for (const [role, session] of [
    ['manager', manager],
    ['admin', admin],
  ]) {
    await runCase(
      'permissions',
      `${role}-admin-surface`,
      async () => {
        await session.call('GET', '/students');
        await session.call('GET', '/drawer/staff-directory');
      },
      !!session.user,
    );
  }

  await runCase(
    'students',
    'registration-preview-save-replay-readback',
    async () => {
      const options = await ceo.call('GET', '/students/options');
      check(
        rows(options, 'educationGrades').some((grade) => grade.educationSystem === 'KR' && grade.code === 'E6'),
        'Registration grade code missing',
      );
      const period = { from: today, fromPrecision: 'day', to: null, toPrecision: null };
      const name = `체험검수${randomUUID().slice(0, 8)}`;
      // 원본 test/student-registration-writer-db.spec.ts의 최소 정상 등록 계약을 재사용한다.
      const command = {
        requestKey: randomUUID(),
        entrySource: 'students',
        leadId: null,
        name,
        englishName: null,
        gender: 'female',
        schoolHistory: [],
        gradeHistory: [{ ...period, educationSystem: 'KR', gradeCode: 'E6' }],
        residenceHistory: [{ ...period, countryCode: 'KR', timezone: 'Asia/Seoul' }],
        textHistory: [],
        contacts: [],
        birthDate: null,
        hasCitizenship: null,
        guardians: [
          {
            relation: 'mother',
            relationOther: null,
            name: '합성 보호자',
            countryCode: 'KR',
            isPrimary: true,
            isPayer: true,
            contacts: [{ kind: 'email', value: 'demo-guardian@example.com', label: null }],
          },
        ],
        cashReceiptNumber: null,
        siblingIds: [],
        source: null,
        assigneeIds: [ceo.user.id],
        notes: null,
        allowSameName: false,
      };
      const before = await ceo.call('GET', `/students?q=${encodeURIComponent(name)}`);
      check(rows(before).length === 0, 'QA name unexpectedly preexists');
      const preview = await ceo.call('POST', '/students/preview', command);
      check(preview.saved === false && preview.studentId === null, 'Preview was reported as persisted');
      check(
        rows(await ceo.call('GET', `/students?q=${encodeURIComponent(name)}`)).length === 0,
        'Preview left a visible student row',
      );
      const saved = await ceo.call('POST', '/students', command, 201);
      check(saved.saved === true && Number.isInteger(saved.studentId), 'Registration result missing student identity');
      studentId = saved.studentId;
      const detail = await ceo.call('GET', `/students/${studentId}`);
      check(detail.name === name, 'Saved student not found on a subsequent request');
      const replay = await ceo.call('POST', '/students', command, 201);
      check(replay.replayed === true && replay.studentId === studentId, 'Registration replay created another identity');
      await ceo.call('POST', '/students', { ...command, name: `${name}변경` }, 409);
      await ceo.call('GET', `/students/${studentId}/hub`);
    },
    !!ceo.user,
  );

  await runCase(
    'students',
    'guardian-create-update-disable-readback',
    async () => {
      const added = await ceo.call(
        'POST',
        `/students/${studentId}/guardians`,
        { name: '추가 합성 보호자', relation: '부모', email: 'extra@example.com', receiveEmail: false, receiveSms: false },
        201,
      );
      check(Number.isInteger(added.id), 'Guardian identity missing');
      await ceo.call('PATCH', `/guardians/${added.id}`, { name: '수정 합성 보호자' });
      check(
        rows(await ceo.call('GET', `/students/${studentId}/guardians`), 'guardians').some(
          (row) => row.id === added.id && row.name === '수정 합성 보호자',
        ),
        'Guardian update not retained',
      );
      await ceo.call('DELETE', `/guardians/${added.id}`, undefined, [200, 204]);
      check(
        rows(await ceo.call('GET', `/students/${studentId}/guardians`), 'guardians').some(
          (row) => row.id === added.id && row.active === false,
        ),
        'Guardian disable not retained',
      );
    },
    Number.isInteger(studentId),
  );

  await runCase(
    'books',
    'book-create-update-readback',
    async () => {
      const code = `DEMO-${randomUUID().slice(0, 8)}`;
      const made = await ceo.call('POST', '/books', { code, title: '통합검수 합성 교재', pages: 48 }, 201);
      createdBookId = made.id;
      check(Number.isInteger(createdBookId), 'Book identity missing');
      await ceo.call('PATCH', `/books/${createdBookId}`, { title: '통합검수 수정 교재', pages: 60 });
      check(
        rows(await ceo.call('GET', '/books')).some((row) => row.id === createdBookId && row.title === '통합검수 수정 교재'),
        'Book update not retained',
      );
    },
    !!ceo.user,
  );

  await runCase(
    'guides',
    'guide-template-create-update-readback',
    async () => {
      const name = `체험 문구 ${randomUUID().slice(0, 8)}`;
      const made = await ceo.call('POST', '/guides/templates', { name, body: '합성 안내입니다.' }, 201);
      await ceo.call('PATCH', `/guides/templates/${made.id}`, { name, body: '수정한 합성 안내입니다.' });
      check(
        rows(await ceo.call('GET', '/guides/templates')).some(
          (row) => row.id === made.id && row.body === '수정한 합성 안내입니다.',
        ),
        'Guide template update not retained',
      );
    },
    !!ceo.user,
  );

  await runCase(
    'ops',
    'marketing-create-replay-update-stale',
    async () => {
      const command = {
        requestKey: randomUUID(),
        title: '체험 마케팅 활동',
        channel: 'instagram',
        item: 'post',
        url: null,
        onDate: today,
        byId: ceo.user.id,
        memo: '합성 활동',
      };
      const made = await ceo.call('POST', '/ops/marketing', command, 201);
      const replay = await ceo.call('POST', '/ops/marketing', command, 201);
      check(made.id === replay.id, 'Marketing replay duplicated a row');
      const update = { requestKey: randomUUID(), expectedVersion: made.version, title: '체험 마케팅 수정' };
      await ceo.call('PATCH', `/ops/marketing/${made.id}`, update);
      check(
        rows(await ceo.call('GET', '/ops'), 'marketing').some((row) => row.id === made.id && row.title === update.title),
        'Marketing update not retained',
      );
      await ceo.call('PATCH', `/ops/marketing/${made.id}`, { ...update, requestKey: randomUUID(), title: '오래된 화면' }, 409);
    },
    !!ceo.user,
  );

  await runCase(
    'ops',
    'todo-create-complete-readback',
    async () => {
      const made = await ceo.call('POST', '/drawer/todos', { title: '체험 검수 할 일', dueOn: plus(today, 2) }, 201);
      await ceo.call('PATCH', `/drawer/todos/${made.id}`, { done: true });
      const drawer = await ceo.call('GET', '/drawer');
      check(
        rows(drawer, 'todos').some((row) => row.id === made.id && row.done === true),
        'Completed todo not returned',
      );
    },
    !!ceo.user,
  );

  await runCase(
    'teacher',
    'teacher-suggestion-create-readback',
    async () => {
      const before = await teacher.call('GET', '/teacher/suggestions');
      check(before.canPost === true, 'Seed teacher suggestion quota prevents the normal writer scenario');
      const made = await teacher.call(
        'POST',
        '/teacher/suggestions',
        { category: 'etc', body: '체험 검수용 합성 건의입니다.' },
        201,
      );
      check(
        rows(await teacher.call('GET', '/teacher/suggestions')).some((row) => row.id === made.id),
        'Teacher suggestion missing after reload',
      );
    },
    !!teacher.user,
  );

  await runCase(
    'consulting',
    'template-create-consulting-readback',
    async () => {
      const templates = rows(await ceo.call('GET', '/consulting/templates'));
      const template = templates.find((item) => item.consType === 'admissions');
      check(!!template, 'Admissions template contract absent');
      if (!template.enabled) {
        await ceo.call('PATCH', '/consulting/templates/admissions', {
          requestKey: randomUUID(),
          expectedVersion: template.version ?? 0,
          items: [{ label: '합성 목표 확인', required: true }],
        });
      }
      const command = {
        requestKey: randomUUID(),
        consType: 'admissions',
        studentIds: [studentId],
        requester: 'mother',
        ownerId: ceo.user.id,
        amount: 100000,
        sessions: 2,
        startOn: today,
        endOn: plus(today, 30),
        share: 'private',
        pickedStaffIds: [],
      };
      const made = await ceo.call('POST', '/consulting', command, 201);
      const detail = await ceo.call('GET', `/consulting/${made.id}`);
      check(detail.id === made.id, 'Consulting detail identity differs');
    },
    !!ceo.user && Number.isInteger(studentId),
  );

  await runCase(
    'schedule',
    'schedule-create-readback-undo',
    async () => {
      const day = plus(today, 35);
      const made = await ceo.call(
        'POST',
        '/schedule',
        {
          kindKey: 'class',
          subKey: null,
          mode: 'offline',
          fromDate: day,
          toDate: null,
          rrule: 'ONCE',
          startMin: 480,
          endMin: 510,
          teacherId: null,
          roomId: null,
          title: '체험 검수 수업',
          studentIds: [studentId],
        },
        201,
      );
      const id = made.serIds?.[0];
      check(Number.isInteger(id) && typeof made.undoToken === 'string', 'Schedule write identity or undo token missing');
      const occurrenceRows = (body) => (Array.isArray(body) ? body : rows(body));
      check(
        occurrenceRows(await ceo.call('GET', `/schedule/occurrences?from=${day}&to=${day}`)).some((row) => row.serId === id),
        'Created occurrence not retained',
      );
      await ceo.call('POST', '/schedule/undo', { token: made.undoToken }, 201);
      check(
        !occurrenceRows(await ceo.call('GET', `/schedule/occurrences?from=${day}&to=${day}`)).some((row) => row.serId === id),
        'Schedule undo did not remove the created occurrence',
      );
    },
    !!ceo.user && Number.isInteger(studentId),
  );

  await runCase(
    'reports',
    'structured-report-draft-stale-readback',
    async () => {
      const day = plus(today, -1);
      const made = await ceo.call(
        'POST',
        '/schedule',
        {
          kindKey: 'class',
          subKey: null,
          mode: 'offline',
          fromDate: day,
          toDate: null,
          rrule: 'ONCE',
          startMin: 60,
          endMin: 90,
          teacherId: teacher.user.id,
          roomId: null,
          title: '구조화 리포트 검수',
          studentIds: [studentId],
        },
        201,
      );
      const id = made.serIds?.[0];
      check(Number.isInteger(id), 'Report scenario schedule identity missing');
      const path = `/reports/${id}/${day}`;
      const detail = await ceo.call('GET', path);
      check(detail.canEdit && detail.formKind === 'individual', 'Report scenario is not editable individual class');
      const command = {
        formatVersion: 1,
        expectedVersion: detail.version,
        language: 'ko',
        structuredBody: {
          kind: 'individual',
          content: '학생의 학습 과정을 정리한 합성 수업 기록입니다.',
          progress: null,
          homework: null,
        },
      };
      const draft = await ceo.call('PUT', `${path}/draft`, command);
      check(draft.version > detail.version && draft.state === 'draft', 'Draft version did not advance');
      const reloaded = await ceo.call('GET', path);
      check(reloaded.structuredBody?.content === command.structuredBody.content, 'Structured draft text not retained');
      await ceo.call('PUT', `${path}/draft`, command, 409);
      check((await ceo.call('GET', path)).version === draft.version, 'Stale draft changed stored version');
    },
    !!ceo.user && !!teacher.user && Number.isInteger(studentId),
  );

  await runCase('accounting', 'expense-request-self-review-denial-and-rejection', async () => {
    // 한 방문자의 데이터에서 역할만 전환한다. 독립 방문자끼리 결과를 전달하지 않는다.
    const session = new Session('expense-workflow');
    await session.login('manager');
    const made = await session.call(
      'POST',
      '/accounting/expenses',
      {
        spendOn: today,
        category: 'supply',
        requestedAmount: 1000,
        merchant: '합성 문구점',
        purpose: '체험 비품',
      },
      201,
    );
    check(made.state === 'pending', 'Expense request was finalized before review');
    await session.call('POST', `/accounting/expenses/${made.id}/review`, { decision: 'approve', amount: 1000 }, 403);
    await session.login('ceo');
    const rejected = await session.call(
      'POST',
      `/accounting/expenses/${made.id}/review`,
      { decision: 'reject', reason: '합성 영수증 첨부 필요' },
      201,
    );
    check(rejected.state === 'rejected', 'Expense rejection state missing');
    await session.login('manager');
    check(
      rows(await session.call('GET', '/accounting/expenses/mine')).some(
        (row) => row.id === made.id && row.state === 'rejected',
      ),
      'Expense review not retained for requester',
    );
  });

  await runCase('isolation', 'independent-visitors-same-row-and-reset', async () => {
    const a = new Session('isolation-a');
    const b = new Session('isolation-b');
    await a.login('ceo');
    await b.login('ceo');
    const first = rows(await a.call('GET', '/books'))[0];
    check(!!first && Number.isInteger(first.id), 'Synthetic baseline has no book for isolation scenario');
    const find = async (session) => rows(await session.call('GET', '/books')).find((row) => row.id === first.id);
    check((await find(b))?.title === first.title, 'Fresh visitor baselines differ');
    await a.call('PATCH', `/books/${first.id}`, { title: '독립 방문자 A 수정' });
    check((await find(a))?.title === '독립 방문자 A 수정', 'Visitor A write not retained');
    check((await find(b))?.title === first.title, 'Visitor A write leaked to visitor B');
    await b.call('PATCH', `/books/${first.id}`, { title: '독립 방문자 B 수정' });
    check((await find(a))?.title === '독립 방문자 A 수정', 'Visitor B write overwrote visitor A');
    check((await find(b))?.title === '독립 방문자 B 수정', 'Visitor B write not retained');
    a.reset();
    await a.call('GET', '/books', undefined, 401);
    await a.login('ceo');
    check((await find(a))?.title === first.title, 'Reset did not restore baseline');
    check((await find(b))?.title === '독립 방문자 B 수정', 'Reset changed another visitor');
  });
}

async function saveReport() {
  report.finishedAt = new Date().toISOString();
  const attempted = new Set(report.calls.map((call) => `${call.method} ${call.path}`));
  const executed = new Set(
    report.calls.filter((call) => Number.isInteger(call.actual)).map((call) => `${call.method} ${call.path}`),
  );
  const successful = new Set(
    report.calls.filter((call) => call.actual >= 200 && call.actual < 300).map((call) => `${call.method} ${call.path}`),
  );
  report.summary = {
    cases: report.cases.length,
    passed: report.cases.filter((item) => item.result === 'pass').length,
    failed: report.cases.filter((item) => item.result === 'fail').length,
    blocked: report.cases.filter((item) => item.result === 'blocked').length,
    calls: report.calls.length,
    attemptedOperations: attempted.size,
    actualOperationsExercised: executed.size,
    successfulOperations: successful.size,
    totalContractOperations: operations.length,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
}

try {
  const groups = new Set([
    'auth',
    'read',
    'teacher',
    'permissions',
    'students',
    'books',
    'guides',
    'ops',
    'consulting',
    'schedule',
    'reports',
    'accounting',
    'isolation',
  ]);
  check(
    [...selected].every((group) => groups.has(group)),
    'Unknown verification group',
  );
  await inspectStaticRoutes();
  if (!staticOnly) {
    if (demoBaseURL) {
      const base = new URL(demoBaseURL);
      check(
        ['http:', 'https:'].includes(base.protocol) && !base.username && !base.password && !base.search && !base.hash,
        'DEMO_BASE_URL must be an http(s) demo origin without credentials',
      );
      report.targetOrigin = base.origin;
      handler = async (envelope) => {
        const response = await fetch(new URL('/api/demo', base), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(envelope),
          signal: AbortSignal.timeout(90_000),
        });
        check(response.ok, `Demo HTTP bridge returned ${response.status}`);
        return response.json();
      };
    } else {
      const entry = join(ROOT, 'backend/dist/demo/entry.js');
      check(existsSync(entry), 'backend/dist/demo/entry.js missing: build the demo backend first');
      const require = createRequire(pathToFileURL(entry));
      handler = require(entry).handleDemoRequest;
      check(typeof handler === 'function', 'handleDemoRequest export missing');
    }
    await runtimeCases();
  }
} catch (error) {
  report.fatal = error instanceof CheckFailure ? error.message : `runtime threw ${error?.constructor?.name ?? 'unknown'}`;
  report.errorCode = safeCode(error?.code) ?? safeCode(error?.message);
}
await saveReport();
console.log(
  JSON.stringify({
    output,
    staticMapped: report.staticCoverage.mappedOperations ?? 0,
    ...report.summary,
    fatal: report.fatal ?? null,
  }),
);
// PGlite/Nest가 보유한 timer와 worker를 남기지 않는다. 모든 awaited 검증과 파일 쓰기는 위에서 완료했다.
process.exit(report.fatal || report.summary.failed || report.summary.blocked ? 1 : 0);
