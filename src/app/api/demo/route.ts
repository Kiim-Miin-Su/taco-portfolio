/** 방문자 RAM snapshot만 받아 원본 Nest API를 격리 메모리 DB에서 실행한다. */
import path from 'node:path';
import type { DemoEnvelope, DemoReply } from '@/demo/transport';

interface DemoRuntime {
  handleDemoRequest: (envelope: DemoEnvelope) => Promise<DemoReply>;
}

// Node의 실제 loader로 Nest decorators/PGlite WASM을 유지한다. Webpack 변환을 거치지 않는다.
const loadRuntime = process.getBuiltinModule('node:module').createRequire(path.join(process.cwd(), 'package.json'));
let demoRuntime: DemoRuntime | undefined;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

function validEnvelope(value: unknown): value is DemoEnvelope {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const body = value as Partial<DemoEnvelope>;
  return body.version === 1 && typeof body.path === 'string' && body.path.startsWith('/')
    && !body.path.startsWith('//') && !body.path.includes('://') && body.path.length <= 4096
    && typeof body.method === 'string' && ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(body.method)
    && (body.state === undefined || (typeof body.state === 'string' && body.state.length <= 1_500_000))
    && !!body.headers && typeof body.headers === 'object' && !!body.cookies && typeof body.cookies === 'object';
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    const input = await req.text();
    if (Buffer.byteLength(input) > 4_000_000) {
      return Response.json({ code: 'DEMO_REQUEST_LIMIT', message: '체험 요청 크기를 줄여 주세요.' }, { status: 413, headers });
    }
    body = JSON.parse(input) as unknown;
  } catch {
    return Response.json({ code: 'DEMO_ENVELOPE', message: '체험판 요청 형식을 확인해 주세요.' }, { status: 400, headers });
  }
  if (!validEnvelope(body)) {
    return Response.json({ code: 'DEMO_ENVELOPE', message: '체험판 요청 형식이나 데이터 크기를 확인해 주세요.' }, { status: 400, headers });
  }
  try {
    if (!demoRuntime) {
      const loaded: unknown = loadRuntime(path.join(process.cwd(), 'backend/dist/demo/entry.js'));
      if (!loaded || typeof loaded !== 'object' || !('handleDemoRequest' in loaded)
        || typeof loaded.handleDemoRequest !== 'function') {
        throw new Error('DEMO_RUNTIME_UNAVAILABLE');
      }
      demoRuntime = loaded as DemoRuntime;
    }
    const reply = await demoRuntime.handleDemoRequest(body);
    const json = JSON.stringify(reply);
    if (Buffer.byteLength(json) > 4_000_000) {
      return Response.json({ code: 'DEMO_CAPACITY', message: '체험 데이터 한도를 넘었습니다. 초기화 후 다시 시도해 주세요.' }, { status: 413, headers });
    }
    return new Response(json, { status: 200, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'DEMO_FILE_TOO_LARGE') {
      return Response.json({ code, message: '공개 체험에서는 파일당 512KB까지 올릴 수 있습니다.' }, { status: 413, headers });
    }
    if (code === 'DEMO_STATE_LIMIT') {
      return Response.json({ code, message: '체험 데이터 한도를 넘었습니다. 초기화 후 다시 시도해 주세요.' }, { status: 413, headers });
    }
    if (['DEMO_STATE_INVALID', 'DEMO_REQUEST_INVALID', 'DEMO_PATH_INVALID', 'DEMO_REQUEST_LIMIT'].includes(code)) {
      return Response.json({ code, message: '체험 데이터 형식을 확인해 주세요. 초기화 후 다시 시도할 수 있습니다.' }, { status: 400, headers });
    }
    // 요청·DB snapshot·자격 값을 서버 로그에 남기지 않는다.
    console.error('[demo] in-memory request failed');
    return Response.json({ code: 'DEMO_UNAVAILABLE', message: '체험판을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503, headers });
  }
}
