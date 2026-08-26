import { Cpu } from 'lucide-react';
import Card from './Card';
import Chip from './Chip';
import SectionLabel from './SectionLabel';
import { findModel, type FalModel } from '../lib/falModels';

/** 모드마다 쓸 수 있는 fal 모델을 고른다. 필요할 때 바꿔 쓰라고 화면에 뒀다. */
export default function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: FalModel[];
  value: string;
  onChange: (id: string) => void;
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
      <p className="mt-3 text-xs leading-relaxed text-muted">{selected.note}</p>
      <p className="mt-1 break-all text-[11px] leading-relaxed text-muted/70">
        {selected.key}
      </p>
    </Card>
  );
}
