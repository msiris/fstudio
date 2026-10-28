import { Image as ImageIcon, ShieldCheck, Users } from 'lucide-react';
import Card from '../components/Card';
import Chip from '../components/Chip';
import EditInstruction from '../components/EditInstruction';
import ImageDrop from '../components/ImageDrop';
import PersonChips from '../components/PersonChips';
import ModelPicker from '../components/ModelPicker';
import PrimaryButton from '../components/PrimaryButton';
import ResultPanel from '../components/ResultPanel';
import SectionLabel from '../components/SectionLabel';
import Toggle from '../components/Toggle';
import { FACE_COUNTS, MAX_SLOT_PHOTOS, MULTI_PRESETS } from '../constants';
import { EDIT_MODELS, findModel } from '../lib/falModels';
import { buildEditPrompt } from '../lib/prompt';
import { runImageRequest } from '../lib/run';
import type { MultiState } from '../state';

export default function MultiSwap({
  state,
  onChange,
  apiKey,
}: {
  state: MultiState;
  onChange: (next: Partial<MultiState>) => void;
  apiKey: string;
}) {
  const model = findModel(EDIT_MODELS, state.model);

  // 슬롯 배열은 항상 4칸을 들고 있고 count만큼만 그린다.
  // 얼굴 수를 줄였다 늘려도 올려둔 이미지가 살아남는다.
  const setSlot = (index: number, photos: string[]) => {
    const faces = state.faces.map((slot, i) => (i === index ? photos : slot));
    onChange({ faces });
  };

  const addToSlot = (index: number, photos: string[]) =>
    setSlot(index, [...state.faces[index], ...photos].slice(0, MAX_SLOT_PHOTOS));

  // 보이는 슬롯 중 채운 것만 보낸다. 사람마다 장수가 달라서 그룹으로 넘긴다.
  const usedGroups = state.faces.slice(0, state.count).filter((slot) => slot.length > 0);
  const usedFaces = usedGroups.flat();

  const instruction = state.instruction.trim();
  const ready = Boolean(state.target) && Boolean(instruction);

  const run = async () => {
    if (!ready || state.busy) return;

    if (!apiKey.trim()) {
      onChange({
        note: '홈 화면 우측 상단 열쇠 버튼에서 fal 키를 먼저 넣어주세요. fal.ai/dashboard/keys 에서 ADMIN 스코프로 발급합니다.',
      });
      return;
    }

    onChange({ busy: true, progress: null, note: null, result: null, sentPrompt: null });

    const outcome = await runImageRequest({
      raw: instruction,
      images: [state.target as string, ...usedFaces],
      ratio: 'Original',
      quality: state.quality,
      model,
      mode: '여러 얼굴 바꾸기',
      falKey: apiKey,
      onProgress: ({ status, queuePosition }) =>
        onChange({
          progress: queuePosition ? `${status} · 대기열 ${queuePosition}번째` : status,
        }),
      build: (text) =>
        buildEditPrompt(text, {
          faceGroups: usedGroups.map((slot) => slot.length),
          scopeLock: state.scopeLock,
        }),
    });

    onChange({ ...outcome, busy: false, progress: null });
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

          <div className="space-y-4">
            {Array.from({ length: state.count }, (_, i) => {
              const slot = state.faces[i];
              const room = MAX_SLOT_PHOTOS - slot.length;
              return (
                <div key={i} className="rounded-card border border-line p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-text">얼굴 {i + 1}</span>
                    <span className="text-xs text-muted">
                      {slot.length}/{MAX_SLOT_PHOTOS}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {slot.map((photo, j) => (
                      <ImageDrop
                        key={j}
                        value={photo}
                        onChange={() => setSlot(i, slot.filter((_, k) => k !== j))}
                        label={`얼굴 ${i + 1} 사진 ${j + 1}`}
                        size="sm"
                        removeLabel={`얼굴 ${i + 1} 사진 ${j + 1} 제거`}
                      />
                    ))}
                    {room > 0 && (
                      <ImageDrop
                        value={null}
                        onChange={(v) => v && addToSlot(i, [v])}
                        label={`얼굴 ${i + 1} 사진 추가`}
                        size="sm"
                      />
                    )}
                  </div>

                  <PersonChips
                    onPick={(photos) => addToSlot(i, photos)}
                    label="등록한 인물에서"
                    limit={room}
                  />
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted">
            채운 슬롯만 왼쪽부터 순서대로 보냅니다. 한 슬롯에 같은 사람을 여러 각도로 넣으면
            얼굴 각도가 달라도 같은 사람으로 들어갑니다.
          </p>
        </Card>
      )}

      <EditInstruction
        value={state.instruction}
        onChange={(v) => onChange({ instruction: v })}
        presets={MULTI_PRESETS}
        placeholder="단체 사진을 어떻게 바꿀지 적어주세요. 아래 칩을 눌러 시작해도 됩니다."
      />

      <Toggle
        icon={ShieldCheck}
        on={state.scopeLock}
        onChange={(scopeLock) => onChange({ scopeLock })}
        title="지시한 것만 변경"
        desc="명령하지 않은 부분은 원본 그대로 둡니다"
      />

      <ModelPicker
        models={EDIT_MODELS}
        value={state.model}
        onChange={(id) => onChange({ model: id })}
        quality={state.quality}
        onChangeQuality={(quality) => onChange({ quality })}
      />

      <PrimaryButton disabled={!ready} busy={state.busy} onClick={() => void run()}>
        {state.busy ? '만드는 중' : '편집하기'}
      </PrimaryButton>

      <ResultPanel
        src={state.result}
        note={state.note}
        sentPrompt={state.sentPrompt}
        busy={state.busy}
        progress={state.progress}
        fileName="face-studio-multi.png"
      />
    </div>
  );
}
