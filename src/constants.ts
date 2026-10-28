import type { PresetKind } from './lib/prompt';
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

/**
 * 참조 이미지 상한.
 * 얼굴 각도가 다른 장면에 인물을 넣으려면 모델이 얼굴의 입체 구조를 알아야 한다.
 * 같은 사람을 각도별로 여러 장 넣을 수 있게 넉넉히 둔다.
 */
export const MAX_REFERENCES = 6;

/**
 * 참조 묶음 하나에 들어갈 수 있는 장수.
 * 한쪽 묶음이 상한을 다 먹어버리면 반대쪽에 아무것도 못 넣는다.
 */
export const MAX_GROUP_PHOTOS = 4;

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
 * 두 예시는 방향이 반대다.
 * - 의상·배경·포즈 입히기: 참조 1의 "사람"을 지키고 참조 2에서 옷·배경·자세를 가져온다
 * - 인물만 교체: 참조 1의 "장면"을 지키고 참조 2에서 사람을 가져온다
 *
 * 공통 규칙은 하나다. 참조 1이 지킬 쪽, 참조 2가 가져올 쪽.
 * 이 규칙이 흔들리면 두 예시가 구분이 안 되고, 어디에 뭘 올려야 할지도 알 수 없다.
 *
 * text는 사용자가 읽고 고치는 지시문이라 한글로 짧게 쓴다.
 * 모델에 먹히는 영어 제약 문단은 prompt.ts가 종류에 맞춰 붙인다.
 */
export type GenPreset = {
  id: PresetKind;
  label: string;
  /** 무엇을 하는 예시인지 한 줄 설명. */
  desc: string;
  /** 참조 묶음 1·2에 각각 무엇을 올려야 하는지. 화면의 올리는 자리에 그대로 쓴다. */
  slotA: string;
  slotB: string;
  text: string;
};

export const GEN_PRESETS: GenPreset[] = [
  {
    id: 'wear-scene',
    label: '의상·배경·포즈 입히기',
    desc: '내 인물은 그대로 두고, 다른 사진의 옷·배경·자세를 가져다 입힙니다.',
    slotA: '얼굴을 지킬 인물',
    slotB: '가져올 의상·배경·자세',
    text: '참조 1의 인물은 그대로 두고, 참조 2의 의상과 배경과 자세를 그 인물에게 그대로 입혀줘.',
  },
  {
    id: 'swap-person',
    label: '인물만 교체',
    desc: '사진은 그대로 두고, 그 안의 인물만 다른 사람으로 바꿉니다.',
    slotA: '그대로 둘 사진',
    slotB: '넣을 인물',
    text: '참조 1 사진은 그대로 두고, 그 안의 인물만 참조 2의 인물로 바꿔줘.',
  },
];
