import { Cpu, ShieldOff } from 'lucide-react';
import Card from './Card';
import Chip from './Chip';
import SectionLabel from './SectionLabel';
import { FOCUS_RING } from './ui';
import { findModel, type FalModel } from '../lib/falModels';
import type { Quality } from '../types';

/** 모드마다 쓸 수 있는 fal 모델을 고른다. 필요할 때 바꿔 쓰라고 화면에 뒀다. */
export default function ModelPicker({
  models,
  value,
  onChange,
  quality,
  onChangeQuality,
  relaxSafety,
  onChangeRelaxSafety,
}: {
  models: FalModel[];
  value: string;
  onChange: (id: string) => void;
  quality: Quality;
  onChangeQuality: (next: Quality) => void;
  relaxSafety: boolean;
  onChangeRelaxSafety: (next: boolean) => void;
}) {
  const selected = findModel(models, value);

  return (
    <Card>
      <SectionLabel icon={Cpu}>모델</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {models.map((model) => (
          <Chip
            key={model.key}
            active={model.key === selected.key}
            onClick={() => onChange(model.key)}
          >
            {model.label}
          </Chip>
        ))}
      </div>
      {selected.qualities && selected.qualities.length > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted">해상도</span>
          {selected.qualities.map((q) => (
            <Chip key={q} active={quality === q} onClick={() => onChangeQuality(q)}>
              {q}
            </Chip>
          ))}
        </div>
      )}

      <label
        className={`mt-3 flex cursor-pointer items-start gap-2 rounded-card border border-line bg-cardAlt p-3 ${FOCUS_RING}`}
      >
        <input
          type="checkbox"
          checked={relaxSafety}
          onChange={(e) => onChangeRelaxSafety(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
        />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-text">
            <ShieldOff size={13} className="text-muted" /> 안전 필터 완화
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-muted">
            모델이 공개한 설정 안에서만 낮춥니다. 평범한 사진이 막히는 오탐을 줄이는
            용도이고, 제공자 정책 자체가 없어지지는 않습니다.
          </span>
        </span>
      </label>

      <p className="mt-3 text-xs leading-relaxed text-muted">{selected.note}</p>
      <p className="mt-1 break-all text-[11px] leading-relaxed text-muted/70">
        {selected.key}
      </p>
    </Card>
  );
}
