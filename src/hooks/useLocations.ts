/**
 * Hooks that wrap `src/api/locations.ts` with loading/error state and
 * AbortController-based cancellation so screens can render
 * declaratively.
 *
 * Kept dependency-free (no React Query) to stay minimal for the MVP,
 * but the hook signatures (`{ data, isLoading, error, reload }`) match
 * the major data libraries so a future migration is mechanical.
 */

import { useCallback, useEffect, useState } from 'react';

import { getLocation } from '@/api/cache';
import { fetchLocationById, fetchLocations } from '@/api/locations';
import type { Location } from '@/types/location';

type AsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
};

export function useLocations() {
  const [state, setState] = useState<AsyncState<Location[]>>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    fetchLocations(controller.signal)
      .then((data) => {
        if (cancelled) return;
        setState({ data, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadKey]);

  // Resetting loading state in the reload handler (not in the effect)
  // satisfies React 19's `react-hooks/set-state-in-effect` rule.
  const reload = useCallback(() => {
    setState({ data: null, isLoading: true, error: null });
    setReloadKey((k) => k + 1);
  }, []);

  return { ...state, reload };
}

export function useLocation(id: string | undefined) {
  // Seed from the in-memory cache so a tap from the map list renders
  // instantly without a loading flicker.
  const [state, setState] = useState<AsyncState<Location>>(() => {
    if (!id) {
      return { data: null, isLoading: false, error: new Error('Missing id') };
    }
    const cached = getLocation(id);
    return cached
      ? { data: cached, isLoading: false, error: null }
      : { data: null, isLoading: true, error: null };
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    let cancelled = false;

    fetchLocationById(id, controller.signal)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setState({
            data: null,
            isLoading: false,
            error: new Error('Location not found'),
          });
          return;
        }
        setState({ data, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        setState((prev) => ({
          // Keep any pre-rendered (cached) data on screen if a background
          // refresh fails — REST Countries data is essentially static so
          // it's better UX than tearing the screen down.
          data: prev.data,
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id, reloadKey]);

  const reload = useCallback(() => {
    setState({ data: null, isLoading: true, error: null });
    setReloadKey((k) => k + 1);
  }, []);

  return { ...state, reload };
}
