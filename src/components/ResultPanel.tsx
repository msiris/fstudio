import { Download, Image as ImageIcon } from 'lucide-react';
import Card from './Card';
import SectionLabel from './SectionLabel';
import { FOCUS_RING } from './ui';

/**
 * 결과 이미지, 안내 문구, 실제로 보낸 프롬프트.
 * 셋 다 없으면 아무것도 그리지 않는다. 저장은 <a download>로 처리한다.
 */
export default function ResultPanel({
  src,
  note,
  sentPrompt,
  fileName = 'face-studio.png',
}: {
  src?: string | null;
  note?: string | null;
  sentPrompt?: string | null;
  fileName?: string;
}) {
  if (!src && !note && !sentPrompt) return null;

  return (
    <Card>
      <SectionLabel icon={ImageIcon}>결과</SectionLabel>

      {src && (
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
      )}

      {note && (
        <p
          className={`whitespace-pre-line text-xs leading-relaxed text-muted ${
            src ? 'mt-3' : ''
          }`}
        >
          {note}
        </p>
      )}

      {sentPrompt && (
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
  );
}
