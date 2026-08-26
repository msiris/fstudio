import { Sparkles, User, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Notice from '../components/Notice';
import { FOCUS_RING } from '../components/ui';
import type { Screen } from '../types';

const MODES: { id: Screen; icon: LucideIcon; label: string }[] = [
  { id: 'single', icon: User, label: 'Single Swap' },
  { id: 'multi', icon: Users, label: 'Multi Swap' },
  { id: 'gen', icon: Sparkles, label: 'Image Gen' },
];

export default function Home({ go }: { go: (screen: Screen) => void }) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-text">Face Studio</h1>
        <p className="mt-1 text-sm text-muted">얼굴 편집과 이미지 생성을 한곳에서.</p>
      </header>

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
        모드 화면 우측 상단에서 Gemini API 키를 넣어주세요. 이미지 생성 모델은 무료 한도가
        없어 결제가 연결된 프로젝트의 키가 필요합니다. 장당 약 $0.04입니다.
      </Notice>
    </div>
  );
}
