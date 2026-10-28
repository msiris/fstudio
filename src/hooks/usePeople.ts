import { useCallback, useEffect, useState } from 'react';
import { listPeople, removePerson, savePerson, type Person } from '../lib/people';

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setPeople(await listPeople());
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (input: { id?: string; name: string; photos: string[] }) => {
      await savePerson(input);
      await reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await removePerson(id);
      await reload();
    },
    [reload],
  );

  return { people, loading, save, remove, reload };
}
