# 공개 데모 서버리스 시작 오류 진단

공개 데모의 `503 DEMO_UNAVAILABLE`는 누락된 npm 모듈이 아니라 **CommonJS에서 ESM을 불러오는 런타임 옵션 차이**로 재현했습니다. 검증 범위는 데모 함수 시작이며, 공개 재배포 성공은 별도 HTTP 영수증으로 판단합니다.

## 원인과 근거

Vercel의 안전 진단 로그는 `phase: load`, `code: ERR_REQUIRE_ESM`을 기록했습니다. 최초 실패는 [공개 HTTP 실패 영수증](api-public-http-initial-failure.json)에 보존합니다. 상세 로컬 결과와 소스 해시는 [JSON 영수증](serverless-startup-diagnosis.json)이 소유합니다.

의존성 경로는 `backend/dist/demo/entry.js` → `light-my-request 6.8.0` → `lib/cookies.js`의 `require('cookie')` → `cookie 2.0.1`입니다. 앞 모듈은 CommonJS이고 `cookie 2.0.1`은 ESM입니다. Nest/PGlite 초기화 전에 이 로드가 실패했습니다.

[공식 Vercel 문서](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration#experimental-nodejs-require-of-es-module)는 실험적 `require(ESM)`을 기본 비활성화하며 `NODE_OPTIONS=--experimental-require-module`로 활성화할 수 있다고 명시합니다. 기본 설정의 로컬 Node 22 성공만으로 Vercel 시작 조건을 재현했다고 볼 수 없었습니다.

## 실행 결과

원본 `backend/node_modules`를 건드리지 않고 임시 폴더에 동일 package/lock과 빌드 산출물을 복사해 `npm ci --omit=dev --ignore-scripts --no-audit --no-fund`를 실행했습니다. 런타임 시험에서는 소켓 연결과 외부 fetch를 차단했습니다.

| 환경 | 결과 |
|---|---|
| Node 22.23.3, `--no-experimental-require-module` | `ERR_REQUIRE_ESM` 재현; `light-my-request/lib/cookies.js`에서 `cookie` 로드 실패 |
| Node 22.23.3, `--experimental-require-module`, `NODE_ENV=production` | entry require 328ms 성공; 익명 `GET /auth/me` → `401 UNAUTHORIZED`, 초기화 포함 3,001ms |

시간은 이 임시 macOS 실행 한 번의 측정값이며 서버리스 지연이나 성능 보장이 아닙니다. 익명 인증 요청의 401은 시작 성공을 확인하는 기대 결과입니다.

## 적용 판단과 남은 확인

데모 Vercel 프로젝트에만 `NODE_OPTIONS=--experimental-require-module`을 설정하는 방안을 채택했습니다. 의존성 버전과 업무 코드는 변경하지 않습니다. 임시 폴더의 하향 버전 검토는 저장소에 적용하지 않았습니다.

공개 함수의 재배포, 인증·CRUD 및 실제 브라우저 검수는 이 로컬 진단과 분리합니다. 후속 [공개 HTTP 영수증](api-public-http.json)의 시각과 결과를 확인해야 하며, 이 문서는 전체 기능 검수 완료를 의미하지 않습니다. 토큰·쿠키·snapshot·본문·자격 값과 원본 운영 데이터는 기록하지 않았습니다.

## 후속 공개 인증 재검증

2026-10-12 01:15:56 UTC에 시작한 [공개 인증 HTTP 영수증](auth-public-http.json)은 9개 operation의 20회 호출을 모두 기대 결과로 마쳤습니다. 비밀번호 복구 완료, 이전 토큰·암호 거절, 새 암호 재로그인, 신규 강사 최초 설정, 설정 후 API 진입과 재로그인을 확인했습니다. 전송 HTTP는 모두 200이며 업무 상태는 시나리오에 따라 200·201·204·401·403·409입니다. 이 결과는 전체 309개 operation이나 브라우저 입력 검수를 대신하지 않습니다.
