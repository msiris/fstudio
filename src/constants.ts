import type { PresetKind, PresetLang } from './lib/prompt';
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
 * text는 전문이다. 입력란에 들어간 글이 그대로 모델에 나간다.
 * 앱이 뒤에서 덧붙이는 문장은 하나도 없다. 보이는 것과 보내는 것이 다르면 고칠 수가 없다.
 * 그래서 예시는 프롬프트 레이어(prompt.ts)를 타지 않는다.
 *
 * ko / en 두 벌을 둔다. 읽고 고치기는 한글이 편하고, 모델은 영어를 더 정확히 따른다.
 * 어느 쪽을 고르든 고른 그 글이 그대로 나간다.
 */
export type GenPreset = {
  id: PresetKind;
  label: string;
  /** 무엇을 하는 예시인지 한 줄 설명. */
  desc: string;
  /** 참조 묶음 1·2에 각각 무엇을 올려야 하는지. 화면의 올리는 자리에 그대로 쓴다. */
  slotA: string;
  slotB: string;
  /** 모델에 그대로 나가는 전문. */
  text: Record<PresetLang, string>;
};

/** 공통 마무리. 화질과 출력 규칙은 어느 예시에나 필요하다. */
const FINISH_KO = [
  '사진의 입자, 선명도, 색감, 조명을 자연스럽게 맞춰라. 합성 경계나 이음매가 보이면 안 된다.',
  '이미지만 반환해라. 글자, 캡션, 워터마크, 테두리, 분할 패널을 넣지 마라.',
];

const FINISH_EN = [
  "Match the original photograph's grain, sharpness, color response, and lighting. The edited regions must blend in seamlessly, with clean edges and no visible compositing seams.",
  'Return the image only. Do not add text, captions, watermarks, borders, or collage panels.',
];

/** 한국어로 보낼 때만 필요하다. 지시문을 그림으로 그려버리는 것을 막는다. */
const KOREAN_NOTE =
  '이 지시는 한국어다. 내용을 해석해서 그려라. 한국어 글자 자체를 이미지에 그리지 마라.';

/** 각도가 바뀌어도 변하지 않는 특징. 같은 사람으로 알아보게 하는 기준이다. */
const TRAITS_KO =
  '눈 모양과 간격, 쌍꺼풀, 홍채 색, 눈썹 모양과 두께, 콧대 너비와 코끝 모양, 입술 모양과 두께, 턱선, 광대 구조, 귀 모양, 헤어라인, 피부톤, 점·주근깨·흉터·수염';

const TRAITS_EN =
  'the shape and spacing of the eyes, the eyelid fold, the iris color, the eyebrow shape and thickness, the nose bridge width and tip shape, the lip shape and thickness, the chin and jaw line, the cheekbone structure, the ear shape, the hairline, the skin tone, and any moles, freckles, scars, or facial hair';

export const GEN_PRESETS: GenPreset[] = [
  {
    id: 'wear-scene',
    label: '의상·배경·포즈 입히기',
    desc: '내 인물은 그대로 두고, 다른 사진의 옷·배경·자세를 가져다 입힙니다.',
    slotA: '얼굴을 지킬 인물',
    slotB: '가져올 의상·배경·자세',
    text: {
      ko: [
        KOREAN_NOTE,
        '앞쪽에 올린 사진(참조 1)의 인물은 그대로 두고, 뒤쪽에 올린 사진(참조 2)의 의상과 배경과 자세를 그 인물에게 그대로 입혀라. 참조 1이 여러 장이면 같은 사람을 여러 각도에서 찍은 것이니 함께 읽어서 얼굴의 입체 구조를 파악해라.',
        '참조 1에서 지킬 것: 얼굴과 정체성, 머리와 몸의 비율, 피부톤, 머리 색과 질감. 다음 특징을 정확히 맞춰라 — ' +
          TRAITS_KO +
          '. 아는 사람이 한눈에 알아볼 수 있어야 한다.',
        '참조 2에서 가져올 것: 의상과 옷이 몸에 걸쳐지고 접히는 모양, 배경과 배경 속 모든 사물, 몸의 자세(머리·목·어깨·팔·팔꿈치·손·손가락·골반·다리의 위치와 각도), 카메라 각도, 구도와 잘림, 조명의 방향과 색.',
        '참조 2에 다른 사람이 있으면 그 사람은 완전히 교체된다. 그 사람의 얼굴 특징, 체형, 머리카락을 결과에 가져오지 마라.',
        '참조 2가 요구하는 고개 각도는 참조 1과 다를 것이다. 참조 1의 픽셀을 베끼지 말고 그 각도로 다시 그려라. 각도 차이가 크더라도 평범하거나 평균적인 얼굴로 도망가지 마라.',
        ...FINISH_KO,
      ].join('\n\n'),
      en: [
        'Keep the person in the first image or images (reference 1) exactly as they are, and dress them in the clothing, background, and pose of the later image or images (reference 2). If reference 1 has several photographs, they show the same person at different angles — read them together to understand the three-dimensional shape of that face.',
        'Keep from reference 1: the face and identity, the head and body proportions, the skin tone, and the hair color and texture. Match these traits exactly — ' +
          TRAITS_EN +
          '. Someone who knows this person must recognise them at a glance.',
        'Take from reference 2: the clothing and the way it folds and sits on the body, the background and every object in it, the body pose (the position and angle of the head, neck, shoulders, arms, elbows, hands, fingers, hips, and legs), the camera angle, the framing and crop, and the lighting direction and color.',
        'If a different person appears in reference 2, that person is replaced entirely. Do not carry any of their facial features, body proportions, or hair into the result.',
        'The head angle reference 2 requires is probably different from reference 1. Do not copy reference 1 pixels — re-render the person at that new angle. Even if the angle difference is large, do not fall back on a generic or averaged face.',
        ...FINISH_EN,
      ].join('\n\n'),
    },
  },
  {
    id: 'swap-person',
    label: '인물만 교체',
    desc: '사진은 그대로 두고, 그 안의 인물만 다른 사람으로 바꿉니다.',
    slotA: '그대로 둘 사진',
    slotB: '넣을 인물',
    text: {
      ko: [
        KOREAN_NOTE,
        '앞쪽에 올린 사진(참조 1)은 그대로 두고, 그 안의 인물만 뒤쪽에 올린 사진(참조 2)의 인물로 바꿔라. 참조 2가 여러 장이면 같은 사람을 여러 각도에서 찍은 것이니 함께 읽어서 얼굴의 입체 구조를 파악하고, 참조 1의 고개 각도와 가장 가까운 장을 주 기준으로 삼아라.',
        '참조 1은 바탕이고 바뀌면 안 된다: 배경과 배경 속 모든 사물, 조명의 방향과 색, 카메라 각도, 구도와 잘림, 의상과 옷이 몸에 걸쳐지고 접히는 모양, 그리고 무엇보다 몸의 자세 — 머리·목·어깨·팔·팔꿈치·손·손가락·골반·다리의 정확한 위치와 각도.',
        '인물은 같은 실루엣, 같은 크기, 화면 속 같은 위치를 차지해야 한다. 자세를 다시 잡거나, 구도를 다시 잡거나, 조명을 다시 주거나, 장면을 다시 그리지 마라. 지시하지 않은 픽셀은 전부 고정이다.',
        '참조 1 인물의 얼굴과 정체성만 참조 2의 인물로 바꿔라.',
        '참조 1의 고개 각도와 시선과 표정은 참조 2와 다를 것이다. 참조 2의 픽셀을 베끼지 말고, 참조 1이 이미 가진 각도로 얼굴을 다시 그려라. 각도가 바뀌어도 변하지 않는 다음 특징을 정확히 맞춰 같은 사람이 되게 해라 — ' +
          TRAITS_KO +
          '. 아는 사람이 한눈에 알아볼 수 있어야 한다. 각도 차이가 크더라도 평범하거나 평균적인 얼굴로 도망가지 마라.',
        '참조 2에서는 얼굴과 머리의 정체성만 가져와라. 의상, 배경, 자세, 구도, 조명은 가져오지 마라. 참조 1의 조명과 색에 맞춰 이음매 없이 섞되, 섞기 쉽게 하려고 얼굴 특징 자체를 바꾸지는 마라.',
        ...FINISH_KO,
      ].join('\n\n'),
      en: [
        'Keep the first image or images (reference 1) exactly as they are, and replace only the person in them with the person shown in the later image or images (reference 2). If reference 2 has several photographs, they show the same person at different angles — read them together to understand the three-dimensional shape of that face, and use whichever is closest to the head angle in reference 1 as the main guide.',
        'Reference 1 is the canvas and must survive unchanged: the background and every object in it, the lighting direction and color, the camera angle, the framing and crop, the clothing and the way it folds and sits on the body, and above all the body pose — the exact position and angle of the head, neck, shoulders, arms, elbows, hands, fingers, hips, and legs.',
        'The person must occupy the same silhouette, at the same scale, in the same position in the frame. Do not re-pose, re-frame, re-light, or redraw the scene. Treat every pixel the instruction does not name as fixed.',
        'Replace only the face and identity of the person in reference 1 with the person shown in reference 2.',
        'The head angle, gaze direction, and expression in reference 1 are probably different from reference 2. Do not copy the reference 2 pixels — re-render the face at the angle reference 1 already has, and carry the identity across by matching these traits exactly, because they do not change with angle — ' +
          TRAITS_EN +
          '. Someone who knows this person must recognise them at a glance. Even if the angle difference is large, do not fall back on a generic or averaged face.',
        'From reference 2 take only the face and head identity. Do not take their clothing, background, pose, framing, or lighting. Blend into the reference 1 lighting and color so there is no visible seam, but do not alter the facial features themselves to make the blend easier.',
        ...FINISH_EN,
      ].join('\n\n'),
    },
  },
];
