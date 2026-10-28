/**
 * 프롬프트 레이어. UI 코드와 섞지 않는다.
 * 결과 품질의 대부분이 여기서 결정되므로 문구를 손댈 때는 이 파일만 본다.
 */

import type { Ratio } from '../types';

/** 화질 수식어 기본 세트 — 조명·초점·디테일. 새로 만들 때만 쓴다. */
const QUALITY =
  'Photographic quality, natural balanced lighting, sharp focus on the subject, fine surface detail, realistic color, clean edges, no visible compression artifacts.';

/**
 * 범위를 잠근 편집에 쓰는 화질 문구.
 * 일반 화질 수식어는 "자연스러운 조명"처럼 재조명을 유도해서 잠금과 싸운다.
 * 여기서는 원본에 맞추라고만 한다.
 */
const QUALITY_MATCH =
  "Match the original photograph's grain, sharpness, color response, and lighting. The edited regions must blend in seamlessly, with clean edges and no visible compositing seams or compression artifacts.";

/** 출력에 군더더기가 붙지 않게 막는다. */
const OUTPUT_RULE =
  'Return the image only. Do not add text, captions, watermarks, borders, or collage panels.';

/**
 * 지시하지 않은 것을 건드리지 못하게 막는 문단.
 *
 * 편집 계열에서 가장 흔한 실패가 "옷만 바꿔달라 했는데 얼굴·배경·구도까지 달라지는 것"이다.
 * 모델은 기본적으로 이미지를 다시 그리려 들기 때문에, 작업의 성격을 국소 편집으로 못박고
 * 유지해야 할 항목을 하나씩 세어준다. 뭉뚱그리면 모델이 알아서 해석한다.
 *
 * 무엇을 바꿀지는 지시가 정한다. 이 문단은 "지시가 말하지 않은 것"만 잠근다.
 * 그래서 어떤 지시와도 충돌하지 않는다.
 */
const SCOPE_LOCK = [
  'Scope lock — this is the highest priority constraint, above style, composition, and quality:',
  'Treat this as a local edit of the first image, not a regeneration.',
  'Change only what the instruction explicitly names. The instruction may name several things; change all of them, and nothing beyond them.',
  'Everything the instruction does not name must come through unchanged. When not named, that includes the face and identity of every person, hair, body shape and proportions, pose and hand positions, garments, accessories, the background, the lighting direction and color, the camera angle, the framing and crop, and the overall color grade.',
  'Do not re-render, re-pose, re-light, re-frame, restyle, or beautify anything that was not asked for.',
  'If you are unsure whether something was asked for, leave it exactly as it is.',
].join(' ');

/**
 * 얼굴은 가장 잘 망가지고 가장 먼저 눈에 띄는 부위라 따로 못박는다.
 * "얼굴을 바꿔달라"는 지시는 예외로 두어, 얼굴 교체 작업과 충돌하지 않게 한다.
 */
const FACE_LOCK = [
  'Face lock: the face is the most fragile region and the one most often altered by mistake.',
  'Unless the instruction explicitly asks to change or replace the face itself, reproduce it exactly as in the first image — facial structure, proportions, eyes, eyebrows, nose, mouth, jawline, ears, skin tone, skin texture, freckles, moles, facial hair, hairstyle, and hair color.',
  'Do not beautify, slim, smooth, de-age, or retouch the face.',
].join(' ');

/**
 * 참조 인물의 얼굴 각도가 사진과 다를 때.
 *
 * 각도가 어긋나면 모델은 픽셀을 베낄 수 없고 새 각도로 다시 그려야 한다.
 * 그때 "얼굴을 유지하라"고만 하면 그럴듯한 남의 얼굴이 나온다.
 * 각도가 바뀌어도 변하지 않는 특징을 하나씩 세어줘야 같은 사람으로 알아본다.
 */
const FACE_ANGLE = [
  'The head angle, gaze direction, and expression in the photograph are probably different from the reference photographs. Do not copy the reference pixels and do not rotate the head in the photograph to match the reference.',
  "Re-render the reference person's face at the angle the photograph already has, and carry the identity across by matching these traits exactly, because they do not change with angle: the shape and spacing of the eyes, the eyelid fold, the iris color, the eyebrow shape and thickness, the nose bridge width and tip shape, the lip shape and thickness, the chin and jaw line, the cheekbone structure, the ear shape, the hairline, the skin tone, and any moles, freckles, scars, or facial hair.",
  'Someone who knows this person must recognise them at a glance.',
].join(' ');

/** 범위 잠금을 끈 경우. 모델이 전체를 다시 해석해도 되게 둔다. */
const LOOSE_GUIDANCE =
  "Unless the instruction explicitly asks to change them, keep the person's facial features, identity, skin tone, and hairstyle identical to the original.";

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

/** 얼굴 보정 문구. 범위를 잠근 상태에서는 얼굴을 건드리지 않게 좁힌다. */
function enhanceLine(locked: boolean): string {
  return locked
    ? 'Improve overall sharpness and fine detail without altering the face, the pose, or anything the instruction did not name.'
    : 'Gently clean up skin texture and fine detail. Keep pores and natural texture; do not smooth the face into a plastic or airbrushed look.';
}

export type GenerationPromptOptions = {
  /** 함께 보내는 참조 이미지 장수. 0이면 참조 안내를 넣지 않는다. */
  refCount?: number;
  /**
   * 지시가 말한 것만 바꾼다.
   * 참조 이미지가 있을 때만 의미가 있다. 이때는 새로 생성이 아니라 편집으로 취급한다.
   */
  scopeLock?: boolean;
  /**
   * 지시문이 역할과 제약을 스스로 담고 있는 경우.
   * 예시 프롬프트가 "2번을 캔버스로 삼으라"처럼 일반 문구와 다른 역할을 지정하기 때문에,
   * 일반 역할 문장과 잠금 문단을 빼고 지시문을 그대로 살린다.
   */
  selfContained?: boolean;
};

/**
 * 새로 생성하는 프롬프트.
 *
 * 참조 이미지가 붙고 범위 잠금이 켜져 있으면 "새로 만들라"가 아니라
 * "첫 장을 바탕으로 고치라"로 성격이 바뀐다. 실제 호출도 편집 엔드포인트로 나가므로
 * 문구와 엔드포인트를 같은 방향으로 맞춘다.
 */
export function buildGenerationPrompt(
  raw: string,
  ratio: string,
  options: GenerationPromptOptions = {},
): string {
  const { refCount = 0, scopeLock = false, selfContained = false } = options;
  const hint = RATIO_HINT[ratio as Exclude<Ratio, 'Original'>];
  const locked = refCount > 0 && scopeLock;
  const extras = refCount - 1;

  if (selfContained) {
    // 지시문이 이미 역할과 제약을 다 담고 있다. 화질과 출력 규칙만 덧붙인다.
    return join([
      'Edit the attached images according to the instruction below.',
      `Instruction: ${raw.trim()}`,
      languageNote(raw),
      QUALITY_MATCH,
      OUTPUT_RULE,
    ]);
  }

  return join([
    locked
      ? 'Edit the attached images according to the instruction below.'
      : 'Generate a new image from the following description.',

    locked && 'The first image is the base photograph. Start from it and keep it intact.',
    locked &&
      extras > 0 &&
      // 무엇을 가져올지는 지시가 정한다. 여기서 품목을 못박으면
      // "2번 의상을 가져와" 같은 지시와 정면으로 싸운다.
      `The remaining ${extras} image${extras > 1 ? 's are' : ' is'} supplied as a source to take from. Take from ${
        extras > 1 ? 'them' : 'it'
      } exactly what the instruction names, and do not import anything the instruction does not name.`,

    `${locked ? 'Instruction' : 'Description'}: ${raw.trim()}`,
    languageNote(raw),

    !locked &&
      refCount > 0 &&
      `${refCount} reference image${refCount > 1 ? 's are' : ' is'} attached. Follow ${
        refCount > 1 ? 'their' : 'its'
      } subject, style, and color treatment, but build a new composition rather than copying the reference.`,

    locked && SCOPE_LOCK,
    locked && FACE_LOCK,
    // 범위를 잠갔을 때 구도를 다시 잡으라고 하면 전체가 다시 그려진다.
    !locked && hint,
    locked ? QUALITY_MATCH : QUALITY,
    OUTPUT_RULE,
  ]);
}

/**
 * 참조 인물이 몇 명이고 각자 몇 장인지 알려준다.
 * [3] = 한 사람 3장, [2, 2] = 두 사람 각 2장.
 * 한 사람을 여러 각도로 넣을 수 있게 되면서 장수만으로는 구분이 안 된다.
 */
function referenceLine(groups: number[]): string {
  const total = groups.reduce((sum, n) => sum + n, 0);
  if (total === 0) return '';

  if (groups.length === 1) {
    return groups[0] === 1
      ? 'The second image is a reference photograph of the person whose face should be used.'
      : `The following ${groups[0]} images are reference photographs of ONE person, taken at different angles. Read them together to understand the three-dimensional shape of that person's face, and use whichever is closest to the angle in the photograph as the main guide.`;
  }

  let index = 2;
  const parts = groups.map((count, i) => {
    const first = index;
    index += count;
    const range = count === 1 ? `image ${first}` : `images ${first}-${first + count - 1}`;
    const suffix = count === 1 ? '' : ' at different angles';
    return `${range} ${count === 1 ? 'is' : 'are'} person ${i + 1}${suffix}`;
  });

  return `The reference photographs are grouped by person: ${parts.join(', ')}. Map person 1 to the leftmost face in the photograph, person 2 to the next, and so on from left to right. Where a person has several photographs, read them together to understand the three-dimensional shape of that person's face.`;
}

export type EditPromptOptions = {
  /** 참조 인물별 사진 장수. */
  faceGroups?: number[];
  /** 얼굴 보정 토글. */
  enhance?: boolean;
  /** 지시가 말한 것만 바꾼다. 끄면 모델이 전체를 다시 해석해도 된다. */
  scopeLock?: boolean;
};

/**
 * 편집 지시 프롬프트.
 *
 * 무엇을 바꿀지는 지시가 정하고, 지시가 말하지 않은 것은 SCOPE_LOCK이 잠근다.
 * 그래서 "옷 바꾸고 배경은 바다로"처럼 여러 개를 시켜도 그 둘만 바뀐다.
 * 얼굴은 따로 한 번 더 못박되, 얼굴을 바꾸라는 지시는 예외로 둔다.
 */
export function buildEditPrompt(raw: string, options: EditPromptOptions = {}): string {
  const { faceGroups = [], enhance = false, scopeLock = true } = options;
  const hasReferences = faceGroups.some((n) => n > 0);

  return join([
    'Edit the attached photograph according to the instruction below.',
    'The first image is the photograph to edit.',

    hasReferences && referenceLine(faceGroups.filter((n) => n > 0)),
    hasReferences &&
      'Take from the reference photographs only what the instruction explicitly asks for. Do not take their clothing, background, pose, framing, or lighting.',

    `Instruction: ${raw.trim()}`,
    languageNote(raw),

    // 얼굴을 바꾸라는 지시일 때만 의미가 있지만, 아닐 때도 해가 없다.
    hasReferences && FACE_ANGLE,
    scopeLock && SCOPE_LOCK,
    scopeLock && FACE_LOCK,
    !scopeLock && LOOSE_GUIDANCE,
    enhance && enhanceLine(scopeLock),
    scopeLock ? QUALITY_MATCH : QUALITY,
    OUTPUT_RULE,
  ]);
}
