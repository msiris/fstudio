import { Key, Trash2 } from 'lucide-react';
import Card from './Card';
import SectionLabel from './SectionLabel';
import { STORAGE_AVAILABLE } from '../lib/keyStore';
import { FOCUS_RING } from './ui';

/**
 * 키는 이 브라우저의 localStorage에만 저장된다.
 * 소스·커밋·빌드 결과 어디에도 들어가지 않는다.
 */
export default function ApiKeyPanel({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (next: string) => void;
  onClear: () => void;
}) {
  return (
    <Card>
      <SectionLabel icon={Key}>Google AI Studio 키</SectionLabel>

      <div className="flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="AIza..."
          aria-label="Google AI Studio API 키"
          autoComplete="off"
          spellCheck={false}
          className={`h-field min-w-0 flex-1 rounded-card border border-line bg-cardAlt px-3 text-sm text-text placeholder:text-muted ${FOCUS_RING}`}
        />
        <button
          type="button"
          onClick={onClear}
          disabled={!value}
          aria-label="저장된 키 지우기"
          className={`flex h-field w-11 shrink-0 items-center justify-center rounded-card border border-line bg-cardAlt ${FOCUS_RING} ${
            value ? 'text-muted hover:text-text' : 'cursor-not-allowed text-muted/40'
          }`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted">
        {STORAGE_AVAILABLE ? (
          <>
            aistudio.google.com에서 무료로 발급됩니다. 이 브라우저에만 저장되며 소스나
            커밋에는 들어가지 않습니다. 공용 PC에서는 휴지통 버튼으로 지우고 나오세요.
          </>
        ) : (
          <>
            aistudio.google.com에서 무료로 발급됩니다. 이 브라우저는 저장을 막고 있어
            새로고침하면 사라집니다.
          </>
        )}
      </p>
    </Card>
  );
}
