import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

/**
 * Narrow Expo Router's `id` param (typed as `string | string[]`) down
 * to a single string. Returns `undefined` when the param is missing.
 */
export function useIdParam(): string | undefined {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  return useMemo(() => {
    const raw = params.id;
    if (!raw) return undefined;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params.id]);
}
