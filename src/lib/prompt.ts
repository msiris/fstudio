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

/**
 * 얼굴이 바뀌는 것을 막는 문단.
 *
 * 편집·합성 계열에서 가장 흔한 실패가 "옷만 바꿔달라 했는데 얼굴이 딴사람이 되는 것"이다.
 * 짧게 "얼굴을 유지하라"고만 쓰면 모델이 미화·보정을 유지의 범주로 본다.
 * 그래서 바꾸면 안 되는 부위를 하나씩 세고, 미화 금지를 따로 못 박는다.
 */
const IDENTITY_LOCK = [
  'Identity lock — this is the highest priority constraint, above style and quality:',
  'Reproduce the face of the person in the first image exactly as it is.',
  'Do not change the facial structure, proportions, eyes, eyebrows, nose, mouth, jawline, ears, skin tone, skin texture, freckles, moles, facial hair, hairstyle, or hair color.',
  'Do not beautify, slim, smooth, de-age, retouch, or restyle the face in any way.',
  'The head must read as the same photograph of the same person, unchanged.',
  'Apply the requested change only to the regions the instruction names, and leave every other region of the first image untouched.',
].join(' ');

/** 얼굴 유지를 끈 경우. 얼굴 교체 지시와 충돌하지 않도록 조건부로 쓴다. */
const IDENTITY_SOFT =
  "Unless the instruction explicitly asks to change them, keep the person's facial features, identity, skin tone, and hairstyle identical to the original, and keep the clothing, background, framing, and lighting unchanged.";

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
    ? 'The instruction above is written in Korean. Interpret it and render what it describes; do not draw the Korean text itself.'
    : '';
}

function join(lines: (string | false | null | undefined)[]): string {
  return lines.filter(Boolean).join('\n\n');
}

/** 얼굴 보정 문구. 얼굴을 잠근 상태에서는 얼굴을 건드리지 않게 범위를 좁힌다. */
function enhanceLine(locked: boolean): string {
  return locked
    ? 'Improve overall sharpness and fine detail of the image without altering the face in any way.'
    : 'Gently clean up skin texture and fine detail. Keep pores and natural texture; do not smooth the face into a plastic or airbrushed look.';
}

export type GenerationPromptOptions = {
  /** 함께 보내는 참조 이미지 장수. 0이면 참조 안내를 넣지 않는다. */
  refCount?: number;
  /**
   * 첫 번째 이미지 인물의 얼굴을 그대로 유지한다.
   * 참조 이미지가 있을 때만 의미가 있다. 이때는 새로 생성이 아니라 편집으로 취급한다.
   */
  preserveIdentity?: boolean;
};

/**
 * 새로 생성하는 프롬프트.
 *
 * 참조 이미지가 붙고 얼굴 유지가 켜져 있으면 "새로 만들라"가 아니라
 * "첫 장을 바탕으로 고치라"로 성격이 바뀐다. 실제 호출도 편집 엔드포인트로 나가므로
 * 문구와 엔드포인트를 같은 방향으로 맞춘다.
 */
export function buildGenerationPrompt(
  raw: string,
  ratio: string,
  options: GenerationPromptOptions = {},
): string {
  const { refCount = 0, preserveIdentity = false } = options;
  const hint = RATIO_HINT[ratio as Exclude<Ratio, 'Original'>];
  const locked = refCount > 0 && preserveIdentity;
  const extras = refCount - 1;

  return join([
    locked
      ? 'Edit the attached images according to the instruction below.'
      : 'Generate a new image from the following description.',

    locked && 'The first image is the base photograph. Start from it and keep it intact.',
    locked &&
      extras > 0 &&
      `The remaining ${extras} image${extras > 1 ? 's are' : ' is'} supplied only as a source to take from. Take from ${
        extras > 1 ? 'them' : 'it'
      } only what the instruction explicitly asks for — nothing else. Do not copy ${
        extras > 1 ? 'their' : 'its'
      } people, faces, body, background, framing, or lighting.`,

    `${locked ? 'Instruction' : 'Description'}: ${raw.trim()}`,
    languageNote(raw),

    !locked &&
      refCount > 0 &&
      `${refCount} reference image${refCount > 1 ? 's are' : ' is'} attached. Follow ${
        refCount > 1 ? 'their' : 'its'
      } subject, style, and color treatment, but build a new composition rather than copying the reference.`,

    locked && IDENTITY_LOCK,
    // 얼굴을 잠갔을 때 구도를 다시 잡으라고 하면 얼굴이 다시 그려진다.
    !locked && hint,
    QUALITY,
    OUTPUT_RULE,
  ]);
}

export type EditPromptOptions = {
  /** 대상 사진 뒤에 함께 보내는 참조 얼굴 장수. */
  referenceFaces?: number;
  /** 얼굴 보정 토글. */
  enhance?: boolean;
  /** 얼굴 유지 토글. 끄면 얼굴 교체 지시를 막지 않는다. */
  preserveIdentity?: boolean;
};

/**
 * 편집 지시 프롬프트.
 * 보존할 대상을 명시하지 않으면 얼굴이 다른 사람으로 바뀌어 나온다.
 * 편집 계열에서 가장 흔한 실패 원인이므로 이 문단을 빼지 않는다.
 *
 * 얼굴 교체가 목적일 때만 preserveIdentity를 꺼서 조건부 문구로 내린다.
 */
export function buildEditPrompt(raw: string, options: EditPromptOptions = {}): string {
  const { referenceFaces = 0, enhance = false, preserveIdentity = true } = options;

  return join([
    'Edit the attached photograph according to the instruction below.',
    'The first image is the photograph to edit.',

    referenceFaces === 1 &&
      (preserveIdentity
        ? 'The second image is a reference supplied by the user. Take from it only what the instruction explicitly asks for. Do not take its face, body, background, or framing.'
        : 'The second image is a reference face supplied by the user. Use it only if the instruction asks for it.'),
    referenceFaces > 1 &&
      (preserveIdentity
        ? `The following ${referenceFaces} images are references supplied by the user, given in order. Take from them only what the instruction explicitly asks for. Do not take their faces, bodies, backgrounds, or framing.`
        : `The following ${referenceFaces} images are reference faces supplied by the user, given in order. When the instruction refers to people in the photograph, map these faces to the people from left to right. Use them only if the instruction asks for it.`),

    `Instruction: ${raw.trim()}`,
    languageNote(raw),

    preserveIdentity ? IDENTITY_LOCK : IDENTITY_SOFT,
    enhance && enhanceLine(preserveIdentity),
    QUALITY,
    OUTPUT_RULE,
  ]);
}
