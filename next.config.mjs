/** @file-guide
 * 목적: next.config.mjs (config)
 * 책임/재사용: 기존 런타임/빌드/검사 설정을 유지한다. 의존성·배포·비밀값 변경은 별도 근거와 검증 없이는 추가하지 않는다.
 * 검증/작업 지침: docs/contracts/FILE-GUIDE.md · docs/AGENT.md · docs/CLAUDE.md
 */

import { fileURLToPath } from 'node:url';

const FRONT_ROOT = fileURLToPath(new URL('.', import.meta.url));

// 공개 체험은 이 앱의 방문자별 메모리 API만 쓴다. 운영/로컬 upstream fallback을 복원하지 않는다.

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,

  // 홈 디렉터리의 다른 package-lock.json을 monorepo 루트로 오인하지 않게 이 앱을 tracing SSOT로 고정한다.
  outputFileTracingRoot: FRONT_ROOT,
  // 서버 전용 CommonJS Nest 산출물과 PGlite WASM을 API function에 포함한다.
  // vercel-build는 backend를 컴파일한 뒤 개발 의존성을 제거한다.
  outputFileTracingIncludes: {
    '/api/demo': ['./backend/dist/**/*', './backend/node_modules/**/*'],
  },

  // 원본의 공개 환경 변수가 남아 있어도 브라우저 요청은 이 앱 안에 머문다.
  env: { NEXT_PUBLIC_API_BASE: '/api/v1' },

  /**
   * 빌드 산출물 위치. 기본은 .next 다.
   *
   * 소스가 **파일을 지울 수 없는** 파일 시스템(마운트 · 네트워크 드라이브)에 있으면
   * Next 가 오래된 .next 를 정리하지 못하고 「Starting…」에서 멈춘다.
   * 그럴 때만 NEXT_DIST_DIR 로 다른 곳을 준다 — 평소에는 아무것도 안 바뀐다.
   *
   * ⚠️ **상대 경로만** 준다. 절대 경로를 주면 Next 가 tsconfig 의 include 에 그 절대 경로를
   *    적어 넣고, 그 폴더가 사라지면 다음 실행이 「Starting…」에서 멈춘다. 한 번 겪었다.
   */
  distDir: process.env.NEXT_DIST_DIR ?? '.next',

  // 데모도 원본과 같은 타입·린트 오류를 빌드 실패로 처리한다.
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  poweredByHeader: false,

  // 기존 보안 헤더를 유지하며 외부 API 통신·폼 전송은 같은 origin으로 제한한다.
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Content-Security-Policy', value: "connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'" },
        // 방문자별 체험 응답을 공유 캐시에 남기지 않는다.
        { key: 'Cache-Control', value: 'no-store' },
      ],
    }];
  },
};
