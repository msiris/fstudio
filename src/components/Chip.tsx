import type { ReactNode } from 'react';
import { FOCUS_RING } from './ui';

/** 비율·프리셋용 칩. 활성 상태에만 액센트를 쓴다. */
export default function Chip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-9 rounded-full border px-4 text-xs font-semibold transition-colors ${FOCUS_RING} ${
        active
          ? 'border-accent bg-accent text-white'
          : 'border-line bg-card text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}
