/**
 * 세 모드가 공유하는 실행 흐름.
 * 한국어 → 영어 변환, 프롬프트 조립, fal 호출, 오류 분류까지 여기서 끝낸다.
 * 화면 코드는 상태를 넣고 결과를 받기만 한다.
 */

import { callFal, FalError } from './fal';
import type { FalModel } from './falModels';
import { translateToEnglish } from './gemini';
import { hasHangul } from './prompt';
import type { Ratio } from '../types';

export type RunOutcome = {
  result: string | null;
  note: string | null;
  /** 실제로 모델에 보낸 확장 프롬프트. */
  sentPrompt: string;
};

const TRANSLATE_FAILED =
  '영어 변환에 실패해 한국어 원문으로 보냈습니다. 결과가 흐릿하면 영어로 직접 적어보세요.';

const NO_GEMINI_KEY =
  '한국어를 그대로 보냈습니다. Gemini 키를 넣으면 영어로 옮긴 뒤 보내서 품질이 올라갑니다. 텍스트 모델은 무료입니다.';

export async function runImageRequest({
  raw,
  images,
  ratio,
  model,
  falKey,
  geminiKey,
  build,
}: {
  /** 사용자가 입력한 원문. 한글이면 영어로 옮긴 뒤 build에 넘긴다. */
  raw: string;
  /** data URL 배열. 순서가 프롬프트에서 말하는 순서와 같아야 한다. */
  images: string[];
  ratio: Ratio;
  model: FalModel;
  falKey: string;
  /** 비어 있으면 변환을 건너뛰고 원문으로 진행한다. */
  geminiKey: string;
  build: (text: string) => string;
}): Promise<RunOutcome> {
  let text = raw;
  let warning = '';

  if (hasHangul(raw)) {
    if (!geminiKey.trim()) {
      warning = NO_GEMINI_KEY;
    } else {
      try {
        text = await translateToEnglish(raw, geminiKey);
      } catch {
        warning = TRANSLATE_FAILED;
      }
    }
  }

  const sentPrompt = build(text);

  try {
    const dataUrl = await callFal(model, { prompt: sentPrompt, images, ratio }, falKey);
    return { result: dataUrl, note: warning || null, sentPrompt };
  } catch (e) {
    return {
      result: null,
      sentPrompt,
      note: [
        warning,
        e instanceof FalError
          ? e.message
          : '알 수 없는 이유로 요청이 끝나지 않았습니다. 다시 시도해주세요.',
      ]
        .filter(Boolean)
        .join('\n\n'),
    };
  }
}
