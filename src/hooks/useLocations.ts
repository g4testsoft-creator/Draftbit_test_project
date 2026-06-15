/**
 * Hooks that wrap `src/api/locations.ts` with loading/error state and
 * AbortController-based cancellation so screens can render
 * declaratively.
 *
 * State is modelled as a discriminated union (`status: 'loading' |
 * 'success' | 'error'`) so impossible combinations — e.g. "loading and
 * error at the same time" — can't be expressed. Consumers narrow with
 * `if (state.status === 'success')` and the compiler enforces that
 * `state.data` is non-null inside that branch.
 *
 * The `error` variant carries a (possibly cached) `data` so that a
 * failed background refresh on the detail screen can keep stale data
 * on screen rather than tearing the UI down.
 *
 * Kept dependency-free (no React Query) to stay minimal for the MVP,
 * but the union and `reload` action are shaped so a migration to
 * TanStack Query / SWR remains mechanical.
 */

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

  // Resetting loading state in the reload handler (not in the effect)
  // satisfies React 19's `react-hooks/set-state-in-effect` rule.
  const reload = useCallback(() => {
    setState(loadingState());
    setReloadKey((k) => k + 1);
  }, []);

  return { ...state, reload };
}

export function useLocation(id: string | undefined) {
  // Seed from the in-memory cache so a tap from the map list renders
  // instantly without a loading flicker.
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
        setState((prev) =>
          // Keep any pre-rendered (cached) data on screen if a background
          // refresh fails — REST Countries data is essentially static so
          // it's better UX than tearing the screen down.
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
