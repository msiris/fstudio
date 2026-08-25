/** 홈 + 3개 모드. 라우터 없이 이 값 하나로 화면을 전환한다. */
export type Screen = 'home' | 'single' | 'multi' | 'gen';

/** Image Gen 비율 선택지. */
export type Ratio = 'Original' | '3:4' | '9:16' | '16:9' | '1:1' | '4:3';

/** 업로드한 이미지는 data URL 문자열로만 들고 다닌다. 비어 있으면 null. */
export type ImageValue = string | null;
