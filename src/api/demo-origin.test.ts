import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it('외부 API 환경 변수가 있어도 공개 데모 요청 기준 주소를 바꾸지 않는다', async () => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE', 'https://outside.invalid/api/v1');
  vi.resetModules();
  const { api } = await import('./client');
  expect(api.defaults.baseURL).toBe('/api/v1');
});
