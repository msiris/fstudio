import type { ImageValue, Ratio } from './types';

/**
 * 모드별 입력 상태. 홈으로 나갔다 돌아와도 유지되도록 App에서 들고 있는다.
 * 저장소에는 쓰지 않으므로 새로고침하면 전부 사라진다.
 */

export type SingleState = {
  target: ImageValue;
  source: ImageValue;
  enhance: boolean;
  instruction: string;
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
  busy: boolean;
  result: string | null;
  note: string | null;
  sentPrompt: string | null;
};

export type GenState = {
  prompt: string;
  ratio: Ratio;
  refs: string[];
  busy: boolean;
  result: string | null;
  /** 오류·거부 안내. 실패해도 prompt와 refs는 건드리지 않는다. */
  note: string | null;
  /** 실제로 모델에 보낸 확장 프롬프트. 무엇이 통했는지 되짚는 용도. */
  sentPrompt: string | null;
};

export const initialSingle: SingleState = {
  target: null,
  source: null,
  enhance: true,
  instruction: '',
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
  busy: false,
  result: null,
  note: null,
  sentPrompt: null,
};

export const initialGen: GenState = {
  prompt: '',
  ratio: 'Original',
  refs: [],
  busy: false,
  result: null,
  note: null,
  sentPrompt: null,
};
