import { Loader2 } from 'lucide-react';
import type { CreditStatus } from '../hooks/useCredits';
import { FOCUS_RING } from './ui';

function format(value: number, currency: string | null): string {
  if (currency && /^[A-Z]{3}$/.test(currency)) {
    try {
      return value.toLocaleString('ko-KR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      });
    } catch {
      // 알 수 없는 통화 코드면 숫자만 보여준다.
    }
  }
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
}

/** 상단 우측에 숫자만. 누르면 다시 조회한다. 자세한 사정은 키 패널에서 본다. */
export default function CreditBadge({
  status,
  onReload,
}: {
  status: CreditStatus;
  onReload: () => void;
}) {
  const value =
    status.kind === 'ok' && status.data.balance !== null
      ? format(status.data.balance, status.data.currency)
      : '—';

  const hint =
    status.kind === 'error'
      ? status.message
      : status.kind === 'idle'
        ? '키를 넣으면 잔액이 표시됩니다'
        : '눌러서 새로고침';

  return (
    <button
      type="button"
      onClick={onReload}
      title={hint}
      aria-label={`크레딧 ${value}. 눌러서 새로고침`}
      className={`flex flex-col items-end rounded-lg px-1 py-0.5 ${FOCUS_RING}`}
    >
      <span className="text-[10px] font-medium leading-none text-muted">크레딧</span>
      <span className="mt-1 flex items-center gap-1 text-sm font-semibold tabular-nums leading-none text-text">
        {status.kind === 'loading' && <Loader2 size={12} className="animate-spin" />}
        {value}
      </span>
    </button>
  );
}
