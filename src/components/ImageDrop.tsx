import { Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { ALLOWED_MIME, readImageFile } from '../lib/image';
import type { ImageValue } from '../types';
import { FOCUS_RING } from './ui';

type Size = 'lg' | 'md' | 'sm';

const HEIGHT: Record<Size, string> = {
  lg: 'h-64',
  md: 'h-36',
  sm: 'h-24',
};

/**
 * 파일을 data URL로 읽어 미리보기까지 담당한다.
 * 형식·용량 오류는 이 자리에서 인라인으로 보여주고, 기존 값은 지우지 않는다.
 */
export default function ImageDrop({
  value,
  onChange,
  label,
  hint,
  size = 'md',
  removeLabel = '이미지 제거',
}: {
  value: ImageValue;
  onChange: (next: ImageValue) => void;
  label: string;
  hint?: string;
  size?: Size;
  removeLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      setError(null);
      onChange(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일을 읽지 못했습니다.');
    }
    // 같은 파일을 다시 골라도 change가 뜨도록 초기화
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME.join(',')}
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt=""
            className={`w-full rounded-card object-cover ${HEIGHT[size]}`}
          />
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange(null);
            }}
            aria-label={removeLabel}
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 ${FOCUS_RING}`}
          >
            <X size={15} className="text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line bg-cardAlt px-2 transition-colors hover:brightness-125 ${HEIGHT[size]} ${FOCUS_RING}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card">
            <Plus size={20} className="text-muted" />
          </div>
          {size !== 'sm' && (
            <>
              <span className="text-sm font-medium text-text">{label}</span>
              {hint && <span className="text-xs text-muted">{hint}</span>}
            </>
          )}
          {size === 'sm' && <span className="sr-only">{label}</span>}
        </button>
      )}

      {error && <p className="mt-2 text-xs leading-relaxed text-muted">{error}</p>}
    </div>
  );
}
