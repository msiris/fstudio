import { useCallback, useEffect, useState } from 'react';
import {
  clearHistory,
  countHistory,
  estimateUsage,
  listHistory,
  removeHistory,
  type HistoryEntry,
} from '../lib/history';

/** 한 번에 읽어올 장수. 누적해서 쌓이므로 끊어서 읽는다. */
const PAGE = 20;

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [usage, setUsage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMeta = useCallback(async () => {
    setTotal(await countHistory());
    setUsage(await estimateUsage());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const first = await listHistory(PAGE);
      setEntries(first);
      setHasMore(first.length === PAGE);
      await refreshMeta();
    } catch {
      setError('기록을 불러오지 못했습니다. 이 브라우저가 저장소를 막고 있을 수 있습니다.');
    } finally {
      setLoading(false);
    }
  }, [refreshMeta]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    const oldest = entries[entries.length - 1];
    if (!oldest) return;
    const next = await listHistory(PAGE, oldest.createdAt);
    setEntries((list) => [...list, ...next]);
    setHasMore(next.length === PAGE);
  }, [entries]);

  const remove = useCallback(
    async (id: string) => {
      await removeHistory(id);
      setEntries((list) => list.filter((e) => e.id !== id));
      await refreshMeta();
    },
    [refreshMeta],
  );

  const clear = useCallback(async () => {
    await clearHistory();
    setEntries([]);
    setHasMore(false);
    await refreshMeta();
  }, [refreshMeta]);

  return { entries, total, usage, loading, hasMore, error, loadMore, remove, clear, reload: load };
}
