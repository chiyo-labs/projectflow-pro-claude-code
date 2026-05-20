'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  // SSR 側と初期値を一致させ Hydration Error を防ぐ
  const [state, setState] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // startTransition でラップしてカスケードレンダリングを回避
    startTransition(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          setState(JSON.parse(raw) as T);
        }
      } catch {
        // parse 失敗時はデフォルト値のまま
      }
      setIsHydrated(true);
    });
  }, [key]);

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setState(prev => {
        const next =
          typeof updater === 'function'
            ? (updater as (p: T) => T)(prev)
            : updater;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // 書き込み失敗は無視
        }
        return next;
      });
    },
    [key],
  );

  return [state, setValue, isHydrated] as const;
}
