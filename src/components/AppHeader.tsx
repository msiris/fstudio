import { ArrowLeft } from 'lucide-react';
import { FOCUS_RING } from './ui';

/**
 * 모드 화면 상단 — 뒤로가기와 제목.
 * 키 설정은 홈에만 둔다. 화면마다 중복해서 둘 이유가 없다.
 */
export default function AppHeader({
  subtitle,
  onBack,
}: {
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="홈으로"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-card ${FOCUS_RING}`}
      >
        <ArrowLeft size={18} className="text-text" />
      </button>
      <div>
        <div className="text-lg font-bold text-text">Face Studio</div>
        <div className="text-xs text-muted">{subtitle}</div>
      </div>
    </div>
  );
}
