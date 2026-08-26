import { DEFAULT_EDIT_MODEL, DEFAULT_GENERATE_MODEL } from './lib/falModels';
import type { ImageValue, Ratio } from './types';

/**
 * 모드별 입력 상태. 홈으로 나갔다 돌아와도 유지되도록 App에서 들고 있는다.
 * 저장소에는 쓰지 않으므로 새로고침하면 전부 사라진다. API 키만 예외다.
 */

export type SingleState = {
  target: ImageValue;
  source: ImageValue;
  enhance: boolean;
  instruction: string;
  /** 고른 fal 모델의 엔드포인트 ID. */
  model: string;
  busy: boolean;
  result: string | null;
  note: string | null;
  sentPrompt: string | null;
};

export type MultiState = {
  target: ImageValue;
  count: number;
  faces: ImageValue[];
  instruction: string;
  model: string;
  busy: boolean;
  result: string | null;
  note: string | null;
  sentPrompt: string | null;
};

export type GenState = {
  prompt: string;
  ratio: Ratio;
  refs: string[];
  model: string;
  busy: boolean;
  result: string | null;
  note: string | null;
  sentPrompt: string | null;
};

export const initialSingle: SingleState = {
  target: null,
  source: null,
  enhance: true,
  instruction: '',
  model: DEFAULT_EDIT_MODEL,
  busy: false,
  result: null,
  note: null,
  sentPrompt: null,
};

export const initialMulti: MultiState = {
  target: null,
  count: 2,
  faces: [null, null, null, null],
  instruction: '',
  model: DEFAULT_EDIT_MODEL,
  busy: false,
  result: null,
  note: null,
  sentPrompt: null,
};

export const initialGen: GenState = {
  prompt: '',
  ratio: 'Original',
  refs: [],
  model: DEFAULT_GENERATE_MODEL,
  busy: false,
  result: null,
  note: null,
  sentPrompt: null,
};
