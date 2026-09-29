import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast(durationMs = 3500) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback(
    (msg: string) => {
      setMessage(msg);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs]
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return [message, show] as const;
}
