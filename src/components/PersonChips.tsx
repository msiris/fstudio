import Chip from './Chip';
import { usePeople } from '../hooks/usePeople';
import { getPersonPhotos } from '../lib/people';

/**
 * 등록해둔 인물을 꺼내는 칩.
 * 보관함은 화면과 무관한 하나의 저장소라, 어느 화면에서 등록하든 전부 같은 목록이 뜬다.
 */
export default function PersonChips({
  onPick,
  label = '등록한 인물 넣기',
  limit,
}: {
  /** 그 인물의 사진 전부를 넘긴다. 받는 쪽이 자기 상한에 맞춰 자른다. */
  onPick: (photos: string[]) => void;
  label?: string;
  /** 넣을 수 있는 장수. 0이면 칩을 숨긴다. */
  limit: number;
}) {
  const { people } = usePeople();
  if (people.length === 0 || limit <= 0) return null;

  return (
    <div className="mt-3">
      <div className="mb-2 text-xs text-muted">{label}</div>
      <div className="flex flex-wrap gap-2">
        {people.map((person) => (
          <Chip
            key={person.id}
            onClick={() => void getPersonPhotos(person.id).then(onPick)}
          >
            {person.name} · {person.photoCount}장
          </Chip>
        ))}
      </div>
    </div>
  );
}
