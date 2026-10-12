# 공개 데모 브라우저 탐색 검수

2026-10-12 KST. CUA Chrome의 별도 탭으로 관찰했습니다. 정본은 [browser-navigation.json](browser-navigation.json)입니다.

**31/31 route entry를 탐색했으며, 본문 확인 25/31·인증 경계만 확인 6/31**입니다. CRUD 저장 성공이나 전체 화면 검수 완료를 뜻하지 않습니다.

- `localhost:3300` 개발 서버: 대표 주 메뉴 12개와 학생·강사 상세, 구성원·권한 패널, 줌·프로그램 관리 확인.
- `localhost:3301` production 빌드: 매니저 로그인·구성원 생성 폼, 강사 로그인·7개 메뉴, 관리자 로그인·학생 등록·문구 관리 확인.
- 조회·입력 폼 경로만 확인했습니다. 생성·승인·송금·발송을 실행한 것으로 기록하지 않습니다.

| 요구 ID | 경로 | 관찰 환경 | 역할 | 관찰 내용 |
|---|---|---|---|---|
| UI-09 | `/login` | 3300, 3301 | public | 4 role buttons + direct account fields; first CEO login and production role switching passed |
| UI-13 | `/password-reset` | 3300 | public | Reset form rendered; no code request or password change performed |
| UI-20 | `/schedule` | 3300, 3301 | ceo, manager, admin, teacher | Admin calendar and teacher calendar loaded; app links retained visitor state |
| UI-25 | `/students` | 3300, 3301 | ceo, manager, admin | List/search/grade filter/new-student link rendered |
| UI-23 | `/students/[id]` | 3300 | ceo | Student 19 overview, comments, profile and Kinder marker inputs rendered |
| UI-22 | `/staff` | 3300 | ceo | Synthetic staff list, state/search and detail links rendered |
| UI-21 | `/staff/[id]` | 3300 | ceo | Teacher 7 detail and eight tabs rendered; actor and target displayed separately |
| UI-08 | `/intake` | 3300 | ceo | Stage board and new inquiry form opened then cancelled |
| UI-04 | `/consulting` | 3300 | ceo | List and start form opened; unconfigured types disabled with explanation |
| UI-02 | `/board` | 3300 | ceo | Lesson board and MAP Math detail opened; roster, attendance, change and cancellation entry points visible |
| UI-03 | `/books` | 3300 | ceo | Progress list and create form opened then cancelled |
| UI-07 | `/guides` | 3300, 3301 | ceo, admin | Student guide writer opened then cancelled; template-management link used |
| UI-19 | `/reports` | 3300, 3301 | ceo, teacher | Admin unsubmitted list and teacher group report structured fields opened |
| UI-01 | `/accounting` | 3300 | ceo | Board and invoice issue form opened; settlement/transfer not executed |
| UI-11 | `/ops` | 3300 | ceo | Marketing board and activity create form opened then cancelled |
| UI-05 | `/exec` | 3300 | ceo | Daily report and aggregate sections rendered; no submission |
| UI-31 | `/zoom` | 3300 | ceo | Drawer link to account page; create form opened then cancelled |
| UI-16 | `/programs` | 3300 | ceo | Drawer link to program page; program/subject list and create inputs visible |
| UI-28 | `/teacher` | 3301 | teacher | Home, upcoming classes, settings and workflow links rendered |
| UI-30 | `/teacher/unavailable` | 3301 | teacher | Two-week grid loaded; selected an open slot, mandatory reason input rendered; cleared selection |
| UI-26 | `/teacher/guides` | 3301 | teacher | Received guides, confirmation, material-request input and assigned students rendered |
| UI-27 | `/teacher/history` | 3301 | teacher | KST previous-month September settlement/history rendered; lesson-linked note form opened then cancelled |
| UI-29 | `/teacher/suggestions` | 3301 | teacher | Suggestion categories, body input and synthetic prior requests rendered |
| UI-24 | `/students/new` | 3301 | admin | Common registration form and review/preview/create controls rendered; no registration performed |
| UI-15 | `/phrases` | 3301 | admin | Guide-management link to phrase list and create name/body fields rendered |

## 역할·입력 경계

- 대표·매니저 구성원 추가 폼은 강사·매니저·관리자 선택을 제공하며 CEO 선택은 없습니다. 계정을 생성하지 않았습니다.
- 강사 리포트에서 공통 수업 사항·학생별 의견·진도·숙제·임시 저장·승인 요청 경로를 확인했습니다.
- 강사 불가 시간은 열린 날짜 선택 뒤 15자 이상 사유 입력을 요구하며, 지난 등록의 삭제 제한도 표시했습니다.
- 강사 히스토리는 KST 전월 정산과 수업 기록을 보여 주며 수업 연결 특이사항 입력 폼을 열 수 있었습니다.
- 학생 기본 프로필 편집은 현재 계약 및 UI에서 제공하지 않습니다. Kinder 표식 변경 입력은 별도입니다.
- 학생 목록은 리드 통합 검색, 상태·국가 필터, 일괄 작업 미제공을 명시합니다.

## 발견 사항

1. **NAV-LOGIN-01:** 개발 서버에서 대표 첫 세션 후 로그아웃·재로그인 시 `/schedule`을 거쳐 `/login`으로 돌아오는 현상을 재현했습니다. 한 차례 초기화 후에도 발생했습니다. 반면 production 빌드 새 탭의 매니저→강사→관리자 로그아웃·로그인 및 메뉴 이동은 정상입니다. 역할 정책 실패로 단정하지 않으며 HMR/번들 상태와 구분합니다.
2. **NAV-RESET-COPY-01:** 개발 서버의 비밀번호 복구에 일반 이메일·문자 안내가 보였습니다. 부모 담당자가 이후 데모 안내 문구를 수정했다고 알렸으나 새 문구의 브라우저 재검수는 이 기록에 포함하지 않습니다.

## 직접 진입한 6개의 인증 전제조건

- UI-06 `/gpa`
- UI-10 `/onboarding`
- UI-12 `/`
- UI-14 `/permissions`
- UI-17 `/reports/[section]/[onDate]`
- UI-18 `/reports/[section]`

부모 담당자의 추가 지시에 따라 위 6개를 `localhost:3301`에서 직접 탐색했습니다. `/reports/weekly`, `/reports/14/2026-10-12`를 실제 주소로 사용했습니다. 모두 해당 주소의 로딩 상태를 거쳐 `/login`에 도달했고 404나 오류 화면은 나타나지 않았습니다. 전체 문서 탐색이 RAM 인증 상태를 초기화하므로 비인증 경계만 확인했습니다.

`/gpa`는 소스상 퇴역 redirect가 아니라 읽기 전용 과거 기록입니다. `/permissions`는 권한 모달과 같은 표의 과거 공유 URL입니다. 이 두 본문, 첫 설정 대상 계정의 `/onboarding`, redirect 3개의 중간 목적지·query 보존은 이 브라우저 기록에서 완료로 판정하지 않습니다. 권한 패널 정상 조회를 `/permissions` 독립 본문 완료로 계산하지 않습니다.

## 증거 범위

- [직접 runtime QA](api-runtime.json)와 [HTTP QA](api-local-http.json)는 별도 실행 증거입니다.
- 한 차례 체험 초기화 버튼을 실행했고 원본 또는 운영 시스템을 변경하지 않았습니다.
- 안내 작성 진입이 내부 초안을 만들었을 가능성을 배제하지 않습니다. 최종 안내 작성·외부 발송은 실행하지 않았습니다.
- 모바일, 전체 로딩/오류/충돌 상태, 모든 CRUD 저장, 직접 DB 재조회는 이 탐색의 완료 범위가 아닙니다.

