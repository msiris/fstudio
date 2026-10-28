/**
 * fal.ai 호출. 세 모드가 모두 이 흐름을 쓴다.
 *
 * 동기 엔드포인트(fal.run) 대신 큐(queue.fal.run)를 쓴다.
 * 생성이 80초쯤 걸리는데, 그동안 연결 하나를 붙잡고 있으면 휴대폰에서 쉽게 끊긴다.
 * 화면을 끄거나 와이파이가 바뀌면 브라우저가 요청을 버리고, fal은 멀쩡히 완성해서
 * 요금을 매긴다. 앱만 실패로 보이고 결과는 사라진다.
 *
 * 큐는 제출하고 2초마다 짧은 요청으로 상태만 확인한다. 끊길 틈이 없고,
 * request_id를 들고 있으면 앱을 닫았다 열어도 결과를 가져올 수 있다.
 */

import type { FalModel, ModelInput } from './falModels';

const QUEUE = 'https://queue.fal.run';

/** 짧은 요청 하나의 제한. 큐 방식이라 길게 잡을 이유가 없다. */
const REQUEST_TIMEOUT_MS = 30_000;
/** 상태 확인 간격. */
const POLL_INTERVAL_MS = 2_000;
/** 전체 포기 시점. 큐가 밀릴 수 있어 넉넉히 둔다. */
const POLL_DEADLINE_MS = 10 * 60_000;

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

type SubmitResponse = {
  request_id?: string;
  status_url?: string;
  response_url?: string;
};

type StatusResponse = {
  status?: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | string;
  queue_position?: number;
  detail?: unknown;
};

/** 화면에 그대로 띄울 문구를 담은 오류. */
export class FalError extends Error {}

/** 제출만 끝난 상태. 이걸 저장해두면 나중에 결과를 회수할 수 있다. */
export type FalSubmission = {
  requestId: string;
  statusUrl: string;
  responseUrl: string;
};

export type FalSuccess = {
  /** 결과 이미지를 data URL로 받은 것. 저장과 썸네일에 그대로 쓴다. */
  dataUrl: string;
  /** 결과는 돌려주되 함께 알릴 내용. 안전 필터 플래그 같은 것. */
  warning: string | null;
};

/** 422는 스키마 오류와 콘텐츠 정책 거부가 같이 쓰인다. 어느 쪽인지 원문에 들어 있다. */
function detailText(data: { detail?: unknown; error?: unknown; message?: unknown }): string {
  const raw = data.detail ?? data.error ?? data.message;
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return '';
  }
}

function isContentBlock(detail: string): boolean {
  return /content_policy_violation|content policy|nsfw|safety/i.test(detail);
}

function baseMessage(status: number, endpointId: string, detail: string): string {
  if (status === 401 || status === 403) {
    return 'fal 키가 거부되었습니다. 홈 화면 우측 상단 열쇠 버튼에서 다시 확인해주세요.';
  }
  if (status === 402) {
    return 'fal 크레딧이 부족합니다. fal.ai/dashboard/billing 에서 충전한 뒤 다시 시도하세요.';
  }
  if (status === 404) {
    return `모델을 찾지 못했습니다. 모델명을 확인하세요 — 방금 부른 엔드포인트는 "${endpointId}"입니다. src/lib/falModels.ts의 ID를 최신 값으로 바꾸면 됩니다.`;
  }
  if (status === 422) {
    if (isContentBlock(detail)) {
      return '콘텐츠 정책에 막혔습니다. 안전 필터는 이미 가장 느슨하게 보내고 있어서, 남은 건 제공자 정책입니다. 다른 모델로 바꿔보세요. 이미 GPU를 쓴 요청이라 요금이 나갈 수 있습니다.';
    }
    return `모델이 입력을 받아들이지 않았습니다. "${endpointId}"의 입력 스키마가 바뀐 것으로 보입니다. src/lib/falModels.ts의 resolve를 모델 페이지와 맞춰주세요.`;
  }
  if (status === 429) {
    return '요청이 몰렸습니다. 잠시 뒤 다시 시도하세요.';
  }
  if (status >= 500) {
    return `모델 서버가 응답하지 못했습니다 (${status}). 서버 오류는 요금이 나가지 않습니다.`;
  }
  return `요청이 실패했습니다 (${status}).`;
}

async function request(
  url: string,
  apiKey: string,
  init: RequestInit = {},
  label = url,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Key ${apiKey.trim()}`,
        ...init.headers,
      },
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new FalError('fal이 응답하지 않습니다. 잠시 뒤 다시 시도해주세요.');
    }
    throw new FalError('네트워크 요청이 실패했습니다. 연결 상태를 확인하고 다시 시도해주세요.');
  } finally {
    clearTimeout(timer);
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const detail = detailText(data);
    const base = baseMessage(res.status, label, detail);
    throw new FalError(detail ? `${base}\n\nfal이 보낸 내용:\n${detail}` : base);
  }
  return data;
}

/** 큐에 밀어 넣고 request_id만 받는다. 여기서 이미 요금이 걸린다. */
export async function submitFal(
  model: FalModel,
  input: ModelInput,
  apiKey: string,
): Promise<FalSubmission> {
  if (!apiKey.trim()) {
    throw new FalError('fal 키가 비어 있습니다. 홈 화면 우측 상단 열쇠 버튼에서 넣어주세요.');
  }

  // 어떤 엔드포인트로 갈지는 모델이 정한다. 참조 이미지 유무에 따라 갈라지기도 한다.
  const resolved = model.resolve(
    // 이미지를 못 받는 모델에는 아예 넘기지 않는다.
    model.acceptsImages ? input : { ...input, images: [] },
  );

  const data = (await request(
    `${QUEUE}/${resolved.id}`,
    apiKey,
    { method: 'POST', body: JSON.stringify(resolved.body) },
    resolved.id,
  )) as SubmitResponse;

  if (!data.request_id || !data.status_url || !data.response_url) {
    throw new FalError('큐 응답에 request_id가 없습니다. 잠시 뒤 다시 시도해주세요.');
  }

  return {
    requestId: data.request_id,
    statusUrl: data.status_url,
    responseUrl: data.response_url,
  };
}

/** 화면에 띄울 진행 상태. */
export type FalProgress = { status: string; queuePosition?: number };

function progressLabel(status: StatusResponse): FalProgress {
  if (status.status === 'IN_QUEUE') {
    return { status: '대기 중', queuePosition: status.queue_position };
  }
  if (status.status === 'IN_PROGRESS') return { status: '그리는 중' };
  return { status: '확인 중' };
}

/** 결과 URL을 data URL로 바꾼다. 저장 버튼과 썸네일이 그대로 동작하도록. */
async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new FalError(`결과 이미지를 받지 못했습니다 (${res.status}).`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new FalError('결과 이미지를 읽지 못했습니다.'));
    reader.readAsDataURL(blob);
  });
}

function readResult(data: FalResponse): FalSuccess | null {
  const url = data.images?.[0]?.url ?? data.image?.url;
  if (!url) return null;

  // 안전 필터 플래그가 붙어도 결과를 버리지 않는다. 이미 요금이 나간 요청이다.
  const flagged = data.has_nsfw_concepts?.some(Boolean) ?? false;
  return {
    dataUrl: url,
    warning: flagged
      ? '모델의 안전 필터가 이 결과를 표시했습니다. 이미지가 비어 있거나 검게 나왔다면 그래서입니다. 다른 모델로 바꾸면 통과하는 경우가 있습니다.'
      : null,
  };
}

/**
 * 완료될 때까지 상태를 확인하고 결과를 가져온다.
 * 제출과 분리돼 있어서, 앱을 닫았다 연 뒤에도 저장해둔 submission으로 다시 부를 수 있다.
 */
export async function collectFal(
  submission: FalSubmission,
  apiKey: string,
  onProgress?: (progress: FalProgress) => void,
): Promise<FalSuccess> {
  const deadline = Date.now() + POLL_DEADLINE_MS;

  for (;;) {
    const status = (await request(
      submission.statusUrl,
      apiKey,
      {},
      submission.requestId,
    )) as StatusResponse;

    if (status.status === 'COMPLETED') break;
    onProgress?.(progressLabel(status));

    if (Date.now() > deadline) {
      throw new FalError(
        '10분이 지나도 끝나지 않았습니다. 기록 화면의 "진행 중" 목록에 남겨뒀으니 나중에 다시 가져올 수 있습니다.',
      );
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  const data = (await request(
    submission.responseUrl,
    apiKey,
    {},
    submission.requestId,
  )) as FalResponse;

  const result = readResult(data);
  if (!result) {
    const detail = detailText(data) || data.description || '';
    throw new FalError(
      ['응답에 이미지가 없습니다. 지시를 바꿔 다시 시도해보세요.', detail && `모델이 보낸 내용:\n${detail}`]
        .filter(Boolean)
        .join('\n\n'),
    );
  }

  return { ...result, dataUrl: await toDataUrl(result.dataUrl) };
}
