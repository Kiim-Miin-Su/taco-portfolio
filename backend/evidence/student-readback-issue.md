# 신규 학생 현재 프로필 조회 경계

- 발견: 공개 데모 브라우저의 신규 등록 후 학교·학년·보호자 관계가 ‘미상’으로 표시됐습니다.
- 원인: 생성 writer는 `stu_profile_period` 및 `guardian.relation_code`를 정본으로 쓰지만 기존 학생 목록·상세·meta 명단은 legacy scalar만 읽었습니다. 저장 실패는 아닙니다.
- 사본 수정: `student-current-read.ts`가 기존 `student_profile_current`의 KST 날짜·기간 공백·legacy 보존 정책을 재사용합니다. 학생 목록/검색·상세·재활성화 후보·meta 명단에 연결했습니다. 보호자 상세와 목록은 공용 관계 표시 함수를 사용합니다. scalar로 복제하거나 원본 DB를 변경하지 않습니다.
- 관계 수정 회귀: 새 관계 코드를 표시한 뒤 기존 PATCH에서 관계를 비우면 이전 코드가 되살아나는 경계도 재현했습니다. `relation`을 명시한 PATCH만 기존 `relation_code/relation_other`를 함께 제거해 사용자의 수정·비우기를 보존합니다. 이름·연락처만 수정할 때는 관계 코드를 유지합니다.
- 회귀: `demo/student-projection-smoke.cjs`에서 학교 생성→학생 생성→별도 snapshot 복원 요청의 상세/목록/필터/meta/보호자 목록 값 일치 및 legacy 값 보존을 검사합니다.
- 원본 제품 후속: `/Users/kiim/workspaces/programming/taco-office/taco_office_back`에는 이 변경을 적용하지 않았습니다. 원본의 동일 조회 경계는 별도 이슈이며, 해당 제품에서 수정·회귀·문서·배포를 완료해야 해결로 표시할 수 있습니다.
- 남은 범위: 다른 업무 화면의 과거/현재 학생 표시와 동명이인 판정 전체를 이 수정으로 검증했다고 주장하지 않습니다. 이 사본에서도 원본 이력 writer와 DTO 계약은 유지합니다.
