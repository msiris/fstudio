/**
 * Gemini 호출. 세 모드가 모두 이 함수 하나를 쓴다.
 * 차이는 보내는 프롬프트와 이미지 개수뿐이다.
 */

import { splitDataUrl } from './image';

/** 자주 바뀐다. 404가 나면 이 값을 먼저 의심한다. */
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 60_000;

type Part = { text?: string; inlineData?: { mimeType: string; data: string } };

type GenerateContentResponse = {
  candidates?: { content?: { parts?: Part[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
};

/** 이미지가 나왔거나, 모델이 처리를 거부했거나. 둘 다 정상 분기다. */
export type GeminiResult =
  | { kind: 'image'; dataUrl: string }
  | { kind: 'refused'; reason: string; modelText: string };

/** 화면에 그대로 띄울 문구를 담은 오류. */
export class GeminiError extends Error {}

function httpMessage(status: number, raw: string | undefined): string {
  if (status === 429) {
    return '무료 한도를 초과했습니다. 잠시 뒤 다시 시도하거나, 한도가 초기화된 다음에 이어서 쓰세요.';
  }
  if (status === 404) {
    return `모델을 찾지 못했습니다. 모델명을 확인하세요 — 지금 설정은 "${GEMINI_IMAGE_MODEL}"입니다. src/lib/gemini.ts의 상수를 최신 모델명으로 바꾸면 됩니다.`;
  }
  if (status === 400 && raw && /API key|API_KEY/i.test(raw)) {
    return 'API 키 형식이 맞지 않습니다. 우측 상단 키 버튼에서 다시 붙여넣어 주세요.';
  }
  if (status === 401 || status === 403) {
    return 'API 키가 거부되었습니다. aistudio.google.com에서 키가 살아 있는지, Generative Language API가 켜져 있는지 확인해주세요.';
  }
  if (status >= 500) {
    return `모델 서버가 응답하지 못했습니다 (${status}). 잠시 뒤 같은 요청을 다시 보내보세요.`;
  }
  return raw || `요청이 실패했습니다 (${status}).`;
}

async function post(
  model: string,
  parts: Part[],
  apiKey: string,
): Promise<GenerateContentResponse> {
  if (!apiKey.trim()) {
    throw new GeminiError(
      'API 키가 비어 있습니다. 우측 상단 키 버튼을 눌러 Google AI Studio 키를 넣어주세요.',
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new GeminiError(
        '60초 안에 응답이 오지 않았습니다. 프롬프트를 짧게 줄이거나 참조 이미지를 빼고 다시 시도해주세요.',
      );
    }
    throw new GeminiError(
      '네트워크 요청이 실패했습니다. 연결 상태를 확인하고 다시 시도해주세요.',
    );
  } finally {
    clearTimeout(timer);
  }

  const data: GenerateContentResponse = await res.json().catch(() => ({}));
  if (!res.ok) throw new GeminiError(httpMessage(res.status, data.error?.message));
  return data;
}

/** 응답에서 텍스트 파트만 모은다. 거부 문구를 그대로 보여주는 데 쓴다. */
function collectText(parts: Part[]): string {
  return parts
    .map((p) => p.text)
    .filter((t): t is string => Boolean(t && t.trim()))
    .join('\n')
    .trim();
}

/**
 * 이미지 생성·편집 공용 호출.
 * @param images data URL 배열. 전송할 때 접두어를 떼고 순수 base64만 보낸다.
 */
export async function callGemini(
  prompt: string,
  images: string[],
  apiKey: string,
): Promise<GeminiResult> {
  const parts: Part[] = [{ text: prompt }];
  for (const dataUrl of images) {
    const { mimeType, data } = splitDataUrl(dataUrl);
    parts.push({ inlineData: { mimeType, data } });
  }

  const data = await post(GEMINI_IMAGE_MODEL, parts, apiKey);

  // 거부 판별 1 — 프롬프트 단계에서 막힌 경우
  const blockReason = data.promptFeedback?.blockReason;
  if (blockReason) {
    return { kind: 'refused', reason: blockReason, modelText: '' };
  }

  const candidate = data.candidates?.[0];
  const responseParts = candidate?.content?.parts ?? [];
  const modelText = collectText(responseParts);

  // 거부 판별 2 — 안전 정책으로 생성이 중단된 경우
  if (candidate?.finishReason === 'SAFETY') {
    return { kind: 'refused', reason: 'SAFETY', modelText };
  }

  // 인덱스가 아니라 타입으로 찾는다. 텍스트 파트가 함께 오기 때문이다.
  const image = responseParts.find((p) => p.inlineData);

  // 거부 판별 3 — 이미지 없이 텍스트만 돌아온 경우 (모델이 거절 문구를 보냈다)
  if (!image?.inlineData) {
    return {
      kind: 'refused',
      reason: candidate?.finishReason || 'NO_IMAGE',
      modelText,
    };
  }

  return {
    kind: 'image',
    dataUrl: `data:${image.inlineData.mimeType};base64,${image.inlineData.data}`,
  };
}

/**
 * 한국어 프롬프트를 영어로 옮긴다.
 * 이미지 모델은 영어에 최적화되어 있어 이 한 번의 호출이 품질 차이를 만든다.
 * 실패하면 던지고, 호출부에서 원문 그대로 진행한다.
 */
export async function translateToEnglish(raw: string, apiKey: string): Promise<string> {
  const data = await post(
    GEMINI_TEXT_MODEL,
    [
      {
        text: [
          'Translate the following image description into natural English suitable for an image generation model.',
          'Keep every concrete detail: subject, clothing, pose, setting, lighting, mood, camera framing.',
          'Do not add details that are not there. Output only the translation, with no quotes and no commentary.',
          '',
          raw.trim(),
        ].join('\n'),
      },
    ],
    apiKey,
  );

  const text = collectText(data.candidates?.[0]?.content?.parts ?? []);
  if (!text) throw new GeminiError('번역 결과가 비어 있습니다.');
  return text;
}
