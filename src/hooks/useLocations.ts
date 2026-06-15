import { useCallback, useEffect, useState } from 'react';

import { getLocation } from '@/api/cache';
import { fetchLocationById, fetchLocations } from '@/api/locations';
import type { Location } from '@/types/location';

export type AsyncState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: T | null; error: Error };

const loadingState = <T>(): AsyncState<T> => ({
  status: 'loading',
  data: null,
  error: null,
});

const successState = <T>(data: T): AsyncState<T> => ({
  status: 'success',
  data,
  error: null,
});

const errorState = <T>(error: Error, data: T | null = null): AsyncState<T> => ({
  status: 'error',
  data,
  error,
});

export function useLocations() {
  const [state, setState] = useState<AsyncState<Location[]>>(loadingState);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    fetchLocations(controller.signal)
      .then((data) => {
        if (cancelled) return;
        setState(successState(data));
      })
      .catch((error: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        setState(errorState(error instanceof Error ? error : new Error(String(error))));
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadKey]);

  // Done here (not in the effect) to satisfy react-hooks/set-state-in-effect.
  const reload = useCallback(() => {
    setState(loadingState());
    setReloadKey((k) => k + 1);
  }, []);

  return { ...state, reload };
}

export function useLocation(id: string | undefined) {
  // Seed from cache so Map → Detail renders without a loading flicker.
  const [state, setState] = useState<AsyncState<Location>>(() => {
    if (!id) return errorState(new Error('Missing id'));
    const cached = getLocation(id);
    return cached ? successState(cached) : loadingState();
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
          setState(errorState(new Error('Location not found')));
          return;
        }
        setState(successState(data));
      })
      .catch((error: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        // Keep stale data on screen if a background refresh fails.
        setState((prev) =>
          errorState(
            error instanceof Error ? error : new Error(String(error)),
            prev.data,
          ),
        );
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id, reloadKey]);

  const reload = useCallback(() => {
    setState(loadingState());
    setReloadKey((k) => k + 1);
  }, []);

  return { ...state, reload };
}
