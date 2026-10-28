import { Image as ImageIcon, ShieldCheck, User, Wand2 } from 'lucide-react';
import Card from '../components/Card';
import EditInstruction from '../components/EditInstruction';
import ImageDrop from '../components/ImageDrop';
import PersonChips from '../components/PersonChips';
import ModelPicker from '../components/ModelPicker';
import PrimaryButton from '../components/PrimaryButton';
import ResultPanel from '../components/ResultPanel';
import SectionLabel from '../components/SectionLabel';
import Toggle from '../components/Toggle';
import { MAX_SOURCE_PHOTOS, SINGLE_PRESETS } from '../constants';
import { EDIT_MODELS, findModel } from '../lib/falModels';
import { buildEditPrompt } from '../lib/prompt';
import { runImageRequest } from '../lib/run';
import type { SingleState } from '../state';

export default function SingleSwap({
  state,
  onChange,
  apiKey,
}: {
  state: SingleState;
  onChange: (next: Partial<SingleState>) => void;
  apiKey: string;
}) {
  const model = findModel(EDIT_MODELS, state.model);
  const instruction = state.instruction.trim();
  const ready = Boolean(state.target) && Boolean(instruction);
  const room = MAX_SOURCE_PHOTOS - state.sources.length;

  const addSources = (photos: string[]) =>
    onChange({ sources: [...state.sources, ...photos].slice(0, MAX_SOURCE_PHOTOS) });

  const run = async () => {
    if (!ready || state.busy) return;

    if (!apiKey.trim()) {
      onChange({
        note: '홈 화면 우측 상단 열쇠 버튼에서 fal 키를 먼저 넣어주세요. fal.ai/dashboard/keys 에서 ADMIN 스코프로 발급합니다.',
      });
      return;
    }

    onChange({ busy: true, progress: null, note: null, result: null, sentPrompt: null });

    // 대상 사진이 먼저, 참조 얼굴이 그 뒤. 프롬프트가 말하는 순서와 같아야 한다.
    const images = [state.target as string, ...state.sources];

    const outcome = await runImageRequest({
      raw: instruction,
      images,
      ratio: 'Original',
      quality: state.quality,
      relaxSafety: state.relaxSafety,
      model,
      mode: '얼굴 하나 바꾸기',
      falKey: apiKey,
      onProgress: ({ status, queuePosition }) =>
        onChange({
          progress: queuePosition ? `${status} · 대기열 ${queuePosition}번째` : status,
        }),
      build: (text) =>
        buildEditPrompt(text, {
          faceGroups: state.sources.length ? [state.sources.length] : [],
          enhance: state.enhance,
          scopeLock: state.scopeLock,
        }),
    });

    onChange({ ...outcome, busy: false, progress: null });
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionLabel icon={ImageIcon}>바꿀 사진</SectionLabel>
        <ImageDrop
          value={state.target}
          onChange={(target) => onChange({ target })}
          label="사진 선택"
          size="lg"
          removeLabel="바꿀 사진 제거"
        />
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <SectionLabel icon={User}>넣을 얼굴</SectionLabel>
          <span className="text-xs text-muted">
            {state.sources.length}/{MAX_SOURCE_PHOTOS}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {state.sources.map((photo, i) => (
            <ImageDrop
              key={i}
              value={photo}
              onChange={() => onChange({ sources: state.sources.filter((_, j) => j !== i) })}
              label={`얼굴 ${i + 1}`}
              size="sm"
              removeLabel={`얼굴 ${i + 1} 제거`}
            />
          ))}
          {room > 0 && (
            <ImageDrop
              value={null}
              onChange={(v) => v && addSources([v])}
              label="얼굴 사진 추가"
              size="sm"
            />
          )}
        </div>

        <PersonChips onPick={addSources} limit={room} />

        <p className="mt-3 text-xs leading-relaxed text-muted">
          얼굴을 바꿀 때만 필요합니다. 같은 사람을 정면·측면 등 여러 각도로 넣으면, 대상
          사진의 얼굴 각도가 달라도 같은 사람으로 들어갑니다.
        </p>
      </Card>

      <EditInstruction
        value={state.instruction}
        onChange={(v) => onChange({ instruction: v })}
        presets={SINGLE_PRESETS}
        placeholder="사진을 어떻게 바꿀지 적어주세요. 아래 칩을 눌러 시작해도 됩니다."
      />

      <ModelPicker
        models={EDIT_MODELS}
        value={state.model}
        onChange={(id) => onChange({ model: id })}
        quality={state.quality}
        onChangeQuality={(quality) => onChange({ quality })}
        relaxSafety={state.relaxSafety}
        onChangeRelaxSafety={(relaxSafety) => onChange({ relaxSafety })}
      />

      <Toggle
        icon={ShieldCheck}
        on={state.scopeLock}
        onChange={(scopeLock) => onChange({ scopeLock })}
        title="지시한 것만 변경"
        desc="명령하지 않은 부분은 원본 그대로 둡니다"
      />

      <Toggle
        icon={Wand2}
        on={state.enhance}
        onChange={(enhance) => onChange({ enhance })}
        title="얼굴 보정"
        desc="피부결과 디테일 정리"
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
        fileName="face-studio-single.png"
      />
    </div>
  );
}
