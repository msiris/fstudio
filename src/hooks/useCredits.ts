import { useCallback, useEffect, useState } from 'react';
import { fetchCredits, FalAccountError, type CreditsResult } from '../lib/falAccount';

/** 키를 입력하는 동안 글자마다 요청이 나가지 않게 기다린다. */
const DEBOUNCE_MS = 800;

export type CreditStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; data: CreditsResult }
  | { kind: 'error'; message: string };

/** 잔액 조회 상태. 상단 뱃지와 키 패널이 같은 상태를 공유한다. */
export function useCredits(apiKey: string) {
  const [status, setStatus] = useState<CreditStatus>({ kind: 'idle' });

  const load = useCallback(async (key: string) => {
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
        message: e instanceof FalAccountError ? e.message : '잔액을 불러오지 못했습니다.',
      });
    }
  }, []);

  // 키가 바뀌면 다시 조회한다. 입력 중에는 잠시 기다린다.
  useEffect(() => {
    if (!apiKey.trim()) {
      setStatus({ kind: 'idle' });
      return;
    }
    const timer = setTimeout(() => void load(apiKey), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [apiKey, load]);

  return { status, reload: () => void load(apiKey) };
}
