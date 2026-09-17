import { Loader2, RefreshCw, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Card from './Card';
import SectionLabel from './SectionLabel';
import { fetchCredits, FalAccountError, type CreditsResult } from '../lib/falAccount';
import { FOCUS_RING } from './ui';

/** 키를 입력하는 동안 글자마다 요청이 나가지 않게 기다린다. */
const DEBOUNCE_MS = 800;

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; data: CreditsResult }
  | { kind: 'error'; message: string };

function formatBalance(value: number, currency: string | null): string {
  if (currency && /^[A-Z]{3}$/.test(currency)) {
    try {
      return value.toLocaleString('ko-KR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 4,
      });
    } catch {
      // 알 수 없는 통화 코드면 숫자만 보여준다.
    }
  }
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
}

export default function CreditBalance({ apiKey }: { apiKey: string }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const load = useCallback(
    async (key: string) => {
      if (!key.trim()) {
        setStatus({ kind: 'idle' });
        return;
      }
      setStatus({ kind: 'loading' });
      try {
        setStatus({ kind: 'ok', data: await fetchCredits(key) });
      } catch (e) {
        setStatus({
          kind: 'error',
          message:
            e instanceof FalAccountError ? e.message : '잔액을 불러오지 못했습니다.',
        });
      }
    },
    [],
  );

  // 키가 바뀌면 다시 조회한다. 입력 중에는 잠시 기다린다.
  useEffect(() => {
    if (!apiKey.trim()) {
      setStatus({ kind: 'idle' });
      return;
    }
    const timer = setTimeout(() => void load(apiKey), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [apiKey, load]);

  const busy = status.kind === 'loading';

  return (
    <Card>
      <div className="flex items-start justify-between">
        <SectionLabel icon={Wallet}>fal 크레딧</SectionLabel>
        <button
          type="button"
          onClick={() => void load(apiKey)}
          disabled={!apiKey.trim() || busy}
          aria-label="잔액 새로고침"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cardAlt ${FOCUS_RING} ${
            apiKey.trim() && !busy
              ? 'text-muted hover:text-text'
              : 'cursor-not-allowed text-muted/40'
          }`}
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
        </button>
      </div>

      {status.kind === 'idle' && (
        <p className="text-xs leading-relaxed text-muted">
          아래 ADMIN 칸에 fal ADMIN 키를 넣으면 남은 크레딧을 보여줍니다. 이미지 생성용
          키와는 다른 키입니다.
        </p>
      )}

      {status.kind === 'loading' && (
        <p className="text-xs leading-relaxed text-muted">불러오는 중</p>
      )}

      {status.kind === 'error' && (
        <p className="text-xs leading-relaxed text-muted">{status.message}</p>
      )}

      {status.kind === 'ok' && (
        <>
          {status.data.balance !== null ? (
            <>
              <div className="text-2xl font-bold tabular-nums text-text">
                {formatBalance(status.data.balance, status.data.currency)}
              </div>
              {status.data.username && (
                <p className="mt-1 text-xs text-muted">{status.data.username}</p>
              )}
            </>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              응답에서 잔액 항목을 찾지 못했습니다. 아래 원문을 열어 어느 값이 잔액인지
              확인해주세요.
            </p>
          )}

          <details className="mt-3 border-t border-line pt-3">
            <summary
              className={`cursor-pointer list-none text-xs font-medium text-muted ${FOCUS_RING}`}
            >
              응답 원문 보기
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-muted">
              {status.data.raw}
            </pre>
          </details>
        </>
      )}
    </Card>
  );
}
