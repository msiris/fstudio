/**
 * Gemini는 한글 프롬프트를 영어로 옮기는 데만 쓴다.
 * 이미지 생성·편집은 fal.ai가 담당한다 (src/lib/fal.ts).
 *
 * 텍스트 모델은 무료 티어로 처리되므로 이 호출에는 비용이 붙지 않는다.
 */

/** 자주 바뀐다. 404가 나면 이 값을 먼저 의심한다. */
export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 30_000;

type Part = { text?: string };

type GenerateContentResponse = {
  candidates?: { content?: { parts?: Part[] } }[];
  error?: { message?: string };
};

export class GeminiError extends Error {}

/**
 * 한국어 프롬프트를 영어로 옮긴다.
 * 이미지 모델은 영어에 최적화되어 있어 이 한 번의 호출이 품질 차이를 만든다.
 * 실패하면 던지고, 호출부에서 원문 그대로 진행한다.
 */
export async function translateToEnglish(raw: string, apiKey: string): Promise<string> {
  if (!apiKey.trim()) throw new GeminiError('Gemini 키가 비어 있습니다.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(
      `${ENDPOINT}/${GEMINI_TEXT_MODEL}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
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
            },
          ],
        }),
        signal: controller.signal,
      },
    );
  } catch {
    throw new GeminiError('번역 요청이 실패했습니다.');
  } finally {
    clearTimeout(timer);
  }

  const data: GenerateContentResponse = await res.json().catch(() => ({}));
  if (!res.ok) throw new GeminiError(data.error?.message || `번역 실패 (${res.status})`);

  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text)
    .filter((t): t is string => Boolean(t && t.trim()))
    .join('\n')
    .trim();

  if (!text) throw new GeminiError('번역 결과가 비어 있습니다.');
  return text;
}
