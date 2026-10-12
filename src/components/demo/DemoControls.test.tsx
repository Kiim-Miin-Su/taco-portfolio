import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/demo/transport', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/demo/transport')>(),
  resetDemoTransport: vi.fn(),
}));

import { DemoNotice, DemoRolePicker } from './DemoControls';

afterEach(cleanup);

describe('공개 체험 조작', () => {
  it('연결 전에는 체험 시작과 초기화를 성공처럼 실행하지 않는다', () => {
    const view = render(<><DemoRolePicker /><DemoNotice /></>);
    expect(view.getByText('체험 시작을 준비하고 있습니다.')).toBeTruthy();
    for (const button of view.getAllByRole('button')) {
      expect(button.hasAttribute('disabled')).toBe(true);
    }
  });

  it('선택한 역할 식별자와 초기화 의도를 세션 소유자에게 전달한다', () => {
    const select = vi.fn();
    const reset = vi.fn();
    const view = render(<><DemoRolePicker onSelect={select} /><DemoNotice onReset={reset} /></>);
    fireEvent.click(view.getByRole('button', { name: '강사로 체험' }));
    expect(select).toHaveBeenCalledWith('teacher');
    fireEvent.click(view.getByRole('button', { name: '체험 초기화' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
