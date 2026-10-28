import type { Ratio, Screen } from './types';

export const RATIOS: Ratio[] = ['Original', '3:4', '9:16', '16:9', '1:1', '4:3'];

/** 모드 화면 헤더에 뜨는 부제. */
export const SCREEN_TITLES: Record<Exclude<Screen, 'home'>, string> = {
  single: '얼굴 하나 바꾸기',
  multi: '여러 얼굴 바꾸기',
  gen: '이미지 만들기',
  history: '기록',
  people: '인물 보관함',
};

/** Single Swap에서 받는 참조 얼굴 장수. 같은 사람을 각도별로 넣는다. */
export const MAX_SOURCE_PHOTOS = 4;

/** Multi Swap에서 한 사람당 받는 장수. 사람 수만큼 곱해지므로 적게 둔다. */
export const MAX_SLOT_PHOTOS = 3;

/** Multi Swap에서 고를 수 있는 얼굴 수. */
export const FACE_COUNTS = [2, 3, 4] as const;

/** Image Gen 참조 이미지 최대 장수. */
/**
 * 참조 이미지 상한.
 * 얼굴 각도가 다른 장면에 인물을 넣으려면 모델이 얼굴의 입체 구조를 알아야 한다.
 * 같은 사람을 각도별로 여러 장 넣을 수 있게 넉넉히 둔다.
 */
export const MAX_REFERENCES = 6;

/**
 * 편집 지시 프리셋. 칩을 누르면 입력란을 이 문장으로 채우고, 사용자가 이어서 고친다.
 * 어떤 지시가 실제로 통하는지 빠르게 확인하는 것이 목적이다.
 */
export type EditPreset = { label: string; text: string };

export const SINGLE_PRESETS: EditPreset[] = [
  { label: '포즈 바꾸기', text: '인물의 자세만 팔짱을 끼고 정면을 보는 자세로 바꿔줘.' },
  { label: '배경 바꾸기', text: '배경만 노을 지는 해변으로 바꿔줘.' },
  { label: '옷 바꾸기', text: '입고 있는 옷만 검은색 정장으로 바꿔줘.' },
  { label: '스타일 바꾸기', text: '사진 전체를 유화 그림 스타일로 바꿔줘.' },
  { label: '표정 바꾸기', text: '표정만 자연스럽게 웃는 얼굴로 바꿔줘.' },
  {
    label: '얼굴 바꾸기',
    text: '첫 번째 사진 속 인물의 얼굴을 두 번째 사진에 있는 사람의 얼굴로 바꿔줘.',
  },
];

export const MULTI_PRESETS: EditPreset[] = [
  { label: '배경 바꾸기', text: '배경만 노을 지는 해변으로 바꿔줘.' },
  { label: '옷 바꾸기', text: '모든 인물의 옷을 흰색 셔츠로 바꿔줘.' },
  { label: '스타일 바꾸기', text: '사진 전체를 유화 그림 스타일로 바꿔줘.' },
  { label: '표정 바꾸기', text: '모든 인물의 표정을 자연스럽게 웃는 얼굴로 바꿔줘.' },
  {
    label: '얼굴 바꾸기',
    text: '첫 번째 사진 속 인물들의 얼굴을, 뒤에 올린 얼굴 사진들로 왼쪽부터 순서대로 바꿔줘.',
  },
];

/**
 * Image Gen 예시.
 *
 * 두 예시는 속을 보면 같은 작업이다 — 참조 1을 캔버스로 고정하고 참조 2의 인물을 넣는다.
 * 사용자가 들어오는 입구가 다를 뿐이라 둘 다 둔다.
 * 참조 1이 항상 바탕이라는 규칙을 지켜야 모델 쪽 파라미터와도 어긋나지 않는다.
 *
 * ANGLE 문단이 핵심이다. 바탕의 얼굴 각도가 참조 인물 사진과 다르면 모델은 픽셀을
 * 베낄 수 없고 새 각도로 다시 그려야 한다. 그때 "얼굴을 유지하라"고만 하면
 * 그럴듯한 남의 얼굴이 나온다. 각도가 바뀌어도 변하지 않는 특징을 하나씩 세어줘야
 * 같은 사람으로 알아볼 수 있게 그린다.
 *
 * 영어로 쓴다. 이미지 모델이 영어 지시를 훨씬 정확하게 따른다.
 * 사용자는 화면에서 펼쳐 보고 고칠 수 있다.
 */
export type GenPreset = {
  id: string;
  label: string;
  /** 참조 이미지를 어떤 순서로 올려야 하는지. */
  desc: string;
  text: string;
};

/** 참조 1을 그대로 두라는 지시. 두 예시가 공유한다. */
const KEEP_CANVAS = [
  'The first image is the canvas and must survive unchanged: the background, every object in it, the lighting direction and color, the camera angle, the framing and crop, the clothing and the way it folds and sits on the body, and above all the body pose — the exact position and angle of the head, neck, shoulders, arms, elbows, hands, fingers, hips, and legs.',
  'The person must occupy the same silhouette, at the same scale, in the same position in the frame.',
  'Do not re-pose, re-frame, re-light, or redraw the scene. Treat every pixel the instruction does not name as fixed.',
].join(' ');

/**
 * 각도가 다를 때 같은 사람으로 보이게 하는 문단.
 * 베끼지 말고 다시 그리되, 각도와 무관한 특징을 맞추라고 지시한다.
 */
const ANGLE = [
  'The head angle, gaze direction, and expression in the canvas are probably different from the reference photographs. Do not copy the reference pixels and do not rotate the canvas head to match the reference.',
  "Re-render the same person's face at the angle the canvas already has, and carry the identity across by matching these traits exactly, because they do not change with angle: the shape and spacing of the eyes, the eyelid fold, the iris color, the eyebrow shape and thickness, the nose bridge width and tip shape, the lip shape and thickness, the chin and jaw line, the cheekbone structure, the ear shape, the hairline, the skin tone, and any moles, freckles, scars, or facial hair.",
  'Someone who knows this person must recognise them at a glance.',
  'If several reference photographs of the same person are supplied, they show that one person from different angles — read them together to understand the three-dimensional shape of the face, and use whichever is closest to the canvas angle as the main guide.',
].join(' ');

const TAKE_FACE = [
  "From the reference photographs take only the person's face and head identity. Do not take their clothing, background, pose, framing, or lighting.",
  "Blend the face into the canvas lighting and color so there is no visible seam, but do not alter the facial features themselves to make the blend easier.",
].join(' ');

export const GEN_PRESETS: GenPreset[] = [
  {
    id: 'wear-scene',
    label: '의상·배경·포즈 입히기',
    desc: '참조 1 = 가져올 의상·배경·자세 · 참조 2~ = 얼굴을 쓸 인물 (여러 각도 가능)',
    text: [
      'Keep the first image exactly as it is, and replace only the face and identity of the person in it with the person shown in the remaining reference photographs. The clothing, background, and pose of the first image stay as they are.',
      '',
      KEEP_CANVAS,
      '',
      ANGLE,
      '',
      TAKE_FACE,
    ].join('\n'),
  },
  {
    id: 'swap-person',
    label: '인물만 교체',
    desc: '참조 1 = 그대로 둘 사진 · 참조 2~ = 넣을 인물 (여러 각도 가능)',
    text: [
      'Keep the first image exactly as it is and replace only the person in it with the person shown in the remaining reference photographs.',
      '',
      KEEP_CANVAS,
      '',
      ANGLE,
      '',
      TAKE_FACE,
    ].join('\n'),
  },
];
