import { useCallback, useEffect, useState } from 'react';
import { collectFal, FalError } from '../lib/fal';
import { addHistory, listPending, removePending, type PendingRequest } from '../lib/history';

/**
 * 제출은 됐는데 결과를 못 받은 요청.
 * 요금은 이미 나간 것이라 되찾을 수 있어야 한다.
 */
export function usePending(apiKey: string, onRecovered: () => void) {
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setPending(await listPending());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const recover = useCallback(
    async (item: PendingRequest) => {
      if (!apiKey.trim()) {
        setError('fal 키가 없어 가져올 수 없습니다. 홈 화면에서 키를 넣어주세요.');
        return;
      }
      setWorkingId(item.requestId);
      setError(null);
      try {
        const { dataUrl } = await collectFal(item, apiKey);
        await addHistory({
          mode: item.mode,
          modelLabel: item.modelLabel,
          instruction: item.instruction,
          sentPrompt: item.sentPrompt,
          image: dataUrl,
        });
        await removePending(item.requestId);
        await reload();
        onRecovered();
      } catch (e) {
        setError(e instanceof FalError ? e.message : '결과를 가져오지 못했습니다.');
      } finally {
        setWorkingId(null);
      }
    },
    [apiKey, onRecovered, reload],
  );

  const discard = useCallback(
    async (requestId: string) => {
      await removePending(requestId);
      await reload();
    },
    [reload],
  );

  return { pending, workingId, error, recover, discard, reload };
}
