/**
 * Search relay pool hook — React state over the search/index relay pool
 * (active defaults + user customs), with Nostra-style latency testing:
 * ping each relay with a tiny query and time the round-trip.
 *
 * Every relay is user-changeable: customs can be added/removed, and
 * defaults can be removed (they land in a restorable removed list) or
 * restored. The pool drives NIP-50 search, web-index reads, cache reads,
 * and index publishing.
 */
import { useCallback, useState } from 'react';

import {
  SEARCH_RELAYS,
  getCustomSearchRelays,
  getRemovedDefaultSearchRelays,
  addCustomSearchRelay,
  removeCustomSearchRelay,
  removeDefaultSearchRelay,
  restoreDefaultSearchRelay,
} from '@/lib/appRelays';
import { getSearchRelay } from '@/lib/searchRelays';

export type SearchRelayOrigin = 'default' | 'custom';
export type SearchRelayStatus = 'untested' | 'testing' | 'ok' | 'error';

export interface SearchRelayEntry {
  url: string;
  origin: SearchRelayOrigin;
  status: SearchRelayStatus;
  latencyMs?: number;
}

function buildPool(): { active: SearchRelayEntry[]; removedDefaults: string[] } {
  const removed = new Set(getRemovedDefaultSearchRelays());
  const active: SearchRelayEntry[] = [];
  const seen = new Set<string>();

  for (const url of SEARCH_RELAYS) {
    if (removed.has(url) || seen.has(url)) continue;
    seen.add(url);
    active.push({ url, origin: 'default', status: 'untested' });
  }
  for (const url of getCustomSearchRelays()) {
    if (seen.has(url)) continue;
    seen.add(url);
    active.push({ url, origin: 'custom', status: 'untested' });
  }

  return { active, removedDefaults: SEARCH_RELAYS.filter((u) => removed.has(u)) };
}

export function useSearchRelayPool() {
  const [state, setState] = useState(buildPool);
  const [testing, setTesting] = useState(false);

  const addRelay = useCallback((input: string): string | null => {
    const added = addCustomSearchRelay(input);
    if (added) setState(buildPool());
    return added;
  }, []);

  /** Remove any relay — custom or default (defaults stay restorable). */
  const removeRelay = useCallback((url: string) => {
    if ((SEARCH_RELAYS as readonly string[]).includes(url)) {
      removeDefaultSearchRelay(url);
    } else {
      removeCustomSearchRelay(url);
    }
    setState(buildPool());
  }, []);

  /** Restore a removed default relay. */
  const restoreRelay = useCallback((url: string) => {
    restoreDefaultSearchRelay(url);
    setState(buildPool());
  }, []);

  /** Ping every relay with a limit-1 query and record latency/status. */
  const testRelays = useCallback(async () => {
    setTesting(true);
    setState((prev) => ({
      ...prev,
      active: prev.active.map((r) => ({ ...r, status: 'testing' as const })),
    }));

    await Promise.allSettled(
      state.active.map(async (entry) => {
        const start = performance.now();
        try {
          const relay = getSearchRelay(entry.url);
          await relay.query([{ kinds: [1], limit: 1 }], {
            signal: AbortSignal.timeout(5000),
          });
          const latencyMs = Math.round(performance.now() - start);
          setState((prev) => ({
            ...prev,
            active: prev.active.map((r) =>
              r.url === entry.url ? { ...r, status: 'ok' as const, latencyMs } : r,
            ),
          }));
        } catch {
          setState((prev) => ({
            ...prev,
            active: prev.active.map((r) =>
              r.url === entry.url ? { ...r, status: 'error' as const, latencyMs: undefined } : r,
            ),
          }));
        }
      }),
    );

    setTesting(false);
  }, [state.active]);

  return {
    pool: state.active,
    removedDefaults: state.removedDefaults,
    testing,
    testRelays,
    addRelay,
    removeRelay,
    restoreRelay,
  };
}
