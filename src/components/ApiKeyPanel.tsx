import { Key, Trash2 } from 'lucide-react';
import Card from './Card';
import SectionLabel from './SectionLabel';
import { STORAGE_AVAILABLE, type ApiKeys, type KeyName } from '../lib/keyStore';
import { FOCUS_RING } from './ui';

/**
 * fal 키 하나면 충분하다. ADMIN 스코프는 API 스코프를 포함하므로
 * ADMIN 키를 첫 칸에 넣으면 이미지 생성과 잔액 조회가 모두 된다.
 *
 * 두 번째 칸은 스코프를 나눠 쓰고 싶은 경우를 위한 것이다.
 * 생성에는 권한이 좁은 API 키를 쓰고 잔액만 ADMIN 키로 보고 싶을 때 채운다.
 *
 * Gemini는 한글을 영어로 옮기는 용도다. 없어도 동작하지만 품질이 떨어진다.
 *
 * 모두 이 브라우저의 localStorage에만 저장된다.
 * 소스·커밋·빌드 결과 어디에도 들어가지 않는다.
 */

function KeyField({
  label,
  hint,
  placeholder,
  value,
  onChange,
  onClear,
}: {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold text-text">{label}</div>
      <div className="flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
          spellCheck={false}
          className={`h-field min-w-0 flex-1 rounded-card border border-line bg-cardAlt px-3 text-sm text-text placeholder:text-muted ${FOCUS_RING}`}
        />
        <button
          type="button"
          onClick={onClear}
          disabled={!value}
          aria-label={`${label} 지우기`}
          className={`flex h-field w-11 shrink-0 items-center justify-center rounded-card border border-line bg-cardAlt ${FOCUS_RING} ${
            value ? 'text-muted hover:text-text' : 'cursor-not-allowed text-muted/40'
          }`}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

export default function ApiKeyPanel({
  keys,
  onChange,
  onClear,
}: {
  keys: ApiKeys;
  onChange: (name: KeyName, next: string) => void;
  onClear: (name: KeyName) => void;
}) {
  return (
    <Card>
      <SectionLabel icon={Key}>API 키</SectionLabel>

      <div className="space-y-4">
        <KeyField
          label="fal.ai 키 (필수)"
          placeholder="키 ID:시크릿"
          value={keys.fal}
          onChange={(v) => onChange('fal', v)}
          onClear={() => onClear('fal')}
          hint="fal.ai/dashboard/keys 에서 발급합니다. ADMIN 스코프로 만들면 이 키 하나로 이미지 생성과 잔액 조회가 모두 됩니다. 크레딧을 충전해야 호출됩니다."
        />

        <KeyField
          label="fal.ai ADMIN — 잔액 조회용 (선택)"
          placeholder="비워두면 위의 키로 조회합니다"
          value={keys.falAdmin}
          onChange={(v) => onChange('falAdmin', v)}
          onClear={() => onClear('falAdmin')}
          hint="보통 비워둡니다. 생성에는 권한이 좁은 API 키를 쓰고 잔액만 따로 보고 싶을 때, 여기에 ADMIN 키를 넣으세요. 잔액 조회는 ADMIN 스코프만 받습니다."
        />

        <KeyField
          label="Google AI Studio — 한글 번역 (선택)"
          placeholder="AIza..."
          value={keys.gemini}
          onChange={(v) => onChange('gemini', v)}
          onClear={() => onClear('gemini')}
          hint="aistudio.google.com/apikey 에서 무료로 발급합니다. 없으면 한국어를 그대로 보냅니다. 텍스트 모델은 무료 티어로 처리돼 비용이 붙지 않습니다."
        />
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
        {STORAGE_AVAILABLE
          ? '키는 모두 이 브라우저에만 저장되며 소스나 커밋에는 들어가지 않습니다. 공용 PC에서는 휴지통 버튼으로 지우고 나오세요.'
          : '이 브라우저는 저장을 막고 있어 새로고침하면 키가 사라집니다.'}
      </p>
    </Card>
  );
}
