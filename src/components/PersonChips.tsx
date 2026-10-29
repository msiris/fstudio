import Chip from './Chip';
import { usePeople } from '../hooks/usePeople';
import { getPersonPhotos } from '../lib/people';
import { FOCUS_RING } from './ui';

/**
 * 등록해둔 인물을 꺼내는 칩.
 * 보관함은 화면과 무관한 하나의 저장소라, 어느 화면에서 등록하든 전부 같은 목록이 뜬다.
 *
 * 기본은 한 장이다. 예전에는 등록한 각도를 전부 딸려 보냈는데,
 * 입력 이미지는 두 번째 장부터 요금이 붙어서 모르는 사이에 지출이 늘었다.
 * 각도가 여러 장 필요한 경우는 얼굴 각도가 크게 어긋날 때뿐이라,
 * 그때만 옆의 버튼으로 꺼내 쓰게 한다. 등록 자체는 돈이 들지 않는다.
 */
export default function PersonChips({
  onPick,
  label = '등록한 인물 넣기',
  limit,
}: {
  /** 넘긴 사진들. 받는 쪽이 자기 상한에 맞춰 자른다. */
  onPick: (photos: string[]) => void;
  label?: string;
  /** 넣을 수 있는 장수. 0이면 칩을 숨긴다. */
  limit: number;
}) {
  const { people } = usePeople();
  if (people.length === 0 || limit <= 0) return null;

  const pick = (id: string, count: number) =>
    void getPersonPhotos(id).then((photos) => onPick(photos.slice(0, count)));

  return (
    <div className="mt-3">
      <div className="mb-2 text-xs text-muted">{label}</div>
      <div className="flex flex-wrap gap-2">
        {people.map((person) => {
          const spare = Math.min(person.photoCount, limit) - 1;
          return (
            <span key={person.id} className="flex items-center gap-1">
              <Chip onClick={() => pick(person.id, 1)}>{person.name}</Chip>
              {spare > 0 && (
                <button
                  type="button"
                  onClick={() => pick(person.id, limit)}
                  title={`${person.name}의 각도 사진을 ${spare}장 더 넣습니다. 장당 요금이 붙습니다.`}
                  className={`h-9 rounded-full border border-line bg-card px-3 text-xs font-semibold tabular-nums text-muted transition-colors hover:text-text ${FOCUS_RING}`}
                >
                  +{spare}각도
                </button>
              )}
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        한 장만 들어갑니다. 대상 사진과 얼굴 각도가 많이 다를 때만 각도를 더 넣으세요. 참조는
        두 번째 장부터 요금이 붙습니다.
      </p>
    </div>
  );
}
