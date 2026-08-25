import { ArrowLeft, Key } from 'lucide-react';
import { FOCUS_RING } from './ui';

/** 모드 화면 상단 — 뒤로가기 / 제목 / API 키 설정. */
export default function AppHeader({
  subtitle,
  hasKey,
  keyOpen,
  onBack,
  onToggleKey,
}: {
  subtitle: string;
  hasKey: boolean;
  keyOpen: boolean;
  onBack: () => void;
  onToggleKey: () => void;
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
      <button
        type="button"
        onClick={onToggleKey}
        aria-label="API 키 설정"
        aria-expanded={keyOpen}
        className={`ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card ${FOCUS_RING} ${
          hasKey ? 'border-accent' : 'border-line'
        }`}
      >
        <Key size={16} className={hasKey ? 'text-accent' : 'text-muted'} />
      </button>
    </div>
  );
}
