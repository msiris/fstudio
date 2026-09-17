import { Wand2 } from 'lucide-react';
import Card from './Card';
import Chip from './Chip';
import SectionLabel from './SectionLabel';
import { FOCUS_RING } from './ui';
import type { EditPreset } from '../constants';

/** 편집 지시 입력란 + 프리셋 칩. 칩을 누르면 입력란을 그 문장으로 채운다. */
export default function EditInstruction({
  value,
  onChange,
  presets,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  presets: EditPreset[];
  placeholder: string;
}) {
  return (
    <Card>
      <SectionLabel icon={Wand2}>편집 지시</SectionLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        aria-label="편집 지시"
        placeholder={placeholder}
        className={`w-full resize-none rounded-card border border-line bg-cardAlt p-3 text-sm text-text placeholder:text-muted ${FOCUS_RING}`}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Chip
            key={preset.label}
            active={value === preset.text}
            onClick={() => onChange(preset.text)}
          >
            {preset.label}
          </Chip>
        ))}
      </div>
    </Card>
  );
}
