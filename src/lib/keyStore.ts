/**
 * API 키를 브라우저 localStorage에 둔다.
 *
 * 이 저장소는 이 브라우저 안에만 존재한다. 소스에도, 커밋에도, 빌드 결과에도
 * 키가 들어가지 않으므로 저장소를 공개로 올려도 키는 노출되지 않는다.
 * 공용 PC에서 쓸 때는 아래 clearApiKey로 지우고 나온다.
 */

const STORAGE_KEY = 'face-studio:gemini-api-key';

/** 시크릿 모드나 저장소 차단 환경에서는 접근 자체가 예외를 던진다. */
function safeStorage(): Storage | null {
  try {
    const probe = '__face-studio-probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadApiKey(): string {
  return safeStorage()?.getItem(STORAGE_KEY) ?? '';
}

/** 빈 문자열이면 저장 대신 삭제한다. */
export function saveApiKey(key: string): void {
  const store = safeStorage();
  if (!store) return;
  if (key.trim()) store.setItem(STORAGE_KEY, key.trim());
  else store.removeItem(STORAGE_KEY);
}

export function clearApiKey(): void {
  safeStorage()?.removeItem(STORAGE_KEY);
}

/** 저장 자체가 불가능한 환경인지. 안내 문구를 바꾸는 데 쓴다. */
export const STORAGE_AVAILABLE = safeStorage() !== null;
