/**
 * 생성 기록. IndexedDB에 누적해서 쌓는다.
 *
 * 저장소를 두 개로 나눈다.
 * - entries: 썸네일과 메타데이터. 목록을 그릴 때 이것만 읽는다
 * - images: 원본 data URL. 저장 버튼을 누를 때만 꺼낸다
 *
 * 한 레코드에 원본까지 넣으면 목록을 여는 것만으로 수십 MB를 읽게 된다.
 * localStorage는 수 MB가 한계라 이미지를 담을 수 없어서 IndexedDB를 쓴다.
 */

const DB_NAME = 'face-studio';
const DB_VERSION = 2;
const ENTRY_STORE = 'entries';
const IMAGE_STORE = 'images';
/** 제출했지만 아직 결과를 못 받은 요청. 앱이 꺼져도 회수할 수 있게 남긴다. */
const PENDING_STORE = 'pending';
const CREATED_INDEX = 'byCreatedAt';

/** 목록용 썸네일의 최대 변 길이. */
const THUMB_MAX = 320;

export type HistoryEntry = {
  id: string;
  createdAt: number;
  /** 어느 화면에서 만들었는지. */
  mode: string;
  modelLabel: string;
  /** 사용자가 입력한 원문. */
  instruction: string;
  /** 실제로 모델에 보낸 확장 프롬프트. */
  sentPrompt: string;
  /** 목록에 그리는 작은 이미지. */
  thumb: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ENTRY_STORE)) {
        const store = db.createObjectStore(ENTRY_STORE, { keyPath: 'id' });
        store.createIndex(CREATED_INDEX, 'createdAt');
      }
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, { keyPath: 'requestId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('기록 저장소를 열지 못했습니다.'));
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('기록 저장에 실패했습니다.'));
    tx.onabort = () => reject(tx.error ?? new Error('기록 저장이 중단되었습니다.'));
  });
}

function newId(): string {
  // randomUUID는 보안 컨텍스트에서만 있다. 없으면 시각과 난수로 대체한다.
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** 목록이 무거워지지 않게 긴 변을 THUMB_MAX로 줄인다. */
function makeThumbnail(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, THUMB_MAX / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      try {
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } catch {
        // 교차 출처 이미지라 캔버스가 오염된 경우. 원본을 그대로 쓴다.
        resolve(dataUrl);
      }
    };
    // 못 읽으면 원본을 그대로 쓴다. 기록을 남기는 쪽이 낫다.
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

/** 생성에 성공했을 때 한 건 남긴다. 실패하면 조용히 넘어간다 — 기록 때문에 결과를 잃지 않는다. */
export async function addHistory(input: {
  mode: string;
  modelLabel: string;
  instruction: string;
  sentPrompt: string;
  image: string;
}): Promise<void> {
  try {
    const thumb = await makeThumbnail(input.image);
    const entry: HistoryEntry = {
      id: newId(),
      createdAt: Date.now(),
      mode: input.mode,
      modelLabel: input.modelLabel,
      instruction: input.instruction,
      sentPrompt: input.sentPrompt,
      thumb,
    };

    const db = await openDb();
    const tx = db.transaction([ENTRY_STORE, IMAGE_STORE], 'readwrite');
    tx.objectStore(ENTRY_STORE).put(entry);
    tx.objectStore(IMAGE_STORE).put({ id: entry.id, image: input.image });
    await done(tx);
    db.close();
  } catch {
    // 저장소가 막혀 있어도 생성 자체는 성공한 것이다. 화면을 깨뜨리지 않는다.
  }
}

/** 최신순으로 한 페이지를 읽는다. before를 주면 그보다 오래된 것부터. */
export async function listHistory(limit: number, before?: number): Promise<HistoryEntry[]> {
  const db = await openDb();
  const tx = db.transaction(ENTRY_STORE, 'readonly');
  const index = tx.objectStore(ENTRY_STORE).index(CREATED_INDEX);
  const range = before === undefined ? null : IDBKeyRange.upperBound(before, true);

  const entries = await new Promise<HistoryEntry[]>((resolve, reject) => {
    const found: HistoryEntry[] = [];
    const cursorRequest = index.openCursor(range, 'prev');
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor || found.length >= limit) {
        resolve(found);
        return;
      }
      found.push(cursor.value as HistoryEntry);
      cursor.continue();
    };
    cursorRequest.onerror = () =>
      reject(cursorRequest.error ?? new Error('기록을 읽지 못했습니다.'));
  });

  db.close();
  return entries;
}

/** 저장 버튼을 눌렀을 때만 원본을 꺼낸다. */
export async function getHistoryImage(id: string): Promise<string | null> {
  const db = await openDb();
  const tx = db.transaction(IMAGE_STORE, 'readonly');
  const request = tx.objectStore(IMAGE_STORE).get(id);

  const image = await new Promise<string | null>((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as { image?: string })?.image ?? null);
    request.onerror = () => reject(request.error ?? new Error('이미지를 읽지 못했습니다.'));
  });

  db.close();
  return image;
}

/**
 * 제출 직후 남기는 기록.
 * 이 시점에 이미 요금이 걸려 있어서, 앱이 꺼지든 연결이 끊기든 결과를 되찾을 수 있어야 한다.
 */
export type PendingRequest = {
  requestId: string;
  statusUrl: string;
  responseUrl: string;
  createdAt: number;
  mode: string;
  modelLabel: string;
  instruction: string;
  sentPrompt: string;
};

export async function addPending(pending: PendingRequest): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(PENDING_STORE, 'readwrite');
    tx.objectStore(PENDING_STORE).put(pending);
    await done(tx);
    db.close();
  } catch {
    // 저장이 안 돼도 생성은 진행한다.
  }
}

export async function removePending(requestId: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(PENDING_STORE, 'readwrite');
    tx.objectStore(PENDING_STORE).delete(requestId);
    await done(tx);
    db.close();
  } catch {
    // 지우지 못해도 결과는 이미 받았다.
  }
}

/** 오래된 것부터. 먼저 제출한 것을 먼저 회수한다. */
export async function listPending(): Promise<PendingRequest[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(PENDING_STORE, 'readonly');
    const request = tx.objectStore(PENDING_STORE).getAll();

    const all = await new Promise<PendingRequest[]>((resolve, reject) => {
      request.onsuccess = () => resolve((request.result as PendingRequest[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error('진행 중 목록을 읽지 못했습니다.'));
    });

    db.close();
    return all.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

export async function removeHistory(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([ENTRY_STORE, IMAGE_STORE], 'readwrite');
  tx.objectStore(ENTRY_STORE).delete(id);
  tx.objectStore(IMAGE_STORE).delete(id);
  await done(tx);
  db.close();
}

export async function clearHistory(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([ENTRY_STORE, IMAGE_STORE], 'readwrite');
  tx.objectStore(ENTRY_STORE).clear();
  tx.objectStore(IMAGE_STORE).clear();
  await done(tx);
  db.close();
}

export async function countHistory(): Promise<number> {
  const db = await openDb();
  const tx = db.transaction(ENTRY_STORE, 'readonly');
  const request = tx.objectStore(ENTRY_STORE).count();

  const count = await new Promise<number>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('기록 수를 세지 못했습니다.'));
  });

  db.close();
  return count;
}

/** 누적해서 쌓으므로 쓰고 있는 용량을 보여준다. 브라우저가 알려주지 않으면 null. */
export async function estimateUsage(): Promise<number | null> {
  try {
    const estimate = await navigator.storage?.estimate?.();
    return estimate?.usage ?? null;
  } catch {
    return null;
  }
}
