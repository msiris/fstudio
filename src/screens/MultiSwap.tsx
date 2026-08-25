import { Image as ImageIcon, Users } from 'lucide-react';
import Card from '../components/Card';
import Chip from '../components/Chip';
import EditInstruction from '../components/EditInstruction';
import ImageDrop from '../components/ImageDrop';
import PrimaryButton from '../components/PrimaryButton';
import ResultPanel from '../components/ResultPanel';
import SectionLabel from '../components/SectionLabel';
import { FACE_COUNTS, MULTI_PRESETS } from '../constants';
import { buildEditPrompt } from '../lib/prompt';
import { runImageRequest } from '../lib/run';
import type { MultiState } from '../state';
import type { ImageValue } from '../types';

export default function MultiSwap({
  state,
  onChange,
  apiKey,
}: {
  state: MultiState;
  onChange: (next: Partial<MultiState>) => void;
  apiKey: string;
}) {
  // 슬롯 배열은 항상 4칸을 들고 있고 count만큼만 그린다.
  // 얼굴 수를 줄였다 늘려도 올려둔 이미지가 살아남는다.
  const setFace = (index: number, value: ImageValue) => {
    const faces = state.faces.slice();
    faces[index] = value;
    onChange({ faces });
  };

  // 보이는 슬롯 중 채운 것만 보낸다.
  const usedFaces = state.faces
    .slice(0, state.count)
    .filter((v): v is string => Boolean(v));

  const instruction = state.instruction.trim();
  const ready = Boolean(state.target) && Boolean(instruction);

  const run = async () => {
    if (!ready || state.busy) return;

    if (!apiKey.trim()) {
      onChange({
        note: '우측 상단 키 버튼을 눌러 Google AI Studio 키를 먼저 넣어주세요. aistudio.google.com에서 무료로 발급됩니다.',
      });
      return;
    }

    onChange({ busy: true, note: null, result: null, sentPrompt: null });

    const outcome = await runImageRequest({
      raw: instruction,
      images: [state.target as string, ...usedFaces],
      apiKey,
      build: (text) => buildEditPrompt(text, { referenceFaces: usedFaces.length }),
    });

    onChange({ ...outcome, busy: false });
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionLabel icon={ImageIcon}>단체 사진</SectionLabel>
        <ImageDrop
          value={state.target}
          onChange={(target) => onChange({ target })}
          label="사진 선택"
          size="lg"
          removeLabel="단체 사진 제거"
        />
      </Card>

      {state.target && (
        <Card>
          <SectionLabel icon={Users}>바꿀 얼굴</SectionLabel>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-muted">얼굴 수</span>
            {FACE_COUNTS.map((n) => (
              <Chip
                key={n}
                active={state.count === n}
                onClick={() => onChange({ count: n })}
              >
                {n}
              </Chip>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: state.count }, (_, i) => (
              <div key={i}>
                <ImageDrop
                  value={state.faces[i]}
                  onChange={(v) => setFace(i, v)}
                  label={`얼굴 ${i + 1} 올리기`}
                  size="sm"
                  removeLabel={`얼굴 ${i + 1} 제거`}
                />
                <span className="mt-2 block text-center text-xs text-muted">
                  얼굴 {i + 1}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted">
            채운 슬롯만 왼쪽부터 순서대로 보냅니다. 얼굴을 바꾸지 않는 지시라면 비워둬도
            됩니다.
          </p>
        </Card>
      )}

      <EditInstruction
        value={state.instruction}
        onChange={(v) => onChange({ instruction: v })}
        presets={MULTI_PRESETS}
        placeholder="단체 사진을 어떻게 바꿀지 적어주세요. 아래 칩을 눌러 시작해도 됩니다."
      />

      <PrimaryButton disabled={!ready} busy={state.busy} onClick={() => void run()}>
        {state.busy ? '만드는 중' : '편집하기'}
      </PrimaryButton>

      <ResultPanel
        src={state.result}
        note={state.note}
        sentPrompt={state.sentPrompt}
        fileName="face-studio-multi.png"
      />
    </div>
  );
}
