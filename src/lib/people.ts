/**
 * 인물 보관함.
 *
 * 얼굴 각도가 다른 장면에 사람을 넣으려면 같은 사람의 사진이 여러 각도로 필요한데,
 * 매번 올리는 건 번거롭다. 한 번 등록해두고 꺼내 쓴다.
 *
 * 기록과 마찬가지로 가벼운 것과 무거운 것을 나눠 담는다.
 * - people: 이름, 장수, 썸네일. 목록과 칩을 그릴 때 이것만 읽는다
 * - photos: 원본 사진 배열. 참조로 넣을 때만 꺼낸다
 *
 * 기록과 다른 데이터베이스를 쓴다. 버전을 서로 끌고 다니지 않게 하려는 것이다.
 */

const DB_NAME = 'face-studio-people';
const DB_VERSION = 1;
const PERSON_STORE = 'people';
const PHOTO_STORE = 'photos';

/** 한 인물에 담을 수 있는 사진 수. 각도별로 몇 장이면 충분하다. */
export const MAX_PERSON_PHOTOS = 6;

const THUMB_MAX = 160;

export type Person = {
  id: string;
  name: string;
  createdAt: number;
  photoCount: number;
  /** 목록과 칩에 쓰는 작은 이미지. 첫 사진에서 만든다. */
  thumb: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PERSON_STORE)) {
        db.createObjectStore(PERSON_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('인물 보관함을 열지 못했습니다.'));
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('저장에 실패했습니다.'));
    tx.onabort = () => reject(tx.error ?? new Error('저장이 중단되었습니다.'));
  });
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

/** 새로 등록하거나, id를 주면 그 인물을 덮어쓴다. */
export async function savePerson(input: {
  id?: string;
  name: string;
  photos: string[];
}): Promise<string> {
  const photos = input.photos.slice(0, MAX_PERSON_PHOTOS);
  if (photos.length === 0) throw new Error('사진을 한 장 이상 넣어주세요.');

  const id = input.id ?? newId();
  const person: Person = {
    id,
    name: input.name.trim() || '이름 없음',
    createdAt: Date.now(),
    photoCount: photos.length,
    thumb: await makeThumbnail(photos[0]),
  };

  const db = await openDb();
  const tx = db.transaction([PERSON_STORE, PHOTO_STORE], 'readwrite');
  tx.objectStore(PERSON_STORE).put(person);
  tx.objectStore(PHOTO_STORE).put({ id, photos });
  await done(tx);
  db.close();
  return id;
}

export async function listPeople(): Promise<Person[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(PERSON_STORE, 'readonly');
    const request = tx.objectStore(PERSON_STORE).getAll();
    const all = await new Promise<Person[]>((resolve, reject) => {
      request.onsuccess = () => resolve((request.result as Person[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error('인물 목록을 읽지 못했습니다.'));
    });
    db.close();
    return all.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

/** 참조로 넣을 때만 원본을 꺼낸다. */
export async function getPersonPhotos(id: string): Promise<string[]> {
  const db = await openDb();
  const tx = db.transaction(PHOTO_STORE, 'readonly');
  const request = tx.objectStore(PHOTO_STORE).get(id);
  const photos = await new Promise<string[]>((resolve, reject) => {
    request.onsuccess = () => resolve((request.result as { photos?: string[] })?.photos ?? []);
    request.onerror = () => reject(request.error ?? new Error('사진을 읽지 못했습니다.'));
  });
  db.close();
  return photos;
}

export async function removePerson(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([PERSON_STORE, PHOTO_STORE], 'readwrite');
  tx.objectStore(PERSON_STORE).delete(id);
  tx.objectStore(PHOTO_STORE).delete(id);
  await done(tx);
  db.close();
}
