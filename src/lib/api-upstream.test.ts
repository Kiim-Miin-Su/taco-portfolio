/** @file-guide
 * 목적: 공개 체험에 운영 upstream 설정이 다시 들어오지 않는지 검증한다.
 * 책임/재사용: 실제 Next 설정을 별도 Node 실행에서 읽어 환경 변수와 배포 경계를 대조한다.
 * 검증/작업 지침: next.config.mjs · src/api/demo-origin.test.ts
 */

import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

type DemoConfig = {
  base: string;
  hasRewrite: boolean;
  headers: Array<{ key: string; value: string }>;
};

function readConfig(): DemoConfig {
  const result = execFileSync(process.execPath, ['--input-type=module', '--eval', `
    const { default: config } = await import('./next.config.mjs');
    const rules = await config.headers();
    process.stdout.write(JSON.stringify({
      base: config.env.NEXT_PUBLIC_API_BASE,
      hasRewrite: config.rewrites !== undefined,
      headers: rules[0].headers,
    }));
  `], {
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      TACO_API_UPSTREAM: 'https://outside.invalid/api/v1',
      NEXT_PUBLIC_API_BASE: 'https://outside.invalid/api/v1',
    },
  });
  return JSON.parse(result) as DemoConfig;
}

describe('공개 체험의 외부 연결 차단', () => {
  it('운영 주소 환경 변수가 있어도 rewrite나 외부 baseURL을 만들지 않는다', () => {
    const config = readConfig();
    expect(config.base).toBe('/api/v1');
    expect(config.hasRewrite).toBe(false);
  });

  it('브라우저의 API 통신과 폼 전송을 같은 origin으로 제한한다', () => {
    const config = readConfig();
    const csp = config.headers.find((header) => header.key === 'Content-Security-Policy')?.value;
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(config.headers).toContainEqual({ key: 'Cache-Control', value: 'no-store' });
  });
});
