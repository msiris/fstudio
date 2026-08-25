/**
 * 세 모드가 공유하는 실행 흐름.
 * 한국어 → 영어 변환, 프롬프트 조립, 호출, 거부·오류 분류까지 여기서 끝낸다.
 * 화면 코드는 상태를 넣고 결과를 받기만 한다.
 */

import { callGemini, GeminiError, translateToEnglish } from './gemini';
import { hasHangul } from './prompt';

export type RunOutcome = {
  result: string | null;
  note: string | null;
  /** 실제로 모델에 보낸 확장 프롬프트. */
  sentPrompt: string;
};

const TRANSLATE_FAILED =
  '영어 변환에 실패해 한국어 원문으로 보냈습니다. 결과가 흐릿하면 영어로 직접 적어보세요.';

export async function runImageRequest({
  raw,
  images,
  apiKey,
  build,
}: {
  /** 사용자가 입력한 원문. 한글이면 영어로 옮긴 뒤 build에 넘긴다. */
  raw: string;
  /** data URL 배열. 순서가 프롬프트에서 말하는 순서와 같아야 한다. */
  images: string[];
  apiKey: string;
  build: (text: string) => string;
}): Promise<RunOutcome> {
  let text = raw;
  let warning = '';

  if (hasHangul(raw)) {
    try {
      text = await translateToEnglish(raw, apiKey);
    } catch {
      warning = TRANSLATE_FAILED;
    }
  }

  const sentPrompt = build(text);

  try {
    const response = await callGemini(sentPrompt, images, apiKey);

    if (response.kind === 'image') {
      return { result: response.dataUrl, note: warning || null, sentPrompt };
    }

    // 거부는 실패가 아니라 예상된 분기다. 모델이 보낸 텍스트를 그대로 보여준다.
    return {
      result: null,
      sentPrompt,
      note: [
        warning,
        `이 요청은 모델이 처리하지 않았습니다. (${response.reason})`,
        response.modelText
          ? `모델이 보낸 내용:\n${response.modelText}`
          : '모델이 남긴 설명은 없습니다.',
        '지시를 바꿔 다시 시도해보세요. 같은 요청을 자동으로 재시도하지는 않습니다.',
      ]
        .filter(Boolean)
        .join('\n\n'),
    };
  } catch (e) {
    return {
      result: null,
      sentPrompt,
      note: [
        warning,
        e instanceof GeminiError
          ? e.message
          : '알 수 없는 이유로 요청이 끝나지 않았습니다. 다시 시도해주세요.',
      ]
        .filter(Boolean)
        .join('\n\n'),
    };
  }
}
