import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * 아이콘 + 제목. 액센트는 주 액션과 활성 상태 전용이라
 * 여기 아이콘 배경은 흰색 계열 표면으로 둔다.
 */
export default function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cardAlt">
        <Icon size={16} className="text-muted" />
      </div>
      <span className="text-sm font-semibold text-text">{children}</span>
    </div>
  );
}
