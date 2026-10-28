import { Image as ImageIcon, ShieldCheck, Sparkles } from 'lucide-react';
import Card from '../components/Card';
import Chip from '../components/Chip';
import ImageDrop from '../components/ImageDrop';
import ModelPicker from '../components/ModelPicker';
import PrimaryButton from '../components/PrimaryButton';
import ResultPanel from '../components/ResultPanel';
import SectionLabel from '../components/SectionLabel';
import Toggle from '../components/Toggle';
import { FOCUS_RING } from '../components/ui';
import { GEN_PRESETS, MAX_REFERENCES, RATIOS } from '../constants';
import { findModel, GENERATE_MODELS } from '../lib/falModels';
import PersonChips from '../components/PersonChips';
import { buildGenerationPrompt } from '../lib/prompt';
import { runImageRequest } from '../lib/run';
import type { GenState } from '../state';

export default function ImageGen({
  state,
  onChange,
  apiKey,
}: {
  state: GenState;
  onChange: (next: Partial<GenState>) => void;
  apiKey: string;
}) {
  const model = findModel(GENERATE_MODELS, state.model);
  /** 등록해둔 인물의 사진을 참조 뒤에 붙인다. 바탕은 참조 1이므로 순서를 건드리지 않는다. */
  const addPerson = (photos: string[]) =>
    onChange({ refs: [...state.refs, ...photos].slice(0, MAX_REFERENCES) });
  // 편집 전용 모델은 참조 이미지가 없으면 호출 자체가 성립하지 않는다.
  const needsRefs = Boolean(model.requiresImages) && state.refs.length === 0;

  const addRef = (value: string | null) => {
    if (!value) return;
    onChange({ refs: [...state.refs, value].slice(0, MAX_REFERENCES) });
  };

  const removeRef = (index: number) => {
    onChange({ refs: state.refs.filter((_, i) => i !== index) });
  };

  const generate = async () => {
    const raw = state.prompt.trim();
    if (!raw || state.busy) return;

    if (!apiKey.trim()) {
      onChange({
        note: '홈 화면 우측 상단 열쇠 버튼에서 fal 키를 먼저 넣어주세요. fal.ai/dashboard/keys 에서 ADMIN 스코프로 발급합니다.',
      });
      return;
    }

    onChange({ busy: true, progress: null, note: null, result: null, sentPrompt: null });

    const outcome = await runImageRequest({
      raw,
      images: state.refs,
      ratio: state.ratio,
      quality: state.quality,
      relaxSafety: state.relaxSafety,
      model,
      mode: '이미지 만들기',
      falKey: apiKey,
      onProgress: ({ status, queuePosition }) =>
        onChange({
          progress: queuePosition ? `${status} · 대기열 ${queuePosition}번째` : status,
        }),
      // 참조를 못 받는 모델에는 "참조가 첨부됐다"고 말하지 않는다.
      build: (text) =>
        buildGenerationPrompt(text, state.ratio, {
          refCount: model.acceptsImages ? state.refs.length : 0,
          scopeLock: state.scopeLock,
          selfContained: state.presetId !== null,
        }),
    });

    onChange({ ...outcome, busy: false, progress: null });
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionLabel icon={Sparkles}>프롬프트</SectionLabel>
        <textarea
          value={state.prompt}
          onChange={(e) =>
            onChange({
              prompt: e.target.value,
              // 비우면 예시에서 벗어난 것으로 본다. 그 뒤로는 일반 프롬프트로 조립한다.
              ...(e.target.value.trim() ? {} : { presetId: null }),
            })
          }
          rows={state.presetId ? 10 : 4}
          aria-label="프롬프트"
          placeholder="만들고 싶은 이미지를 적어주세요. 예: 눈 내리는 거리에 선 인물, 영화 같은 조명"
          className={`w-full resize-none rounded-card border border-line bg-cardAlt p-3 text-sm text-text placeholder:text-muted ${FOCUS_RING}`}
        />
      </Card>

      <Card>
        <details open={state.presetId !== null}>
          <summary
            className={`cursor-pointer list-none text-sm font-semibold text-text ${FOCUS_RING}`}
          >
            예시 프롬프트
          </summary>

          <p className="mt-2 text-xs leading-relaxed text-muted">
            참조 이미지 2장을 올리고 고르세요. 한쪽을 그대로 고정하고 다른 쪽에서 얼굴만
            가져오도록 지시가 짜여 있습니다. 누르면 위 입력란에 들어가고, 거기서 고쳐 쓸 수
            있습니다.
          </p>

          <div className="mt-3 space-y-3">
            {GEN_PRESETS.map((preset) => (
              <div key={preset.id}>
                <Chip
                  active={state.presetId === preset.id}
                  onClick={() =>
                    onChange(
                      state.presetId === preset.id
                        ? { presetId: null }
                        : { presetId: preset.id, prompt: preset.text },
                    )
                  }
                >
                  {preset.label}
                </Chip>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{preset.desc}</p>
              </div>
            ))}
          </div>

          {state.presetId && state.refs.length !== 2 && (
            <p className="mt-3 text-xs leading-relaxed text-muted">
              이 예시는 참조 이미지 2장을 전제로 합니다. 지금은 {state.refs.length}장입니다.
            </p>
          )}
        </details>
      </Card>

      <ModelPicker
        models={GENERATE_MODELS}
        value={state.model}
        onChange={(id) => onChange({ model: id })}
        quality={state.quality}
        onChangeQuality={(quality) => onChange({ quality })}
        relaxSafety={state.relaxSafety}
        onChangeRelaxSafety={(relaxSafety) => onChange({ relaxSafety })}
      />

      <div>
        <div className="mb-2 text-sm font-semibold text-text">비율</div>
        <div className="flex flex-wrap gap-2">
          {RATIOS.map((r) => (
            <Chip key={r} active={state.ratio === r} onClick={() => onChange({ ratio: r })}>
              {r}
            </Chip>
          ))}
        </div>
        {state.refs.length > 0 && model.acceptsImages && (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            참조 이미지가 있으면 편집으로 동작해서 원본 비율을 그대로 따릅니다. 비율을
            바꾸면 구도를 다시 잡으면서 얼굴까지 다시 그려지기 때문입니다.
          </p>
        )}
      </div>

      <Card>
        <div className="flex items-start justify-between">
          <SectionLabel icon={ImageIcon}>참조 이미지</SectionLabel>
          <span className="text-xs text-muted">
            {state.refs.length}/{MAX_REFERENCES}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {state.refs.map((r, i) => (
            <ImageDrop
              key={i}
              value={r}
              onChange={() => removeRef(i)}
              label={`참조 ${i + 1}`}
              size="sm"
              removeLabel={`참조 ${i + 1} 제거`}
            />
          ))}
          {state.refs.length < MAX_REFERENCES && (
            <ImageDrop value={null} onChange={addRef} label="참조 이미지 추가" size="sm" />
          )}
        </div>
        <PersonChips onPick={addPerson} limit={MAX_REFERENCES - state.refs.length} />

        {state.refs.length > 0 && !model.acceptsImages && (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {model.label}은 참조 이미지를 쓰지 않습니다. 참조를 반영하려면 다른 모델을
            골라주세요.
          </p>
        )}
        {needsRefs && (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {model.label}은 편집 전용이라 이미지가 있어야 합니다. 고칠 사진을 올리거나 다른
            모델을 골라주세요.
          </p>
        )}
      </Card>

      {state.refs.length > 0 && model.acceptsImages && (
        <Toggle
          icon={ShieldCheck}
          on={state.scopeLock}
          onChange={(scopeLock) => onChange({ scopeLock })}
          title="지시한 것만 변경"
          desc="명령하지 않은 부분은 원본 그대로 둡니다"
        />
      )}

      <PrimaryButton
        disabled={!state.prompt.trim() || needsRefs}
        busy={state.busy}
        onClick={() => void generate()}
      >
        {state.busy ? '만드는 중' : '이미지 만들기'}
      </PrimaryButton>

      <ResultPanel
        src={state.result}
        note={state.note}
        sentPrompt={state.sentPrompt}
        busy={state.busy}
        progress={state.progress}
        fileName="face-studio-gen.png"
      />
    </div>
  );
}
