'use client';

import { useState, useCallback } from 'react';

export function useAiGenerate<TInput, TOutput>(endpoint: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TOutput | null>(null);

  const generate = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `エラー: ${res.status}`);
        }
        const data = (await res.json()) as TOutput;
        setResult(data);
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : '生成に失敗しました');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { generate, isLoading, error, result, reset };
}
