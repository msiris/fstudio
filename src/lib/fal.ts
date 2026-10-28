/**
 * fal.ai 호출. 세 모드가 모두 이 함수 하나를 쓴다.
 * 차이는 어떤 모델을 고르는지와 보내는 이미지 개수뿐이다.
 *
 * fal.run은 CORS를 열어두고 있어 서버 없이 브라우저에서 직접 부른다.
 * sync_mode를 켜면 결과가 data URI로 와서, 저장과 미리보기를 그대로 처리할 수 있다.
 */

import type { FalModel, ModelInput } from './falModels';

const ENDPOINT = 'https://fal.run';
/**
 * 편집 모델은 해상도와 참조 장수에 따라 1분을 넘기는 경우가 있다.
 * 실패가 아니라 아직 그리는 중이라서, 60초에서 끊으면 멀쩡한 요청을 버리게 된다.
 * 크레딧은 이미 쓰였으므로 기다리는 쪽이 낫다.
 */
const TIMEOUT_MS = 120_000;

type FalImage = { url?: string; content_type?: string };

type FalResponse = {
  images?: FalImage[];
  image?: FalImage;
  description?: string;
  has_nsfw_concepts?: boolean[];
  detail?: unknown;
  error?: string;
  message?: string;
};

/** 화면에 그대로 띄울 문구를 담은 오류. */
export class FalError extends Error {}

/** 422는 스키마가 바뀐 경우다. 어느 필드가 문제인지 원문에 들어 있다. */
function detailText(data: FalResponse): string {
  const raw = data.detail ?? data.error ?? data.message;
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return '';
  }
}

/** 콘텐츠 필터에 막힌 것인지. fal은 이것도 422로 돌려준다. */
function isContentBlock(detail: string): boolean {
  return /content_policy_violation|content policy|nsfw|safety/i.test(detail);
}

function baseMessage(status: number, endpointId: string, detail: string): string {
  if (status === 401 || status === 403) {
    return 'fal 키가 거부되었습니다. 우측 상단 키 버튼에서 다시 확인해주세요. fal.ai/dashboard/keys 에서 발급합니다.';
  }
  if (status === 402) {
    return 'fal 크레딧이 부족합니다. fal.ai/dashboard/billing 에서 충전한 뒤 다시 시도하세요.';
  }
  if (status === 404) {
    return `모델을 찾지 못했습니다. 모델명을 확인하세요 — 방금 부른 엔드포인트는 "${endpointId}"입니다. src/lib/falModels.ts의 ID를 최신 값으로 바꾸면 됩니다.`;
  }
  if (status === 422) {
    // 422는 스키마 오류와 콘텐츠 정책 거부가 같이 쓰인다. 원문으로 갈라서 안내한다.
    if (isContentBlock(detail)) {
      return '콘텐츠 정책에 막혔습니다. 모델 카드의 "안전 필터 완화"를 켜거나 Seedream으로 바꿔보세요. 이미 GPU를 쓴 요청이라 요금이 나갈 수 있습니다.';
    }
    return `모델이 입력을 받아들이지 않았습니다. "${endpointId}"의 입력 스키마가 바뀐 것으로 보입니다. src/lib/falModels.ts의 resolve를 모델 페이지와 맞춰주세요.`;
  }
  if (status === 429) {
    return '요청이 몰렸습니다. 잠시 뒤 다시 시도하세요.';
  }
  if (status >= 500) {
    return `모델 서버가 응답하지 못했습니다 (${status}). 잠시 뒤 같은 요청을 다시 보내보세요.`;
  }
  return `요청이 실패했습니다 (${status}).`;
}

export type FalSuccess = {
  /** 결과 이미지의 data URI (sync_mode가 무시된 모델이면 https URL). */
  dataUrl: string;
  /** 결과는 돌려주되 함께 알릴 내용. 안전 필터 플래그 같은 것. */
  warning: string | null;
};

/** 이미지 생성·편집 공용 호출. */
export async function callFal(
  model: FalModel,
  input: ModelInput,
  apiKey: string,
): Promise<FalSuccess> {
  if (!apiKey.trim()) {
    throw new FalError(
      'fal 키가 비어 있습니다. 우측 상단 키 버튼을 눌러 fal.ai 키를 넣어주세요.',
    );
  }

  // 어떤 엔드포인트로 갈지는 모델이 정한다. 참조 이미지 유무에 따라 갈라지기도 한다.
  const request = model.resolve(
    // 이미지를 못 받는 모델에는 아예 넘기지 않는다.
    model.acceptsImages ? input : { ...input, images: [] },
  );

  const body = {
    ...request.body,
    // 결과를 data URI로 받는다. 저장 버튼과 미리보기가 그대로 동작한다.
    sync_mode: true,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}/${request.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey.trim()}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new FalError(
        '2분 안에 응답이 오지 않았습니다. 해상도를 1K로 낮추거나 참조 이미지를 줄여 다시 시도해주세요.',
      );
    }
    throw new FalError('네트워크 요청이 실패했습니다. 연결 상태를 확인하고 다시 시도해주세요.');
  } finally {
    clearTimeout(timer);
  }

  const data: FalResponse = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = detailText(data);
    const base = baseMessage(res.status, request.id, detail);
    throw new FalError(detail ? `${base}\n\nfal이 보낸 내용:\n${detail}` : base);
  }

  const url = data.images?.[0]?.url ?? data.image?.url;
  if (!url) {
    const detail = detailText(data) || data.description || '';
    throw new FalError(
      [
        '응답에 이미지가 없습니다. 지시를 바꿔 다시 시도해보세요.',
        detail && `모델이 보낸 내용:\n${detail}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    );
  }

  // 안전 필터 플래그가 붙어도 결과를 버리지 않는다.
  // 200으로 돌아온 시점에 이미 GPU를 썼고 요금도 나갔다.
  // 오탐이면 멀쩡한 이미지이고, 진짜로 걸렸으면 검은 이미지가 보일 뿐이다.
  const flagged = data.has_nsfw_concepts?.some(Boolean) ?? false;

  return {
    dataUrl: url,
    warning: flagged
      ? '모델의 안전 필터가 이 결과를 표시했습니다. 이미지가 비어 있거나 검게 나왔다면 그래서입니다. 모델 카드의 "안전 필터 완화"를 켜면 오탐을 줄일 수 있습니다.'
      : null,
  };
}
