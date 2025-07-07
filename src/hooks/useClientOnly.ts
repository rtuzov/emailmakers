/**
 * 🔧 CLIENT-ONLY HOOK
 * 
 * Предотвращает hydration mismatches для client-only компонентов
 * Следует лучшим практикам React 18+ и Next.js
 */

import { useEffect, useState } from 'react';

/**
 * Hook для безопасного рендеринга client-only контента
 * Предотвращает hydration errors между server и client
 */
export function useClientOnly(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Выполняется только на клиенте после монтирования
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook для загрузки данных только на клиенте
 * Предотвращает несоответствие между server/client state
 */
export function useClientData<T>(
  fetchData: () => Promise<T>,
  fallbackData?: T
): {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  isClient: boolean;
} {
  const [data, setData] = useState<T | undefined>(fallbackData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isClient = useClientOnly();

  useEffect(() => {
    if (!isClient) return;

    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetchData()
      .then((result) => {
        if (!isCancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isClient]); // Зависимость только от isClient

  return { data, loading, error, isClient };
}