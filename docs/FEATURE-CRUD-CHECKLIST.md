<!-- @file-guide
목적: 원본309 API와31 route entry를 공개 데모 기능별 계획·실행 체크리스트로 연결한다.
책임/재사용: FEATURE-CRUD-CHECKLIST.json이 기계 판독 목록을 소유한다. 최상위 범위와 실행 순서는 ../AGENTS.md·../PLAN.md를 따른다.
검증/작업 지침: source SHA·operationId·정적 호출자·역할별 실제 CRUD 증거를 구분하며 실행하지 않은 검증은 pending으로 둔다.
-->

# 공개 데모 기능·CRUD 체크리스트

작성일: 2026-10-12. 상태: **공개 데모 API 부분 실행 증거 반영, 전수 검수 미완료**. [JSON 목록](FEATURE-CRUD-CHECKLIST.json)과 같은 ID를 사용한다. 원본 파일·운영 앱·DB·배포는 변경하지 않았다.

## 기준과 수량

| 기준 | 목록 수 | 실행 검증 |
|---|---:|---|
| OpenAPI path | 279 | 구조 목록만 확인 |
| API operation (method + path + operationId) | 309 | 정적 재사용309/309 · 선택 호출78/309 · 미실행231/309 |
| 기능 tag | 22 | 아래 기능군별 부분 실행 범위 참조; 전체 scenario 완료 없음 |
| Front HTTP 호출 지점 | 310 | 310곳을 OpenAPI에 정적으로 연결; 런타임 PASS 아님 |
| route entry | 31 | 이번 API 영수증으로 S01~S04 완료 추가0/31; 브라우저 증거 별도 |
| 실제 page entry / redirect entry | 28 / 3 | 표시·입력 / 목적지·query 보존을 각각 검증 |

목록 생성 당시 원본 HEAD와 dirty 상태·파일 SHA는 JSON의 source에 고정했다. [데모 OpenAPI](../backend/openapi.json), [공용 Query](../src/api/queries.ts), [학생 API](../src/api/students.ts), `원본 contract-audit.mjs` (대조 기록)를 읽었다. 원본 감사 도구의 `--write`는 실행하지 않았다. R117 배포 commit은 참고 기준이며 현재 로컬 후속 변경을 배포 성과로 포함하지 않는다.

PGlite 메모리 DB와 기존 Nest dispatcher를 구현하고 선택된 API를 직접 실행·localhost HTTP·공개 데모 HTTP로 검증했다. 방문자 RAM snapshot을 복원하므로 warm instance의 세션 Map을 전제로 하지 않는다. 이번 영수증은 선택된 교재 상태의 방문자 분리/reset을 확인하며, 모든 화면·분기·브라우저 reload/새탭·운영 PostgreSQL 동시성의 완료 증거는 아니다.

## 반영한 실행 영수증

| 증거 | 시나리오/회귀 | 호출 | 호출한 고유 API | 범위 |
|---|---:|---:|---:|---|
| [S 정적 매핑](evidence/api-static.json) | 0 | 0 | 0/309 | controller 정적 대응309/309 |
| [M 메모리 런타임](evidence/api-runtime.json) | 63/63 case 통과 | 126 | 72/309 | 선택된 기존 Nest API와 case assertion |
| [H 로컬 HTTP](evidence/api-local-http.json) | 63/63 case 통과 | 126 | 72/309 | localhost:3300의 동일 선택 범위 |
| [P 공개 HTTP](evidence/api-public-http.json) | 63/63 case 통과 | 126 | 72/309 | taco-portfolio.vercel.app의 선택 범위 |
| [A 공개 인증](evidence/auth-public-http.json) | 인증 회귀1회 통과 | 20 checks | 9/309 | 비밀번호 복구·최초 설정·재로그인·선택 오류 |

고유 API 합집합은 **78/309**, 미실행은 **231/309**다. M/H/P 각72개와 A9개를 단순 합산하지 않는다. A가 추가한6개는 복구 codes/complete, 최초 설정 info/codes/complete, 구성원 생성이다. 공개 P+A만의 합집합도78개다. 총398회 호출 중 공개 HTTP는146회이며 기대한401/403/409도 정상 시나리오 결과다. `2xx 관측78개`는 모든 성공·오류 분기 완료가 아니므로 C01~C07 전체 완료는0/309로 유지한다.

M/H/P의 `calls.method/path → 각 보고서 staticCoverage.mappings.operationId → JSON operationId`를 대조했다. A의 `checks.method/path`는 P의 mapping과 대조했다.398회가 모두 일치하며 JSON `runtimeExecution`에 원본 index·상태 수를 남겼다. A는 자체 caseId/visitor/계약 SHA를 기록하지 않아 이를 새로 만들어 넣지 않는다. A의20 checks를20개 시나리오로 세지 않으며 M/H/P의 고유 case ID는63개다.

M/H는2026-10-12 00:37~00:41 UTC의 이전 계약 기록이다. P는01:13:53~01:19:47 UTC, A는01:15:56 UTC 시작한 공개 데모 기록이다. 원본 목록의 SHA는 보존하고 현재 데모 계약의309개 method/path/operationId도 재대조했다. 각 SHA는 JSON `source`, `currentDemoContract`, `evidenceReports`에 있다. 초기503은 [실패 영수증](evidence/api-public-http-initial-failure.json)과 [시작 오류 진단](evidence/serverless-startup-diagnosis.md)에 보존하며 후속 성공과 구분한다.

선택된 학생 preview·재시도·충돌, 리포트 stale409, 지출 자기 승인403·반려, 방문자별 교재 수정·reset, 비밀번호 복구와 최초 설정은 실행했다. 모든 권한·입력·원자성·동시성 조합은 남아 있다. [별도 브라우저 탐색](evidence/browser-navigation.md)은31/31진입·25/31본문·6/31인증 경계 관찰이며, 이 링크를 S01~S04 전체 완료나 모든 CRUD 저장 증거로 계산하지 않는다. 원본 ERP 운영 검증과 공개 메모리 데모 검증도 구분한다.

## 체크 방법

각 API는 아래 C01~C07을, 각 route는 S01~S04를 실행한다. 이번 API 부분 실행은 C02~C06의 해당 항목만 partial로 남긴다. C01 화면 연결과 C07 부작용·개인정보 전수 검수는 이 API 보고서로 완료하지 않는다. 해당하지 않는 항목만 원본 계약과 사유를 기록해 N/A로 바꾼다. handler 재사용·API 개수 일치·화면 렌더만으로 PASS할 수 없다.

| ID | 항목 | 실행 확인 |
|---|---|---|
| C01 | 화면·계약 연결 | 기존 화면 input/action에서 해당 method/path·DTO를 실제로 호출하고 상태/오류 형상을 대조한다. |
| C02 | 성공·재조회 | 합성 사전 상태→요청→응답→메모리 DB 전후→같은 방문자의 재조회 결과를 기록한다. 읽기는 존재/빈 상태를 확인한다. |
| C03 | 역할·소유권 | 허용 actor와 금지 actor를 직접 API로 확인한다. 역할을 추정하지 않고 기존 guard·서비스 정책·금지 필드 projection을 따른다. |
| C04 | 입력·오류·원자성 | 필수/형식/범위/존재하지 않는 ID·충돌 입력을 실행하고 실패 시 레코드·이력·알림이 중간 상태로 남지 않는지 확인한다. |
| C05 | 버전·중복·동시성 | 원본 계약에 version/requestKey/잠금이 있는 경로는 stale/replay/동시 변경을 검증한다. 해당하지 않으면 사유를 기록한 뒤 N/A로 변경한다. |
| C06 | 방문자 격리·초기화 | 다른 방문자 상태에 영향이 없고 reset 후 합성 baseline으로 복귀하며 durable DB·브라우저 영속 저장을 쓰지 않는지 확인한다. |
| C07 | 부작용·개인정보 | 응답·이력·로그·파일·출력에 합성 정보만 남고 외부 OTP/email/SMS/계좌/스토리지 요청이 없는지 확인한다. |
| S01 | 페이지 진입·복귀 | 직접 URL·메뉴·딥링크·뒤로가기로 정확한 페이지/대상에 도달한다. redirect entry는 목적지와 검색 매개변수를 검증한다. |
| S02 | CRUD input 경로 | 보이는 입력·선택·버튼을 실제로 조작해 연결 API와 재조회까지 확인한다. API/handler 존재만으로 PASS하지 않는다. |
| S03 | UI 상태·반응형 | 로딩·빈 결과·입력 오류·저장 실패·충돌 복구·모바일390/데스크톱을 확인한다. |
| S04 | 로컬 모의/초기화 표시 | 실제 서비스와 구분되는 데모·외부발송 모의·비영속 경계를 설명하고 초기화 동선을 확인한다. |

각 결과에는 actor·합성 입력·사전 메모리 상태·HTTP/로컬 응답·DB 전후·이력/알림·재조회·실패/복구·실행일·소스 버전·증거 경로를 남긴다. API의 공용 오류 목록이 있다고 모든 경로에서 모든 오류가 발생한다고 가정하지 않는다. 역할은 Swagger 보안 이름만으로 추정하지 않고 기존 guard와 업무 함수를 대조한다. JSON의 `ceo/admin/manager/teacher`는 원본 role_t 값이며 `anonymous`는 인증 없는 요청 시나리오다.

## 원본과 공개 데모의 차이

| ID | 영역 | 확인한 범위·증거 | 남은 검수 | 상태 |
|---|---|---|---|---|
| D01 | 업무 화면·계약 | 원본 dispatcher 정적309개와 선택 API78개를 연결했고 공개 학생 생성·재조회와 새 강사 입력/첫설정 표시를 확인했다. [api-static](evidence/api-static.json) · [api-runtime](evidence/api-runtime.json) · [api-local-http](evidence/api-local-http.json) · [api-public-http](evidence/api-public-http.json) · [auth-public-http](evidence/auth-public-http.json) · [browser-public-student](evidence/browser-public-student.json) · [browser-public-onboarding](evidence/browser-public-onboarding.json) | 309 operation의 모든 화면 입력·권한·계산·오류·CRUD 분기는 미완료다. | partial |
| D02 | DB 수명 | 논리 snapshot의 A/B 복원 일치, cold 프로세스 파일 bytes, 방문자별 교재·암호 격리 및 공개 학생 reset readback을 확인했다. [api-runtime](evidence/api-runtime.json) · [api-local-http](evidence/api-local-http.json) · [api-public-http](evidence/api-public-http.json) · [auth-public-http](evidence/auth-public-http.json) · [spike](../backend/evidence/spike.json) · [runtime-smoke](../backend/evidence/runtime-smoke.json) · [browser-public-student](evidence/browser-public-student.json) | 전체 화면·reload·새탭·브라우저 영속 저장 검수는 별도다. | partial |
| D03 | 실행 엔진 | PGlite에서124 migration과149 table snapshot 복원, 선택 Nest/TypeORM API 및 공개 HTTP 실행을 확인했다. [api-runtime](evidence/api-runtime.json) · [api-local-http](evidence/api-local-http.json) · [api-public-http](evidence/api-public-http.json) · [auth-public-http](evidence/auth-public-http.json) · [spike](../backend/evidence/spike.json) · [runtime-smoke](../backend/evidence/runtime-smoke.json) | 모든 SQL·extension·업무 동시성 또는 운영 PostgreSQL 검증 완료가 아니다. | partial |
| D04 | OTP/email/SMS | 네트워크 차단 OTP 회귀, 공개 복구/첫설정 완료·재로그인, 브라우저 체험코드·실발송 없음 표시를 확인했다. [auth-public-http](evidence/auth-public-http.json) · [auth-smoke](../backend/evidence/auth-smoke.json) · [browser-public-onboarding](evidence/browser-public-onboarding.json) | 브라우저 최종 OTP 제출/암호 변경은 API 증거와 분리한다. 모든 입력/재시도 분기와 공개 provider egress 전수 계측은 별도다. | partial |
| D05 | 지급·환불·증빙 | 회계·환불 목록 조회와 지출 생성→자기 승인403→반려→재조회를 선택 실행했다. [api-public-http](evidence/api-public-http.json) | 지급·환불 확정·증빙 발급·계좌 보호 전체 분기는 미완료이며 실제 이체·결제망·외부 회계 연동을 실행하지 않았다. | partial |
| D06 | 파일·Zoom·외부 링크 | 합성 binary의 방문자 메모리 업로드/다운로드·cold 복원·용량 제한과 Zoom identity/domain 치환 이력을 확인했다. [runtime-smoke](../backend/evidence/runtime-smoke.json) · [source-sanitization](../backend/evidence/source-sanitization.json) | 모든 문서 생성·미리보기·Zoom/보호자 링크의 목적지 전수 검수는 남아 있다. | partial |
| D07 | seed·개인정보 | 소스 치환 이력·제한된 비밀 패턴 스캔·합성 학생/강사 공개 브라우저 관찰을 확인했다. [public-source-scan](evidence/public-source-scan.json) · [source-sanitization](../backend/evidence/source-sanitization.json) · [source-differences](../backend/evidence/source-differences.json) · [browser-public-student](evidence/browser-public-student.json) · [browser-public-onboarding](evidence/browser-public-onboarding.json) | 모든 자유문·파생값·파일 bytes의 원본 개인정보 잔존0건을 입증하는 전수 결과는 아니다. | partial |
| D08 | 서비스 의미 | 기존 계약의309개와 수동 연결 검수 대상8개를 보존했다. GPA guard migration이 실행됐으며 /gpa 브라우저 기록은 인증 경계만 확인했다. [api-static](evidence/api-static.json) · [spike](../backend/evidence/spike.json) · [browser-navigation](evidence/browser-navigation.json) | GPA 본문/쓰기 금지 직접 검증과8개 API의 legacy/direct input 용도 전수 확인은 남아 있다. | partial |

## 합성 seed·개인정보 치환 체크리스트

기존 증거를 대조한 상태는 **전체 조건 완료0/15 · 부분 확인14/15 · 전용 검증 미실행1/15(P05)**다. 미검증 계좌 항목을 제외해도, 일부 사전검사 통과만으로 모든 출력·자유문·화면의 안전성을 완료 처리하지 않는다.

완료한 좁은 검사 결과는 따로 남긴다: [공개 소스 패턴6종 검사](evidence/public-source-scan.json)는 발견0건, [메모리 DB 호환성](../backend/evidence/spike.json)은124 migration·149 table 복원, [네트워크 차단 런타임 회귀](../backend/evidence/runtime-smoke.json)는 합성 파일 업로드/다운로드·cold 복원 일치, [OTP 회귀](../backend/evidence/auth-smoke.json)는 복구·최초설정 성공/실패 경로, [공개 학생 브라우저](evidence/browser-public-student.json)는 등록 후 초기화·재조회가 통과했다. **치환 파일 이력은 개인정보 잔존0건 스캔과 다르며 소스 패턴 검사는 생성 의존성·binary를 제외한다.**

- [ ] **P01 운영 연결·비밀값 차단 — partial** — 원본 .env*, .vercel, dump, Git 이력, 토큰·쿠키·secret·실제 DB URL을 복사하지 않는다. 새 앱의 bundle/config/network를 검사한다.

  확인: 원본 환경·Vercel·Git·미커밋 파일 제외 이력, 공개 소스의 알려진 비밀/운영 계정 패턴6종에서 발견0건, 외부 소켓/fetch를 차단한 런타임·OTP 회귀와 memory-only DB 실행을 확인했다. [public-source-scan](evidence/public-source-scan.json) · [SOURCE](../backend/SOURCE.json) · [runtime-smoke](../backend/evidence/runtime-smoke.json) · [auth-smoke](../backend/evidence/auth-smoke.json) · [spike](../backend/evidence/spike.json)

  남음: 공개 소스 스캔은 생성 의존성·binary를 제외한다. 모든 bundle·설정·브라우저/서버 네트워크 경로 전수 검수까지 완료한 기록은 아니다.

- [ ] **P02 이름·인명 치환 — partial** — STAFF/STU/GUARDIAN뿐 아니라 JSONB·리포트·안내·컨설팅·회의·검색·알림·이력의 모든 인명을 공개 데모용 합성 이름으로 바꾼다.

  확인: 직원·학생·상담자·보호자·학교 identity 치환 파일 이력이 있고 공개 학생/강사 생성·재조회 화면에서 합성 인물을 확인했다. [source-sanitization](../backend/evidence/source-sanitization.json) · [source-differences](../backend/evidence/source-differences.json) · [browser-public-student](evidence/browser-public-student.json) · [browser-public-onboarding](evidence/browser-public-onboarding.json)

  남음: 치환 이력은 모든 DB 자유문·검색색인·알림에서 원본 이름 잔존0건을 주장하는 완전한 스캔 영수증이 아니다.

- [ ] **P03 전화번호 치환 — partial** — 전화/문자 수신번호·연락처는 고정된 합성 allowlist로 바꾸고 DTO 입력 형식은 유지한다. 유효 형식이 실제 전송 가능한 번호라는 의미가 없도록 egress를 차단한다.

  확인: 합성 전화번호의 SMS 체험코드 발급·최초 설정을 네트워크 차단 회귀와 공개 API에서 확인했고 브라우저는 마스킹된 합성 연락처/실발송 없음 표시를 관찰했다. [auth-smoke](../backend/evidence/auth-smoke.json) · [auth-public-http](evidence/auth-public-http.json) · [browser-public-onboarding](evidence/browser-public-onboarding.json)

  남음: 모든 전화 컬럼·자유문·숫자 형식의 합성 allowlist 일치 검사와 모든 공개 egress 경로 계측은 남아 있다.

- [ ] **P04 email 치환 — partial** — email·login email·파일 문구는 example.com 등 예약된 예시 도메인의 합성 주소로 바꾸고 원본 도메인/연락처 잔존을 스캔한다. 실제 전송은 차단한다.

  확인: seed-domain 치환 이력과 example.com 합성 주소의 이메일 체험코드·최초 설정·재로그인을 확인했다. 로컬 인증 회귀는 외부 통신을 차단했다. [source-sanitization](../backend/evidence/source-sanitization.json) · [auth-smoke](../backend/evidence/auth-smoke.json) · [auth-public-http](evidence/auth-public-http.json) · [browser-public-onboarding](evidence/browser-public-onboarding.json)

  남음: 파일 bytes와 모든 자유문의 이메일 도메인 잔존 검사, 공개의 모든 전송 분기 계측을 완료한 것은 아니다.

- [ ] **P05 계좌·은행·신분 정보 — pending** — 합성 계좌만 사용하고 공개/마스킹/reveal·snapshot·내보내기까지 확인한다. 원본 계좌·예금주·주민번호·결제 식별자는 남기지 않는다.

  확인: 비밀 패턴 스캔과 회계/환불 목록 조회는 있으나 계좌·주민번호 전용 스캔 또는 마스킹/reveal·snapshot·내보내기 검증 영수증은 없다. [public-source-scan](evidence/public-source-scan.json) · [api-public-http](evidence/api-public-http.json)

  남음: 합성 계좌 값, 공개/마스킹/reveal 권한, snapshot과 출력·내보내기의 개인정보 경계를 전용 시나리오로 확인해야 한다.

- [ ] **P06 사용자 ID·PK/FK — partial** — 로그인 ID는 demo 전용으로 바꾼다. 내부 숫자 PK를 재사용/재생성하는 선택은 FK와 실제 actor/target 일관성을 검증한 후 기록한다. 원본 운영 ID/계정 URL을 공개하지 않는다.

  확인: 원본 초기 login identity 패턴0건, 데모 계정 로그인,124 migration/합성 seed 및 새 강사 생성→첫 설정→재로그인을 확인했다. [public-source-scan](evidence/public-source-scan.json) · [source-sanitization](../backend/evidence/source-sanitization.json) · [spike](../backend/evidence/spike.json) · [runtime-smoke](../backend/evidence/runtime-smoke.json) · [auth-public-http](evidence/auth-public-http.json) · [browser-public-onboarding](evidence/browser-public-onboarding.json)

  남음: 기존 숫자 PK/FK를 사용하는 모든 actor/target·연결 이력·계정 URL 전수 검수는 별도다.

- [ ] **P07 데모 인증·자격 — partial** — 공개 데모 자격·서명 키는 운영 자격과 분리한다. 공개 기본 계정/키는 데모 전용이며 보호 비밀이나 방문자 신원 증거로 취급하지 않는다. 코드 원장·cookie jar·snapshot은 방문자 RAM 상태로 분리하고 다른 방문자의 변경이 섞이지 않는지 검사한다.

  확인: 운영 자격 패턴0건, 네트워크 차단 로그인/refresh, 복구 후 옛 토큰·암호 거절·코드 재사용 거절, 다른 방문자의 기본 암호 유지를 확인했다. [public-source-scan](evidence/public-source-scan.json) · [runtime-smoke](../backend/evidence/runtime-smoke.json) · [auth-smoke](../backend/evidence/auth-smoke.json) · [auth-public-http](evidence/auth-public-http.json)

  남음: 모든 인증/쿠키/브라우저 저장·교차 탭·자격 전환 조합은 미완료다. 공개 데모 고정 키는 방문자 신원이나 운영 비밀을 보장하지 않는다.

- [ ] **P08 자유문·중첩 JSON — partial** — 메모·과제·관찰·학생 특이사항·연락 이력·오류 메시지·검색색인·JSONB에 원본 인명/연락처가 남는지 구조 순회와 원본 문자열 대조를 실행한다.

  확인: identity 치환 이력에 리포트·안내·컨설팅·회의·이력 관련 소스와 seed 파일이 포함되어 있다. [source-sanitization](../backend/evidence/source-sanitization.json) · [source-differences](../backend/evidence/source-differences.json)

  남음: 변경 파일 목록은 모든 중첩 JSON·자유문·검색색인을 순회해 원본 문자열 잔존0건을 단언하는 결과가 아니다. 전체 snapshot 값 대조 영수증이 필요하다.

- [ ] **P09 첨부·파일·미리보기 — partial** — 실제 사진·문서·리포트 파일은 복사하지 않는다. 합성 bytes·파일명·메타데이터·다운로드·PNG/PDF/CSV 생성 결과를 검사한다.

  확인: 합성 binary 업로드→다운로드 bytes 일치, 새 프로세스의 동일 bytes 복원,512KB 초과413 뒤 정상 요청 복구를 외부 통신 차단 상태에서 확인했다. [runtime-smoke](../backend/evidence/runtime-smoke.json)

  남음: 모든 seed 첨부·파일명·metadata와 PNG/PDF/CSV 생성/미리보기 결과의 개인정보 전수 검수는 남아 있다.

- [ ] **P10 외부 링크·서비스 URL — partial** — Zoom 링크·웹훅·메일/SMS endpoint·보호자 발송 URL·외부 스토리지 URL은 데모 내부 경로 또는 명시적 simulation으로 바꾼다.

  확인: seed-domain·Zoom meeting identity 치환 이력이 있고 외부 형식 path 거부, 메모리 파일 조회와 모의 발송 표시를 확인했다. [source-sanitization](../backend/evidence/source-sanitization.json) · [runtime-smoke](../backend/evidence/runtime-smoke.json) · [browser-public-onboarding](evidence/browser-public-onboarding.json)

  남음: 모든 Zoom/보호자 발송 링크·webhook·파일 URL의 내부 또는 simulation 목적지 목록 대조는 미완료다.

- [ ] **P11 전송 경계 — partial** — 정상·재시도·실패 경로에서 OTP/email/SMS/외부 스토리지/실제 송금 네트워크가 나가지 않는지 네트워크 계측으로 확인한다. UI 문구만 모의로 바꾸지 않는다.

  확인: 소켓 연결과 외부 fetch를 실패시키는 계측 아래 OTP 정상·잘못된 코드·재사용·파일 업로드/다운로드·용량 거절 회귀가 통과했다. [runtime-smoke](../backend/evidence/runtime-smoke.json) · [auth-smoke](../backend/evidence/auth-smoke.json)

  남음: 공개 런타임의 모든 메일/SMS/스토리지/회계 경로를 정상·재시도·실패 조합으로 계측한 증거는 아니다. 실제 은행 송금은 실행하지 않았다.

- [ ] **P12 메모리·방문자 격리 — partial** — 방문자A create/update/delete가 B에 보이지 않아야 한다. 새 방문·reload·새탭·reset의 정확한 수명은 결정·검증하고 localStorage/IndexedDB/원격DB에 업무 행을 영속화하지 않는다.

  확인: 서로 다른 snapshot 복원 일치, 동시 방문자 할 일 격리, 교재 격리/reset, 다른 방문자 암호 유지, cold 프로세스 파일 복원, 공개 학생 등록 후 reset으로19명 복귀·생성 학생 검색0건을 확인했다. [spike](../backend/evidence/spike.json) · [runtime-smoke](../backend/evidence/runtime-smoke.json) · [api-public-http](evidence/api-public-http.json) · [auth-public-http](evidence/auth-public-http.json) · [browser-public-student](evidence/browser-public-student.json)

  남음: 모든31 route의 생성/변경/삭제와 reload·새탭·브라우저 영속 저장 전수 검수는 남아 있다.

- [ ] **P13 역할별 전수 화면 — partial** — CEO/admin/manager/teacher/anonymous의 31 route entry와 공용 서랍·검색·출력에서 합성 정보만 보이는지 확인한다.

  확인: 로컬 브라우저31진입 탐색 중25본문/6인증 경계를 기록했다. 공개 로그인4역할 선택지·합성/초기화 안내, 대표 학생 등록·매니저 강사 생성/첫설정 화면도 별도 확인했다. [browser-navigation](evidence/browser-navigation.json) · [browser-public-login](evidence/browser-public-login.json) · [browser-public-student](evidence/browser-public-student.json) · [browser-public-onboarding](evidence/browser-public-onboarding.json)

  남음: 역할별31화면과 공용 서랍·검색·출력의 전수 조합, 모든 숨김 필드와 모바일 검수는 완료하지 않았다.

- [ ] **P14 데모 날짜 — partial** — seed 날짜를 옮기거나 기준 시각을 고정할 경우 전월 급여·10일 기준·마감·종류 판정·예외·반복·제출 지연 규칙이 같이 유지되는지 검증한다.

  확인: 합성 seed 실행, 강사 KST 전월 히스토리 화면, 선택 수업 생성/undo와 리포트 버전 충돌 경로를 확인했다. [browser-navigation](evidence/browser-navigation.json) · [api-public-http](evidence/api-public-http.json) · [spike](../backend/evidence/spike.json)

  정적 참고: [기존 seed 기준](../backend/src/seed/base.ts)의 `SEED_TODAY`는 `todayKst()` 기본값과 기존 `rel/RANGE`를 사용한다. 별도 고정 데모 날짜를 신설하지 않았으며 실행 증거와 구분한다.

  남음: 이 결과는 시각 이동/고정 시의10일 기준·마감·종류 판정·예외·반복·제출 지연을 모두 대조한 날짜 회귀가 아니다.

- [ ] **P15 로그·공개 산출물 — partial** — 콘솔·서버 오류·소스맵·GitHub·빌드 산출물·PPTX/스크린샷·README에 secret/실제 인명·연락처·계좌·운영자격이 없는지 공개 전 다시 스캔한다.

  확인: tracked/nonignored 소스의 알려진 비밀·운영 계정 패턴6종에서 발견0건이며 공개 브라우저 영수증은 합성 데이터만 사용하고 자격·코드 숫자를 제외했다. [public-source-scan](evidence/public-source-scan.json) · [browser-public-login](evidence/browser-public-login.json) · [browser-public-student](evidence/browser-public-student.json) · [browser-public-onboarding](evidence/browser-public-onboarding.json)

  남음: 생성 의존성·binary는 소스 스캔 제외다. 모든 로그·소스맵·PPTX·이미지·build/GitHub 산출물을 전수 검사했다고 주장하지 않는다.

## 화면·API 연결의 해석

정적 import와 명명된 Query 함수의 호출 관계를 따라 연결했다. 조건부 렌더·barrel export 때문에 도달 후보가 넓을 수 있으므로 아래 연결은 브라우저 네트워크 실행 증거가 아니다. 공용 AppShell/RequireAuth/Providers는 별도로 기록한다. `candidatePageRoutes`가 비어 있어도 API를 목록에서 없애지 않는다.

### 연결을 수동 확인할 API

| API | 현재 경계 |
|---|---|
| `GET /health` · `HealthController_health` | health 자체 조회; 일반 화면 CRUD 대상 아님 |
| `GET /accounting/book-sales/{id}` · `AccountingController_bookSaleDetail` | 원본 Front 호출자/현재 활성 버튼·legacy 경로 여부를 추가 확인하고 direct API 검증 계획 유지 |
| `GET /accounting/payment-evidence/{payId}` · `AccountingController_paymentEvidence` | 원본 Front 호출자/현재 활성 버튼·legacy 경로 여부를 추가 확인하고 direct API 검증 계획 유지 |
| `POST /accounting/rates` · `AccountingController_writeRate` | 원본 Front 호출자/현재 활성 버튼·legacy 경로 여부를 추가 확인하고 direct API 검증 계획 유지 |
| `POST /accounting/sturates` · `AccountingController_writeStudentRate` | 원본 Front 호출자/현재 활성 버튼·legacy 경로 여부를 추가 확인하고 direct API 검증 계획 유지 |
| `POST /ops/leads/{id}/enroll/preview` · `OpsController_enrollPreview` | 원본 Front 호출자/현재 활성 버튼·legacy 경로 여부를 추가 확인하고 direct API 검증 계획 유지 |
| `POST /ops/leads/{id}/enroll` · `OpsController_enroll` | 원본 Front 호출자/현재 활성 버튼·legacy 경로 여부를 추가 확인하고 direct API 검증 계획 유지 |
| `POST /books/issues` · `BooksController_issue` | 원본 Front 호출자/현재 활성 버튼·legacy 경로 여부를 추가 확인하고 direct API 검증 계획 유지 |

### 31 route entry 체크리스트

| 상태 | ID | 경로 | 화면/진입 | 종류 | 후보 API 수 | 원본 |
|---|---|---|---|---|---:|---|
| [ ] | UI-01 | `/accounting` | 회계 | page-entry | 70 | [source](../src/app/accounting/page.tsx) |
| [ ] | UI-02 | `/board` | 대기함·업무 보드 | page-entry | 34 | [source](../src/app/board/page.tsx) |
| [ ] | UI-03 | `/books` | 교재 | page-entry | 28 | [source](../src/app/books/page.tsx) |
| [ ] | UI-04 | `/consulting` | 컨설팅 | page-entry | 33 | [source](../src/app/consulting/page.tsx) |
| [ ] | UI-05 | `/exec` | 대표 보고 | page-entry | 7 | [source](../src/app/exec/page.tsx) |
| [ ] | UI-06 | `/gpa` | 과거 GPA | page-entry | 1 | [source](../src/app/gpa/page.tsx) |
| [ ] | UI-07 | `/guides` | 수업 안내 | page-entry | 18 | [source](../src/app/guides/page.tsx) |
| [ ] | UI-08 | `/intake` | 상담 유입 | page-entry | 17 | [source](../src/app/intake/page.tsx) |
| [ ] | UI-09 | `/login` | 로그인 | page-entry | 2 | [source](../src/app/login/page.tsx) |
| [ ] | UI-10 | `/onboarding` | 첫 설정 | page-entry | 5 | [source](../src/app/onboarding/page.tsx) |
| [ ] | UI-11 | `/ops` | 운영 | page-entry | 43 | [source](../src/app/ops/page.tsx) |
| [ ] | UI-12 | `/` | 스케줄 진입 redirect | redirect-entry | 0 | [source](../src/app/page.tsx) |
| [ ] | UI-13 | `/password-reset` | 비밀번호 복구 | page-entry | 3 | [source](../src/app/password-reset/page.tsx) |
| [ ] | UI-14 | `/permissions` | 권한 | page-entry | 1 | [source](../src/app/permissions/page.tsx) |
| [ ] | UI-15 | `/phrases` | 문구 | page-entry | 3 | [source](../src/app/phrases/page.tsx) |
| [ ] | UI-16 | `/programs` | 프로그램 | page-entry | 5 | [source](../src/app/programs/page.tsx) |
| [ ] | UI-17 | `/reports/[section]/[onDate]` | 리포트 회차 redirect | redirect-entry | 0 | [source](../src/app/reports/[section]/[onDate]/page.tsx) |
| [ ] | UI-18 | `/reports/[section]` | 리포트 section redirect | redirect-entry | 0 | [source](../src/app/reports/[section]/page.tsx) |
| [ ] | UI-19 | `/reports` | 리포트 | page-entry | 19 | [source](../src/app/reports/page.tsx) |
| [ ] | UI-20 | `/schedule` | 캘린더 | page-entry | 55 | [source](../src/app/schedule/page.tsx) |
| [ ] | UI-21 | `/staff/[id]` | 관리자 강사 허브 | page-entry | 53 | [source](../src/app/staff/[id]/page.tsx) |
| [ ] | UI-22 | `/staff` | 강사·구성원 목록 | page-entry | 2 | [source](../src/app/staff/page.tsx) |
| [ ] | UI-23 | `/students/[id]` | 학생 허브 | page-entry | 9 | [source](../src/app/students/[id]/page.tsx) |
| [ ] | UI-24 | `/students/new` | 학생 등록 | page-entry | 11 | [source](../src/app/students/new/page.tsx) |
| [ ] | UI-25 | `/students` | 학생 목록 | page-entry | 1 | [source](../src/app/students/page.tsx) |
| [ ] | UI-26 | `/teacher/guides` | 받은 안내 | page-entry | 14 | [source](../src/app/teacher/guides/page.tsx) |
| [ ] | UI-27 | `/teacher/history` | 전월 급여·수업 히스토리 | page-entry | 4 | [source](../src/app/teacher/history/page.tsx) |
| [ ] | UI-28 | `/teacher` | 강사 홈 | page-entry | 20 | [source](../src/app/teacher/page.tsx) |
| [ ] | UI-29 | `/teacher/suggestions` | 건의 | page-entry | 3 | [source](../src/app/teacher/suggestions/page.tsx) |
| [ ] | UI-30 | `/teacher/unavailable` | 불가 시간 | page-entry | 4 | [source](../src/app/teacher/unavailable/page.tsx) |
| [ ] | UI-31 | `/zoom` | Zoom 계정 | page-entry | 3 | [source](../src/app/zoom/page.tsx) |

`/` 및 `/reports/[section]`, `/reports/[section]/[onDate]`는 redirect다. 이 3개를 독립된 새 CRUD 화면으로 집계하지 않는다. 공용 셸의39개·인증 진입의1개·Providers의2개 API 후보는 중복될 수 있으며 합산하지 않는다. 자세한 함수·파일·행·원본 controller는 JSON에 있다.

## 기능군별 계획

### FEATURE-HEALTH — 상태 확인

API 1개 · HTTP GET 1 · 선택 호출 1/1 · 전체 체크 완료 0/1 · 상태 partial-execution

- [ ] **health-01** — 원본 health 응답 형상을 읽는다. 외부 운영 health를 proxy하지 않는다.

후보 route: 페이지 없음; 직접 상태 확인.

부분 실행 사례(M/H/P): `anonymous-health-and-denial`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-AUTH — 로그인·첫 설정·비밀번호 복구

API 10개 · HTTP POST 7, GET 3 · 선택 호출 8/10 · 전체 체크 완료 0/10 · 상태 partial-execution

- [ ] **auth-01** — 합성 계정 로그인·현재 사용자·갱신·로그아웃을 이어 확인한다. (partial: 로그인·복구 후 재로그인; logout 미실행)
- [ ] **auth-02** — 코드 요청·첫 설정·복구는 데모에 표시된 체험코드로 확인하며 실제 SMS/email이 나가지 않는다. (partial: A의 선택된 복구·최초설정 경로)

후보 route: `/login`, `/onboarding`, `/password-reset`.

부분 실행 사례(M/H/P): `expense-request-self-review-denial-and-rejection`, `independent-visitors-same-row-and-reset`, `login-admin`, `login-ceo`, `login-manager`, `login-teacher`, `refresh-cookie-contract`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

추가 A 공개 인증 회귀: [checks 영수증](evidence/auth-public-http.json)의 이 기능군 선택 호출 17회를 연결했다. 원본 index는 JSON에 남겼으며 전체 시나리오 완료로 승격하지 않는다.

### FEATURE-META — 공용 선택지

API 1개 · HTTP GET 1 · 선택 호출 1/1 · 전체 체크 완료 0/1 · 상태 partial-execution

- [ ] **meta-01** — 종류·과목·강사·학생·학년 선택지가 합성 PK/FK와 맞고 화면별 중복 정본을 만들지 않는다.

후보 route: `/accounting`, `/board`, `/books`, `/consulting`, `/exec`, `/guides`, `/intake`, `/ops`, `/reports`, `/schedule`, `/staff/[id]`, `/students/[id]`, `/students/new`, `/teacher`, `/teacher/guides`, `/teacher/history`, `/teacher/suggestions`, `/teacher/unavailable`.

부분 실행 사례(M/H/P): `read-meta`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

추가 A 공개 인증 회귀: [checks 영수증](evidence/auth-public-http.json)의 이 기능군 선택 호출 2회를 연결했다. 원본 index는 JSON에 남겼으며 전체 시나리오 완료로 승격하지 않는다.

### FEATURE-SCHEDULE — 캘린더·반복·예외·이동

API 23개 · HTTP GET 10, POST 8, PUT 1, DELETE 2, PATCH 2 · 선택 호출 4/23 · 전체 체크 완료 0/23 · 상태 partial-execution

- [ ] **schedule-01** — 생성→회차 조회→개별/반복 변경→이동/취소→복원/undo를 같은 방문자 상태에서 확인한다.
- [ ] **schedule-02** — 겹침·정원·Kinder1명·정책 시작일·원래 회차일/실제일을 원본과 대조한다.

후보 route: `/board`, `/guides`, `/ops`, `/schedule`, `/staff/[id]`, `/students/[id]`, `/teacher/guides`.

부분 실행 사례(M/H/P): `read-schedule-holidays`, `read-schedule-occurrences`, `schedule-create-readback-undo`, `structured-report-draft-stale-readback`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-REPORTS — 종류별 리포트·승인·자료·전달

API 14개 · HTTP GET 6, POST 6, PUT 2 · 선택 호출 3/14 · 전체 체크 완료 0/14 · 상태 partial-execution

- [ ] **reports-01** — 일반·그룹·Kinder·진단 양식 입력→초안→제출→관리자 승인/반려→재조회를 확인한다.
- [ ] **reports-02** — expectedVersion stale409·최초 제출시각·실제 actor·자료 생성 직후 선택을 확인한다.
- [ ] **reports-03** — 전달/재발송/미작성 알림은 내부 기록과 모의 전송 결과만 만든다.

후보 route: `/ops`, `/reports`, `/schedule`, `/staff/[id]`.

부분 실행 사례(M/H/P): `read-reports`, `structured-report-draft-stale-readback`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-FILES — 첨부·다운로드

API 2개 · HTTP POST 1, GET 1 · 선택 호출 0/2 · 전체 체크 완료 0/2 · 상태 pending

- [ ] **files-01** — 합성 파일만 메모리에 저장하고 같은 방문자 권한으로 bytes·MIME·이름·다운로드를 재조회한다.

후보 route: `/accounting`, `/books`, `/consulting`, `/reports`, `/schedule`, `/staff/[id]`, `/teacher/guides`.

### FEATURE-ACCOUNTING — 청구·수납·환불·급여·단가·마감

API 69개 · HTTP GET 23, POST 42, PATCH 2, DELETE 2 · 선택 호출 9/69 · 전체 체크 완료 0/69 · 상태 partial-execution

- [ ] **accounting-01** — 청구·수납·조정 승인·환불·지급 원장·취소 후 같은 방문자의 메모리 상태를 재조회한다. hard reload는 확정한 데모 수명에 따라 초기화/유지 결과를 별도로 검증한다.
- [ ] **accounting-02** — 마감/해제·확정 snapshot·계산·단가 적용기간·학생 예외·중복 요청·보호 계좌 권한을 각각 확인한다.
- [ ] **accounting-03** — 급여/환불 내부 원장 처리를 실제 은행 송금으로 표시하지 않는다.

후보 route: `/accounting`, `/board`, `/ops`, `/schedule`, `/staff/[id]`.

부분 실행 사례(M/H/P): `expense-request-self-review-denial-and-rejection`, `read-accounting`, `read-accounting-board`, `read-accounting-other-income`, `read-accounting-rates`, `read-accounting-student-refunds`, `read-accounting-tuition`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-OPS — 상담 유입·회의·할 일·강사 교체·마케팅

API 45개 · HTTP GET 5, POST 27, PATCH 9, PUT 3, DELETE 1 · 선택 호출 4/45 · 전체 체크 완료 0/45 · 상태 partial-execution

- [ ] **ops-01** — 상담 유입 단계·메모·상담 연결, 회의 참석/할 일, 마케팅 create/update/stale, 강사 교체 apply/undo를 각각 확인한다.
- [ ] **ops-02** — 날짜·담당자·원래/실제 회차·requestKey·권한과 이력의 연결을 유지한다.

후보 route: `/board`, `/intake`, `/ops`, `/schedule`, `/staff/[id]`, `/teacher`.

부분 실행 사례(M/H/P): `marketing-create-replay-update-stale`, `read-ops`, `read-ops-marketing-overview`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-BOOKS — 교재·판·배정·진도·전달

API 20개 · HTTP GET 7, POST 8, PATCH 5 · 선택 호출 6/20 · 전체 체크 완료 0/20 · 상태 partial-execution

- [ ] **books-01** — 교재/판 등록→배정→진도→반납/교체→자료 전달/수신 확인을 같은 학생 identity로 재조회한다.
- [ ] **books-02** — 카탈로그 writer와 리포트 안 자료 writer를 구분하고 학생/강사/과목 배정·계보를 보존한다.

후보 route: `/accounting`, `/books`, `/intake`, `/ops`.

부분 실행 사례(M/H/P): `book-create-update-readback`, `independent-visitors-same-row-and-reset`, `read-books`, `read-books-deliveries`, `read-books-history`, `read-books-tracking`, `teacher-cannot-admin-read-or-write`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-GUIDES — 수업 안내·작성·발송·확인

API 14개 · HTTP GET 5, POST 7, PATCH 1, PUT 1 · 선택 호출 5/14 · 전체 체크 완료 0/14 · 상태 partial-execution

- [ ] **guides-01** — 작성/수정/회신·확인과 강사 수신 reader를 연결하고 외부 발송은 로컬 모의 결과로 구분한다.

후보 route: `/consulting`, `/guides`, `/phrases`, `/students/[id]`.

부분 실행 사례(M/H/P): `guide-template-create-update-readback`, `read-guides`, `read-guides-students`, `read-guides-templates`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-ZOOM — Zoom 계정·배정

API 4개 · HTTP GET 1, POST 2, PATCH 1 · 선택 호출 1/4 · 전체 체크 완료 0/4 · 상태 partial-execution

- [ ] **zoom-01** — 합성 Zoom 계정과 수업 배정·충돌·조회만 체험하며 실제 Zoom 인증정보/회의 계정 연결은 없다.

후보 route: `/guides`, `/zoom`.

부분 실행 사례(M/H/P): `read-zoom`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-CONSULTING — 컨설팅·항목·계약·파일·수납

API 27개 · HTTP POST 13, GET 5, PATCH 6, DELETE 3 · 선택 호출 6/27 · 전체 체크 완료 0/27 · 상태 partial-execution

- [ ] **consulting-01** — 등록 후 시작·유형별 항목·계약 단계·금액·회차·파일·수납을 확인하고 후속 실패가 학생 등록을 취소하지 않는지 확인한다.
- [ ] **consulting-02** — 대표·담당·최초 등록자·공개 범위와 파일 접근이 원본 정책에 맞는지 역할별 확인한다.

후보 route: `/consulting`, `/students/[id]`, `/students/new`.

부분 실행 사례(M/H/P): `read-consulting`, `read-consulting-accounting`, `read-consulting-students`, `read-consulting-templates`, `template-create-consulting-readback`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-BOARD — 대기함·업무 보드

API 1개 · HTTP GET 1 · 선택 호출 1/1 · 전체 체크 완료 0/1 · 상태 partial-execution

- [ ] **board-01** — 대기함 항목의 원래 페이지/정확한 대상을 열고 처리 후 같은 원장을 재조회한다.

후보 route: `/board`.

부분 실행 사례(M/H/P): `read-board`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-TEACHER — 강사 홈·안내·급여·불가시간·건의

API 14개 · HTTP GET 8, POST 5, DELETE 1 · 선택 호출 8/14 · 전체 체크 완료 0/14 · 상태 partial-execution

- [ ] **teacher-01** — 강사 홈·안내·전월 급여/히스토리·불가시간·건의의 권한과 날짜 제약을 확인한다.
- [ ] **teacher-02** — 관리자 조회 대상 강사와 실제 작성자를 분리하고 비공개 직원 메모가 나오지 않는지 확인한다.

후보 route: `/schedule`, `/staff/[id]`, `/teacher`, `/teacher/guides`, `/teacher/history`, `/teacher/suggestions`, `/teacher/unavailable`.

부분 실행 사례(M/H/P): `read-teacher-guides`, `read-teacher-guides-received`, `read-teacher-history`, `read-teacher-home`, `read-teacher-shell`, `read-teacher-suggestions`, `read-teacher-unavailable`, `teacher-suggestion-create-readback`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-GPA — 과거 GPA 읽기 전용

API 1개 · HTTP GET 1 · 선택 호출 0/1 · 전체 체크 완료 0/1 · 상태 pending

- [ ] **gpa-01** — 원본처럼 과거 원장 조회만 허용한다. 전체 CRUD 요청을 이유로 퇴역 GPA 쓰기를 새로 만들지 않는다.

후보 route: `/gpa`.

### FEATURE-EXEC — 대표 보고·정책

API 6개 · HTTP GET 1, PUT 1, PATCH 1, POST 3 · 선택 호출 1/6 · 전체 체크 완료 0/6 · 상태 partial-execution

- [ ] **exec-01** — 대표 보고와 정책 조회·설정의 허용 역할, 계산 근거·날짜·하위 원장 이동을 확인한다.

후보 route: `/exec`.

부분 실행 사례(M/H/P): `read-exec`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-DRAWER — 공용 서랍·구성원·알림·권한

API 24개 · HTTP GET 10, POST 7, PATCH 5, DELETE 2 · 선택 호출 6/24 · 전체 체크 완료 0/24 · 상태 partial-execution

- [ ] **drawer-01** — 모든 보호 화면에서 공용 검색/알림/할 일/요청/빠른 등록을 연결한다.
- [ ] **drawer-02** — 합성 구성원 생성·역할 변경·중지/복원 등의 실제 서버 권한과 타인의 민감 필드 projection을 확인한다.

후보 route: `/accounting`, `/board`, `/books`, `/ops`, `/permissions`, `/schedule`, `/staff`, `/staff/[id]`, `/teacher`.

부분 실행 사례(M/H/P): `admin-admin-surface`, `manager-admin-surface`, `read-drawer`, `read-drawer-staff-directory`, `read-permissions`, `teacher-cannot-admin-read-or-write`, `todo-create-complete-readback`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

추가 A 공개 인증 회귀: [checks 영수증](evidence/auth-public-http.json)의 이 기능군 선택 호출 1회를 연결했다. 원본 index는 JSON에 남겼으며 전체 시나리오 완료로 승격하지 않는다.

### FEATURE-CATALOG — 과목·프로그램·학년·종류

API 5개 · HTTP GET 1, POST 2, PATCH 2 · 선택 호출 1/5 · 전체 체크 완료 0/5 · 상태 partial-execution

- [ ] **catalog-01** — 과목/프로그램/종류 선택·생성/변경 계약과 기존 FK·정렬·필터를 확인한다.

후보 route: `/programs`.

부분 실행 사례(M/H/P): `read-catalog`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-GUARDIANS — 보호자·연락 이력

API 6개 · HTTP GET 2, POST 2, PATCH 1, DELETE 1 · 선택 호출 4/6 · 전체 체크 완료 0/6 · 상태 partial-execution

- [ ] **guardians-01** — 합성 보호자 연결·연락 수단·동의·발송 이력만 사용하고 전송은 로컬 모의로 처리한다.

후보 route: `/accounting`, `/board`, `/consulting`, `/guides`, `/reports`, `/schedule`, `/staff/[id]`.

부분 실행 사례(M/H/P): `guardian-create-update-disable-readback`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-STUDENTS — 학생 등록·재활성화·상세·Kinder

API 13개 · HTTP GET 7, POST 6 · 선택 호출 6/13 · 전체 체크 완료 0/13 · 상태 partial-execution

- [ ] **students-01** — 입력 검토→동일 writer preview rollback→등록→상세/허브 재조회와 재활성화 STU ID 보존을 확인한다.
- [ ] **students-02** — Kinder 표시 변경·그룹 충돌409와 등록/추가/복사/undo 방어를 원본과 대조한다.

후보 route: `/students`, `/students/[id]`, `/students/new`.

부분 실행 사례(M/H/P): `admin-admin-surface`, `anonymous-health-and-denial`, `manager-admin-surface`, `read-students`, `read-students-options`, `registration-preview-save-replay-readback`, `teacher-cannot-admin-read-or-write`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

### FEATURE-PRIVATE-NOTES — 직원 전용 비공개 메모

API 3개 · HTTP POST 1, GET 2 · 선택 호출 0/3 · 전체 체크 완료 0/3 · 상태 pending

- [ ] **private-notes-01** — 허용 직원 CRUD와 강사 직접 API 거절, 검색·다운로드·알림의 비노출을 확인한다.

후보 route: `/students/[id]`, `/teacher/history`.

### FEATURE-MATERIAL-REQUESTS — 자료 요청·처리·수신 확인

API 6개 · HTTP GET 3, POST 2, PATCH 1 · 선택 호출 3/6 · 전체 체크 완료 0/6 · 상태 partial-execution

- [ ] **material-requests-01** — 요청→관리자 처리→합성 첨부 전달→강사 수신 확인·이력을 재조회한다.

후보 route: `/books`, `/teacher/guides`.

부분 실행 사례(M/H/P): `read-material-requests`, `read-material-requests-mine`, `read-material-requests-options`. 위 시나리오의 전체 단계·분기 완료 표시는 유지하지 않는다.

## API별 전수 체크리스트

각 행의 전체 완료 체크는 C01~C07과 실행 증거가 충족된 뒤에만 완료한다. M/H/P/A 열은 보고서의 선택 호출 상태 코드이며 `[ ]`를 해제하는 근거가 아니다. 정적 재사용309개는 JSON `implementationStatus=reused-static-mapped`, 실제 호출78개는 `runtimeVerificationStatus=partial-execution`으로 구분한다. GET은 조회, 나머지 method는 생성/변경/삭제 외 승인·취소·미리보기·발송 같은 command도 포함한다. 번호만 보고 business CRUD 의미를 추정하지 않는다.

| 전체 완료 | ID | Method | Path | Tag | Operation ID | 성공 상태 계약 | 부분 실행(M/H/P/A) |
|---|---|---|---|---|---|---|---|
| [ ] | API-001 | GET | `/health` | health | `HealthController_health` | 200 | M·H·P: 200 |
| [ ] | API-002 | POST | `/auth/login` | auth | `AuthController_login` | 201 | M·H·P: 201; A: 201, 401 |
| [ ] | API-003 | POST | `/auth/refresh` | auth | `AuthController_refresh` | 201 | M·H·P: 201 |
| [ ] | API-004 | POST | `/auth/logout` | auth | `AuthController_logout` | 204 | 미실행 |
| [ ] | API-005 | GET | `/auth/me` | auth | `AuthController_me` | 200 | M·H·P: 200; A: 401 |
| [ ] | API-006 | GET | `/auth/onboarding` | auth | `OnboardingController_info` | 200 | A: 200 |
| [ ] | API-007 | POST | `/auth/onboarding/codes` | auth | `OnboardingController_codes` | 201 | A: 201 |
| [ ] | API-008 | POST | `/auth/onboarding/complete` | auth | `OnboardingController_complete` | 201 | A: 201 |
| [ ] | API-009 | GET | `/auth/password-reset` | auth | `PasswordResetController_info` | 200 | 미실행 |
| [ ] | API-010 | POST | `/auth/password-reset/codes` | auth | `PasswordResetController_codes` | 201 | A: 201 |
| [ ] | API-011 | POST | `/auth/password-reset/complete` | auth | `PasswordResetController_complete` | 204 | A: 204, 409 |
| [ ] | API-012 | GET | `/meta` | meta | `MetaController_get` | 200 | M·H·P: 200; A: 200, 403 |
| [ ] | API-013 | GET | `/schedule/occurrences` | schedule | `ScheduleController_list` | 200 | M·H·P: 200 |
| [ ] | API-014 | GET | `/schedule/holidays` | schedule | `ScheduleController_holidays` | 200 | M·H·P: 200 |
| [ ] | API-015 | GET | `/schedule/unavailable` | schedule | `ScheduleController_unavailable` | 200 | 미실행 |
| [ ] | API-016 | GET | `/schedule/day-cancel/notices` | schedule | `ScheduleController_dayCancelNotices` | 200 | 미실행 |
| [ ] | API-017 | GET | `/schedule/series-counts` | schedule | `ScheduleController_seriesCounts` | 200 | 미실행 |
| [ ] | API-018 | GET | `/schedule/students/{studentId}/books` | schedule | `ScheduleController_studentBooks` | 200 | 미실행 |
| [ ] | API-019 | GET | `/schedule/teachers/{teacherId}/guides` | schedule | `ScheduleController_teacherGuides` | 200 | 미실행 |
| [ ] | API-020 | GET | `/schedule/tracking` | schedule | `ScheduleController_tracking` | 200 | 미실행 |
| [ ] | API-021 | POST | `/schedule/tracking/notes` | schedule | `ScheduleController_addNote` | 201 | 미실행 |
| [ ] | API-022 | GET | `/schedule/conflicts` | schedule | `ScheduleController_conflicts` | 200 | 미실행 |
| [ ] | API-023 | GET | `/schedule/horizon` | schedule | `ScheduleController_bounds` | 200 | 미실행 |
| [ ] | API-024 | PUT | `/schedule/{serId}/{onDate}/attendance` | schedule | `ScheduleController_saveAttendance` | 200 | 미실행 |
| [ ] | API-025 | DELETE | `/schedule/{serId}/{onDate}/attendance` | schedule | `ScheduleController_clearAttendance` | 200 | 미실행 |
| [ ] | API-026 | POST | `/schedule` | schedule | `ScheduleController_create` | 201 | M·H·P: 201 |
| [ ] | API-027 | POST | `/schedule/paste` | schedule | `ScheduleController_paste` | 201 | 미실행 |
| [ ] | API-028 | POST | `/schedule/move` | schedule | `ScheduleController_moveMany` | 201 | 미실행 |
| [ ] | API-029 | POST | `/schedule/day-cancel` | schedule | `ScheduleController_dayCancel` | 201 | 미실행 |
| [ ] | API-030 | POST | `/schedule/students/{studentId}/pause` | schedule | `ScheduleController_pauseStudent` | 201 | 미실행 |
| [ ] | API-031 | POST | `/schedule/students/{studentId}/pause/{pauseId}/resume` | schedule | `ScheduleController_resumeStudent` | 201 | 미실행 |
| [ ] | API-032 | POST | `/schedule/undo` | schedule | `ScheduleController_undo` | 201 | M·H·P: 201 |
| [ ] | API-033 | PATCH | `/schedule/{serId}` | schedule | `ScheduleController_patch` | 200 | 미실행 |
| [ ] | API-034 | DELETE | `/schedule/{serId}` | schedule | `ScheduleController_remove` | 200 | 미실행 |
| [ ] | API-035 | PATCH | `/schedule/{serId}/roster` | schedule | `ScheduleController_roster` | 200 | 미실행 |
| [ ] | API-036 | GET | `/reports` | reports | `ReportsController_list` | 200 | M·H·P: 200 |
| [ ] | API-037 | GET | `/reports/unwritten` | reports | `ReportsController_unwritten` | 200 | 미실행 |
| [ ] | API-038 | POST | `/reports/reminders` | reports | `ReportsController_reminders` | 201 | 미실행 |
| [ ] | API-039 | GET | `/reports/deliveries` | reports | `ReportsController_deliveryQueue` | 200 | 미실행 |
| [ ] | API-040 | POST | `/reports/deliveries` | reports | `ReportsController_deliver` | 201 | 미실행 |
| [ ] | API-041 | GET | `/reports/deliveries/history` | reports | `ReportsController_deliveryHistory` | 200 | 미실행 |
| [ ] | API-042 | POST | `/reports/deliveries/{sendId}/resend` | reports | `ReportsController_resend` | 201 | 미실행 |
| [ ] | API-043 | GET | `/reports/weekly` | reports | `ReportsController_weekly` | 200 | 미실행 |
| [ ] | API-044 | PUT | `/reports/weekly` | reports | `ReportsController_writeWeekly` | 200 | 미실행 |
| [ ] | API-045 | GET | `/reports/{serId}/{onDate}` | reports | `ReportsController_detail` | 200 | M·H·P: 200 |
| [ ] | API-046 | POST | `/reports/{serId}/{onDate}/materials` | reports | `ReportsController_createMaterial` | 201 | 미실행 |
| [ ] | API-047 | PUT | `/reports/{serId}/{onDate}/draft` | reports | `ReportsController_saveDraft` | 200 | M·H·P: 200, 409 |
| [ ] | API-048 | POST | `/reports/{serId}/{onDate}/submit` | reports | `ReportsController_submit` | 201 | 미실행 |
| [ ] | API-049 | POST | `/reports/{serId}/{onDate}/review` | reports | `ReportsController_review` | 201 | 미실행 |
| [ ] | API-050 | POST | `/files` | files | `FilesController_upload` | 201 | 미실행 |
| [ ] | API-051 | GET | `/files/{id}` | files | `FilesController_download` | 200 | 미실행 |
| [ ] | API-052 | GET | `/accounting/book-sales` | accounting | `AccountingController_bookSaleLedger` | 200 | 미실행 |
| [ ] | API-053 | POST | `/accounting/book-sales` | accounting | `AccountingController_createBookSale` | 201 | 미실행 |
| [ ] | API-054 | GET | `/accounting/book-sales/{id}` | accounting | `AccountingController_bookSaleDetail` | 200 | 미실행 |
| [ ] | API-055 | POST | `/accounting/book-sales/{id}/cancel` | accounting | `AccountingController_cancelBookSale` | 201 | 미실행 |
| [ ] | API-056 | GET | `/accounting` | accounting | `AccountingController_all` | 200 | M·H·P: 200 |
| [ ] | API-057 | GET | `/accounting/student-cumulative` | accounting | `AccountingController_studentCumulative` | 200 | 미실행 |
| [ ] | API-058 | GET | `/accounting/delinquency-suspensions` | accounting | `AccountingController_delinquencyLedger` | 200 | 미실행 |
| [ ] | API-059 | POST | `/accounting/delinquency-suspensions/policy` | accounting | `AccountingController_writeDelinquencyPolicy` | 201 | 미실행 |
| [ ] | API-060 | POST | `/accounting/delinquency-suspensions/{studentId}/remind` | accounting | `AccountingController_remindDelinquency` | 201 | 미실행 |
| [ ] | API-061 | POST | `/accounting/delinquency-suspensions/remind-batch` | accounting | `AccountingController_remindDelinquencyBatch` | 201 | 미실행 |
| [ ] | API-062 | POST | `/accounting/delinquency-suspensions/{studentId}/suspend` | accounting | `AccountingController_suspendDelinquency` | 201 | 미실행 |
| [ ] | API-063 | POST | `/accounting/delinquency-suspensions/{studentId}/release` | accounting | `AccountingController_releaseDelinquency` | 201 | 미실행 |
| [ ] | API-064 | GET | `/accounting/adjustments` | accounting | `AccountingController_adjustmentLedger` | 200 | 미실행 |
| [ ] | API-065 | POST | `/accounting/adjustments` | accounting | `AccountingController_createAdjustment` | 201 | 미실행 |
| [ ] | API-066 | POST | `/accounting/adjustments/{id}/approve` | accounting | `AccountingController_approveAdjustment` | 201 | 미실행 |
| [ ] | API-067 | POST | `/accounting/adjustments/{id}/reject` | accounting | `AccountingController_rejectAdjustment` | 201 | 미실행 |
| [ ] | API-068 | POST | `/accounting/adjustments/{id}/cancel` | accounting | `AccountingController_cancelAdjustment` | 201 | 미실행 |
| [ ] | API-069 | POST | `/accounting/adjustments/{id}/undo` | accounting | `AccountingController_undoAdjustment` | 201 | 미실행 |
| [ ] | API-070 | GET | `/accounting/payment-evidence` | accounting | `AccountingController_paymentEvidenceLedger` | 200 | 미실행 |
| [ ] | API-071 | GET | `/accounting/payment-evidence/{payId}` | accounting | `AccountingController_paymentEvidence` | 200 | 미실행 |
| [ ] | API-072 | POST | `/accounting/payment-evidence/issue-batch` | accounting | `AccountingController_issuePaymentEvidenceBatch` | 201 | 미실행 |
| [ ] | API-073 | POST | `/accounting/payment-evidence/{payId}/issue` | accounting | `AccountingController_issuePaymentEvidence` | 201 | 미실행 |
| [ ] | API-074 | POST | `/accounting/payment-evidence/{payId}/cancel` | accounting | `AccountingController_cancelPaymentEvidence` | 201 | 미실행 |
| [ ] | API-075 | GET | `/accounting/protected-accounts` | accounting | `AccountingController_protectedAccountLedger` | 200 | 미실행 |
| [ ] | API-076 | POST | `/accounting/protected-accounts` | accounting | `AccountingController_writeProtectedAccount` | 201 | 미실행 |
| [ ] | API-077 | POST | `/accounting/protected-accounts/{accountId}/delete` | accounting | `AccountingController_deleteProtectedAccount` | 201 | 미실행 |
| [ ] | API-078 | POST | `/accounting/protected-accounts/{accountId}/reveal` | accounting | `AccountingController_revealProtectedAccount` | 201 | 미실행 |
| [ ] | API-079 | GET | `/accounting/student-refunds` | accounting | `AccountingController_studentRefundLedger` | 200 | M·H·P: 200 |
| [ ] | API-080 | POST | `/accounting/student-refunds/{adjustmentId}/pay` | accounting | `AccountingController_payStudentRefund` | 201 | 미실행 |
| [ ] | API-081 | POST | `/accounting/student-refunds/{adjustmentId}/cancel` | accounting | `AccountingController_cancelStudentRefund` | 201 | 미실행 |
| [ ] | API-082 | GET | `/accounting/tuition` | accounting | `AccountingController_tuition` | 200 | M·H·P: 200 |
| [ ] | API-083 | GET | `/accounting/payout-ledger` | accounting | `AccountingController_payoutDisbursementLedger` | 200 | 미실행 |
| [ ] | API-084 | POST | `/accounting/payout-ledger/pay-batch` | accounting | `AccountingController_payPayoutDisbursementBatch` | 201 | 미실행 |
| [ ] | API-085 | POST | `/accounting/payout-ledger/{payoutId}/pay` | accounting | `AccountingController_payPayoutDisbursement` | 201 | 미실행 |
| [ ] | API-086 | POST | `/accounting/payout-ledger/{payoutId}/cancel` | accounting | `AccountingController_cancelPayoutDisbursement` | 201 | 미실행 |
| [ ] | API-087 | GET | `/accounting/payouts` | accounting | `AccountingController_payoutSheet` | 200 | 미실행 |
| [ ] | API-088 | GET | `/accounting/payouts/{staffId}` | accounting | `AccountingController_payoutDetail` | 200 | 미실행 |
| [ ] | API-089 | GET | `/accounting/cashflow` | accounting | `AccountingController_cashflow` | 200 | 미실행 |
| [ ] | API-090 | POST | `/accounting/payouts/{month}/confirm` | accounting | `AccountingController_confirmPayout` | 201 | 미실행 |
| [ ] | API-091 | GET | `/accounting/bonus-rules` | accounting | `AccountingController_bonusBook` | 200 | 미실행 |
| [ ] | API-092 | POST | `/accounting/bonus-rules` | accounting | `AccountingController_writeBonusRule` | 201 | 미실행 |
| [ ] | API-093 | GET | `/accounting/privacy` | accounting | `AccountingController_acctPrivacy` | 200 | 미실행 |
| [ ] | API-094 | PATCH | `/accounting/privacy` | accounting | `AccountingController_setAcctPrivacy` | 200 | 미실행 |
| [ ] | API-095 | POST | `/accounting/withdrawals/preview` | accounting | `AccountingController_withdrawPreview` | 201 | 미실행 |
| [ ] | API-096 | POST | `/accounting/withdrawals` | accounting | `AccountingController_withdraw` | 201 | 미실행 |
| [ ] | API-097 | POST | `/accounting/tuition/close` | accounting | `AccountingController_closeMonth` | 201 | 미실행 |
| [ ] | API-098 | POST | `/accounting/tuition/reopen` | accounting | `AccountingController_reopenMonth` | 201 | 미실행 |
| [ ] | API-099 | GET | `/accounting/board` | accounting | `AccountingController_invoiceBoard` | 200 | M·H·P: 200 |
| [ ] | API-100 | GET | `/accounting/other-income` | accounting | `AccountingController_otherIncome` | 200 | M·H·P: 200 |
| [ ] | API-101 | POST | `/accounting/tuition/carry` | accounting | `AccountingController_carryTuition` | 201 | 미실행 |
| [ ] | API-102 | GET | `/accounting/invoices/draft` | accounting | `AccountingController_draftInvoice` | 200 | 미실행 |
| [ ] | API-103 | POST | `/accounting/invoices` | accounting | `AccountingController_issueInvoice` | 201 | 미실행 |
| [ ] | API-104 | POST | `/accounting/invoices/batch` | accounting | `AccountingController_issueBatch` | 201 | 미실행 |
| [ ] | API-105 | POST | `/accounting/invoices/{id}/deliver` | accounting | `AccountingController_deliverInvoice` | 201 | 미실행 |
| [ ] | API-106 | POST | `/accounting/invoices/{id}/void` | accounting | `AccountingController_voidInvoice` | 201 | 미실행 |
| [ ] | API-107 | POST | `/accounting/payments` | accounting | `AccountingController_addPayment` | 201 | 미실행 |
| [ ] | API-108 | POST | `/accounting/payments/manual` | accounting | `AccountingController_addManualPayment` | 201 | 미실행 |
| [ ] | API-109 | DELETE | `/accounting/payments/{id}` | accounting | `AccountingController_removePayment` | 200 | 미실행 |
| [ ] | API-110 | POST | `/accounting/expenses/{id}/review` | accounting | `AccountingController_reviewExpense` | 201 | M·H·P: 201, 403 |
| [ ] | API-111 | GET | `/accounting/rates` | accounting | `AccountingController_rateBook` | 200 | M·H·P: 200 |
| [ ] | API-112 | POST | `/accounting/rates` | accounting | `AccountingController_writeRate` | 201 | 미실행 |
| [ ] | API-113 | POST | `/accounting/hourly-rates` | accounting | `AccountingController_createHourlyRate` | 201 | 미실행 |
| [ ] | API-114 | PATCH | `/accounting/hourly-rates/{id}` | accounting | `AccountingController_replaceHourlyRate` | 200 | 미실행 |
| [ ] | API-115 | DELETE | `/accounting/hourly-rates/{id}` | accounting | `AccountingController_retireHourlyRate` | 200 | 미실행 |
| [ ] | API-116 | GET | `/accounting/wages` | accounting | `AccountingController_wageHistory` | 200 | 미실행 |
| [ ] | API-117 | POST | `/accounting/wages` | accounting | `AccountingController_writeWage` | 201 | 미실행 |
| [ ] | API-118 | POST | `/accounting/sturates` | accounting | `AccountingController_writeStudentRate` | 201 | 미실행 |
| [ ] | API-119 | POST | `/accounting/expenses` | accounting | `AccountingController_createExpense` | 201 | M·H·P: 201 |
| [ ] | API-120 | GET | `/accounting/expenses/mine` | accounting | `AccountingController_myExpenses` | 200 | M·H·P: 200 |
| [ ] | API-121 | GET | `/ops` | ops | `OpsController_all` | 200 | M·H·P: 200 |
| [ ] | API-122 | POST | `/ops/meetings` | ops | `OpsController_createMeeting` | 201 | 미실행 |
| [ ] | API-123 | POST | `/ops/plans` | ops | `OpsController_createPlan` | 201 | 미실행 |
| [ ] | API-124 | POST | `/ops/leads` | ops | `OpsController_createLead` | 201 | 미실행 |
| [ ] | API-125 | PATCH | `/ops/leads/{id}` | ops | `OpsController_patchLead` | 200 | 미실행 |
| [ ] | API-126 | PATCH | `/ops/leads/{id}/stage` | ops | `OpsController_moveLeadStage` | 200 | 미실행 |
| [ ] | API-127 | POST | `/ops/leads/{id}/touches` | ops | `OpsController_addLeadTouch` | 201 | 미실행 |
| [ ] | API-128 | POST | `/ops/leads/{id}/fail` | ops | `OpsController_failLead` | 201 | 미실행 |
| [ ] | API-129 | POST | `/ops/leads/{id}/resume` | ops | `OpsController_resumeLead` | 201 | 미실행 |
| [ ] | API-130 | POST | `/ops/leads/{id}/enroll/preview` | ops | `OpsController_enrollPreview` | 201 | 미실행 |
| [ ] | API-131 | POST | `/ops/leads/{id}/enroll` | ops | `OpsController_enroll` | 201 | 미실행 |
| [ ] | API-132 | POST | `/ops/complaints` | ops | `OpsController_createComplaint` | 201 | 미실행 |
| [ ] | API-133 | PATCH | `/ops/complaints/{id}` | ops | `OpsController_patchComplaint` | 200 | 미실행 |
| [ ] | API-134 | POST | `/ops/teacher-change/preview` | ops | `OpsController_teacherChangePreview` | 201 | 미실행 |
| [ ] | API-135 | POST | `/ops/teacher-change` | ops | `OpsController_teacherChange` | 201 | 미실행 |
| [ ] | API-136 | POST | `/ops/teacher-change/{requestKey}/undo` | ops | `OpsController_teacherChangeUndo` | 201 | 미실행 |
| [ ] | API-137 | GET | `/ops/marketing-overview` | ops | `OpsController_marketingOverview` | 200 | M·H·P: 200 |
| [ ] | API-138 | POST | `/ops/marketing` | ops | `OpsController_createMarketing` | 201 | M·H·P: 201 |
| [ ] | API-139 | PATCH | `/ops/marketing/{id}` | ops | `OpsController_patchMarketing` | 200 | M·H·P: 200, 409 |
| [ ] | API-140 | POST | `/ops/marketing/{id}/comments` | ops | `OpsController_comment` | 201 | 미실행 |
| [ ] | API-141 | POST | `/ops/marketing/{id}/replies` | ops | `OpsController_reply` | 201 | 미실행 |
| [ ] | API-142 | PATCH | `/ops/marketing/feedback/{id}` | ops | `OpsController_editPost` | 200 | 미실행 |
| [ ] | API-143 | GET | `/ops/plans/{id}` | ops | `OpsController_planDetail` | 200 | 미실행 |
| [ ] | API-144 | PATCH | `/ops/plans/{id}` | ops | `OpsController_patchPlan` | 200 | 미실행 |
| [ ] | API-145 | PATCH | `/ops/plans/{id}/owner` | ops | `OpsController_patchPlanOwner` | 200 | 미실행 |
| [ ] | API-146 | PATCH | `/ops/suggestions/{id}/reply` | ops | `OpsController_replySuggestion` | 200 | 미실행 |
| [ ] | API-147 | PATCH | `/ops/plans/{id}/stage` | ops | `OpsController_movePlanStage` | 200 | 미실행 |
| [ ] | API-148 | POST | `/ops/plans/{id}/due` | ops | `OpsController_decidePlanDue` | 201 | 미실행 |
| [ ] | API-149 | POST | `/ops/plans/{id}/review` | ops | `OpsController_reviewPlan` | 201 | 미실행 |
| [ ] | API-150 | POST | `/ops/plans/{id}/tasks` | ops | `OpsController_addPlanTask` | 201 | 미실행 |
| [ ] | API-151 | GET | `/ops/meetings/{id}` | ops | `OpsController_meetingDetail` | 200 | 미실행 |
| [ ] | API-152 | PUT | `/ops/meetings/{id}/agenda` | ops | `OpsController_writeMeetingAgenda` | 200 | 미실행 |
| [ ] | API-153 | POST | `/ops/meetings/{id}/agenda/import` | ops | `OpsController_importMeetingAgenda` | 200 | 미실행 |
| [ ] | API-154 | POST | `/ops/meetings/{id}/notice` | ops | `OpsController_sendMeetingNotice` | 201 | 미실행 |
| [ ] | API-155 | POST | `/ops/meetings/{id}/attend` | ops | `OpsController_respondMeeting` | 201 | 미실행 |
| [ ] | API-156 | POST | `/ops/meetings/{id}/minutes` | ops | `OpsController_writeMinutes` | 201 | 미실행 |
| [ ] | API-157 | POST | `/ops/meetings/{id}/todos` | ops | `OpsController_assignMeetingTask` | 201 | 미실행 |
| [ ] | API-158 | GET | `/ops/leads/{id}/diag` | ops | `LeadDiagController_history` | 200 | 미실행 |
| [ ] | API-159 | POST | `/ops/leads/{id}/diag` | ops | `LeadDiagController_append` | 201 | 미실행 |
| [ ] | API-160 | PUT | `/ops/leads/{id}/plan` | ops | `LeadPlanController_savePlan` | 200 | 미실행 |
| [ ] | API-161 | POST | `/ops/leads/{id}/hold/extend` | ops | `LeadPlanController_extendHold` | 200 | 미실행 |
| [ ] | API-162 | PUT | `/ops/leads/{id}/appts` | ops | `LeadPlanController_saveAppt` | 200 | 미실행 |
| [ ] | API-163 | DELETE | `/ops/leads/{id}/appts/{kind}` | ops | `LeadPlanController_deleteAppt` | 200 | 미실행 |
| [ ] | API-164 | POST | `/ops/leads/{id}/appts/schedule` | ops | `LeadPlanController_scheduleAppts` | 201 | 미실행 |
| [ ] | API-165 | POST | `/ops/leads/{id}/appts/book` | ops | `LeadPlanController_bookAppt` | 201 | 미실행 |
| [ ] | API-166 | GET | `/books` | books | `BooksController_all` | 200 | M·H·P: 200, 401 |
| [ ] | API-167 | POST | `/books` | books | `BooksController_create` | 201 | M·H·P: 201, 403 |
| [ ] | API-168 | PATCH | `/books/{id}` | books | `BooksController_patch` | 200 | M·H·P: 200 |
| [ ] | API-169 | GET | `/books/tracking` | books | `BooksController_tracking` | 200 | M·H·P: 200 |
| [ ] | API-170 | GET | `/books/assignment-options` | books | `BooksController_assignmentOptions` | 200 | 미실행 |
| [ ] | API-171 | GET | `/books/students/{studentId}/latest-diag` | books | `BooksController_latestDiag` | 200 | 미실행 |
| [ ] | API-172 | POST | `/books/issues` | books | `BooksController_issue` | 201 | 미실행 |
| [ ] | API-173 | POST | `/books/assignments` | books | `BooksController_assignment` | 201 | 미실행 |
| [ ] | API-174 | PATCH | `/books/issues/{id}/state` | books | `BooksController_issueState` | 200 | 미실행 |
| [ ] | API-175 | PATCH | `/books/issues/{id}/progress` | books | `BooksController_progress` | 200 | 미실행 |
| [ ] | API-176 | POST | `/books/issues/{id}/return` | books | `BooksController_returnIssue` | 200 | 미실행 |
| [ ] | API-177 | GET | `/books/history` | books | `BooksController_history` | 200 | M·H·P: 200 |
| [ ] | API-178 | GET | `/books/deliveries` | books | `BooksController_deliveries` | 200 | M·H·P: 200 |
| [ ] | API-179 | POST | `/books/deliveries` | books | `BooksController_createDelivery` | 201 | 미실행 |
| [ ] | API-180 | PATCH | `/books/deliveries/{id}` | books | `BooksController_patchDelivery` | 200 | 미실행 |
| [ ] | API-181 | POST | `/books/deliveries/{id}/deliver` | books | `BooksController_deliver` | 200 | 미실행 |
| [ ] | API-182 | POST | `/books/deliveries/{id}/receive` | books | `BooksController_receive` | 200 | 미실행 |
| [ ] | API-183 | POST | `/books/{id}/versions` | books | `BooksController_addVersion` | 201 | 미실행 |
| [ ] | API-184 | GET | `/books/{id}/holders` | books | `BooksController_holders` | 200 | 미실행 |
| [ ] | API-185 | PATCH | `/books/versions/{id}/use` | books | `BooksController_useVersion` | 200 | 미실행 |
| [ ] | API-186 | GET | `/guides` | guides | `GuidesController_all` | 200 | M·H·P: 200 |
| [ ] | API-187 | GET | `/guides/students` | guides | `GuidesController_students` | 200 | M·H·P: 200 |
| [ ] | API-188 | GET | `/guides/history` | guides | `GuidesController_history` | 200 | 미실행 |
| [ ] | API-189 | POST | `/guides/drafts` | guides | `GuidesController_createDraft` | 201 | 미실행 |
| [ ] | API-190 | GET | `/guides/templates` | guides | `GuidesController_templates` | 200 | M·H·P: 200 |
| [ ] | API-191 | POST | `/guides/templates` | guides | `GuidesController_createTemplate` | 201 | M·H·P: 201 |
| [ ] | API-192 | PATCH | `/guides/templates/{id}` | guides | `GuidesController_patchTemplate` | 200 | M·H·P: 200 |
| [ ] | API-193 | PUT | `/guides/{id}/body` | guides | `GuidesController_writeBody` | 200 | 미실행 |
| [ ] | API-194 | GET | `/guides/{id}/class-diagnostics` | guides | `GuidesController_classDiagnostics` | 200 | 미실행 |
| [ ] | API-195 | POST | `/guides/{id}/class-diagnostics` | guides | `GuidesController_writeClassDiagnostics` | 201 | 미실행 |
| [ ] | API-196 | POST | `/guides/{id}/copy` | guides | `GuidesController_copyBody` | 201 | 미실행 |
| [ ] | API-197 | POST | `/guides/{id}/send` | guides | `GuidesController_sendGuide` | 200 | 미실행 |
| [ ] | API-198 | POST | `/guides/zoom-notice` | guides | `GuidesController_sendZoomNotice` | 201 | 미실행 |
| [ ] | API-199 | POST | `/guides/zoom-notice/batch` | guides | `GuidesController_sendZoomNoticeBatch` | 201 | 미실행 |
| [ ] | API-200 | GET | `/zoom` | zoom | `ZoomController_board` | 200 | M·H·P: 200 |
| [ ] | API-201 | POST | `/zoom/accounts` | zoom | `ZoomController_create` | 201 | 미실행 |
| [ ] | API-202 | PATCH | `/zoom/accounts/{id}` | zoom | `ZoomController_patch` | 200 | 미실행 |
| [ ] | API-203 | POST | `/zoom/assign` | zoom | `ZoomController_assign` | 201 | 미실행 |
| [ ] | API-204 | POST | `/consulting` | consulting | `create` | 201 | M·H·P: 201 |
| [ ] | API-205 | GET | `/consulting` | consulting | `ConsultingController_all` | 200 | M·H·P: 200 |
| [ ] | API-206 | GET | `/consulting/templates` | consulting | `ConsultingController_templates` | 200 | M·H·P: 200 |
| [ ] | API-207 | PATCH | `/consulting/templates/{consType}` | consulting | `ConsultingController_writeTemplate` | 200 | 미실행 |
| [ ] | API-208 | PATCH | `/consulting/{id}/items/{itemId}` | consulting | `ConsultingController_toggleItem` | 200 | 미실행 |
| [ ] | API-209 | PATCH | `/consulting/{id}/items` | consulting | `ConsultingController_editItems` | 200 | 미실행 |
| [ ] | API-210 | POST | `/consulting/{id}/items/{itemId}/files` | consulting | `ConsultingController_addItemFile` | 201 | 미실행 |
| [ ] | API-211 | DELETE | `/consulting/{id}/items/{itemId}/files/{fileId}` | consulting | `ConsultingController_removeItemFile` | 204 | 미실행 |
| [ ] | API-212 | GET | `/consulting/accounting` | consulting | `ConsultingController_accounting` | 200 | M·H·P: 200 |
| [ ] | API-213 | GET | `/consulting/students` | consulting | `ConsultingController_students` | 200 | M·H·P: 200 |
| [ ] | API-214 | GET | `/consulting/{id}` | consulting | `detail` | 200 | M·H·P: 200 |
| [ ] | API-215 | PATCH | `/consulting/{id}` | consulting | `updateCore` | 200 | 미실행 |
| [ ] | API-216 | DELETE | `/consulting/{id}` | consulting | `archive` | 204 | 미실행 |
| [ ] | API-217 | PATCH | `/consulting/{id}/share` | consulting | `updateShare` | 200 | 미실행 |
| [ ] | API-218 | POST | `/consulting/{id}/contract-files` | consulting | `addContractFile` | 201 | 미실행 |
| [ ] | API-219 | DELETE | `/consulting/{id}/contract-files/{fileId}` | consulting | `removeContractFile` | 204 | 미실행 |
| [ ] | API-220 | POST | `/consulting/{id}/feedback` | consulting | `addFeedback` | 201 | 미실행 |
| [ ] | API-221 | POST | `/consulting/{id}/feedback/{feedbackId}/resolve` | consulting | `markFeedbackResolved` | 201 | 미실행 |
| [ ] | API-222 | POST | `/consulting/{id}/deliver` | consulting | `deliverContract` | 201 | 미실행 |
| [ ] | API-223 | POST | `/consulting/{id}/signed-files` | consulting | `addSignedFile` | 201 | 미실행 |
| [ ] | API-224 | POST | `/consulting/{id}/sessions/preview` | consulting | `ConsultingController_previewSessions` | 201 | 미실행 |
| [ ] | API-225 | POST | `/consulting/{id}/sessions` | consulting | `ConsultingController_addSessions` | 201 | 미실행 |
| [ ] | API-226 | PATCH | `/consulting/{id}/sessions/{sessId}` | consulting | `ConsultingController_writeSession` | 200 | 미실행 |
| [ ] | API-227 | POST | `/consulting/{id}/close/preview` | consulting | `ConsultingController_previewClose` | 201 | 미실행 |
| [ ] | API-228 | POST | `/consulting/{id}/close` | consulting | `ConsultingController_close` | 201 | 미실행 |
| [ ] | API-229 | POST | `/consulting/{id}/payments` | consulting | `ConsultingController_addPayment` | 201 | 미실행 |
| [ ] | API-230 | POST | `/consulting/{id}/invoice` | consulting | `ConsultingController_toInvoice` | 201 | 미실행 |
| [ ] | API-231 | GET | `/board` | board | `BoardController_range` | 200 | M·H·P: 200 |
| [ ] | API-232 | GET | `/teacher/shell` | teacher | `TeacherController_shell` | 200 | M·H·P: 200 |
| [ ] | API-233 | GET | `/teacher/home` | teacher | `TeacherController_home` | 200 | M·H·P: 200 |
| [ ] | API-234 | GET | `/teacher/lessons/{serId}/{onDate}/hub` | teacher | `TeacherController_lessonHub` | 200 | 미실행 |
| [ ] | API-235 | GET | `/teacher/history` | teacher | `TeacherController_history` | 200 | M·H·P: 200 |
| [ ] | API-236 | GET | `/teacher/guides` | teacher | `TeacherController_guides` | 200 | M·H·P: 200 |
| [ ] | API-237 | GET | `/teacher/guides/received` | teacher | `TeacherController_receivedGuides` | 200 | M·H·P: 200 |
| [ ] | API-238 | POST | `/teacher/guides/{id}/ack` | teacher | `TeacherController_acknowledgeGuide` | 200 | 미실행 |
| [ ] | API-239 | GET | `/teacher/suggestions` | teacher | `TeacherController_suggestions` | 200 | M·H·P: 200 |
| [ ] | API-240 | POST | `/teacher/suggestions` | teacher | `TeacherController_createSuggestion` | 201 | M·H·P: 201 |
| [ ] | API-241 | POST | `/teacher/diagnostics` | teacher | `TeacherController_createDiagnostic` | 201 | 미실행 |
| [ ] | API-242 | GET | `/teacher/unavailable` | teacher | `TeacherController_unavailable` | 200 | M·H·P: 200 |
| [ ] | API-243 | POST | `/teacher/unavailable` | teacher | `TeacherController_createUnavailable` | 201 | 미실행 |
| [ ] | API-244 | DELETE | `/teacher/unavailable/{id}` | teacher | `TeacherController_deleteUnavailable` | 200 | 미실행 |
| [ ] | API-245 | POST | `/teacher/requests` | teacher | `TeacherController_createSettingRequest` | 201 | 미실행 |
| [ ] | API-246 | GET | `/gpa` | gpa | `GpaController_board` | 200 | 미실행 |
| [ ] | API-247 | GET | `/exec` | exec | `ExecController_range` | 200 | M·H·P: 200 |
| [ ] | API-248 | PUT | `/exec/areas/{key}/owner` | exec | `ExecController_setAreaOwner` | 200 | 미실행 |
| [ ] | API-249 | PATCH | `/exec/report` | exec | `ExecController_saveMemo` | 200 | 미실행 |
| [ ] | API-250 | POST | `/exec/report/submit` | exec | `ExecController_submit` | 201 | 미실행 |
| [ ] | API-251 | POST | `/exec/report/{id}/review` | exec | `ExecController_review` | 201 | 미실행 |
| [ ] | API-252 | POST | `/exec/report/{id}/withdraw` | exec | `ExecController_withdraw` | 201 | 미실행 |
| [ ] | API-253 | GET | `/drawer` | drawer | `DrawerController_all` | 200 | M·H·P: 200 |
| [ ] | API-254 | GET | `/drawer/staff-directory` | drawer | `DrawerController_staffDirectory` | 200 | M·H·P: 200 |
| [ ] | API-255 | GET | `/drawer/staff-directory/{id}` | drawer | `DrawerController_staffDirectoryDetail` | 200 | 미실행 |
| [ ] | API-256 | GET | `/drawer/staff-directory/{id}/home` | drawer | `DrawerController_staffTeacherHome` | 200 | 미실행 |
| [ ] | API-257 | GET | `/drawer/staff-directory/{id}/guides` | drawer | `DrawerController_staffTeacherGuides` | 200 | 미실행 |
| [ ] | API-258 | GET | `/drawer/staff-directory/{id}/suggestions` | drawer | `DrawerController_staffTeacherSuggestions` | 200 | 미실행 |
| [ ] | API-259 | GET | `/drawer/staff-directory/{id}/history` | drawer | `DrawerController_staffTeacherHistory` | 200 | 미실행 |
| [ ] | API-260 | GET | `/drawer/staff-directory/{id}/inbox` | drawer | `DrawerController_staffTeacherInbox` | 200 | 미실행 |
| [ ] | API-261 | POST | `/drawer/staff` | drawer | `DrawerController_createStaff` | 201 | A: 201 |
| [ ] | API-262 | PATCH | `/drawer/staff/{id}` | drawer | `DrawerController_updateStaff` | 200 | 미실행 |
| [ ] | API-263 | DELETE | `/drawer/staff/{id}` | drawer | `DrawerController_deleteStaff` | 200 | 미실행 |
| [ ] | API-264 | POST | `/drawer/staff/{id}/password-reset` | drawer | `DrawerController_resetStaffPassword` | 201 | 미실행 |
| [ ] | API-265 | PATCH | `/drawer/staff/{id}/active` | drawer | `DrawerController_setStaffActive` | 200 | 미실행 |
| [ ] | API-266 | PATCH | `/drawer/todos/{id}` | drawer | `DrawerController_todoDone` | 200 | M·H·P: 200 |
| [ ] | API-267 | GET | `/drawer/schedule-history` | drawer | `DrawerController_scheduleHistory` | 200 | 미실행 |
| [ ] | API-268 | POST | `/drawer/todos` | drawer | `DrawerController_createTodo` | 201 | M·H·P: 201 |
| [ ] | API-269 | DELETE | `/drawer/todos/completed` | drawer | `DrawerController_clearDoneTodos` | 200 | 미실행 |
| [ ] | API-270 | PATCH | `/drawer/notis/{id}/read` | drawer | `DrawerController_notiRead` | 200 | 미실행 |
| [ ] | API-271 | PATCH | `/drawer/notis/read-all` | drawer | `DrawerController_notiReadAll` | 200 | 미실행 |
| [ ] | API-272 | POST | `/drawer/requests/{id}/review` | drawer | `DrawerController_reviewRequest` | 201 | 미실행 |
| [ ] | API-273 | POST | `/drawer/change-requests/{id}/review` | drawer | `DrawerController_reviewChangeRequest` | 201 | 미실행 |
| [ ] | API-274 | POST | `/drawer/approvals/undo` | drawer | `DrawerController_undoApproval` | 201 | 미실행 |
| [ ] | API-275 | POST | `/drawer/change-requests` | drawer | `DrawerController_createChangeReq` | 201 | 미실행 |
| [ ] | API-276 | GET | `/permissions` | drawer | `PermissionsController_table` | 200 | M·H·P: 200, 403 |
| [ ] | API-277 | GET | `/catalog` | catalog | `CatalogController_all` | 200 | M·H·P: 200 |
| [ ] | API-278 | POST | `/catalog/kinds` | catalog | `CatalogController_createKind` | 201 | 미실행 |
| [ ] | API-279 | PATCH | `/catalog/kinds/{key}` | catalog | `CatalogController_patchKind` | 200 | 미실행 |
| [ ] | API-280 | POST | `/catalog/subs` | catalog | `CatalogController_createSub` | 201 | 미실행 |
| [ ] | API-281 | PATCH | `/catalog/subs/{key}` | catalog | `CatalogController_patchSub` | 200 | 미실행 |
| [ ] | API-282 | GET | `/students/{id}/guardians` | guardians | `GuardiansController_list` | 200 | M·H·P: 200 |
| [ ] | API-283 | POST | `/students/{id}/guardians` | guardians | `GuardiansController_create` | 201 | M·H·P: 201 |
| [ ] | API-284 | GET | `/guardians/channels` | guardians | `GuardiansController_channels` | 200 | 미실행 |
| [ ] | API-285 | POST | `/guardians/send` | guardians | `GuardiansController_send` | 200 | 미실행 |
| [ ] | API-286 | PATCH | `/guardians/{id}` | guardians | `GuardiansController_patch` | 200 | M·H·P: 200 |
| [ ] | API-287 | DELETE | `/guardians/{id}` | guardians | `GuardiansController_deactivate` | 200 | M·H·P: 200 |
| [ ] | API-288 | GET | `/students` | students | `StudentsController_list` | 200 | M·H·P: 200, 401, 403 |
| [ ] | API-289 | POST | `/students` | students | `StudentsController_create` | 201 | M·H·P: 201, 409 |
| [ ] | API-290 | GET | `/students/options` | students | `StudentsController_registrationOptions` | 200 | M·H·P: 200 |
| [ ] | API-291 | GET | `/students/schools` | students | `StudentsController_searchSchools` | 200 | 미실행 |
| [ ] | API-292 | POST | `/students/schools` | students | `StudentsController_createSchool` | 201 | 미실행 |
| [ ] | API-293 | POST | `/students/preview` | students | `StudentsController_previewCreate` | 200 | M·H·P: 200 |
| [ ] | API-294 | GET | `/students/reactivation-candidates` | students | `StudentsController_reactivationCandidates` | 200 | 미실행 |
| [ ] | API-295 | POST | `/students/{id}/reactivate/preview` | students | `StudentsController_previewReactivation` | 200 | 미실행 |
| [ ] | API-296 | POST | `/students/{id}/reactivate` | students | `StudentsController_reactivate` | 201 | 미실행 |
| [ ] | API-297 | GET | `/students/{id}/hub` | students | `StudentsController_hub` | 200 | M·H·P: 200 |
| [ ] | API-298 | GET | `/students/{id}/kinder-marker` | students | `StudentsController_kinderHistory` | 200 | 미실행 |
| [ ] | API-299 | POST | `/students/{id}/kinder-marker` | students | `StudentsController_createKinderMarker` | 201 | 미실행 |
| [ ] | API-300 | GET | `/students/{id}` | students | `StudentsController_detail` | 200 | M·H·P: 200 |
| [ ] | API-301 | POST | `/teacher/private-notes` | private-notes | `PrivateNotesController_write` | 201 | 미실행 |
| [ ] | API-302 | GET | `/teacher/private-notes/receipts` | private-notes | `PrivateNotesController_receipts` | 200 | 미실행 |
| [ ] | API-303 | GET | `/students/{studentId}/private-notes` | private-notes | `PrivateNotesController_studentNotes` | 200 | 미실행 |
| [ ] | API-304 | GET | `/material-requests/options` | material-requests | `MaterialRequestsController_options` | 200 | M·H·P: 200 |
| [ ] | API-305 | GET | `/material-requests/mine` | material-requests | `MaterialRequestsController_mine` | 200 | M·H·P: 200 |
| [ ] | API-306 | POST | `/material-requests` | material-requests | `MaterialRequestsController_create` | 201 | 미실행 |
| [ ] | API-307 | GET | `/material-requests` | material-requests | `MaterialRequestsController_all` | 200 | M·H·P: 200 |
| [ ] | API-308 | PATCH | `/material-requests/{id}` | material-requests | `MaterialRequestsController_transition` | 200 | 미실행 |
| [ ] | API-309 | POST | `/material-requests/{id}/ack` | material-requests | `MaterialRequestsController_acknowledge` | 200 | 미실행 |

## 청크 종료와 검증 경계

- [ ] 구현된 PGlite 구조와 선택된 실행 범위 밖의 SQL/extension/transaction/constraint·동시성 검증을 구분해 보완한다.
- [ ] 합성 seed·역할·방문자 격리를 먼저 검증한 뒤 기능군별 CRUD→권한→오류→초기화 순으로 진행한다.
- [ ] 기능군마다 관련 API·route·공용 서랍·출력 경계를 재조회하고 checklist와 실제 증거를 함께 갱신한다.
- [ ] 개인정보·secret·외부발송 차단·비영속 상태를 공개 build와 브라우저에서 검증한다.
- [ ] 로컬 검증, Git commit/push, 별도 Vercel 데모 배포·실URL 검수는 각각 증거를 남긴다.

이번 갱신은 기존 세 보고서를 읽어 operationId·case·call을 체크리스트에 반영하고 JSON/수량/증거 링크/diff를 검증한 문서 작업이다. 새 앱 실행·DB 접근·외부 발송·배포는 수행하지 않았다. 실행 사실은 위 영수증의 시각·범위에 한정하며 pending/partial을 전수 완료로 해석하지 않는다.
