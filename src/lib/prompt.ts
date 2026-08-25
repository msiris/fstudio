/**
 * 프롬프트 레이어. UI 코드와 섞지 않는다.
 * 결과 품질의 대부분이 여기서 결정되므로 문구를 손댈 때는 이 파일만 본다.
 */

import type { Ratio } from '../types';

/** 화질 수식어 기본 세트 — 조명·초점·디테일. */
const QUALITY =
  'Photographic quality, natural balanced lighting, sharp focus on the subject, fine surface detail, realistic color, clean edges, no visible compression artifacts.';

/** 출력에 군더더기가 붙지 않게 막는다. */
const OUTPUT_RULE =
  'Return the image only. Do not add text, captions, watermarks, borders, or collage panels.';

/** 비율별 구도 힌트. Original은 힌트를 넣지 않는다. */
const RATIO_HINT: Record<Exclude<Ratio, 'Original'>, string> = {
  '3:4': 'Compose for a 3:4 vertical frame, portrait orientation with the subject centered and headroom above.',
  '9:16':
    'Compose for a 9:16 tall vertical frame, mobile-screen orientation with a full-height subject.',
  '16:9':
    'Compose for a 16:9 wide cinematic frame, landscape orientation with lateral space around the subject.',
  '1:1': 'Compose for a 1:1 square frame, subject centered with even margins.',
  '4:3': 'Compose for a 4:3 frame, classic landscape orientation.',
};

/** 한글이 섞여 있으면 모델에게 해석을 지시한다. */
export function hasHangul(text: string): boolean {
  return /[ㄱ-ㆎ가-힣]/.test(text);
}

function languageNote(raw: string): string {
  return hasHangul(raw)
    ? 'The description above is written in Korean. Interpret it and render the scene it describes; do not draw the Korean text itself.'
    : '';
}

function join(lines: (string | false | null | undefined)[]): string {
  return lines.filter(Boolean).join('\n\n');
}

/**
 * 새로 생성하는 프롬프트.
 * @param refCount 함께 보내는 참조 이미지 장수. 0이면 참조 안내를 넣지 않는다.
 */
export function buildGenerationPrompt(raw: string, ratio: string, refCount = 0): string {
  const hint = RATIO_HINT[ratio as Exclude<Ratio, 'Original'>];

  return join([
    'Generate a new image from the following description.',
    `Description: ${raw.trim()}`,
    languageNote(raw),
    refCount > 0 &&
      `${refCount} reference image${refCount > 1 ? 's are' : ' is'} attached. Follow ${
        refCount > 1 ? 'their' : 'its'
      } subject, style, and color treatment, but build a new composition rather than copying the reference.`,
    hint,
    QUALITY,
    OUTPUT_RULE,
  ]);
}

export type EditPromptOptions = {
  /** 대상 사진 뒤에 함께 보내는 참조 얼굴 장수. */
  referenceFaces?: number;
  /** 얼굴 보정 토글. */
  enhance?: boolean;
};

/**
 * 편집 지시 프롬프트.
 * 보존할 대상을 명시하지 않으면 얼굴이 다른 사람으로 바뀌어 나온다.
 * 편집 계열에서 가장 흔한 실패 원인이므로 이 문단을 빼지 않는다.
 *
 * 다만 "얼굴을 바꿔달라"는 지시와 충돌하지 않도록,
 * 지시가 명시적으로 요구하는 변경은 보존 대상에서 제외한다.
 */
export function buildEditPrompt(raw: string, options: EditPromptOptions = {}): string {
  const { referenceFaces = 0, enhance = false } = options;

  return join([
    'Edit the attached photograph according to the instruction below.',
    'The first image is the photograph to edit.',
    referenceFaces === 1 &&
      'The second image is a reference face supplied by the user. Use it only if the instruction asks for it.',
    referenceFaces > 1 &&
      `The following ${referenceFaces} images are reference faces supplied by the user, given in order. When the instruction refers to people in the photograph, map these faces to the people from left to right. Use them only if the instruction asks for it.`,
    `Instruction: ${raw.trim()}`,
    languageNote(raw),
    "Unless the instruction explicitly asks to change them, keep the person's facial features, identity, skin tone, and hairstyle identical to the original, and keep the clothing, background, framing, and lighting unchanged.",
    enhance &&
      'Gently clean up skin texture and fine detail. Keep pores and natural texture; do not smooth the face into a plastic or airbrushed look.',
    QUALITY,
    OUTPUT_RULE,
  ]);
}
