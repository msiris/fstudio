import { Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Card from './Card';
import SectionLabel from './SectionLabel';
import { FOCUS_RING } from './ui';

/** 생성이 시작된 뒤 흐른 시간. 멈춘 건지 도는 건지 구분이 되어야 한다. */
function useElapsed(active: boolean): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const started = Date.now();
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  return seconds;
}

/**
 * 기다리는 동안 보여줄 문구.
 *
 * 타임아웃이 2분이라 "보통 10~30초"만 띄워두면 그 뒤로는 멈춘 것처럼 보인다.
 * 오래 걸리는 것이 정상 범위라는 걸 경과에 따라 알려준다.
 */
function waitingHint(elapsed: number): string {
  if (elapsed < 30) return '보통 10~30초 걸립니다.';
  if (elapsed < 60) {
    return '조금 오래 걸리고 있습니다. 해상도가 높거나 이미지가 많으면 1분을 넘기기도 합니다.';
  }
  return '아직 진행 중입니다. 2분까지 기다린 뒤 응답이 없으면 알려드립니다.';
}

/**
 * 결과 이미지, 진행 상태, 안내 문구, 실제로 보낸 프롬프트.
 * 전부 없으면 아무것도 그리지 않는다. 저장은 <a download>로 처리한다.
 */
export default function ResultPanel({
  src,
  note,
  sentPrompt,
  busy = false,
  fileName = 'face-studio.png',
}: {
  src?: string | null;
  note?: string | null;
  sentPrompt?: string | null;
  busy?: boolean;
  fileName?: string;
}) {
  const elapsed = useElapsed(busy);
  const cardRef = useRef<HTMLDivElement>(null);

  // 실행 버튼은 화면 위쪽에 있어서, 누르면 진행 상태가 접힌 아래에 생긴다.
  // 눌렀는데 아무 일도 없는 것처럼 보이지 않도록 결과 자리로 데려온다.
  useEffect(() => {
    if (busy) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [busy]);

  if (!busy && !src && !note && !sentPrompt) return null;

  return (
    <div ref={cardRef}>
      <Card>
        <SectionLabel icon={ImageIcon}>결과</SectionLabel>

        {busy ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-card border border-line bg-cardAlt">
            <Loader2 size={28} className="animate-spin text-accent" />
            <div className="text-sm font-semibold text-text">만드는 중</div>
            <div className="text-xs tabular-nums text-muted">{elapsed}초</div>
            <p className="px-6 text-center text-xs leading-relaxed text-muted">
              {waitingHint(elapsed)}
            </p>
          </div>
        ) : (
          src && (
            <>
              <img src={src} alt="생성 결과" className="w-full rounded-card" />
              <a
                href={src}
                download={fileName}
                className={`mt-3 flex h-field items-center justify-center gap-2 rounded-card bg-cardAlt text-sm font-medium text-text ${FOCUS_RING}`}
              >
                <Download size={15} /> 저장
              </a>
            </>
          )
        )}

        {!busy && note && (
          <p
            className={`whitespace-pre-line text-xs leading-relaxed text-muted ${
              src ? 'mt-3' : ''
            }`}
          >
            {note}
          </p>
        )}

        {!busy && sentPrompt && (
          <details className="mt-3 border-t border-line pt-3">
            <summary
              className={`cursor-pointer list-none text-xs font-medium text-muted ${FOCUS_RING}`}
            >
              보낸 프롬프트 보기
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-muted">
              {sentPrompt}
            </pre>
          </details>
        )}
      </Card>
    </div>
  );
}
