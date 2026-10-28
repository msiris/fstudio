/**
 * 세 모드가 공유하는 실행 흐름.
 * 프롬프트 조립, 큐 제출, 결과 수거, 기록 저장, 오류 분류까지 여기서 끝낸다.
 * 화면 코드는 상태를 넣고 결과를 받기만 한다.
 */

import { collectFal, FalError, submitFal, type FalProgress } from './fal';
import type { FalModel } from './falModels';
import { addHistory, addPending, removePending } from './history';
import type { Quality, Ratio } from '../types';

export type RunOutcome = {
  result: string | null;
  note: string | null;
  /** 실제로 모델에 보낸 확장 프롬프트. */
  sentPrompt: string;
};

/** 제출은 됐는데 수거에 실패한 경우. 돈은 이미 나갔으니 회수 경로를 알려준다. */
const RECOVERABLE =
  '\n\n제출은 끝난 요청이라 fal에서 그리고 있을 수 있습니다. 기록 화면의 "진행 중"에서 다시 가져와 보세요.';

export async function runImageRequest({
  raw,
  images,
  ratio,
  quality,
  relaxSafety,
  model,
  mode,
  falKey,
  build,
  onProgress,
}: {
  /** 사용자가 입력한 원문. 한글이면 프롬프트 레이어가 그 사실을 모델에 알린다. */
  raw: string;
  /** data URL 배열. 순서가 프롬프트에서 말하는 순서와 같아야 한다. */
  images: string[];
  ratio: Ratio;
  quality: Quality;
  /** 모델이 허용하는 범위에서 안전 필터를 낮춘다. */
  relaxSafety: boolean;
  model: FalModel;
  /** 어느 화면에서 만들었는지. 기록에 남긴다. */
  mode: string;
  falKey: string;
  build: (text: string) => string;
  onProgress?: (progress: FalProgress) => void;
}): Promise<RunOutcome> {
  const sentPrompt = build(raw);

  // 1단계 — 제출. 여기부터 요금이 걸린다.
  let submission;
  try {
    submission = await submitFal(model, { prompt: sentPrompt, images, ratio, quality, relaxSafety }, falKey);
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

  // 2단계 — 제출 기록을 먼저 남긴다.
  // 지금 앱이 꺼지거나 연결이 끊겨도 이 기록으로 결과를 되찾을 수 있다.
  await addPending({
    ...submission,
    createdAt: Date.now(),
    mode,
    modelLabel: model.label,
    instruction: raw,
    sentPrompt,
  });

  // 3단계 — 완료될 때까지 짧은 요청으로 확인하고 결과를 가져온다.
  try {
    const { dataUrl, warning } = await collectFal(submission, falKey, onProgress);

    await addHistory({
      mode,
      modelLabel: model.label,
      instruction: raw,
      sentPrompt,
      image: dataUrl,
    });
    await removePending(submission.requestId);

    return { result: dataUrl, note: warning, sentPrompt };
  } catch (e) {
    return {
      result: null,
      sentPrompt,
      note:
        (e instanceof FalError
          ? e.message
          : '알 수 없는 이유로 요청이 끝나지 않았습니다.') + RECOVERABLE,
    };
  }
}
