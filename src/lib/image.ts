/**
 * 업로드 이미지 처리. 상태에는 data URL만 담고, 파일 객체는 들고 있지 않는다.
 * localStorage / sessionStorage는 쓰지 않는다 — 새로고침하면 전부 사라지는 것이 의도된 동작이다.
 */

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const MIME_LABEL = 'jpg, png, webp';

/** 형식·용량 검사. 통과하면 null, 아니면 화면에 그대로 띄울 오류 문구. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME.includes(file.type)) {
    return `${MIME_LABEL} 형식만 올릴 수 있습니다. 다른 형식이면 변환해서 다시 올려주세요.`;
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `${mb}MB입니다. 10MB 이하로 줄여서 올려주세요.`;
  }
  return null;
}

/** FileReader로 data URL 변환. 검사에 걸리면 reject한다. */
export function readImageFile(file: File): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) return Promise.reject(new Error(problem));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error('파일을 읽지 못했습니다. 다른 파일로 다시 시도해주세요.'));
    reader.readAsDataURL(file);
  });
}

/** data URL에서 mime과 순수 base64를 분리한다. API 전송 시 접두어를 떼는 용도. */
export function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const [head, data = ''] = dataUrl.split(',');
  const mimeType = head.replace(/^data:/, '').replace(/;base64$/, '');
  return { mimeType, data };
}

/**
 * 바탕 이미지에 가장 가까운 image_size 프리셋.
 *
 * 비율을 지정해야만 하는 모델이 있는데, 기본값을 쓰면 정사각으로 잘라버린다.
 * 원본 비율에 가장 가까운 프리셋을 골라 구도가 틀어지지 않게 한다.
 */
const SIZE_PRESETS: { name: string; ratio: number }[] = [
  { name: 'portrait_16_9', ratio: 9 / 16 },
  { name: 'portrait_4_3', ratio: 3 / 4 },
  { name: 'square_hd', ratio: 1 },
  { name: 'landscape_4_3', ratio: 4 / 3 },
  { name: 'landscape_16_9', ratio: 16 / 9 },
];

export function measureImageSize(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const ratio = image.width / Math.max(1, image.height);
      const best = SIZE_PRESETS.reduce((a, b) =>
        Math.abs(b.ratio - ratio) < Math.abs(a.ratio - ratio) ? b : a,
      );
      resolve(best.name);
    };
    image.onerror = () => resolve('square_hd');
    image.src = dataUrl;
  });
}
