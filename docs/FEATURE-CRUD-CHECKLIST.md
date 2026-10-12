<!-- @file-guide
목적: 원본309 API와31 route entry를 공개 데모 기능별 계획·실행 체크리스트로 연결한다.
책임/재사용: FEATURE-CRUD-CHECKLIST.json이 기계 판독 목록을 소유한다. 최상위 범위와 실행 순서는 ../AGENTS.md·../PLAN.md를 따른다.
검증/작업 지침: source SHA·operationId·정적 호출자·역할별 실제 CRUD 증거를 구분하며 실행하지 않은 검증은 pending으로 둔다.
-->

# 공개 데모 기능·CRUD 체크리스트

작성일: 2026-10-12. 상태: **계획 작성, 체험판 런타임 검증 미실행**. [JSON 목록](FEATURE-CRUD-CHECKLIST.json)과 같은 ID를 사용한다. 원본 파일·운영 앱·DB·배포는 변경하지 않았다.

## 기준과 수량

| 기준 | 목록 수 | 실행 검증 |
|---|---:|---|
| OpenAPI path | 279 | 구조 목록만 확인 |
| API operation (method + path + operationId) | 309 | 0/309, 전부 not-run |
| 기능 tag | 22 | 기능별 scenario pending |
| Front HTTP 호출 지점 | 310 | 310곳을 OpenAPI에 정적으로 연결; 런타임 PASS 아님 |
| route entry | 31 | 0/31, 전부 not-run |
| 실제 page entry / redirect entry | 28 / 3 | 표시·입력 / 목적지·query 보존을 각각 검증 |

원본 현재 HEAD와 dirty 상태·파일 SHA는 JSON의 source에 고정했다. [원본 OpenAPI](../backend/openapi.json), [공용 Query](../src/api/queries.ts), [학생 API](../src/api/students.ts), `원본 contract-audit.mjs` (대조 기록)를 읽었다. 원본 감사 도구의 `--write`는 실행하지 않았다. R117 배포 commit은 참고 기준이며 현재 로컬 후속 변경을 배포 성과로 포함하지 않는다.

PGlite/메모리 DB 호환성 spike는 진행 중이다. 최종 엔진·실행 위치·reset/reload/새탭 수명을 확정했다고 쓰지 않는다. 방문자별 상태는 메모리만 사용하며 서버리스 warm instance나 단일 인스턴스 공유를 전제로 하지 않는다.

## 체크 방법

각 API는 아래 C01~C07을, 각 route는 S01~S04를 실행한다. 처음에는 모두 pending이다. 해당하지 않는 항목만 원본 계약과 사유를 기록해 N/A로 바꾼다. handler 재사용·API 개수 일치·화면 렌더만으로 PASS할 수 없다.

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

| ID | 영역 | 필수 경계 | 상태 |
|---|---|---|---|
| D01 | 업무 화면·계약 | 기존31 route entry·309 API 계약과 권한/계산/검증을 최대한 재사용한다. mock success 응답만으로 writer를 대체하지 않는다. | pending |
| D02 | DB 수명 | 공개 데모의 방문자별 업무 상태는 메모리만 사용한다. durable DB·localStorage·IndexedDB를 쓰지 않으며 warm instance/단일 인스턴스를 전제로 하지 않는다. reset/reload/새탭 정책은 구현 결정 후 검증한다. | pending |
| D03 | 실행 엔진 | PGlite/메모리 호환성 spike 진행 중이다. TypeORM·잠금·트랜잭션·지연 제약·GiST/extension·날짜·파일 bytes 호환 여부를 확인하기 전 구조를 확정했다고 쓰지 않는다. | pending |
| D04 | OTP/email/SMS | 원본 입력·오류·검증·재시도 UI는 유지하되 외부 provider 전송은 방문자 내부 모의 우편함/이력으로 바꾼다. 실제 수신 성공이라고 표시하지 않는다. | pending |
| D05 | 지급·환불·증빙 | 원장 처리와 합성 금액·계좌만 체험한다. 실제 은행 이체·결제망·외부 발급/회계 시스템 연결을 하지 않는다. | pending |
| D06 | 파일·Zoom·외부 링크 | 방문자 메모리의 합성 첨부·다운로드만 사용한다. 실제 외부 스토리지·운영 Zoom 계정·학부모 발송 링크로 연결하지 않는다. | pending |
| D07 | seed·개인정보 | 원본 seed도 공개 승인을 받은 실제 개인정보라고 가정하지 않는다. 이름/전화/email/계좌/userid와 모든 파생·자유문·파일 값을 데모 fixture로 치환한다. | pending |
| D08 | 서비스 의미 | GPA는 원본의 과거 읽기 전용 상태를 유지한다. 화면 연결을 찾지 못한8API는 contract 목록에서 삭제하거나 새 화면완료로 승격하지 않고 legacy/direct API 사용 여부를 검수한다. | pending |

## 합성 seed·개인정보 치환 체크리스트

- [ ] **P01 운영 연결·비밀값 차단** — 원본 .env*, .vercel, dump, Git 이력, 토큰·쿠키·secret·실제 DB URL을 복사하지 않는다. 새 앱의 bundle/config/network를 검사한다.
- [ ] **P02 이름·인명 치환** — STAFF/STU/GUARDIAN뿐 아니라 JSONB·리포트·안내·컨설팅·회의·검색·알림·이력의 모든 인명을 공개 데모용 합성 이름으로 바꾼다.
- [ ] **P03 전화번호 치환** — 전화/문자 수신번호·연락처는 고정된 합성 allowlist로 바꾸고 DTO 입력 형식은 유지한다. 유효 형식이 실제 전송 가능한 번호라는 의미가 없도록 egress를 차단한다.
- [ ] **P04 email 치환** — email·login email·파일 문구는 example.invalid 도메인의 합성 주소로 바꾸고 원본 도메인/연락처 잔존을 스캔한다.
- [ ] **P05 계좌·은행·신분 정보** — 합성 계좌만 사용하고 공개/마스킹/reveal·snapshot·내보내기까지 확인한다. 원본 계좌·예금주·주민번호·결제 식별자는 남기지 않는다.
- [ ] **P06 사용자 ID·PK/FK** — 로그인 ID는 demo 전용으로 바꾼다. 내부 숫자 PK를 재사용/재생성하는 선택은 FK와 실제 actor/target 일관성을 검증한 후 기록한다. 원본 운영 ID/계정 URL을 공개하지 않는다.
- [ ] **P07 데모 인증·자격** — 공개 데모 자격은 운영 자격과 분리한다. 초기 hash·복구 코드·JWT/cookie·요청키·세션 식별자는 방문자별로 생성하고 다른 방문자와 공유하지 않는다.
- [ ] **P08 자유문·중첩 JSON** — 메모·과제·관찰·학생 특이사항·연락 이력·오류 메시지·검색색인·JSONB에 원본 인명/연락처가 남는지 구조 순회와 원본 문자열 대조를 실행한다.
- [ ] **P09 첨부·파일·미리보기** — 실제 사진·문서·리포트 파일은 복사하지 않는다. 합성 bytes·파일명·메타데이터·다운로드·PNG/PDF/CSV 생성 결과를 검사한다.
- [ ] **P10 외부 링크·서비스 URL** — Zoom 링크·웹훅·메일/SMS endpoint·보호자 발송 URL·외부 스토리지 URL은 데모 내부 경로 또는 명시적 simulation으로 바꾼다.
- [ ] **P11 전송 경계** — 정상·재시도·실패 경로에서 OTP/email/SMS/외부 스토리지/실제 송금 네트워크가 나가지 않는지 네트워크 계측으로 확인한다. UI 문구만 모의로 바꾸지 않는다.
- [ ] **P12 메모리·방문자 격리** — 방문자A create/update/delete가 B에 보이지 않아야 한다. 새 방문·reload·새탭·reset의 정확한 수명은 결정·검증하고 localStorage/IndexedDB/원격DB에 업무 행을 영속화하지 않는다.
- [ ] **P13 역할별 전수 화면** — CEO/admin/manager/teacher/anonymous의 31 route entry와 공용 서랍·검색·출력에서 합성 정보만 보이는지 확인한다.
- [ ] **P14 데모 날짜** — seed 날짜를 옮기거나 기준 시각을 고정할 경우 전월 급여·10일 기준·마감·종류 판정·예외·반복·제출 지연 규칙이 같이 유지되는지 검증한다.
- [ ] **P15 로그·공개 산출물** — 콘솔·서버 오류·소스맵·GitHub·빌드 산출물·PPTX/스크린샷·README에 secret/실제 인명·연락처·계좌·운영자격이 없는지 공개 전 다시 스캔한다.

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

API 1개 · HTTP GET 1 · 상태 pending

- [ ] **health-01** — 원본 health 응답 형상을 읽는다. 외부 운영 health를 proxy하지 않는다.

후보 route: 페이지 없음; 직접 상태 확인.

### FEATURE-AUTH — 로그인·첫 설정·비밀번호 복구

API 10개 · HTTP POST 7, GET 3 · 상태 pending

- [ ] **auth-01** — 합성 계정 로그인·현재 사용자·갱신·로그아웃을 이어 확인한다.
- [ ] **auth-02** — 코드 요청·첫 설정·복구는 로컬 모의 우편함으로 확인하며 실제 SMS/email이 나가지 않는다.

후보 route: `/login`, `/onboarding`, `/password-reset`.

### FEATURE-META — 공용 선택지

API 1개 · HTTP GET 1 · 상태 pending

- [ ] **meta-01** — 종류·과목·강사·학생·학년 선택지가 합성 PK/FK와 맞고 화면별 중복 정본을 만들지 않는다.

후보 route: `/accounting`, `/board`, `/books`, `/consulting`, `/exec`, `/guides`, `/intake`, `/ops`, `/reports`, `/schedule`, `/staff/[id]`, `/students/[id]`, `/students/new`, `/teacher`, `/teacher/guides`, `/teacher/history`, `/teacher/suggestions`, `/teacher/unavailable`.

### FEATURE-SCHEDULE — 캘린더·반복·예외·이동

API 23개 · HTTP GET 10, POST 8, PUT 1, DELETE 2, PATCH 2 · 상태 pending

- [ ] **schedule-01** — 생성→회차 조회→개별/반복 변경→이동/취소→복원/undo를 같은 방문자 상태에서 확인한다.
- [ ] **schedule-02** — 겹침·정원·Kinder1명·정책 시작일·원래 회차일/실제일을 원본과 대조한다.

후보 route: `/board`, `/guides`, `/ops`, `/schedule`, `/staff/[id]`, `/students/[id]`, `/teacher/guides`.

### FEATURE-REPORTS — 종류별 리포트·승인·자료·전달

API 14개 · HTTP GET 6, POST 6, PUT 2 · 상태 pending

- [ ] **reports-01** — 일반·그룹·Kinder·진단 양식 입력→초안→제출→관리자 승인/반려→재조회를 확인한다.
- [ ] **reports-02** — expectedVersion stale409·최초 제출시각·실제 actor·자료 생성 직후 선택을 확인한다.
- [ ] **reports-03** — 전달/재발송/미작성 알림은 내부 기록과 모의 전송 결과만 만든다.

후보 route: `/ops`, `/reports`, `/schedule`, `/staff/[id]`.

### FEATURE-FILES — 첨부·다운로드

API 2개 · HTTP POST 1, GET 1 · 상태 pending

- [ ] **files-01** — 합성 파일만 메모리에 저장하고 같은 방문자 권한으로 bytes·MIME·이름·다운로드를 재조회한다.

후보 route: `/accounting`, `/books`, `/consulting`, `/reports`, `/schedule`, `/staff/[id]`, `/teacher/guides`.

### FEATURE-ACCOUNTING — 청구·수납·환불·급여·단가·마감

API 69개 · HTTP GET 23, POST 42, PATCH 2, DELETE 2 · 상태 pending

- [ ] **accounting-01** — 청구·수납·조정 승인·환불·지급 원장·취소 후 같은 방문자의 메모리 상태를 재조회한다. hard reload는 확정한 데모 수명에 따라 초기화/유지 결과를 별도로 검증한다.
- [ ] **accounting-02** — 마감/해제·확정 snapshot·계산·단가 적용기간·학생 예외·중복 요청·보호 계좌 권한을 각각 확인한다.
- [ ] **accounting-03** — 급여/환불 내부 원장 처리를 실제 은행 송금으로 표시하지 않는다.

후보 route: `/accounting`, `/board`, `/ops`, `/schedule`, `/staff/[id]`.

### FEATURE-OPS — 상담 유입·회의·할 일·강사 교체·마케팅

API 45개 · HTTP GET 5, POST 27, PATCH 9, PUT 3, DELETE 1 · 상태 pending

- [ ] **ops-01** — 상담 유입 단계·메모·상담 연결, 회의 참석/할 일, 마케팅 create/update/stale, 강사 교체 apply/undo를 각각 확인한다.
- [ ] **ops-02** — 날짜·담당자·원래/실제 회차·requestKey·권한과 이력의 연결을 유지한다.

후보 route: `/board`, `/intake`, `/ops`, `/schedule`, `/staff/[id]`, `/teacher`.

### FEATURE-BOOKS — 교재·판·배정·진도·전달

API 20개 · HTTP GET 7, POST 8, PATCH 5 · 상태 pending

- [ ] **books-01** — 교재/판 등록→배정→진도→반납/교체→자료 전달/수신 확인을 같은 학생 identity로 재조회한다.
- [ ] **books-02** — 카탈로그 writer와 리포트 안 자료 writer를 구분하고 학생/강사/과목 배정·계보를 보존한다.

후보 route: `/accounting`, `/books`, `/intake`, `/ops`.

### FEATURE-GUIDES — 수업 안내·작성·발송·확인

API 14개 · HTTP GET 5, POST 7, PATCH 1, PUT 1 · 상태 pending

- [ ] **guides-01** — 작성/수정/회신·확인과 강사 수신 reader를 연결하고 외부 발송은 로컬 모의 결과로 구분한다.

후보 route: `/consulting`, `/guides`, `/phrases`, `/students/[id]`.

### FEATURE-ZOOM — Zoom 계정·배정

API 4개 · HTTP GET 1, POST 2, PATCH 1 · 상태 pending

- [ ] **zoom-01** — 합성 Zoom 계정과 수업 배정·충돌·조회만 체험하며 실제 Zoom 인증정보/회의 계정 연결은 없다.

후보 route: `/guides`, `/zoom`.

### FEATURE-CONSULTING — 컨설팅·항목·계약·파일·수납

API 27개 · HTTP POST 13, GET 5, PATCH 6, DELETE 3 · 상태 pending

- [ ] **consulting-01** — 등록 후 시작·유형별 항목·계약 단계·금액·회차·파일·수납을 확인하고 후속 실패가 학생 등록을 취소하지 않는지 확인한다.
- [ ] **consulting-02** — 대표·담당·최초 등록자·공개 범위와 파일 접근이 원본 정책에 맞는지 역할별 확인한다.

후보 route: `/consulting`, `/students/[id]`, `/students/new`.

### FEATURE-BOARD — 대기함·업무 보드

API 1개 · HTTP GET 1 · 상태 pending

- [ ] **board-01** — 대기함 항목의 원래 페이지/정확한 대상을 열고 처리 후 같은 원장을 재조회한다.

후보 route: `/board`.

### FEATURE-TEACHER — 강사 홈·안내·급여·불가시간·건의

API 14개 · HTTP GET 8, POST 5, DELETE 1 · 상태 pending

- [ ] **teacher-01** — 강사 홈·안내·전월 급여/히스토리·불가시간·건의의 권한과 날짜 제약을 확인한다.
- [ ] **teacher-02** — 관리자 조회 대상 강사와 실제 작성자를 분리하고 비공개 직원 메모가 나오지 않는지 확인한다.

후보 route: `/schedule`, `/staff/[id]`, `/teacher`, `/teacher/guides`, `/teacher/history`, `/teacher/suggestions`, `/teacher/unavailable`.

### FEATURE-GPA — 과거 GPA 읽기 전용

API 1개 · HTTP GET 1 · 상태 pending

- [ ] **gpa-01** — 원본처럼 과거 원장 조회만 허용한다. 전체 CRUD 요청을 이유로 퇴역 GPA 쓰기를 새로 만들지 않는다.

후보 route: `/gpa`.

### FEATURE-EXEC — 대표 보고·정책

API 6개 · HTTP GET 1, PUT 1, PATCH 1, POST 3 · 상태 pending

- [ ] **exec-01** — 대표 보고와 정책 조회·설정의 허용 역할, 계산 근거·날짜·하위 원장 이동을 확인한다.

후보 route: `/exec`.

### FEATURE-DRAWER — 공용 서랍·구성원·알림·권한

API 24개 · HTTP GET 10, POST 7, PATCH 5, DELETE 2 · 상태 pending

- [ ] **drawer-01** — 모든 보호 화면에서 공용 검색/알림/할 일/요청/빠른 등록을 연결한다.
- [ ] **drawer-02** — 합성 구성원 생성·역할 변경·중지/복원 등의 실제 서버 권한과 타인의 민감 필드 projection을 확인한다.

후보 route: `/accounting`, `/board`, `/books`, `/ops`, `/permissions`, `/schedule`, `/staff`, `/staff/[id]`, `/teacher`.

### FEATURE-CATALOG — 과목·프로그램·학년·종류

API 5개 · HTTP GET 1, POST 2, PATCH 2 · 상태 pending

- [ ] **catalog-01** — 과목/프로그램/종류 선택·생성/변경 계약과 기존 FK·정렬·필터를 확인한다.

후보 route: `/programs`.

### FEATURE-GUARDIANS — 보호자·연락 이력

API 6개 · HTTP GET 2, POST 2, PATCH 1, DELETE 1 · 상태 pending

- [ ] **guardians-01** — 합성 보호자 연결·연락 수단·동의·발송 이력만 사용하고 전송은 로컬 모의로 처리한다.

후보 route: `/accounting`, `/board`, `/consulting`, `/guides`, `/reports`, `/schedule`, `/staff/[id]`.

### FEATURE-STUDENTS — 학생 등록·재활성화·상세·Kinder

API 13개 · HTTP GET 7, POST 6 · 상태 pending

- [ ] **students-01** — 입력 검토→동일 writer preview rollback→등록→상세/허브 재조회와 재활성화 STU ID 보존을 확인한다.
- [ ] **students-02** — Kinder 표시 변경·그룹 충돌409와 등록/추가/복사/undo 방어를 원본과 대조한다.

후보 route: `/students`, `/students/[id]`, `/students/new`.

### FEATURE-PRIVATE-NOTES — 직원 전용 비공개 메모

API 3개 · HTTP POST 1, GET 2 · 상태 pending

- [ ] **private-notes-01** — 허용 직원 CRUD와 강사 직접 API 거절, 검색·다운로드·알림의 비노출을 확인한다.

후보 route: `/students/[id]`, `/teacher/history`.

### FEATURE-MATERIAL-REQUESTS — 자료 요청·처리·수신 확인

API 6개 · HTTP GET 3, POST 2, PATCH 1 · 상태 pending

- [ ] **material-requests-01** — 요청→관리자 처리→합성 첨부 전달→강사 수신 확인·이력을 재조회한다.

후보 route: `/books`, `/teacher/guides`.

## API별 전수 체크리스트

각 행의 체크는 C01~C07과 실행 증거가 충족된 뒤에만 완료한다. GET은 조회, 나머지 method는 생성/변경/삭제 외 승인·취소·미리보기·발송 같은 command도 포함한다. 번호만 보고 business CRUD 의미를 추정하지 않는다.

| 상태 | ID | Method | Path | Tag | Operation ID | 성공 상태 계약 |
|---|---|---|---|---|---|---|
| [ ] | API-001 | GET | `/health` | health | `HealthController_health` | 200 |
| [ ] | API-002 | POST | `/auth/login` | auth | `AuthController_login` | 201 |
| [ ] | API-003 | POST | `/auth/refresh` | auth | `AuthController_refresh` | 201 |
| [ ] | API-004 | POST | `/auth/logout` | auth | `AuthController_logout` | 204 |
| [ ] | API-005 | GET | `/auth/me` | auth | `AuthController_me` | 200 |
| [ ] | API-006 | GET | `/auth/onboarding` | auth | `OnboardingController_info` | 200 |
| [ ] | API-007 | POST | `/auth/onboarding/codes` | auth | `OnboardingController_codes` | 201 |
| [ ] | API-008 | POST | `/auth/onboarding/complete` | auth | `OnboardingController_complete` | 201 |
| [ ] | API-009 | GET | `/auth/password-reset` | auth | `PasswordResetController_info` | 200 |
| [ ] | API-010 | POST | `/auth/password-reset/codes` | auth | `PasswordResetController_codes` | 201 |
| [ ] | API-011 | POST | `/auth/password-reset/complete` | auth | `PasswordResetController_complete` | 204 |
| [ ] | API-012 | GET | `/meta` | meta | `MetaController_get` | 200 |
| [ ] | API-013 | GET | `/schedule/occurrences` | schedule | `ScheduleController_list` | 200 |
| [ ] | API-014 | GET | `/schedule/holidays` | schedule | `ScheduleController_holidays` | 200 |
| [ ] | API-015 | GET | `/schedule/unavailable` | schedule | `ScheduleController_unavailable` | 200 |
| [ ] | API-016 | GET | `/schedule/day-cancel/notices` | schedule | `ScheduleController_dayCancelNotices` | 200 |
| [ ] | API-017 | GET | `/schedule/series-counts` | schedule | `ScheduleController_seriesCounts` | 200 |
| [ ] | API-018 | GET | `/schedule/students/{studentId}/books` | schedule | `ScheduleController_studentBooks` | 200 |
| [ ] | API-019 | GET | `/schedule/teachers/{teacherId}/guides` | schedule | `ScheduleController_teacherGuides` | 200 |
| [ ] | API-020 | GET | `/schedule/tracking` | schedule | `ScheduleController_tracking` | 200 |
| [ ] | API-021 | POST | `/schedule/tracking/notes` | schedule | `ScheduleController_addNote` | 201 |
| [ ] | API-022 | GET | `/schedule/conflicts` | schedule | `ScheduleController_conflicts` | 200 |
| [ ] | API-023 | GET | `/schedule/horizon` | schedule | `ScheduleController_bounds` | 200 |
| [ ] | API-024 | PUT | `/schedule/{serId}/{onDate}/attendance` | schedule | `ScheduleController_saveAttendance` | 200 |
| [ ] | API-025 | DELETE | `/schedule/{serId}/{onDate}/attendance` | schedule | `ScheduleController_clearAttendance` | 200 |
| [ ] | API-026 | POST | `/schedule` | schedule | `ScheduleController_create` | 201 |
| [ ] | API-027 | POST | `/schedule/paste` | schedule | `ScheduleController_paste` | 201 |
| [ ] | API-028 | POST | `/schedule/move` | schedule | `ScheduleController_moveMany` | 201 |
| [ ] | API-029 | POST | `/schedule/day-cancel` | schedule | `ScheduleController_dayCancel` | 201 |
| [ ] | API-030 | POST | `/schedule/students/{studentId}/pause` | schedule | `ScheduleController_pauseStudent` | 201 |
| [ ] | API-031 | POST | `/schedule/students/{studentId}/pause/{pauseId}/resume` | schedule | `ScheduleController_resumeStudent` | 201 |
| [ ] | API-032 | POST | `/schedule/undo` | schedule | `ScheduleController_undo` | 201 |
| [ ] | API-033 | PATCH | `/schedule/{serId}` | schedule | `ScheduleController_patch` | 200 |
| [ ] | API-034 | DELETE | `/schedule/{serId}` | schedule | `ScheduleController_remove` | 200 |
| [ ] | API-035 | PATCH | `/schedule/{serId}/roster` | schedule | `ScheduleController_roster` | 200 |
| [ ] | API-036 | GET | `/reports` | reports | `ReportsController_list` | 200 |
| [ ] | API-037 | GET | `/reports/unwritten` | reports | `ReportsController_unwritten` | 200 |
| [ ] | API-038 | POST | `/reports/reminders` | reports | `ReportsController_reminders` | 201 |
| [ ] | API-039 | GET | `/reports/deliveries` | reports | `ReportsController_deliveryQueue` | 200 |
| [ ] | API-040 | POST | `/reports/deliveries` | reports | `ReportsController_deliver` | 201 |
| [ ] | API-041 | GET | `/reports/deliveries/history` | reports | `ReportsController_deliveryHistory` | 200 |
| [ ] | API-042 | POST | `/reports/deliveries/{sendId}/resend` | reports | `ReportsController_resend` | 201 |
| [ ] | API-043 | GET | `/reports/weekly` | reports | `ReportsController_weekly` | 200 |
| [ ] | API-044 | PUT | `/reports/weekly` | reports | `ReportsController_writeWeekly` | 200 |
| [ ] | API-045 | GET | `/reports/{serId}/{onDate}` | reports | `ReportsController_detail` | 200 |
| [ ] | API-046 | POST | `/reports/{serId}/{onDate}/materials` | reports | `ReportsController_createMaterial` | 201 |
| [ ] | API-047 | PUT | `/reports/{serId}/{onDate}/draft` | reports | `ReportsController_saveDraft` | 200 |
| [ ] | API-048 | POST | `/reports/{serId}/{onDate}/submit` | reports | `ReportsController_submit` | 201 |
| [ ] | API-049 | POST | `/reports/{serId}/{onDate}/review` | reports | `ReportsController_review` | 201 |
| [ ] | API-050 | POST | `/files` | files | `FilesController_upload` | 201 |
| [ ] | API-051 | GET | `/files/{id}` | files | `FilesController_download` | 200 |
| [ ] | API-052 | GET | `/accounting/book-sales` | accounting | `AccountingController_bookSaleLedger` | 200 |
| [ ] | API-053 | POST | `/accounting/book-sales` | accounting | `AccountingController_createBookSale` | 201 |
| [ ] | API-054 | GET | `/accounting/book-sales/{id}` | accounting | `AccountingController_bookSaleDetail` | 200 |
| [ ] | API-055 | POST | `/accounting/book-sales/{id}/cancel` | accounting | `AccountingController_cancelBookSale` | 201 |
| [ ] | API-056 | GET | `/accounting` | accounting | `AccountingController_all` | 200 |
| [ ] | API-057 | GET | `/accounting/student-cumulative` | accounting | `AccountingController_studentCumulative` | 200 |
| [ ] | API-058 | GET | `/accounting/delinquency-suspensions` | accounting | `AccountingController_delinquencyLedger` | 200 |
| [ ] | API-059 | POST | `/accounting/delinquency-suspensions/policy` | accounting | `AccountingController_writeDelinquencyPolicy` | 201 |
| [ ] | API-060 | POST | `/accounting/delinquency-suspensions/{studentId}/remind` | accounting | `AccountingController_remindDelinquency` | 201 |
| [ ] | API-061 | POST | `/accounting/delinquency-suspensions/remind-batch` | accounting | `AccountingController_remindDelinquencyBatch` | 201 |
| [ ] | API-062 | POST | `/accounting/delinquency-suspensions/{studentId}/suspend` | accounting | `AccountingController_suspendDelinquency` | 201 |
| [ ] | API-063 | POST | `/accounting/delinquency-suspensions/{studentId}/release` | accounting | `AccountingController_releaseDelinquency` | 201 |
| [ ] | API-064 | GET | `/accounting/adjustments` | accounting | `AccountingController_adjustmentLedger` | 200 |
| [ ] | API-065 | POST | `/accounting/adjustments` | accounting | `AccountingController_createAdjustment` | 201 |
| [ ] | API-066 | POST | `/accounting/adjustments/{id}/approve` | accounting | `AccountingController_approveAdjustment` | 201 |
| [ ] | API-067 | POST | `/accounting/adjustments/{id}/reject` | accounting | `AccountingController_rejectAdjustment` | 201 |
| [ ] | API-068 | POST | `/accounting/adjustments/{id}/cancel` | accounting | `AccountingController_cancelAdjustment` | 201 |
| [ ] | API-069 | POST | `/accounting/adjustments/{id}/undo` | accounting | `AccountingController_undoAdjustment` | 201 |
| [ ] | API-070 | GET | `/accounting/payment-evidence` | accounting | `AccountingController_paymentEvidenceLedger` | 200 |
| [ ] | API-071 | GET | `/accounting/payment-evidence/{payId}` | accounting | `AccountingController_paymentEvidence` | 200 |
| [ ] | API-072 | POST | `/accounting/payment-evidence/issue-batch` | accounting | `AccountingController_issuePaymentEvidenceBatch` | 201 |
| [ ] | API-073 | POST | `/accounting/payment-evidence/{payId}/issue` | accounting | `AccountingController_issuePaymentEvidence` | 201 |
| [ ] | API-074 | POST | `/accounting/payment-evidence/{payId}/cancel` | accounting | `AccountingController_cancelPaymentEvidence` | 201 |
| [ ] | API-075 | GET | `/accounting/protected-accounts` | accounting | `AccountingController_protectedAccountLedger` | 200 |
| [ ] | API-076 | POST | `/accounting/protected-accounts` | accounting | `AccountingController_writeProtectedAccount` | 201 |
| [ ] | API-077 | POST | `/accounting/protected-accounts/{accountId}/delete` | accounting | `AccountingController_deleteProtectedAccount` | 201 |
| [ ] | API-078 | POST | `/accounting/protected-accounts/{accountId}/reveal` | accounting | `AccountingController_revealProtectedAccount` | 201 |
| [ ] | API-079 | GET | `/accounting/student-refunds` | accounting | `AccountingController_studentRefundLedger` | 200 |
| [ ] | API-080 | POST | `/accounting/student-refunds/{adjustmentId}/pay` | accounting | `AccountingController_payStudentRefund` | 201 |
| [ ] | API-081 | POST | `/accounting/student-refunds/{adjustmentId}/cancel` | accounting | `AccountingController_cancelStudentRefund` | 201 |
| [ ] | API-082 | GET | `/accounting/tuition` | accounting | `AccountingController_tuition` | 200 |
| [ ] | API-083 | GET | `/accounting/payout-ledger` | accounting | `AccountingController_payoutDisbursementLedger` | 200 |
| [ ] | API-084 | POST | `/accounting/payout-ledger/pay-batch` | accounting | `AccountingController_payPayoutDisbursementBatch` | 201 |
| [ ] | API-085 | POST | `/accounting/payout-ledger/{payoutId}/pay` | accounting | `AccountingController_payPayoutDisbursement` | 201 |
| [ ] | API-086 | POST | `/accounting/payout-ledger/{payoutId}/cancel` | accounting | `AccountingController_cancelPayoutDisbursement` | 201 |
| [ ] | API-087 | GET | `/accounting/payouts` | accounting | `AccountingController_payoutSheet` | 200 |
| [ ] | API-088 | GET | `/accounting/payouts/{staffId}` | accounting | `AccountingController_payoutDetail` | 200 |
| [ ] | API-089 | GET | `/accounting/cashflow` | accounting | `AccountingController_cashflow` | 200 |
| [ ] | API-090 | POST | `/accounting/payouts/{month}/confirm` | accounting | `AccountingController_confirmPayout` | 201 |
| [ ] | API-091 | GET | `/accounting/bonus-rules` | accounting | `AccountingController_bonusBook` | 200 |
| [ ] | API-092 | POST | `/accounting/bonus-rules` | accounting | `AccountingController_writeBonusRule` | 201 |
| [ ] | API-093 | GET | `/accounting/privacy` | accounting | `AccountingController_acctPrivacy` | 200 |
| [ ] | API-094 | PATCH | `/accounting/privacy` | accounting | `AccountingController_setAcctPrivacy` | 200 |
| [ ] | API-095 | POST | `/accounting/withdrawals/preview` | accounting | `AccountingController_withdrawPreview` | 201 |
| [ ] | API-096 | POST | `/accounting/withdrawals` | accounting | `AccountingController_withdraw` | 201 |
| [ ] | API-097 | POST | `/accounting/tuition/close` | accounting | `AccountingController_closeMonth` | 201 |
| [ ] | API-098 | POST | `/accounting/tuition/reopen` | accounting | `AccountingController_reopenMonth` | 201 |
| [ ] | API-099 | GET | `/accounting/board` | accounting | `AccountingController_invoiceBoard` | 200 |
| [ ] | API-100 | GET | `/accounting/other-income` | accounting | `AccountingController_otherIncome` | 200 |
| [ ] | API-101 | POST | `/accounting/tuition/carry` | accounting | `AccountingController_carryTuition` | 201 |
| [ ] | API-102 | GET | `/accounting/invoices/draft` | accounting | `AccountingController_draftInvoice` | 200 |
| [ ] | API-103 | POST | `/accounting/invoices` | accounting | `AccountingController_issueInvoice` | 201 |
| [ ] | API-104 | POST | `/accounting/invoices/batch` | accounting | `AccountingController_issueBatch` | 201 |
| [ ] | API-105 | POST | `/accounting/invoices/{id}/deliver` | accounting | `AccountingController_deliverInvoice` | 201 |
| [ ] | API-106 | POST | `/accounting/invoices/{id}/void` | accounting | `AccountingController_voidInvoice` | 201 |
| [ ] | API-107 | POST | `/accounting/payments` | accounting | `AccountingController_addPayment` | 201 |
| [ ] | API-108 | POST | `/accounting/payments/manual` | accounting | `AccountingController_addManualPayment` | 201 |
| [ ] | API-109 | DELETE | `/accounting/payments/{id}` | accounting | `AccountingController_removePayment` | 200 |
| [ ] | API-110 | POST | `/accounting/expenses/{id}/review` | accounting | `AccountingController_reviewExpense` | 201 |
| [ ] | API-111 | GET | `/accounting/rates` | accounting | `AccountingController_rateBook` | 200 |
| [ ] | API-112 | POST | `/accounting/rates` | accounting | `AccountingController_writeRate` | 201 |
| [ ] | API-113 | POST | `/accounting/hourly-rates` | accounting | `AccountingController_createHourlyRate` | 201 |
| [ ] | API-114 | PATCH | `/accounting/hourly-rates/{id}` | accounting | `AccountingController_replaceHourlyRate` | 200 |
| [ ] | API-115 | DELETE | `/accounting/hourly-rates/{id}` | accounting | `AccountingController_retireHourlyRate` | 200 |
| [ ] | API-116 | GET | `/accounting/wages` | accounting | `AccountingController_wageHistory` | 200 |
| [ ] | API-117 | POST | `/accounting/wages` | accounting | `AccountingController_writeWage` | 201 |
| [ ] | API-118 | POST | `/accounting/sturates` | accounting | `AccountingController_writeStudentRate` | 201 |
| [ ] | API-119 | POST | `/accounting/expenses` | accounting | `AccountingController_createExpense` | 201 |
| [ ] | API-120 | GET | `/accounting/expenses/mine` | accounting | `AccountingController_myExpenses` | 200 |
| [ ] | API-121 | GET | `/ops` | ops | `OpsController_all` | 200 |
| [ ] | API-122 | POST | `/ops/meetings` | ops | `OpsController_createMeeting` | 201 |
| [ ] | API-123 | POST | `/ops/plans` | ops | `OpsController_createPlan` | 201 |
| [ ] | API-124 | POST | `/ops/leads` | ops | `OpsController_createLead` | 201 |
| [ ] | API-125 | PATCH | `/ops/leads/{id}` | ops | `OpsController_patchLead` | 200 |
| [ ] | API-126 | PATCH | `/ops/leads/{id}/stage` | ops | `OpsController_moveLeadStage` | 200 |
| [ ] | API-127 | POST | `/ops/leads/{id}/touches` | ops | `OpsController_addLeadTouch` | 201 |
| [ ] | API-128 | POST | `/ops/leads/{id}/fail` | ops | `OpsController_failLead` | 201 |
| [ ] | API-129 | POST | `/ops/leads/{id}/resume` | ops | `OpsController_resumeLead` | 201 |
| [ ] | API-130 | POST | `/ops/leads/{id}/enroll/preview` | ops | `OpsController_enrollPreview` | 201 |
| [ ] | API-131 | POST | `/ops/leads/{id}/enroll` | ops | `OpsController_enroll` | 201 |
| [ ] | API-132 | POST | `/ops/complaints` | ops | `OpsController_createComplaint` | 201 |
| [ ] | API-133 | PATCH | `/ops/complaints/{id}` | ops | `OpsController_patchComplaint` | 200 |
| [ ] | API-134 | POST | `/ops/teacher-change/preview` | ops | `OpsController_teacherChangePreview` | 201 |
| [ ] | API-135 | POST | `/ops/teacher-change` | ops | `OpsController_teacherChange` | 201 |
| [ ] | API-136 | POST | `/ops/teacher-change/{requestKey}/undo` | ops | `OpsController_teacherChangeUndo` | 201 |
| [ ] | API-137 | GET | `/ops/marketing-overview` | ops | `OpsController_marketingOverview` | 200 |
| [ ] | API-138 | POST | `/ops/marketing` | ops | `OpsController_createMarketing` | 201 |
| [ ] | API-139 | PATCH | `/ops/marketing/{id}` | ops | `OpsController_patchMarketing` | 200 |
| [ ] | API-140 | POST | `/ops/marketing/{id}/comments` | ops | `OpsController_comment` | 201 |
| [ ] | API-141 | POST | `/ops/marketing/{id}/replies` | ops | `OpsController_reply` | 201 |
| [ ] | API-142 | PATCH | `/ops/marketing/feedback/{id}` | ops | `OpsController_editPost` | 200 |
| [ ] | API-143 | GET | `/ops/plans/{id}` | ops | `OpsController_planDetail` | 200 |
| [ ] | API-144 | PATCH | `/ops/plans/{id}` | ops | `OpsController_patchPlan` | 200 |
| [ ] | API-145 | PATCH | `/ops/plans/{id}/owner` | ops | `OpsController_patchPlanOwner` | 200 |
| [ ] | API-146 | PATCH | `/ops/suggestions/{id}/reply` | ops | `OpsController_replySuggestion` | 200 |
| [ ] | API-147 | PATCH | `/ops/plans/{id}/stage` | ops | `OpsController_movePlanStage` | 200 |
| [ ] | API-148 | POST | `/ops/plans/{id}/due` | ops | `OpsController_decidePlanDue` | 201 |
| [ ] | API-149 | POST | `/ops/plans/{id}/review` | ops | `OpsController_reviewPlan` | 201 |
| [ ] | API-150 | POST | `/ops/plans/{id}/tasks` | ops | `OpsController_addPlanTask` | 201 |
| [ ] | API-151 | GET | `/ops/meetings/{id}` | ops | `OpsController_meetingDetail` | 200 |
| [ ] | API-152 | PUT | `/ops/meetings/{id}/agenda` | ops | `OpsController_writeMeetingAgenda` | 200 |
| [ ] | API-153 | POST | `/ops/meetings/{id}/agenda/import` | ops | `OpsController_importMeetingAgenda` | 200 |
| [ ] | API-154 | POST | `/ops/meetings/{id}/notice` | ops | `OpsController_sendMeetingNotice` | 201 |
| [ ] | API-155 | POST | `/ops/meetings/{id}/attend` | ops | `OpsController_respondMeeting` | 201 |
| [ ] | API-156 | POST | `/ops/meetings/{id}/minutes` | ops | `OpsController_writeMinutes` | 201 |
| [ ] | API-157 | POST | `/ops/meetings/{id}/todos` | ops | `OpsController_assignMeetingTask` | 201 |
| [ ] | API-158 | GET | `/ops/leads/{id}/diag` | ops | `LeadDiagController_history` | 200 |
| [ ] | API-159 | POST | `/ops/leads/{id}/diag` | ops | `LeadDiagController_append` | 201 |
| [ ] | API-160 | PUT | `/ops/leads/{id}/plan` | ops | `LeadPlanController_savePlan` | 200 |
| [ ] | API-161 | POST | `/ops/leads/{id}/hold/extend` | ops | `LeadPlanController_extendHold` | 200 |
| [ ] | API-162 | PUT | `/ops/leads/{id}/appts` | ops | `LeadPlanController_saveAppt` | 200 |
| [ ] | API-163 | DELETE | `/ops/leads/{id}/appts/{kind}` | ops | `LeadPlanController_deleteAppt` | 200 |
| [ ] | API-164 | POST | `/ops/leads/{id}/appts/schedule` | ops | `LeadPlanController_scheduleAppts` | 201 |
| [ ] | API-165 | POST | `/ops/leads/{id}/appts/book` | ops | `LeadPlanController_bookAppt` | 201 |
| [ ] | API-166 | GET | `/books` | books | `BooksController_all` | 200 |
| [ ] | API-167 | POST | `/books` | books | `BooksController_create` | 201 |
| [ ] | API-168 | PATCH | `/books/{id}` | books | `BooksController_patch` | 200 |
| [ ] | API-169 | GET | `/books/tracking` | books | `BooksController_tracking` | 200 |
| [ ] | API-170 | GET | `/books/assignment-options` | books | `BooksController_assignmentOptions` | 200 |
| [ ] | API-171 | GET | `/books/students/{studentId}/latest-diag` | books | `BooksController_latestDiag` | 200 |
| [ ] | API-172 | POST | `/books/issues` | books | `BooksController_issue` | 201 |
| [ ] | API-173 | POST | `/books/assignments` | books | `BooksController_assignment` | 201 |
| [ ] | API-174 | PATCH | `/books/issues/{id}/state` | books | `BooksController_issueState` | 200 |
| [ ] | API-175 | PATCH | `/books/issues/{id}/progress` | books | `BooksController_progress` | 200 |
| [ ] | API-176 | POST | `/books/issues/{id}/return` | books | `BooksController_returnIssue` | 200 |
| [ ] | API-177 | GET | `/books/history` | books | `BooksController_history` | 200 |
| [ ] | API-178 | GET | `/books/deliveries` | books | `BooksController_deliveries` | 200 |
| [ ] | API-179 | POST | `/books/deliveries` | books | `BooksController_createDelivery` | 201 |
| [ ] | API-180 | PATCH | `/books/deliveries/{id}` | books | `BooksController_patchDelivery` | 200 |
| [ ] | API-181 | POST | `/books/deliveries/{id}/deliver` | books | `BooksController_deliver` | 200 |
| [ ] | API-182 | POST | `/books/deliveries/{id}/receive` | books | `BooksController_receive` | 200 |
| [ ] | API-183 | POST | `/books/{id}/versions` | books | `BooksController_addVersion` | 201 |
| [ ] | API-184 | GET | `/books/{id}/holders` | books | `BooksController_holders` | 200 |
| [ ] | API-185 | PATCH | `/books/versions/{id}/use` | books | `BooksController_useVersion` | 200 |
| [ ] | API-186 | GET | `/guides` | guides | `GuidesController_all` | 200 |
| [ ] | API-187 | GET | `/guides/students` | guides | `GuidesController_students` | 200 |
| [ ] | API-188 | GET | `/guides/history` | guides | `GuidesController_history` | 200 |
| [ ] | API-189 | POST | `/guides/drafts` | guides | `GuidesController_createDraft` | 201 |
| [ ] | API-190 | GET | `/guides/templates` | guides | `GuidesController_templates` | 200 |
| [ ] | API-191 | POST | `/guides/templates` | guides | `GuidesController_createTemplate` | 201 |
| [ ] | API-192 | PATCH | `/guides/templates/{id}` | guides | `GuidesController_patchTemplate` | 200 |
| [ ] | API-193 | PUT | `/guides/{id}/body` | guides | `GuidesController_writeBody` | 200 |
| [ ] | API-194 | GET | `/guides/{id}/class-diagnostics` | guides | `GuidesController_classDiagnostics` | 200 |
| [ ] | API-195 | POST | `/guides/{id}/class-diagnostics` | guides | `GuidesController_writeClassDiagnostics` | 201 |
| [ ] | API-196 | POST | `/guides/{id}/copy` | guides | `GuidesController_copyBody` | 201 |
| [ ] | API-197 | POST | `/guides/{id}/send` | guides | `GuidesController_sendGuide` | 200 |
| [ ] | API-198 | POST | `/guides/zoom-notice` | guides | `GuidesController_sendZoomNotice` | 201 |
| [ ] | API-199 | POST | `/guides/zoom-notice/batch` | guides | `GuidesController_sendZoomNoticeBatch` | 201 |
| [ ] | API-200 | GET | `/zoom` | zoom | `ZoomController_board` | 200 |
| [ ] | API-201 | POST | `/zoom/accounts` | zoom | `ZoomController_create` | 201 |
| [ ] | API-202 | PATCH | `/zoom/accounts/{id}` | zoom | `ZoomController_patch` | 200 |
| [ ] | API-203 | POST | `/zoom/assign` | zoom | `ZoomController_assign` | 201 |
| [ ] | API-204 | POST | `/consulting` | consulting | `create` | 201 |
| [ ] | API-205 | GET | `/consulting` | consulting | `ConsultingController_all` | 200 |
| [ ] | API-206 | GET | `/consulting/templates` | consulting | `ConsultingController_templates` | 200 |
| [ ] | API-207 | PATCH | `/consulting/templates/{consType}` | consulting | `ConsultingController_writeTemplate` | 200 |
| [ ] | API-208 | PATCH | `/consulting/{id}/items/{itemId}` | consulting | `ConsultingController_toggleItem` | 200 |
| [ ] | API-209 | PATCH | `/consulting/{id}/items` | consulting | `ConsultingController_editItems` | 200 |
| [ ] | API-210 | POST | `/consulting/{id}/items/{itemId}/files` | consulting | `ConsultingController_addItemFile` | 201 |
| [ ] | API-211 | DELETE | `/consulting/{id}/items/{itemId}/files/{fileId}` | consulting | `ConsultingController_removeItemFile` | 204 |
| [ ] | API-212 | GET | `/consulting/accounting` | consulting | `ConsultingController_accounting` | 200 |
| [ ] | API-213 | GET | `/consulting/students` | consulting | `ConsultingController_students` | 200 |
| [ ] | API-214 | GET | `/consulting/{id}` | consulting | `detail` | 200 |
| [ ] | API-215 | PATCH | `/consulting/{id}` | consulting | `updateCore` | 200 |
| [ ] | API-216 | DELETE | `/consulting/{id}` | consulting | `archive` | 204 |
| [ ] | API-217 | PATCH | `/consulting/{id}/share` | consulting | `updateShare` | 200 |
| [ ] | API-218 | POST | `/consulting/{id}/contract-files` | consulting | `addContractFile` | 201 |
| [ ] | API-219 | DELETE | `/consulting/{id}/contract-files/{fileId}` | consulting | `removeContractFile` | 204 |
| [ ] | API-220 | POST | `/consulting/{id}/feedback` | consulting | `addFeedback` | 201 |
| [ ] | API-221 | POST | `/consulting/{id}/feedback/{feedbackId}/resolve` | consulting | `markFeedbackResolved` | 201 |
| [ ] | API-222 | POST | `/consulting/{id}/deliver` | consulting | `deliverContract` | 201 |
| [ ] | API-223 | POST | `/consulting/{id}/signed-files` | consulting | `addSignedFile` | 201 |
| [ ] | API-224 | POST | `/consulting/{id}/sessions/preview` | consulting | `ConsultingController_previewSessions` | 201 |
| [ ] | API-225 | POST | `/consulting/{id}/sessions` | consulting | `ConsultingController_addSessions` | 201 |
| [ ] | API-226 | PATCH | `/consulting/{id}/sessions/{sessId}` | consulting | `ConsultingController_writeSession` | 200 |
| [ ] | API-227 | POST | `/consulting/{id}/close/preview` | consulting | `ConsultingController_previewClose` | 201 |
| [ ] | API-228 | POST | `/consulting/{id}/close` | consulting | `ConsultingController_close` | 201 |
| [ ] | API-229 | POST | `/consulting/{id}/payments` | consulting | `ConsultingController_addPayment` | 201 |
| [ ] | API-230 | POST | `/consulting/{id}/invoice` | consulting | `ConsultingController_toInvoice` | 201 |
| [ ] | API-231 | GET | `/board` | board | `BoardController_range` | 200 |
| [ ] | API-232 | GET | `/teacher/shell` | teacher | `TeacherController_shell` | 200 |
| [ ] | API-233 | GET | `/teacher/home` | teacher | `TeacherController_home` | 200 |
| [ ] | API-234 | GET | `/teacher/lessons/{serId}/{onDate}/hub` | teacher | `TeacherController_lessonHub` | 200 |
| [ ] | API-235 | GET | `/teacher/history` | teacher | `TeacherController_history` | 200 |
| [ ] | API-236 | GET | `/teacher/guides` | teacher | `TeacherController_guides` | 200 |
| [ ] | API-237 | GET | `/teacher/guides/received` | teacher | `TeacherController_receivedGuides` | 200 |
| [ ] | API-238 | POST | `/teacher/guides/{id}/ack` | teacher | `TeacherController_acknowledgeGuide` | 200 |
| [ ] | API-239 | GET | `/teacher/suggestions` | teacher | `TeacherController_suggestions` | 200 |
| [ ] | API-240 | POST | `/teacher/suggestions` | teacher | `TeacherController_createSuggestion` | 201 |
| [ ] | API-241 | POST | `/teacher/diagnostics` | teacher | `TeacherController_createDiagnostic` | 201 |
| [ ] | API-242 | GET | `/teacher/unavailable` | teacher | `TeacherController_unavailable` | 200 |
| [ ] | API-243 | POST | `/teacher/unavailable` | teacher | `TeacherController_createUnavailable` | 201 |
| [ ] | API-244 | DELETE | `/teacher/unavailable/{id}` | teacher | `TeacherController_deleteUnavailable` | 200 |
| [ ] | API-245 | POST | `/teacher/requests` | teacher | `TeacherController_createSettingRequest` | 201 |
| [ ] | API-246 | GET | `/gpa` | gpa | `GpaController_board` | 200 |
| [ ] | API-247 | GET | `/exec` | exec | `ExecController_range` | 200 |
| [ ] | API-248 | PUT | `/exec/areas/{key}/owner` | exec | `ExecController_setAreaOwner` | 200 |
| [ ] | API-249 | PATCH | `/exec/report` | exec | `ExecController_saveMemo` | 200 |
| [ ] | API-250 | POST | `/exec/report/submit` | exec | `ExecController_submit` | 201 |
| [ ] | API-251 | POST | `/exec/report/{id}/review` | exec | `ExecController_review` | 201 |
| [ ] | API-252 | POST | `/exec/report/{id}/withdraw` | exec | `ExecController_withdraw` | 201 |
| [ ] | API-253 | GET | `/drawer` | drawer | `DrawerController_all` | 200 |
| [ ] | API-254 | GET | `/drawer/staff-directory` | drawer | `DrawerController_staffDirectory` | 200 |
| [ ] | API-255 | GET | `/drawer/staff-directory/{id}` | drawer | `DrawerController_staffDirectoryDetail` | 200 |
| [ ] | API-256 | GET | `/drawer/staff-directory/{id}/home` | drawer | `DrawerController_staffTeacherHome` | 200 |
| [ ] | API-257 | GET | `/drawer/staff-directory/{id}/guides` | drawer | `DrawerController_staffTeacherGuides` | 200 |
| [ ] | API-258 | GET | `/drawer/staff-directory/{id}/suggestions` | drawer | `DrawerController_staffTeacherSuggestions` | 200 |
| [ ] | API-259 | GET | `/drawer/staff-directory/{id}/history` | drawer | `DrawerController_staffTeacherHistory` | 200 |
| [ ] | API-260 | GET | `/drawer/staff-directory/{id}/inbox` | drawer | `DrawerController_staffTeacherInbox` | 200 |
| [ ] | API-261 | POST | `/drawer/staff` | drawer | `DrawerController_createStaff` | 201 |
| [ ] | API-262 | PATCH | `/drawer/staff/{id}` | drawer | `DrawerController_updateStaff` | 200 |
| [ ] | API-263 | DELETE | `/drawer/staff/{id}` | drawer | `DrawerController_deleteStaff` | 200 |
| [ ] | API-264 | POST | `/drawer/staff/{id}/password-reset` | drawer | `DrawerController_resetStaffPassword` | 201 |
| [ ] | API-265 | PATCH | `/drawer/staff/{id}/active` | drawer | `DrawerController_setStaffActive` | 200 |
| [ ] | API-266 | PATCH | `/drawer/todos/{id}` | drawer | `DrawerController_todoDone` | 200 |
| [ ] | API-267 | GET | `/drawer/schedule-history` | drawer | `DrawerController_scheduleHistory` | 200 |
| [ ] | API-268 | POST | `/drawer/todos` | drawer | `DrawerController_createTodo` | 201 |
| [ ] | API-269 | DELETE | `/drawer/todos/completed` | drawer | `DrawerController_clearDoneTodos` | 200 |
| [ ] | API-270 | PATCH | `/drawer/notis/{id}/read` | drawer | `DrawerController_notiRead` | 200 |
| [ ] | API-271 | PATCH | `/drawer/notis/read-all` | drawer | `DrawerController_notiReadAll` | 200 |
| [ ] | API-272 | POST | `/drawer/requests/{id}/review` | drawer | `DrawerController_reviewRequest` | 201 |
| [ ] | API-273 | POST | `/drawer/change-requests/{id}/review` | drawer | `DrawerController_reviewChangeRequest` | 201 |
| [ ] | API-274 | POST | `/drawer/approvals/undo` | drawer | `DrawerController_undoApproval` | 201 |
| [ ] | API-275 | POST | `/drawer/change-requests` | drawer | `DrawerController_createChangeReq` | 201 |
| [ ] | API-276 | GET | `/permissions` | drawer | `PermissionsController_table` | 200 |
| [ ] | API-277 | GET | `/catalog` | catalog | `CatalogController_all` | 200 |
| [ ] | API-278 | POST | `/catalog/kinds` | catalog | `CatalogController_createKind` | 201 |
| [ ] | API-279 | PATCH | `/catalog/kinds/{key}` | catalog | `CatalogController_patchKind` | 200 |
| [ ] | API-280 | POST | `/catalog/subs` | catalog | `CatalogController_createSub` | 201 |
| [ ] | API-281 | PATCH | `/catalog/subs/{key}` | catalog | `CatalogController_patchSub` | 200 |
| [ ] | API-282 | GET | `/students/{id}/guardians` | guardians | `GuardiansController_list` | 200 |
| [ ] | API-283 | POST | `/students/{id}/guardians` | guardians | `GuardiansController_create` | 201 |
| [ ] | API-284 | GET | `/guardians/channels` | guardians | `GuardiansController_channels` | 200 |
| [ ] | API-285 | POST | `/guardians/send` | guardians | `GuardiansController_send` | 200 |
| [ ] | API-286 | PATCH | `/guardians/{id}` | guardians | `GuardiansController_patch` | 200 |
| [ ] | API-287 | DELETE | `/guardians/{id}` | guardians | `GuardiansController_deactivate` | 200 |
| [ ] | API-288 | GET | `/students` | students | `StudentsController_list` | 200 |
| [ ] | API-289 | POST | `/students` | students | `StudentsController_create` | 201 |
| [ ] | API-290 | GET | `/students/options` | students | `StudentsController_registrationOptions` | 200 |
| [ ] | API-291 | GET | `/students/schools` | students | `StudentsController_searchSchools` | 200 |
| [ ] | API-292 | POST | `/students/schools` | students | `StudentsController_createSchool` | 201 |
| [ ] | API-293 | POST | `/students/preview` | students | `StudentsController_previewCreate` | 200 |
| [ ] | API-294 | GET | `/students/reactivation-candidates` | students | `StudentsController_reactivationCandidates` | 200 |
| [ ] | API-295 | POST | `/students/{id}/reactivate/preview` | students | `StudentsController_previewReactivation` | 200 |
| [ ] | API-296 | POST | `/students/{id}/reactivate` | students | `StudentsController_reactivate` | 201 |
| [ ] | API-297 | GET | `/students/{id}/hub` | students | `StudentsController_hub` | 200 |
| [ ] | API-298 | GET | `/students/{id}/kinder-marker` | students | `StudentsController_kinderHistory` | 200 |
| [ ] | API-299 | POST | `/students/{id}/kinder-marker` | students | `StudentsController_createKinderMarker` | 201 |
| [ ] | API-300 | GET | `/students/{id}` | students | `StudentsController_detail` | 200 |
| [ ] | API-301 | POST | `/teacher/private-notes` | private-notes | `PrivateNotesController_write` | 201 |
| [ ] | API-302 | GET | `/teacher/private-notes/receipts` | private-notes | `PrivateNotesController_receipts` | 200 |
| [ ] | API-303 | GET | `/students/{studentId}/private-notes` | private-notes | `PrivateNotesController_studentNotes` | 200 |
| [ ] | API-304 | GET | `/material-requests/options` | material-requests | `MaterialRequestsController_options` | 200 |
| [ ] | API-305 | GET | `/material-requests/mine` | material-requests | `MaterialRequestsController_mine` | 200 |
| [ ] | API-306 | POST | `/material-requests` | material-requests | `MaterialRequestsController_create` | 201 |
| [ ] | API-307 | GET | `/material-requests` | material-requests | `MaterialRequestsController_all` | 200 |
| [ ] | API-308 | PATCH | `/material-requests/{id}` | material-requests | `MaterialRequestsController_transition` | 200 |
| [ ] | API-309 | POST | `/material-requests/{id}/ack` | material-requests | `MaterialRequestsController_acknowledge` | 200 |

## 청크 종료와 검증 경계

- [ ] 호환성 spike 결과와 unsupported SQL/extension/transaction/constraint 목록을 기록하고 최종 구조를 확정한다.
- [ ] 합성 seed·역할·방문자 격리를 먼저 검증한 뒤 기능군별 CRUD→권한→오류→초기화 순으로 진행한다.
- [ ] 기능군마다 관련 API·route·공용 서랍·출력 경계를 재조회하고 checklist와 실제 증거를 함께 갱신한다.
- [ ] 개인정보·secret·외부발송 차단·비영속 상태를 공개 build와 브라우저에서 검증한다.
- [ ] 로컬 검증, Git commit/push, 별도 Vercel 데모 배포·실URL 검수는 각각 증거를 남긴다.

이 문서 작성 중에는 소스 읽기·정적 목록 추출·링크/JSON 검증만 수행했다. 앱 테스트·체험판 CRUD·DB 실행·운영 접근·외부 생성·발송·배포는 실행하지 않았다. 문서와 JSON의 pending 상태가 현재 검증 기준이다.
