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
  /** 이미지 없이는 동작하지 않는지. 편집 전용 모델이 여기 해당한다. */
  requiresImages?: boolean;
  resolve(input: ModelInput): FalRequest;
};

/** image_size 프리셋을 쓰는 모델용 (Seedream, FLUX). Original은 모델마다 값이 달라 따로 받는다. */
const IMAGE_SIZE: Record<Exclude<Ratio, 'Original'>, string> = {
  '3:4': 'portrait_4_3',
  '9:16': 'portrait_16_9',
  '16:9': 'landscape_16_9',
  '1:1': 'square_hd',
  '4:3': 'landscape_4_3',
};

function sizeFor(ratio: Ratio, autoSize: string): string {
  return ratio === 'Original' ? autoSize : IMAGE_SIZE[ratio];
}

/** aspect_ratio를 쓰는 모델용 (Nano Banana). */
const ASPECT_RATIO: Record<Ratio, string> = {
  Original: 'auto',
  '3:4': '3:4',
  '9:16': '9:16',
  '16:9': '16:9',
  '1:1': '1:1',
  '4:3': '4:3',
};

const NANO_T2I = 'fal-ai/nano-banana';
const NANO_EDIT = 'fal-ai/nano-banana/edit';
const FLUX_SCHNELL = 'fal-ai/flux/schnell';
const KONTEXT_SINGLE = 'fal-ai/flux-pro/kontext';
const KONTEXT_MULTI = 'fal-ai/flux-pro/kontext/multi';

type SeedreamSpec = {
  label: string;
  /** text-to-image 엔드포인트. v5 pro는 fal-ai/ 접두어가 없다. */
  t2i: string;
  edit: string;
  /**
   * Original 비율일 때 보낼 image_size.
   * v4는 'auto'였는데 v4.5부터 사라져서 버전마다 다르다. 틀리면 422가 난다.
   */
  autoSize: string;
  note: Record<ModelKind, string>;
};

/**
 * Seedream 계열. 이미지가 붙으면 edit 엔드포인트로 간다.
 *
 * 편집일 때는 비율을 지정하지 않고 autoSize로 보낸다.
 * 비율을 고정하면 구도를 다시 잡으면서 얼굴까지 다시 그린다.
 */
const seedream =
  (spec: SeedreamSpec) =>
  (kind: ModelKind): FalModel => ({
    key: kind === 'edit' ? spec.edit : spec.t2i,
    label: spec.label,
    note: spec.note[kind],
    kind,
    acceptsImages: true,
    resolve: ({ prompt, images, ratio }) =>
      images.length
        ? {
            id: spec.edit,
            // 편집에는 비율을 지정하지 않는다. 원본 비율을 벗어나면 구도를 다시 잡으면서
            // 얼굴까지 다시 그린다. 화면의 비율 선택은 새로 만들 때만 쓴다.
            body: {
              prompt,
              image_urls: images,
              image_size: spec.autoSize,
              num_images: 1,
            },
          }
        : {
            id: spec.t2i,
            body: { prompt, image_size: sizeFor(ratio, spec.autoSize), num_images: 1 },
          },
  });

const seedream5 = seedream({
  label: 'Seedream 5 Pro',
  t2i: 'bytedance/seedream/v5/pro/text-to-image',
  edit: 'bytedance/seedream/v5/pro/edit',
  autoSize: 'auto_2K',
  note: {
    edit: '한 부분만 바꾸고 나머지 화면은 그대로 두도록 만들어진 모델. 얼굴이 흔들린다면 이쪽을 먼저 쓴다.',
    generate: '가장 최신 Seedream. 참조 이미지를 넣으면 편집 엔드포인트로 자동 전환된다.',
  },
});

const seedream45 = seedream({
  label: 'Seedream 4.5',
  t2i: 'fal-ai/bytedance/seedream/v4.5/text-to-image',
  edit: 'fal-ai/bytedance/seedream/v4.5/edit',
  autoSize: 'auto_2K',
  note: {
    edit: '생성과 편집을 한 모델로 처리한다. 참조를 10장까지 받는다. 5 Pro가 안 맞으면 시도해본다.',
    generate: '생성과 편집을 한 모델로 처리한다. 장당 약 $0.04.',
  },
});

const nanoBanana = (kind: ModelKind): FalModel => ({
  key: kind === 'edit' ? NANO_EDIT : NANO_T2I,
  label: 'Nano Banana',
  note:
    kind === 'edit'
      ? '지시를 비교적 잘 따른다. Kontext로도 잘 안 되면 시도해볼 만하다.'
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

/**
 * 국소 편집 전용 모델.
 *
 * 전체를 다시 합성하지 않고 지시한 부분만 고치도록 만들어져서,
 * "옷만 바꿨는데 얼굴이 달라지는" 문제에 가장 먼저 시도해볼 선택지다.
 * 대신 이미지가 없으면 동작하지 않는다.
 *
 * aspect_ratio는 보내지 않는다. 비율을 지정하면 구도를 다시 잡으면서 얼굴도 다시 그린다.
 */
const kontext = (kind: ModelKind): FalModel => ({
  key: kind === 'edit' ? KONTEXT_MULTI : KONTEXT_SINGLE,
  label: 'FLUX Kontext',
  note: '지시한 부분만 고치도록 만들어진 편집 전용 모델. 얼굴이 흔들리면 먼저 이쪽으로 바꿔본다. 참조 이미지가 반드시 필요하다.',
  kind,
  acceptsImages: true,
  requiresImages: true,
  resolve: ({ prompt, images }) =>
    images.length > 1
      ? {
          id: KONTEXT_MULTI,
          body: { prompt, image_urls: images, num_images: 1, output_format: 'png' },
        }
      : {
          id: KONTEXT_SINGLE,
          body: { prompt, image_url: images[0], num_images: 1, output_format: 'png' },
        },
});

/** 텍스트로 새 이미지를 만드는 모델. 첫 항목이 기본값이다. */
export const GENERATE_MODELS: FalModel[] = [
  seedream5('generate'),
  seedream45('generate'),
  nanoBanana('generate'),
  kontext('generate'),
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
        // schnell에는 auto 계열이 없다. Original이면 기본값 landscape_4_3을 쓴다.
        image_size: sizeFor(ratio, 'landscape_4_3'),
        num_images: 1,
        output_format: 'png',
      },
    }),
  },
];

/** 사진을 받아 편집하는 모델. Single / Multi Swap이 쓴다. 첫 항목이 기본값이다. */
export const EDIT_MODELS: FalModel[] = [
  seedream5('edit'),
  seedream45('edit'),
  kontext('edit'),
  nanoBanana('edit'),
];

export function findModel(models: FalModel[], key: string): FalModel {
  return models.find((m) => m.key === key) ?? models[0];
}

export const DEFAULT_GENERATE_MODEL = GENERATE_MODELS[0].key;
export const DEFAULT_EDIT_MODEL = EDIT_MODELS[0].key;
