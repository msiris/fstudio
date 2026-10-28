import { DEFAULT_EDIT_MODEL, DEFAULT_GENERATE_MODEL } from './lib/falModels';
import type { ImageValue, Quality, Ratio } from './types';

/**
 * 모드별 입력 상태. 홈으로 나갔다 돌아와도 유지되도록 App에서 들고 있는다.
 * 저장소에는 쓰지 않으므로 새로고침하면 전부 사라진다. API 키만 예외다.
 */

export type SingleState = {
  target: ImageValue;
  /** 넣을 얼굴. 같은 사람을 각도별로 여러 장 받는다. */
  sources: string[];
  enhance: boolean;
  /** 지시가 말한 것만 바꾸고 나머지는 원본 그대로 둔다. */
  scopeLock: boolean;
  instruction: string;
  /** 고른 fal 모델의 엔드포인트 ID. */
  model: string;
  /** 출력 해상도. 모델에 따라 요금이 2배 차이 난다. */
  quality: Quality;
  /** 모델이 허용하는 범위에서 안전 필터를 낮춘다. */
  relaxSafety: boolean;
  busy: boolean;
  /** 큐 진행 상태. 생성 중에만 채운다. */
  progress: string | null;
  result: string | null;
  note: string | null;
  sentPrompt: string | null;
};

export type MultiState = {
  target: ImageValue;
  count: number;
  /** 슬롯마다 한 사람. 각 사람을 각도별로 여러 장 받는다. */
  faces: string[][];
  scopeLock: boolean;
  instruction: string;
  model: string;
  quality: Quality;
  relaxSafety: boolean;
  busy: boolean;
  /** 큐 진행 상태. 생성 중에만 채운다. */
  progress: string | null;
  result: string | null;
  note: string | null;
  sentPrompt: string | null;
};

export type GenState = {
  prompt: string;
  /** 고른 예시. 예시가 자체 역할 설명을 담고 있어 프롬프트 조립 방식이 달라진다. */
  presetId: string | null;
  ratio: Ratio;
  refs: string[];
  /** 지시가 말한 것만 바꾼다. 참조 이미지가 있을 때만 의미가 있다. */
  scopeLock: boolean;
  model: string;
  quality: Quality;
  relaxSafety: boolean;
  busy: boolean;
  /** 큐 진행 상태. 생성 중에만 채운다. */
  progress: string | null;
  result: string | null;
  note: string | null;
  sentPrompt: string | null;
};

export const initialSingle: SingleState = {
  target: null,
  sources: [],
  enhance: true,
  scopeLock: true,
  instruction: '',
  model: DEFAULT_EDIT_MODEL,
  quality: '1K',
  relaxSafety: false,
  busy: false,
  progress: null,
  result: null,
  note: null,
  sentPrompt: null,
};

export const initialMulti: MultiState = {
  target: null,
  count: 2,
  faces: [[], [], [], []],
  scopeLock: true,
  instruction: '',
  model: DEFAULT_EDIT_MODEL,
  quality: '1K',
  relaxSafety: false,
  busy: false,
  progress: null,
  result: null,
  note: null,
  sentPrompt: null,
};

export const initialGen: GenState = {
  prompt: '',
  presetId: null,
  ratio: 'Original',
  refs: [],
  scopeLock: true,
  model: DEFAULT_GENERATE_MODEL,
  quality: '1K',
  relaxSafety: false,
  busy: false,
  progress: null,
  result: null,
  note: null,
  sentPrompt: null,
};
