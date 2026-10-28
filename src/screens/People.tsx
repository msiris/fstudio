import { Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import Card from '../components/Card';
import ImageDrop from '../components/ImageDrop';
import Notice from '../components/Notice';
import PrimaryButton from '../components/PrimaryButton';
import SectionLabel from '../components/SectionLabel';
import { FOCUS_RING } from '../components/ui';
import { usePeople } from '../hooks/usePeople';
import { getPersonPhotos, MAX_PERSON_PHOTOS, type Person } from '../lib/people';

/** 사진 여러 장을 넣고 빼는 그리드. 등록과 수정이 같은 화면을 쓴다. */
function PhotoGrid({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo, i) => (
        <ImageDrop
          key={i}
          value={photo}
          onChange={() => onChange(photos.filter((_, j) => j !== i))}
          label={`사진 ${i + 1}`}
          size="sm"
          removeLabel={`사진 ${i + 1} 제거`}
        />
      ))}
      {photos.length < MAX_PERSON_PHOTOS && (
        <ImageDrop
          value={null}
          onChange={(v) => v && onChange([...photos, v])}
          label="사진 추가"
          size="sm"
        />
      )}
    </div>
  );
}

function PersonCard({
  person,
  onSave,
  onRemove,
}: {
  person: Person;
  onSave: (input: { id: string; name: string; photos: string[] }) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(person.name);
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const expand = async () => {
    if (!open && photos === null) setPhotos(await getPersonPhotos(person.id));
    setOpen((v) => !v);
  };

  return (
    <Card className="space-y-3">
      <button
        type="button"
        onClick={() => void expand()}
        className={`flex w-full items-center gap-3 text-left ${FOCUS_RING}`}
      >
        <img src={person.thumb} alt="" className="h-12 w-12 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-text">{person.name}</div>
          <div className="text-xs text-muted">사진 {person.photoCount}장</div>
        </div>
        <span className="text-xs text-muted">{open ? '접기' : '수정'}</span>
      </button>

      {open && photos !== null && (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="이름"
            className={`h-field w-full rounded-card border border-line bg-cardAlt px-3 text-sm text-text ${FOCUS_RING}`}
          />
          <PhotoGrid photos={photos} onChange={setPhotos} />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving || photos.length === 0}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave({ id: person.id, name, photos });
                  setOpen(false);
                } finally {
                  setSaving(false);
                }
              }}
              className={`flex h-field flex-1 items-center justify-center rounded-card bg-cardAlt text-sm font-medium text-text ${FOCUS_RING}`}
            >
              {saving ? '저장 중' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirming) onRemove(person.id);
                else {
                  setConfirming(true);
                  setTimeout(() => setConfirming(false), 3000);
                }
              }}
              aria-label={confirming ? '삭제 확인' : '삭제'}
              className={`flex h-field shrink-0 items-center justify-center gap-2 rounded-card bg-cardAlt px-4 text-sm font-medium ${FOCUS_RING} ${
                confirming ? 'text-accent' : 'text-muted hover:text-text'
              }`}
            >
              <Trash2 size={15} /> {confirming ? '정말요?' : ''}
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

export default function People() {
  const { people, loading, save, remove } = usePeople();
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const add = async () => {
    setSaving(true);
    try {
      await save({ name, photos });
      setName('');
      setPhotos([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Notice>
        같은 사람을 여러 각도로 넣어두세요. 정면·측면·비스듬히 2~3장이면 얼굴의 입체
        구조를 모델이 파악해서, 각도가 다른 장면에도 같은 사람으로 들어갑니다.
      </Notice>

      <Card className="space-y-3">
        <SectionLabel icon={UserPlus}>인물 등록</SectionLabel>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          aria-label="새 인물 이름"
          className={`h-field w-full rounded-card border border-line bg-cardAlt px-3 text-sm text-text placeholder:text-muted ${FOCUS_RING}`}
        />
        <PhotoGrid photos={photos} onChange={setPhotos} />
        <PrimaryButton disabled={photos.length === 0} busy={saving} onClick={() => void add()}>
          등록
        </PrimaryButton>
      </Card>

      {loading && <p className="text-xs text-muted">불러오는 중</p>}

      {!loading && people.length === 0 && (
        <p className="text-xs text-muted">등록한 인물이 아직 없습니다.</p>
      )}

      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          onSave={save}
          onRemove={(id) => void remove(id)}
        />
      ))}
    </div>
  );
}
