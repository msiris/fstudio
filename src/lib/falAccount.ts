/**
 * fal 계정 정보 조회.
 *
 * 이미지 호출과 같은 키, 같은 Authorization 헤더를 쓴다. 별도 발급이 필요 없다.
 * api.fal.ai도 CORS를 열어두고 있어 서버 없이 브라우저에서 직접 부른다.
 */

const ENDPOINT = 'https://api.fal.ai/v1/account/billing?expand=credits';
const TIMEOUT_MS = 15_000;

export class FalAccountError extends Error {}

export type CreditsResult = {
  /** 응답에서 찾아낸 잔액. 구조가 바뀌면 null이 된다. */
  balance: number | null;
  /** 잔액 확인용 원문. 파싱이 어긋났을 때 화면에서 직접 볼 수 있어야 한다. */
  raw: string;
};

/** 잔액으로 볼 만한 필드 이름. fal이 구조를 바꿔도 대개 이 중 하나에 걸린다. */
const BALANCE_KEY = /^(balance|credits?|credit_balance|remaining|available|amount)$/i;

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

/**
 * 응답 구조를 모르는 채로 잔액을 찾는다.
 * 이름이 맞는 숫자를 먼저 훑고, 없으면 한 단계씩 내려간다.
 */
function findBalance(value: unknown, depth = 0): number | null {
  if (depth > 4 || value === null || typeof value !== 'object') return null;

  const entries = Object.entries(value as Record<string, unknown>);

  for (const [key, child] of entries) {
    if (BALANCE_KEY.test(key)) {
      const parsed = toNumber(child);
      if (parsed !== null) return parsed;
    }
  }

  for (const [, child] of entries) {
    const found = findBalance(child, depth + 1);
    if (found !== null) return found;
  }

  return null;
}

export async function fetchCredits(apiKey: string): Promise<CreditsResult> {
  if (!apiKey.trim()) throw new FalAccountError('fal 키가 비어 있습니다.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      headers: { Authorization: `Key ${apiKey.trim()}` },
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new FalAccountError('잔액 조회가 시간 안에 끝나지 않았습니다.');
    }
    throw new FalAccountError('잔액을 불러오지 못했습니다. 연결 상태를 확인해주세요.');
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new FalAccountError('키가 거부되었습니다. fal 키를 다시 확인해주세요.');
    }
    throw new FalAccountError(`잔액 조회에 실패했습니다 (${res.status}).`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new FalAccountError('잔액 응답을 해석하지 못했습니다.');
  }

  return {
    balance: findBalance(parsed),
    raw: JSON.stringify(parsed, null, 2),
  };
}
