import type { Ratio, Screen } from './types';

export const RATIOS: Ratio[] = ['Original', '3:4', '9:16', '16:9', '1:1', '4:3'];

/** 모드 화면 헤더에 뜨는 부제. */
export const SCREEN_TITLES: Record<Exclude<Screen, 'home'>, string> = {
  single: '얼굴 하나 바꾸기',
  multi: '여러 얼굴 바꾸기',
  gen: '이미지 만들기',
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
