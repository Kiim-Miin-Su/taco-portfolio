/** @file-guide
 * 목적: 신규 학생 등록의 정규화 기간 값을 기존 목록·상세·공용 선택기의 읽기 계약에 연결한다.
 * 책임/재사용: KST 현재 날짜·기간 공백·legacy 보존은 기존 student_profile_current가 판정한다. scalar 복제 쓰기는 하지 않는다.
 * 검증/작업 지침: backend/demo/student-projection-smoke.cjs · backend/evidence/student-readback-issue.md
 */

/** 공개 데모 사본의 읽기 보정. 원본 제품에는 별도 검토와 배포가 필요하다. */
export const STUDENT_CURRENT_READ_SQL = `(SELECT s.id,s.name,s.english_name,s.gender,s.created_at,s.started_on,s.profile_version,
  current_profile.grade,current_profile.school,current_profile.guidance,current_profile.lang,current_profile.target_exam
  FROM stu s LEFT JOIN (
    SELECT p.student_id,
      max(COALESCE(p.grade_code,p.legacy_text)) FILTER(WHERE p.field='grade') AS grade,
      max(COALESCE(sc.name,p.legacy_text)) FILTER(WHERE p.field='school') AS school,
      max(COALESCE(p.text_value,p.legacy_text)) FILTER(WHERE p.field='guidance') AS guidance,
      max(COALESCE(p.text_value,p.legacy_text)) FILTER(WHERE p.field='lang') AS lang,
      max(COALESCE(p.text_value,p.legacy_text)) FILTER(WHERE p.field='target_exam') AS target_exam
    FROM student_profile_current p LEFT JOIN school sc ON sc.id=p.school_id GROUP BY p.student_id
  ) current_profile ON current_profile.student_id=s.id)`;
