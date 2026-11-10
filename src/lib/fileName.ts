/**
 * 내려받을 때 쓸 파일 이름.
 *
 * 전에는 모드마다 이름이 하나로 고정돼 있어서, 저장할 때마다 같은 이름이 나왔다.
 * 브라우저가 (1), (2)를 붙여주긴 하지만 어느 것이 언제 만든 건지 알 수 없었다.
 * 만든 시각을 뒤에 붙이면 겹치지 않고, 이름순으로 정렬하면 만든 순서가 된다.
 *
 * 앞에 fstudio를 붙이는 것은 다운로드 폴더에서 모아 보기 위해서다.
 * 웹 페이지는 저장 폴더를 고를 수 없어서, 이름으로 묶는 것이 할 수 있는 전부다.
 *
 * 초까지 넣는다. 연달아 저장하면 같은 분 안에 두 장이 생긴다.
 */
export function resultFileName(mode: string, at: number = Date.now()): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `fstudio-${mode}-${stamp}.png`;
}

/**
 * 기록 화면은 한글 모드 이름만 들고 있다. 파일 이름에는 짧은 영문 쪽이 다루기 편하다.
 * 모르는 값이 와도 저장은 되어야 하므로 image로 떨어뜨린다.
 */
const MODE_SLUG: Record<string, string> = {
  '얼굴 하나 바꾸기': 'single',
  '여러 얼굴 바꾸기': 'multi',
  '이미지 만들기': 'gen',
};

export function modeSlug(mode: string): string {
  return MODE_SLUG[mode] ?? 'image';
}
