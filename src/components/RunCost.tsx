import { Coins } from 'lucide-react';
import type { FalModel } from '../lib/falModels';
import type { Quality } from '../types';

/**
 * 실행 직전에 몇 장이 나가고 얼마가 빠지는지 보여준다.
 *
 * 참조를 한 장 더 넣는 것이 요금에 붙는다는 사실이 화면 어디에도 없었다.
 * 상한만 올려두면 모르는 사이에 늘어난다. 누르기 직전이 그걸 보여줄 자리다.
 *
 * 요금을 확인하지 못한 모델은 장수만 보여준다. 틀린 숫자보다 없는 숫자가 낫다.
 * 실패해도 요금은 나간다는 것까지 적는다. 거절이 잦으면 그쪽이 더 큰 지출이다.
 */
export default function RunCost({
  model,
  quality,
  imageCount,
}: {
  model: FalModel;
  quality: Quality;
  /** 이번 호출에 실제로 실려 나갈 이미지 장수. */
  imageCount: number;
}) {
  const sent = model.acceptsImages ? imageCount : 0;
  const usd = model.price?.({ quality, imageCount: sent });
  if (usd === undefined && sent === 0) return null;

  // 첫 장을 뺀 나머지가 추가 과금이다. 줄일 수 있는 부분이 어디인지 보여준다.
  const base = model.price?.({ quality, imageCount: Math.min(sent, 1) });
  const extra = usd !== undefined && base !== undefined ? usd - base : 0;

  return (
    <p className="-mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs text-muted">
      <Coins size={13} className="shrink-0" />
      {sent > 0 && <span className="tabular-nums">이미지 {sent}장</span>}
      {usd !== undefined && (
        <span className="font-semibold tabular-nums text-text">약 ${usd.toFixed(3)}</span>
      )}
      {extra > 0.0001 && (
        <span className="tabular-nums">
          (참조 {sent - 1}장 추가로 +${extra.toFixed(3)})
        </span>
      )}
      <span>· 실패해도 요금은 나갑니다</span>
    </p>
  );
}
