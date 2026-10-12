/**
 * 공개 데모의 상태 소유자는 현재 브라우저 탭이다.
 * 서버 인스턴스가 바뀌어도 직전 응답의 DB 상태를 복원하며, 다른 탭/방문자와 공유하지 않는다.
 * 요청을 직렬화해야 같은 과거 snapshot에서 출발한 두 쓰기가 서로 덮어쓰지 않는다.
 */
import { AxiosError, AxiosHeaders, CanceledError, type AxiosAdapter, type AxiosResponse } from 'axios';

export interface DemoEnvelope {
  version: 1;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: unknown;
  state?: string;
  cookies: Record<string, string>;
}

export interface DemoReply {
  version: 1;
  status: number;
  headers: Record<string, string>;
  body: unknown;
  encoding?: 'base64';
  state: string;
  cookies: Record<string, string>;
}

type DemoFetch = (input: string, init: RequestInit) => Promise<Response>;

function isReply(value: unknown): value is DemoReply {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const reply = value as Partial<DemoReply>;
  return reply.version === 1 && typeof reply.status === 'number' && typeof reply.state === 'string'
    && !!reply.cookies && typeof reply.cookies === 'object' && !!reply.headers && typeof reply.headers === 'object';
}

export function createDemoTransport(send: DemoFetch = (input, init) => fetch(input, init)) {
  let state: string | undefined;
  let cookies: Record<string, string> = {};
  let generation = 0;
  let queue: Promise<unknown> = Promise.resolve();

  const adapter: AxiosAdapter = (config) => {
    const requestedGeneration = generation;
    const execute = async (): Promise<AxiosResponse> => {
      if (config.signal?.aborted || generation !== requestedGeneration) {
        throw new CanceledError('체험판이 초기화되었거나 요청이 취소되었습니다.', config);
      }
      const rawPath = config.url ?? '/';
      if (!rawPath.startsWith('/') || rawPath.startsWith('//') || rawPath.includes('://')) {
        throw new AxiosError('체험판은 외부 API를 호출할 수 없습니다.', 'DEMO_EXTERNAL_REQUEST', config);
      }
      const url = new URL(rawPath.replace(/^\/api\/v1(?=\/|$)/, ''), 'https://demo.invalid');
      const parameters = config.params as Record<string, unknown> | undefined;
      for (const [key, value] of Object.entries(parameters ?? {})) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            for (const item of value) {
              url.searchParams.append(key, String(item));
            }
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      }
      let body: unknown = config.data ?? null;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body) as unknown;
        } catch {
          throw new AxiosError('체험판 요청 본문은 JSON이어야 합니다.', 'DEMO_INVALID_BODY', config);
        }
      }
      const authorization = config.headers.get('Authorization');
      const envelope: DemoEnvelope = {
        version: 1,
        method: (config.method ?? 'get').toUpperCase(),
        path: `${url.pathname}${url.search}`,
        headers: typeof authorization === 'string' ? { authorization } : {},
        body,
        state,
        cookies: { ...cookies },
      };
      const controller = new AbortController();
      let timedOut = false;
      const abort = () => controller.abort();
      config.signal?.addEventListener?.('abort', abort);
      const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, config.timeout || 60_000);
      try {
        const response = await send('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(envelope),
          signal: controller.signal,
          credentials: 'omit',
          cache: 'no-store',
        });
        if (!response.ok) {
          const errorBody: unknown = await response.json().catch(() => ({ code: 'DEMO_TRANSPORT' }));
          throw new AxiosError('체험판 요청을 처리하지 못했습니다.', AxiosError.ERR_BAD_RESPONSE, config, undefined, {
            data: errorBody, status: response.status, statusText: String(response.status), headers: AxiosHeaders.from({}), config,
          });
        }
        const reply: unknown = await response.json();
        if (!isReply(reply)) {
          throw new AxiosError('체험판 응답 형식을 확인할 수 없습니다.', 'DEMO_INVALID_REPLY', config);
        }
        if (generation !== requestedGeneration) {
          throw new CanceledError('초기화 전 응답을 적용하지 않습니다.', config);
        }
        // HTTP 업무 오류도 감사/인증 상태를 바꿀 수 있으므로 최신 snapshot을 먼저 인수한다.
        state = reply.state;
        cookies = { ...reply.cookies };
        let data: unknown = reply.body;
        if (reply.encoding === 'base64' && typeof data === 'string') {
          const binary = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
          data = config.responseType === 'arraybuffer'
            ? binary.buffer
            : new Blob([binary], { type: reply.headers['content-type'] ?? 'application/octet-stream' });
        }
        const result: AxiosResponse = {
          data,
          status: reply.status,
          statusText: String(reply.status),
          headers: AxiosHeaders.from(reply.headers),
          config,
        };
        if (reply.status < 200 || reply.status >= 300) {
          throw new AxiosError('체험판 업무 요청을 처리하지 못했습니다.', AxiosError.ERR_BAD_RESPONSE, config, undefined, result);
        }
        return result;
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          if (timedOut) {
            throw new AxiosError('체험판 응답 시간이 초과되었습니다.', AxiosError.ETIMEDOUT, config);
          }
          throw new CanceledError('체험판 요청이 취소되었습니다.', config);
        }
        if (error instanceof TypeError) {
          throw new AxiosError('체험판 서버에 연결하지 못했습니다.', AxiosError.ERR_NETWORK, config);
        }
        throw error;
      } finally {
        clearTimeout(timeout);
        config.signal?.removeEventListener?.('abort', abort);
      }
    };
    const request = queue.then(execute, execute);
    queue = request.then(() => undefined, () => undefined);
    return request;
  };

  return {
    adapter,
    reset() {
      generation += 1;
      state = undefined;
      cookies = {};
    },
  };
}

const session = createDemoTransport();
export const demoTransport = session.adapter;
export const resetDemoTransport = () => session.reset();
