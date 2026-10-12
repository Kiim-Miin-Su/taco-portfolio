/** @file-guide
 * 목적: 신규 등록 관계 코드와 기존 보호자 관계 자유입력을 같은 표시 응답으로 연결한다.
 * 책임/재사용: 학생 상세와 보호자 DTO가 공통 표시를 사용하며 저장된 이름·관계를 추정하지 않는다.
 * 검증/작업 지침: backend/demo/student-projection-smoke.cjs
 */
export interface GuardianRelationSource {
  relation: string | null;
  relation_code: string | null;
  relation_other: string | null;
}
const RELATION_LABELS: Readonly<Record<string, string>> = {
  mother: '어머니', father: '아버지', aunt: '이모/고모', driver: '기사님', other: '기타',
};
export function guardianRelationDisplay(row: GuardianRelationSource): string | null {
  return row.relation ?? row.relation_other ?? (row.relation_code ? RELATION_LABELS[row.relation_code] ?? null : null);
}
