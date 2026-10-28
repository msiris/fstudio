import type { Ratio, Screen } from './types';

export const RATIOS: Ratio[] = ['Original', '3:4', '9:16', '16:9', '1:1', '4:3'];

/** 모드 화면 헤더에 뜨는 부제. */
export const SCREEN_TITLES: Record<Exclude<Screen, 'home'>, string> = {
  single: '얼굴 하나 바꾸기',
  multi: '여러 얼굴 바꾸기',
  gen: '이미지 만들기',
  history: '기록',
};

/** Multi Swap에서 고를 수 있는 얼굴 수. */
export const FACE_COUNTS = [2, 3, 4] as const;

/** Image Gen 참조 이미지 최대 장수. */
export const MAX_REFERENCES = 3;

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
 * 두 케이스는 사실 같은 작업이다 — 한쪽 이미지를 캔버스로 고정하고
 * 다른 쪽에서 얼굴만 가져온다. 어느 쪽을 고정할지가 다를 뿐이다.
 * 그 역할을 문장으로 못박아야 모델이 자세와 배경을 덜 흔든다.
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

export const GEN_PRESETS: GenPreset[] = [
  {
    id: 'wear-scene',
    label: '의상·배경·포즈 입히기',
    desc: '참조 1 = 얼굴을 쓸 인물 · 참조 2 = 가져올 의상·배경·자세',
    text: [
      "Recreate the second image exactly, replacing only the person's face and identity with the person from the first image.",
      '',
      'The second image is the canvas. Reproduce it pixel for pixel: the background, every object in it, the lighting direction and color, the camera angle, the framing and crop, the clothing and the way it folds and falls, and above all the body pose — the exact position and angle of the head, neck, shoulders, arms, elbows, hands, fingers, hips, and legs. Do not re-pose, re-frame, re-light, or redraw the scene. If the hands are in a specific position, keep them in that exact position.',
      '',
      "From the first image take only the face and head identity: facial structure, proportions, eyes, eyebrows, nose, mouth, jawline, ears, skin tone, skin texture, and hairstyle. Do not take the first image's clothing, background, pose, framing, or lighting.",
      '',
      "Blend the face into the second image's lighting and color so there is no visible seam, but do not alter the facial features themselves.",
    ].join('\n'),
  },
  {
    id: 'swap-person',
    label: '인물만 교체',
    desc: '참조 1 = 그대로 둘 사진 · 참조 2 = 넣을 인물',
    text: [
      'Keep the first image exactly as it is and replace only the person in it with the person from the second image.',
      '',
      'The first image is the canvas and must survive unchanged: the background, every object in it, the lighting direction and color, the camera angle, the framing and crop, the clothing and the way it sits on the body, and above all the body pose — the exact position and angle of the head, neck, shoulders, arms, elbows, hands, fingers, hips, and legs. The new person must occupy the same silhouette, at the same scale, in the same position in the frame. Do not re-pose, re-frame, re-light, or redraw the scene.',
      '',
      "From the second image take only the person's face and head identity: facial structure, proportions, eyes, eyebrows, nose, mouth, jawline, ears, skin tone, skin texture, and hairstyle. Do not take the second image's clothing, background, pose, framing, or lighting.",
      '',
      "Treat every pixel the instruction does not name as fixed. Blend the new face into the first image's lighting and color so there is no visible seam, but do not alter the facial features themselves.",
    ].join('\n'),
  },
];
