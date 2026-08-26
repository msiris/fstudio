import { Image as ImageIcon, Sparkles } from 'lucide-react';
import Card from '../components/Card';
import Chip from '../components/Chip';
import ImageDrop from '../components/ImageDrop';
import ModelPicker from '../components/ModelPicker';
import PrimaryButton from '../components/PrimaryButton';
import ResultPanel from '../components/ResultPanel';
import SectionLabel from '../components/SectionLabel';
import { FOCUS_RING } from '../components/ui';
import { MAX_REFERENCES, RATIOS } from '../constants';
import { findModel, GENERATE_MODELS } from '../lib/falModels';
import type { ApiKeys } from '../lib/keyStore';
import { buildGenerationPrompt } from '../lib/prompt';
import { runImageRequest } from '../lib/run';
import type { GenState } from '../state';

export default function ImageGen({
  state,
  onChange,
  keys,
}: {
  state: GenState;
  onChange: (next: Partial<GenState>) => void;
  keys: ApiKeys;
}) {
  const model = findModel(GENERATE_MODELS, state.model);

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

    if (!keys.fal.trim()) {
      onChange({
        note: '우측 상단 키 버튼을 눌러 fal.ai 키를 먼저 넣어주세요. fal.ai/dashboard/keys 에서 발급합니다.',
      });
      return;
    }

    onChange({ busy: true, note: null, result: null, sentPrompt: null });

    const outcome = await runImageRequest({
      raw,
      images: state.refs,
      ratio: state.ratio,
      model,
      falKey: keys.fal,
      geminiKey: keys.gemini,
      // 참조를 못 받는 모델에는 "참조가 첨부됐다"고 말하지 않는다.
      build: (text) =>
        buildGenerationPrompt(
          text,
          state.ratio,
          model.acceptsImages ? state.refs.length : 0,
        ),
    });

    onChange({ ...outcome, busy: false });
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionLabel icon={Sparkles}>프롬프트</SectionLabel>
        <textarea
          value={state.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          rows={4}
          aria-label="프롬프트"
          placeholder="만들고 싶은 이미지를 적어주세요. 예: 눈 내리는 거리에 선 인물, 영화 같은 조명"
          className={`w-full resize-none rounded-card border border-line bg-cardAlt p-3 text-sm text-text placeholder:text-muted ${FOCUS_RING}`}
        />
      </Card>

      <ModelPicker
        models={GENERATE_MODELS}
        value={state.model}
        onChange={(id) => onChange({ model: id })}
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
        {state.refs.length > 0 && !model.acceptsImages && (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {model.label}은 참조 이미지를 쓰지 않습니다. 참조를 반영하려면 다른 모델을
            골라주세요.
          </p>
        )}
      </Card>

      <PrimaryButton
        disabled={!state.prompt.trim()}
        busy={state.busy}
        onClick={() => void generate()}
      >
        {state.busy ? '만드는 중' : '이미지 만들기'}
      </PrimaryButton>

      <ResultPanel
        src={state.result}
        note={state.note}
        sentPrompt={state.sentPrompt}
        fileName="face-studio-gen.png"
      />
    </div>
  );
}
