/**
 * 세 모드가 공유하는 실행 흐름.
 * 프롬프트 조립, fal 호출, 오류 분류까지 여기서 끝낸다.
 * 화면 코드는 상태를 넣고 결과를 받기만 한다.
 */

import { callFal, FalError } from './fal';
import type { FalModel } from './falModels';
import type { Quality, Ratio } from '../types';

export type RunOutcome = {
  result: string | null;
  note: string | null;
  /** 실제로 모델에 보낸 확장 프롬프트. */
  sentPrompt: string;
};

export async function runImageRequest({
  raw,
  images,
  ratio,
  quality,
  model,
  falKey,
  build,
}: {
  /** 사용자가 입력한 원문. 한글이면 프롬프트 레이어가 그 사실을 모델에 알린다. */
  raw: string;
  /** data URL 배열. 순서가 프롬프트에서 말하는 순서와 같아야 한다. */
  images: string[];
  ratio: Ratio;
  quality: Quality;
  model: FalModel;
  falKey: string;
  build: (text: string) => string;
}): Promise<RunOutcome> {
  const sentPrompt = build(raw);

  try {
    const dataUrl = await callFal(model, { prompt: sentPrompt, images, ratio, quality }, falKey);
    return { result: dataUrl, note: null, sentPrompt };
  } catch (e) {
    return {
      result: null,
      sentPrompt,
      note:
        e instanceof FalError
          ? e.message
          : '알 수 없는 이유로 요청이 끝나지 않았습니다. 다시 시도해주세요.',
    };
  }
}
