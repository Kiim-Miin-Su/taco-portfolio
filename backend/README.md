# TACO 공개 체험 Backend

기존 ERP의 커밋 소스를 재사용해 방문자의 브라우저 RAM에 보관하는 상태로 CRUD를 실행합니다. 원본 저장소의 환경 파일, `.vercel`, Git 이력, 미커밋 변경을 복사하지 않았습니다. 출처 커밋은 `SOURCE.json`, 공개 계약은 `openapi.json`에 기록합니다.

`demo/entry.ts`의 `handleDemoRequest()`가 유일한 공개 실행 진입점입니다. 빌드 출력은 `dist/demo/entry.js`입니다. 요청 전체를 직렬화하고 `행·시퀀스 복원 → 기존 Nest HTTP 처리 → 스냅숏 반환 → 기본 상태 복원` 순서로 실행합니다. 콜드 프로세스에서도 요청의 상태로 복원하므로 서버 세션 Map이나 운영 DB에 의존하지 않습니다.

```sh
npm ci --ignore-scripts
npm run typecheck
npm run lint
npm run build
npm run test:demo
npm run spike
```

## 데모 경계

- `src/data-source.ts`는 PGlite `memory://`만 사용하며 환경 파일과 네트워크 PostgreSQL을 읽지 않습니다.
- 원본 Controller·DTO·Service의 309개 계약을 재사용합니다. 정적 매핑 수가 모든 CRUD의 실행 검증을 뜻하지는 않습니다.
- `typeorm-pglite`는 프로세스 singleton입니다. mutex를 제거하거나 요청 중간에 해제하면 방문자 격리가 깨집니다.
- 실행 중 요청과 대기를 합쳐 인스턴스당 20개까지만 수용합니다. 초과 시 방문자 상태를 보존하고 429 `DEMO_BUSY`로 재시도를 안내합니다.
- `demo/pg-compat.ts`는 enum 배열 입력, PostgreSQL `rowCount`/command, `bytea` Buffer 결과를 보정합니다. 학생 등록의 멱등 fingerprint도 이 경계를 사용합니다.
- 사용자 SQL을 실행하지 않습니다. 복원할 테이블·컬럼·시퀀스는 서버의 기존 스키마로 제한하며 값은 query parameter로 전달합니다. 복원용 `session_replication_role`은 transaction-local이고 종료 후 origin으로 돌아옵니다.
- 외부 메일·문자는 `DemoSender`가 체험 원장만 처리합니다. 외부 Blob과 Cron은 사용하지 않습니다. 발송·송금·운영 인증을 검증한 서비스로 표현하지 않습니다.
- OTP는 `TACO_PUBLIC_MEMORY_DEMO=true`인 이 사본에서만 `devCode`로 화면에 돌려줍니다. 합성 계정의 코드 원장·한도·검증·비밀번호 변경·기존 세션 무효화는 원본 경로를 재사용합니다. 실제 전송은 없으며 이 예외를 원본 ERP 운영에 적용하면 안 됩니다.
- 파일은 데모 전용으로 512KiB까지 허용합니다. 누적 상태는 JSON 4MiB, gzip 1MiB까지입니다. 초과 입력은 413으로 거절하고 이전 방문자 상태를 보존합니다.
- 원본 운영 계정과 연결되지 않는 공개 계정 `demo-ceo`, `demo-manager`, `demo-admin`, `demo-teacher`를 사용합니다. 비밀번호 `PortfolioDemo!2026`은 공개 체험 전용 값입니다.
- 인물·학교·연락처·링크는 합성 fixture입니다. 방문자가 바꾼 스냅숏도 해당 방문자의 체험 데이터이며 운영 인증·무결성의 증거로 취급하지 않습니다.
- 방문자 상태는 서버 저장소에 보존하지 않습니다. 브라우저 RAM 초기화 시 체험 내용이 사라집니다. 다운로드는 원본 HTTP 결과를 base64 envelope로 전달합니다.

## 검증 증거

- `evidence/spike.json`: 전체 124개 migration, seed, 행·시퀀스 복원 동등성, 복원 시간, Nest 조회 검사.
- `evidence/runtime-smoke.json`: 소켓·fetch 차단 상태의 역할·권한, TODO CRUD, 병렬 방문자 분리, 파일 왕복, refresh, 잘못된 상태 회복, 새 프로세스의 상태 재조회.
- `evidence/auth-smoke.json`: production 모드·외부 통신 차단에서 계정 생성→첫 설정과 비밀번호 찾기, 잘못된/재사용 코드 거절, 이전 세션 무효화, 방문자 분리를 검증합니다.
- `evidence/student-projection-smoke.json`: 신규 등록의 학교·학년·지도 이력과 보호자 관계가 상세·검색·명단에 표시되고 관계 수정·비우기 뒤에도 일치하는지 검사합니다. 원본 제품 미적용 이슈는 `evidence/student-readback-issue.md`입니다.
- `evidence/source-sanitization.json`, `source-differences.json`: 공개용 문자열과 데모 실행 경계의 변경 범위.
- `typecheck.log`, `lint.log`, `build.log`: 실행 결과. PGlite의 단일 연결 검증은 운영 PostgreSQL 동시성 검증을 대체하지 않습니다.

Next/Vercel 패키징 시 PGlite의 WASM·data·`contrib/btree_gist` 자산을 파일 추적에 포함해야 합니다. 실제 배포 및 브라우저 검증은 프로젝트 루트에서 별도 수행합니다.
