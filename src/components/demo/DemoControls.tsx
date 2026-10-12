/** @file-guide
 * 목적: 공개 체험의 역할 선택·초기화 안내를 공용 UI로 표현한다.
 * 책임/재사용: 역할 권한이나 데이터 초기화를 구현하지 않고 데모 세션 소유자의 callback을 받는다.
 * 검증/작업 지침: 원본 생성 Me 계약 · DemoControls.test.tsx
 */

'use client';

import type { Me } from '@/api/types';
import { Button } from '@/components/ui';
import { useQueryClient } from '@tanstack/react-query';
import { clearSessionQueries } from '@/api/session-cache';
import { useSession } from '@/store/useSession';
import { resetDemoTransport } from '@/demo/transport';

export type DemoRole = Me['role'];

// 표시용 체험 목록이다. 실제 can* 권한은 데모 서버가 기존 권한 함수를 통해 반환한다.
const DEMO_ROLES: ReadonlyArray<{ role: DemoRole; label: string }> = [
  { role: 'ceo', label: '대표' },
  { role: 'manager', label: '매니저' },
  { role: 'admin', label: '관리자' },
  { role: 'teacher', label: '강사' },
];

export function DemoRolePicker({ onSelect, busy = false }: {
  onSelect?: (role: DemoRole) => void;
  busy?: boolean;
}) {
  return (
    <section aria-label="역할별 체험" className="mt-5">
      <h1 className="text-[18px] font-bold">업무 역할을 선택해 체험하세요</h1>
      <p id="demo-role-description" className="mt-2 text-[13px] text-fg-subtle">
        {onSelect ? '실제 계정 없이 합성 데이터로 이용합니다.' : '체험 시작을 준비하고 있습니다.'}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {DEMO_ROLES.map(({ role, label }) => (
          <Button
            key={role}
            disabled={!onSelect || busy}
            aria-describedby="demo-role-description"
            onClick={() => onSelect?.(role)}
          >
            {label}로 체험
          </Button>
        ))}
      </div>
    </section>
  );
}

export function DemoNotice({ onReset, busy = false }: {
  onReset?: () => void;
  busy?: boolean;
}) {
  return (
    <aside
      aria-label="공개 체험 안내"
      data-print="chrome"
      className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line bg-inset px-4 py-2"
    >
      <div className="text-[12px]">
        <strong className="font-bold">포트폴리오 체험 · 합성 데이터</strong>
        <p className="text-fg-subtle">
          {onReset ? '변경은 현재 탭에서만 유지되며 새로고침하면 초기화됩니다. 파일은 512KB까지 가능합니다.' : '체험 연결 준비 중 · 실제 계정은 입력하지 마세요.'}
        </p>
      </div>
      <Button size="sm" disabled={!onReset || busy} onClick={onReset}>
        체험 초기화
      </Button>
    </aside>
  );
}

/** 전체 문서 이동으로 지역 폼까지 폐기하며, 다른 방문자의 체험 공간은 건드리지 않는다. */
export function DemoSessionNotice() {
  const queryClient = useQueryClient();
  const signOut = useSession((state) => state.signOut);

  function reset() {
    resetDemoTransport();
    signOut();
    clearSessionQueries(queryClient);
    window.location.assign('/login');
  }

  return <DemoNotice onReset={reset} />;
}
