/**
 * fal.ai 모델 레지스트리.
 *
 * 모델마다 엔드포인트와 입력 스키마가 달라서, 각 항목이 자기 요청을 직접 만든다.
 * 참조 이미지가 있으면 text-to-image 대신 edit 엔드포인트로 갈아타는 것도 여기서 정한다.
 *
 * 새 모델을 붙이려면 이 파일에 항목 하나만 추가하면 된다. 호출부는 손댈 필요가 없다.
 * 엔드포인트 ID나 스키마가 바뀌면 404나 422가 나고, 앱이 그 사실을 그대로 보여준다.
 */

import type { Ratio } from '../types';

export type ModelKind = 'generate' | 'edit';

export type ModelInput = {
  /** 프롬프트 레이어가 만든 확장 프롬프트. */
  prompt: string;
  /** data URL 배열. 순서가 프롬프트에서 말하는 순서와 같다. */
  images: string[];
  ratio: Ratio;
};

/** 실제로 부를 엔드포인트와 본문. */
export type FalRequest = { id: string; body: Record<string, unknown> };

export type FalModel = {
  /** 상태에 저장하는 안정된 키. 기본 엔드포인트 ID를 그대로 쓴다. */
  key: string;
  label: string;
  /** 화면에 한 줄로 뜨는 설명. */
  note: string;
  kind: ModelKind;
  /** 참조·대상 이미지를 받을 수 있는지. false면 이미지를 무시한다. */
  acceptsImages: boolean;
  resolve(input: ModelInput): FalRequest;
};

/** image_size 프리셋을 쓰는 모델용 (Seedream, FLUX). */
const IMAGE_SIZE: Record<Ratio, string> = {
  Original: 'auto',
  '3:4': 'portrait_4_3',
  '9:16': 'portrait_16_9',
  '16:9': 'landscape_16_9',
  '1:1': 'square_hd',
  '4:3': 'landscape_4_3',
};

/** aspect_ratio를 쓰는 모델용 (Nano Banana). */
const ASPECT_RATIO: Record<Ratio, string> = {
  Original: 'auto',
  '3:4': '3:4',
  '9:16': '9:16',
  '16:9': '16:9',
  '1:1': '1:1',
  '4:3': '4:3',
};

const SEEDREAM_T2I = 'fal-ai/bytedance/seedream/v4/text-to-image';
const SEEDREAM_EDIT = 'fal-ai/bytedance/seedream/v4/edit';
const NANO_T2I = 'fal-ai/nano-banana';
const NANO_EDIT = 'fal-ai/nano-banana/edit';
const FLUX_SCHNELL = 'fal-ai/flux/schnell';

/** 이미지가 붙으면 edit 엔드포인트로 간다. Seedream은 참조를 10장까지 받는다. */
const seedream = (kind: ModelKind): FalModel => ({
  key: kind === 'edit' ? SEEDREAM_EDIT : SEEDREAM_T2I,
  label: 'Seedream 4',
  note:
    kind === 'edit'
      ? '참조 이미지를 최대 10장까지 받는다. 여러 얼굴을 한 번에 다룰 때 유리하다.'
      : '균형이 좋아 기본값으로 둔다. 참조 이미지를 넣으면 편집 엔드포인트로 자동 전환된다.',
  kind,
  acceptsImages: true,
  resolve: ({ prompt, images, ratio }) =>
    images.length
      ? {
          id: SEEDREAM_EDIT,
          body: {
            prompt,
            image_urls: images,
            image_size: kind === 'edit' ? 'auto' : IMAGE_SIZE[ratio],
            num_images: 1,
          },
        }
      : { id: SEEDREAM_T2I, body: { prompt, image_size: IMAGE_SIZE[ratio], num_images: 1 } },
});

const nanoBanana = (kind: ModelKind): FalModel => ({
  key: kind === 'edit' ? NANO_EDIT : NANO_T2I,
  label: 'Nano Banana',
  note:
    kind === 'edit'
      ? '보존 지시를 잘 지킨다. 얼굴을 유지한 채 배경이나 옷만 바꿀 때 시도해볼 만하다.'
      : 'Google Gemini 이미지 모델을 fal 경유로 부른다. 지시를 잘 따르는 편이다.',
  kind,
  acceptsImages: true,
  resolve: ({ prompt, images, ratio }) =>
    images.length
      ? {
          id: NANO_EDIT,
          body: {
            prompt,
            image_urls: images,
            aspect_ratio: 'auto',
            num_images: 1,
            output_format: 'png',
          },
        }
      : {
          id: NANO_T2I,
          body: {
            prompt,
            // 이 모델의 text-to-image에는 auto가 없다.
            aspect_ratio: ratio === 'Original' ? '1:1' : ASPECT_RATIO[ratio],
            num_images: 1,
            output_format: 'png',
          },
        },
});

/** 텍스트로 새 이미지를 만드는 모델. 첫 항목이 기본값이다. */
export const GENERATE_MODELS: FalModel[] = [
  seedream('generate'),
  nanoBanana('generate'),
  {
    key: FLUX_SCHNELL,
    label: 'FLUX schnell',
    note: '가장 빠르고 싸다. 여러 번 시험해볼 때 쓴다. 참조 이미지는 쓰지 않는다.',
    kind: 'generate',
    acceptsImages: false,
    resolve: ({ prompt, ratio }) => ({
      id: FLUX_SCHNELL,
      body: {
        prompt,
        // schnell에는 auto가 없다. Original이면 기본값 landscape_4_3을 쓴다.
        image_size: ratio === 'Original' ? 'landscape_4_3' : IMAGE_SIZE[ratio],
        num_images: 1,
        output_format: 'png',
      },
    }),
  },
];

/** 사진을 받아 편집하는 모델. Single / Multi Swap이 쓴다. 첫 항목이 기본값이다. */
export const EDIT_MODELS: FalModel[] = [seedream('edit'), nanoBanana('edit')];

export function findModel(models: FalModel[], key: string): FalModel {
  return models.find((m) => m.key === key) ?? models[0];
}

export const DEFAULT_GENERATE_MODEL = GENERATE_MODELS[0].key;
export const DEFAULT_EDIT_MODEL = EDIT_MODELS[0].key;
