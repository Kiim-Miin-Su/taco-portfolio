# 공개 체험판 구현 계획

요청일: 2026-10-12. 범위: 기존 전체 31개 화면 경로와 309개 API 작업의 CRUD 체험. 공개 저장소명은 `taco-portfolio`, 배포는 별도 Vercel 프로젝트다. 원본 실서비스 링크를 배포 완료 후 포트폴리오에서 데모 링크로 교체한다.

## 확정 사항

- 기존 Front·Back의 커밋된 코드를 새 저장소로 분리하고 원본 미커밋 변경은 포함하지 않는다.
- 모든 데이터는 별도로 작성한 공개용 합성 자료다. 실제 계정·비밀번호·연락처·계좌·학생 정보는 사용하지 않는다.
- 방문자별 메모리 상태를 격리하고 초기화 동작을 제공한다. 영구 데이터베이스에 쓰지 않는다.
- 기존 실제 업무 함수와 PostgreSQL 규칙을 최대한 재사용한다. 데모 구현을 운영 동시성 검증으로 설명하지 않는다.
- 이메일·문자·외부 저장소 등 외부 부작용은 데모 대역으로 처리하고 화면에 실행 범위를 명시한다.
- Vercel 함수 인스턴스가 바뀌어도 한 방문자의 작업이 임의로 초기화되거나 다른 방문자에게 섞이지 않아야 한다.

## 청크와 종료 조건

1. **메모리 DB 호환성**: PGlite·TypeORM으로 전체 migration과 합성 seed, 핵심 서비스 질의를 실행한다. 불일치는 기능별로 기록하고 기존 업무 규칙을 임의 삭제하지 않는다. 방문자 상태의 전달·복원 방식을 검증해 확정한다.
2. **전체 화면과 API 연결**: 기존 UI·폼·생성 타입을 재사용하고 데모 전용 통신 경계를 연결한다. 로그인·역할 전환·초기화, 파일·발송 대역을 구현한다. 운영 URL fallback을 제거한다.
3. **전체 기능 검수**: 화면·API 목록과 실제 CRUD를 대조한다. 실패 복구·관계·권한·두 방문자 격리·새 인스턴스 복원·데이터 제한을 검증한다. test/typecheck/lint/build 및 브라우저 검수를 수행한다.
4. **공개 배포와 포트폴리오**: 비밀값·개인정보·환경 분리 검사, GitHub 공개 push, 별도 Vercel 배포, 배포 URL의 실제 역할별 CRUD를 확인한다. 현행 포트폴리오의 운영 링크를 데모 링크로 바꾸고 새 아키텍처 이미지·설명·문서·증거를 동기화한다.

## 현재 상태

- [x] 사용자에게 전체 화면·CRUD 범위를 확인했다.
- [x] 기존 API·공용 Axios·인증·PostgreSQL 의존과 배포 계정을 읽기 조사했다.
- [x] 요청한 로고와 연결선 형식의 제품 기술 스택 이미지를 생성했다.
- [x] PGlite 124개 migration·149개 테이블과 주요 서비스 호환성을 확인했다.
- [x] 브라우저 RAM snapshot·직렬 전송·서버 독점 복원과 baseline 초기화 계약을 확정했다.
- [x] 전체 화면·CRUD 소유자를 이식하고 합성 자료·외부 발송 대역·체험용 OTP를 연결했다.
- [x] 전체 화면/API 목록을 대조하고 격리·대표 CRUD·브라우저·빌드 검증을 완료했다.
- [ ] 모든 API·분기 전수 실행: 고유 78/309 실행, 231개는 후속 검수 범위로 남긴다. 구현 이식과 전수 실행의 완료 수는 구분한다.
- [x] 공개 저장소 push와 별도 데모 배포, 공개 HTTP/인증/브라우저 저장·재조회·초기화 검증을 완료했다.
- [x] R122 포트폴리오 31장·공개 링크·실제 데모 로그인 화면·전체 렌더·metadata를 최종 검수하고 원본 문서에 연결했다. 원본 문서 저장소의 최종 게이트·커밋 영수증은 R122 원장이 소유한다.

기존 Nest API를 PGlite 메모리 DB로 실행하고 방문자 상태는 브라우저 RAM이 소유한다. 직접 런타임·로컬 HTTP·공개 HTTP 각각 63개 시나리오를 실행해 72개 고유 API를 검증했다. 공개 인증 20회 회귀를 더한 고유 API 합계는 78개다. 309개 API의 정적 연결과 모든 API 성공/오류 분기의 전수 실행은 다른 검증이다.

## 검증 중 발견·조치

- PostgreSQL 배열·bytea·UPDATE rowCount 차이: 공용 호환 드라이버에서 보정했다. 학생 등록 재시도 fingerprint 회귀를 재검증했다.
- 공개 원본 사본의 fixture identity: 합성 인명·학교·연락처로 교체하고 단어 부분 치환으로 SQL을 손상시키지 않는지 migration 전체 재실행했다.
- 데모 전용 API를 Pages Router에 추가하면 기존 App Router hook 타입이 nullable이 되는 문제: 기존 App Router 내 Node route로 구현했다.
- 전체 Front 테스트 2,392개·typecheck·lint·Next production build가 통과했다. 개인정보 fixture 치환 후 검색 테스트도 새 합성 검색어로 확인했다.
- 브라우저 학생 등록 성공 후 학교·학년·보호자 관계 재조회 누락을 발견했다. 기존 student_profile_current 뷰를 목록·상세·검색·meta에 재사용하고 관계 코드 표시를 연결한 뒤 등록→재조회·수정·비우기 회귀를 통과했다. 원본 제품 후속 이슈는 backend/evidence/student-readback-issue.md에 남겼다.

## 배포 중 확인한 경계

- 공개 GitHub 저장소 생성·push 완료. GitHub 인증에 workflow 권한이 없어 Actions 정의는 예제로 보존했고 자동 실행하지 않는다. Vercel Git 연결·push 자동 빌드는 확인했다.
- 첫 Vercel 빌드에서 생산 환경 npm 설치가 Nest compiler를 제외했다. Backend 빌드 단계에 `--include=dev`를 지정하고 패키징 전 prune한다.
- 첫 READY 배포는 API 초기화 503이었다. `light-my-request 6.8 → cookie 2`의 CommonJS/ESM 연동과 Vercel 기본 제한이 원인이며 Node 22 제한 모드에서 재현했다. [공식 가이드](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration)에 따라 데모 프로젝트 Production·Preview에 `NODE_OPTIONS=--experimental-require-module`을 설정했다. 성공 검증 전 실패 영수증도 보존한다.

## 매 청크 갱신 대상

새 저장소의 README·PLAN·기능 CRUD 원장·검증 evidence·소스 이식/공개 검사 receipt를 갱신한다. 원본 문서의 두 PROMPT·TODO·ENTRY·CLAUDE·계약 원장·포트폴리오 생성기/metadata/PPTX/렌더/증거 색인도 R122로 연결한다. 원본 제품 요구/Figma/DBML은 데모 분리로 업무 형상이 바뀌지 않아 영향 없음으로 기록하며 실제 편집했다고 표시하지 않는다. 신규 계약은 공개 메모리 snapshot·파일 제한·모의 발송·OTP 표시다.

청크 기록: 문서 기준 `924aaad`, 전체 Front 이식·통신 `e396b6b`. Backend 이식·정본 이력 조회 교정 `62fa60c`, 상대 OpenAPI 경로 정정 `5b16dc3`, 빌드 단계 서버 컴파일러 설치 `b8e53f1`, 안전한 초기화 진단 `8af3736`, 서버리스 ESM 계약·주석 `dd09db3`·`7a2d0a4`, 공개 인증 회귀 도구 `9f9fb03`.
