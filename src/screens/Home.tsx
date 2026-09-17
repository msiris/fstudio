import { Key, Sparkles, User, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ApiKeyPanel from '../components/ApiKeyPanel';
import CreditBadge from '../components/CreditBadge';
import Notice from '../components/Notice';
import { FOCUS_RING } from '../components/ui';
import { useCredits } from '../hooks/useCredits';
import type { Screen } from '../types';

const MODES: { id: Screen; icon: LucideIcon; label: string }[] = [
  { id: 'single', icon: User, label: 'Single Swap' },
  { id: 'multi', icon: Users, label: 'Multi Swap' },
  { id: 'gen', icon: Sparkles, label: 'Image Gen' },
];

export default function Home({
  go,
  apiKey,
  onChangeKey,
  onClearKey,
  keyOpen,
  onToggleKey,
}: {
  go: (screen: Screen) => void;
  apiKey: string;
  onChangeKey: (next: string) => void;
  onClearKey: () => void;
  keyOpen: boolean;
  onToggleKey: () => void;
}) {
  const { status, reload } = useCredits(apiKey);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Face Studio</h1>
          <p className="mt-1 text-sm text-muted">얼굴 편집과 이미지 생성을 한곳에서.</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <CreditBadge status={status} onReload={reload} />
          <button
            type="button"
            onClick={onToggleKey}
            aria-label="API 키 설정"
            aria-expanded={keyOpen}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card ${FOCUS_RING} ${
              apiKey ? 'border-accent' : 'border-line'
            }`}
          >
            <Key size={16} className={apiKey ? 'text-accent' : 'text-muted'} />
          </button>
        </div>
      </header>

      {keyOpen && (
        <ApiKeyPanel
          value={apiKey}
          onChange={onChangeKey}
          onClear={onClearKey}
          creditStatus={status}
        />
      )}

      <div className="grid grid-cols-3 gap-3">
        {MODES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            className={`flex flex-col items-center gap-3 rounded-card p-1 ${FOCUS_RING}`}
          >
            <div className="flex aspect-square w-full items-center justify-center rounded-card border border-line bg-card transition-transform hover:scale-105">
              <Icon size={30} className="text-text" />
            </div>
            <span className="text-center text-xs font-semibold leading-tight text-text">
              {label}
            </span>
          </button>
        ))}
      </div>

      <Notice>
        이미지는 fal.ai로 만듭니다. 우측 상단 열쇠 버튼에서 키를 한 번 넣어두면 세 모드가
        모두 그 키를 씁니다. 모드마다 모델을 바꿀 수 있고, 지시하지 않은 부분은 원본 그대로
        두도록 잠가둡니다.
      </Notice>
    </div>
  );
}
