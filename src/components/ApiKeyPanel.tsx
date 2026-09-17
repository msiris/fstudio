import { Key, Trash2 } from 'lucide-react';
import Card from './Card';
import SectionLabel from './SectionLabel';
import { STORAGE_AVAILABLE } from '../lib/keyStore';
import type { CreditStatus } from '../hooks/useCredits';
import { FOCUS_RING } from './ui';

/**
 * fal 키 하나만 받는다. ADMIN 스코프로 발급하면 이미지 생성과 잔액 조회가 모두 된다.
 * 키는 이 브라우저의 localStorage에만 저장된다.
 * 소스·커밋·빌드 결과 어디에도 들어가지 않는다.
 */
export default function ApiKeyPanel({
  value,
  onChange,
  onClear,
  creditStatus,
}: {
  value: string;
  onChange: (next: string) => void;
  onClear: () => void;
  /** 잔액 조회가 실패했을 때 그 사정을 여기서 보여준다. */
  creditStatus?: CreditStatus;
}) {
  return (
    <Card>
      <SectionLabel icon={Key}>fal.ai 키</SectionLabel>

      <div className="flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="키 ID:시크릿"
          aria-label="fal.ai 키"
          autoComplete="off"
          spellCheck={false}
          className={`h-field min-w-0 flex-1 rounded-card border border-line bg-cardAlt px-3 text-sm text-text placeholder:text-muted ${FOCUS_RING}`}
        />
        <button
          type="button"
          onClick={onClear}
          disabled={!value}
          aria-label="키 지우기"
          className={`flex h-field w-11 shrink-0 items-center justify-center rounded-card border border-line bg-cardAlt ${FOCUS_RING} ${
            value ? 'text-muted hover:text-text' : 'cursor-not-allowed text-muted/40'
          }`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted">
        fal.ai/dashboard/keys 에서 <strong className="font-semibold text-text">ADMIN</strong>{' '}
        스코프로 발급하세요. 이미지 생성과 잔액 조회가 이 키 하나로 됩니다. 크레딧을 충전해야
        호출됩니다.
      </p>

      {creditStatus?.kind === 'error' && (
        <p className="mt-2 text-xs leading-relaxed text-muted">{creditStatus.message}</p>
      )}

      {creditStatus?.kind === 'ok' && creditStatus.data.balance === null && (
        <details className="mt-2">
          <summary className={`cursor-pointer list-none text-xs text-muted ${FOCUS_RING}`}>
            잔액 항목을 찾지 못했습니다. 응답 원문 보기
          </summary>
          <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-muted">
            {creditStatus.data.raw}
          </pre>
        </details>
      )}

      <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
        {STORAGE_AVAILABLE
          ? '키는 이 브라우저에만 저장되며 소스나 커밋에는 들어가지 않습니다. 공용 PC에서는 휴지통 버튼으로 지우고 나오세요.'
          : '이 브라우저는 저장을 막고 있어 새로고침하면 키가 사라집니다.'}
      </p>
    </Card>
  );
}
