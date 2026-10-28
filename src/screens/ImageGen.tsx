import { Image as ImageIcon, ShieldCheck, Sparkles } from 'lucide-react';
import Card from '../components/Card';
import Chip from '../components/Chip';
import ImageDrop from '../components/ImageDrop';
import ModelPicker from '../components/ModelPicker';
import PersonChips from '../components/PersonChips';
import PrimaryButton from '../components/PrimaryButton';
import ResultPanel from '../components/ResultPanel';
import SectionLabel from '../components/SectionLabel';
import Toggle from '../components/Toggle';
import { FOCUS_RING } from '../components/ui';
import { GEN_PRESETS, MAX_GROUP_PHOTOS, MAX_REFERENCES, RATIOS } from '../constants';
import { findModel, GENERATE_MODELS } from '../lib/falModels';
import { buildGenerationPrompt } from '../lib/prompt';
import { runImageRequest } from '../lib/run';
import type { GenState } from '../state';

/**
 * 예시를 고르지 않았을 때의 자리 설명.
 * 예시를 고르면 그 예시가 정한 역할로 바뀐다.
 */
const DEFAULT_SLOTS = {
  a: '고칠 바탕 사진',
  b: '가져올 사진 (선택)',
};

const SLOT_HINT = {
  a: '참조 1번이 항상 바탕이 됩니다. 여기 올린 사진을 고치는 식으로 동작합니다.',
  b: '여기서 무엇을 가져올지는 프롬프트가 정합니다. 필요 없으면 비워두세요.',
};

/** 예시 전문을 꺼낼 언어. 꺼낸 글이 그대로 모델에 나간다. */
const PRESET_LANGS = [
  { key: 'ko' as const, label: '한글' },
  { key: 'en' as const, label: 'English' },
];

/**
 * 참조 이미지 한 묶음.
 *
 * 묶음을 둘로 나눈 이유는 하나다. 보관함에서 인물을 꺼내면 사진이 여러 장 들어오는데,
 * 한 줄에 다 쏟으면 어느 것이 바탕이고 어느 것이 인물인지 사라진다.
 * 묶음이 역할을 들고 있으면 꺼내 넣는 자리도 분명해진다.
 */
function RefGroup({
  index,
  role,
  hint,
  photos,
  room,
  onAdd,
  onRemove,
}: {
  index: 1 | 2;
  role: string;
  hint: string;
  photos: string[];
  room: number;
  onAdd: (photos: string[]) => void;
  onRemove: (at: number) => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <SectionLabel icon={ImageIcon}>
          참조 {index} — {role}
        </SectionLabel>
        <span className="shrink-0 text-xs text-muted">
          {photos.length}/{MAX_GROUP_PHOTOS}
        </span>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-muted">{hint}</p>

      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo, i) => (
          <ImageDrop
            key={i}
            value={photo}
            onChange={() => onRemove(i)}
            label={`참조 ${index} 사진 ${i + 1}`}
            size="sm"
            removeLabel={`참조 ${index} 사진 ${i + 1} 제거`}
          />
        ))}
        {room > 0 && (
          <ImageDrop
            value={null}
            onChange={(v) => v && onAdd([v])}
            label={`참조 ${index} 사진 추가`}
            size="sm"
          />
        )}
      </div>

      <PersonChips onPick={onAdd} limit={room} label="등록한 인물에서" />
    </Card>
  );
}

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
  const preset = GEN_PRESETS.find((p) => p.id === state.presetId) ?? null;

  // 보내는 순서가 프롬프트가 말하는 순서다. 참조 1 묶음이 먼저, 참조 2 묶음이 뒤.
  const images = [...state.refsA, ...state.refsB];
  const shared = MAX_REFERENCES - images.length;
  const roomA = Math.min(MAX_GROUP_PHOTOS - state.refsA.length, shared);
  const roomB = Math.min(MAX_GROUP_PHOTOS - state.refsB.length, shared);

  // 편집 전용 모델은 참조 이미지가 없으면 호출 자체가 성립하지 않는다.
  const needsRefs = Boolean(model.requiresImages) && images.length === 0;
  // 예시는 양쪽 묶음을 다 쓴다. 한쪽이 비면 역할 설명이 거짓말이 된다.
  const presetIncomplete = Boolean(preset) && (!state.refsA.length || !state.refsB.length);

  const addTo = (slot: 'refsA' | 'refsB', room: number) => (photos: string[]) =>
    onChange({ [slot]: [...state[slot], ...photos.slice(0, Math.max(0, room))] });

  const removeFrom = (slot: 'refsA' | 'refsB') => (at: number) =>
    onChange({ [slot]: state[slot].filter((_, i) => i !== at) });

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
      images,
      ratio: state.ratio,
      quality: state.quality,
      model,
      mode: '이미지 만들기',
      falKey: apiKey,
      onProgress: ({ status, queuePosition }) =>
        onChange({
          progress: queuePosition ? `${status} · 대기열 ${queuePosition}번째` : status,
        }),
      // 예시는 전문이 입력란에 그대로 있으므로 손대지 않고 보낸다.
      // 참조를 못 받는 모델에는 "참조가 첨부됐다"고 말하지 않는다.
      build: (text) =>
        buildGenerationPrompt(text, state.ratio, {
          refCount: model.acceptsImages ? images.length : 0,
          scopeLock: state.scopeLock,
          verbatim: state.presetId !== null,
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
          rows={preset ? 16 : 4}
          aria-label="프롬프트"
          placeholder="만들고 싶은 이미지를 적어주세요. 예: 눈 내리는 거리에 선 인물, 영화 같은 조명"
          className={`w-full resize-none rounded-card border border-line bg-cardAlt p-3 text-sm text-text placeholder:text-muted ${FOCUS_RING}`}
        />
        {preset ? (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            여기 적힌 글이 <strong className="font-semibold text-text">그대로</strong> 모델에
            나갑니다. 앱이 뒤에서 덧붙이는 문장은 없습니다. 지우고 바꾸고 마음대로
            고치세요.
          </p>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            이 입력란은 지시만 적는 자리라, 아래 설정에 따라 제약 문장이 함께 나갑니다.
            실제로 나간 전문은 결과 아래 "보낸 프롬프트 보기"에서 볼 수 있습니다.
          </p>
        )}
      </Card>

      <Card>
        <details open={state.presetId !== null}>
          <summary
            className={`cursor-pointer list-none text-sm font-semibold text-text ${FOCUS_RING}`}
          >
            예시 프롬프트
          </summary>

          <p className="mt-2 text-xs leading-relaxed text-muted">
            예시를 고르면 전문이 위 입력란에 들어가고, 그 글이 그대로 나갑니다. 아래 참조
            1·2에 무엇을 올려야 하는지도 그 예시에 맞게 바뀝니다. 어느 쪽이든 참조 1이 지킬
            쪽, 참조 2가 가져올 쪽입니다.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted">언어</span>
            {PRESET_LANGS.map(({ key, label }) => (
              <Chip
                key={key}
                active={state.presetLang === key}
                onClick={() =>
                  onChange({
                    presetLang: key,
                    // 예시를 보고 있는 중이면 같은 예시의 반대 언어 전문으로 갈아끼운다.
                    ...(preset ? { prompt: preset.text[key] } : {}),
                  })
                }
              >
                {label}
              </Chip>
            ))}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            모델은 영어를 더 정확히 따릅니다. 결과가 아쉬우면 English로 바꿔보세요. 고쳐
            쓴 내용은 언어를 바꾸면 사라집니다.
          </p>

          <div className="mt-3 space-y-3">
            {GEN_PRESETS.map((p) => (
              <div key={p.id}>
                <Chip
                  active={state.presetId === p.id}
                  onClick={() =>
                    onChange(
                      state.presetId === p.id
                        ? { presetId: null }
                        : { presetId: p.id, prompt: p.text[state.presetLang] },
                    )
                  }
                >
                  {p.label}
                </Chip>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{p.desc}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  참조 1 = {p.slotA} · 참조 2 = {p.slotB}
                </p>
              </div>
            ))}
          </div>
        </details>
      </Card>

      <ModelPicker
        models={GENERATE_MODELS}
        value={state.model}
        onChange={(id) => onChange({ model: id })}
        quality={state.quality}
        onChangeQuality={(quality) => onChange({ quality })}
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
        {images.length > 0 && model.acceptsImages && (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            참조 이미지가 있으면 편집으로 동작해서 원본 비율을 그대로 따릅니다. 비율을
            바꾸면 구도를 다시 잡으면서 얼굴까지 다시 그려지기 때문입니다.
          </p>
        )}
      </div>

      <RefGroup
        index={1}
        role={preset ? preset.slotA : DEFAULT_SLOTS.a}
        hint={preset ? '여기 올린 쪽을 지킵니다. 인물이면 여러 각도로 넣을수록 좋습니다.' : SLOT_HINT.a}
        photos={state.refsA}
        room={roomA}
        onAdd={addTo('refsA', roomA)}
        onRemove={removeFrom('refsA')}
      />

      <RefGroup
        index={2}
        role={preset ? preset.slotB : DEFAULT_SLOTS.b}
        hint={preset ? '여기서 가져옵니다. 지시가 말한 것만 가져옵니다.' : SLOT_HINT.b}
        photos={state.refsB}
        room={roomB}
        onAdd={addTo('refsB', roomB)}
        onRemove={removeFrom('refsB')}
      />

      {presetIncomplete && (
        <p className="text-xs leading-relaxed text-muted">
          이 예시는 참조 1과 참조 2를 모두 씁니다. 지금은 참조 1이 {state.refsA.length}장,
          참조 2가 {state.refsB.length}장입니다.
        </p>
      )}

      {images.length > 0 && !model.acceptsImages && (
        <p className="text-xs leading-relaxed text-muted">
          {model.label}은 참조 이미지를 쓰지 않습니다. 참조를 반영하려면 다른 모델을
          골라주세요.
        </p>
      )}

      {needsRefs && (
        <p className="text-xs leading-relaxed text-muted">
          {model.label}은 편집 전용이라 이미지가 있어야 합니다. 고칠 사진을 올리거나 다른
          모델을 골라주세요.
        </p>
      )}

      {/* 예시는 무엇을 지키고 무엇을 가져올지를 스스로 정하므로 이 토글이 끼어들 자리가 없다. */}
      {!preset && images.length > 0 && model.acceptsImages && (
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
