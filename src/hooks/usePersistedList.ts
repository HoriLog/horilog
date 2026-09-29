import { useEffect, useRef, useState } from 'react';

/**
 * State backed by OperationalStorage: loads once on mount and persists every later change.
 * Screens use this so imported data shows up and user actions survive a page reload.
 */
export function usePersistedList<T>(load: () => T[], save: (data: T[]) => void) {
  const [items, setItems] = useState<T[]>(load);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    save(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  return [items, setItems] as const;
}
