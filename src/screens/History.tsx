import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Card from '../components/Card';
import Notice from '../components/Notice';
import { FOCUS_RING } from '../components/ui';
import { useHistory } from '../hooks/useHistory';
import { downloadDataUrl } from '../lib/download';
import { getHistoryImage, type HistoryEntry } from '../lib/history';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function HistoryCard({
  entry,
  onRemove,
}: {
  entry: HistoryEntry;
  onRemove: (id: string) => void;
}) {
  // 한 번 더 눌러야 지워진다. 실수로 날리면 되돌릴 방법이 없다.
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const image = await getHistoryImage(entry.id);
      downloadDataUrl(image ?? entry.thumb, `face-studio-${entry.createdAt}.png`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-3">
      <img
        src={entry.thumb}
        alt={entry.instruction || '생성 결과'}
        className="h-40 w-full rounded-card object-cover"
      />

      <div>
        <div className="text-xs text-muted">
          {formatDate(entry.createdAt)} · {entry.mode} · {entry.modelLabel}
        </div>
        {entry.instruction && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text">
            {entry.instruction}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className={`flex h-field flex-1 items-center justify-center gap-2 rounded-card bg-cardAlt text-sm font-medium text-text ${FOCUS_RING}`}
        >
          <Download size={15} /> {saving ? '여는 중' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirming) onRemove(entry.id);
            else {
              setConfirming(true);
              setTimeout(() => setConfirming(false), 3000);
            }
          }}
          aria-label={confirming ? '삭제 확인' : '삭제'}
          className={`flex h-field shrink-0 items-center justify-center gap-2 rounded-card bg-cardAlt px-4 text-sm font-medium ${FOCUS_RING} ${
            confirming ? 'text-accent' : 'text-muted hover:text-text'
          }`}
        >
          <Trash2 size={15} /> {confirming ? '정말요?' : ''}
        </button>
      </div>

      <details>
        <summary className={`cursor-pointer list-none text-xs text-muted ${FOCUS_RING}`}>
          보낸 프롬프트 보기
        </summary>
        <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-muted">
          {entry.sentPrompt}
        </pre>
      </details>
    </Card>
  );
}

export default function History() {
  const { entries, total, usage, loading, hasMore, error, loadMore, remove, clear } =
    useHistory();
  const [clearing, setClearing] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted">
          {total}장{usage !== null && ` · ${formatBytes(usage)} 사용 중`}
        </div>
        {total > 0 && (
          <button
            type="button"
            onClick={() => {
              if (clearing) void clear();
              else {
                setClearing(true);
                setTimeout(() => setClearing(false), 3000);
              }
            }}
            className={`rounded-lg px-2 py-1 text-xs font-medium ${FOCUS_RING} ${
              clearing ? 'text-accent' : 'text-muted hover:text-text'
            }`}
          >
            {clearing ? '전부 지울까요?' : '전체 삭제'}
          </button>
        )}
      </div>

      {error && <Notice>{error}</Notice>}

      {loading && <p className="text-xs text-muted">불러오는 중</p>}

      {!loading && !error && entries.length === 0 && (
        <Notice>
          아직 기록이 없습니다. 이미지를 만들면 여기에 쌓입니다. 이 브라우저에만 저장되고
          지우기 전까지 남습니다.
        </Notice>
      )}

      {entries.map((entry) => (
        <HistoryCard key={entry.id} entry={entry} onRemove={(id) => void remove(id)} />
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={() => void loadMore()}
          className={`flex h-field w-full items-center justify-center rounded-card border border-line bg-card text-sm font-medium text-text ${FOCUS_RING}`}
        >
          더 보기
        </button>
      )}
    </div>
  );
}
