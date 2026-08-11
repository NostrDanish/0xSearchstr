import { describe, it, expect, beforeEach } from 'vitest';

import {
  SEARCH_RELAYS,
  getSearchRelayUrls,
  getActiveDefaultSearchRelays,
  getRemovedDefaultSearchRelays,
  removeDefaultSearchRelay,
  restoreDefaultSearchRelay,
  addCustomSearchRelay,
  removeCustomSearchRelay,
  normalizeRelayUrl,
} from './appRelays';

describe('search relay pool', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ships the UNCAGED ecosystem defaults', () => {
    expect(SEARCH_RELAYS).toContain('wss://relay-na1.metanomalist.com/');
    expect(SEARCH_RELAYS).toContain('wss://jskitty.cat/nostr');
    expect(SEARCH_RELAYS).toContain('wss://nostr.hifish.org/');
    expect(SEARCH_RELAYS).toContain('wss://search.nos.today/');
    expect(SEARCH_RELAYS).toContain('wss://relay.primal.net/');
    expect(SEARCH_RELAYS).toContain('wss://relay.ditto.pub/');
    // The Tor index relay (ws://, reachable over Tor only).
    expect(SEARCH_RELAYS.some((u) => u.startsWith('ws://') && u.includes('.onion'))).toBe(true);
  });

  it('returns all defaults when nothing is removed', () => {
    expect(getSearchRelayUrls()).toEqual([...SEARCH_RELAYS]);
    expect(getRemovedDefaultSearchRelays()).toEqual([]);
  });

  it('removes a default relay from the effective pool', () => {
    const target = SEARCH_RELAYS[0];
    removeDefaultSearchRelay(target);
    expect(getSearchRelayUrls()).not.toContain(target);
    expect(getActiveDefaultSearchRelays()).not.toContain(target);
    expect(getRemovedDefaultSearchRelays()).toContain(target);
    // The constant itself is untouched (restore always possible).
    expect(SEARCH_RELAYS).toContain(target);
  });

  it('restores a removed default', () => {
    const target = SEARCH_RELAYS[1];
    removeDefaultSearchRelay(target);
    restoreDefaultSearchRelay(target);
    expect(getSearchRelayUrls()).toContain(target);
    expect(getRemovedDefaultSearchRelays()).toEqual([]);
  });

  it('remove is idempotent and ignores non-defaults', () => {
    const target = SEARCH_RELAYS[0];
    removeDefaultSearchRelay(target);
    removeDefaultSearchRelay(target);
    expect(getRemovedDefaultSearchRelays()).toEqual([target]);
    removeDefaultSearchRelay('wss://not-a-default.example/');
    expect(getRemovedDefaultSearchRelays()).toEqual([target]);
  });

  it('re-adding a removed default restores it instead of duplicating as custom', () => {
    const target = SEARCH_RELAYS[2];
    removeDefaultSearchRelay(target);
    expect(getSearchRelayUrls()).not.toContain(target);

    const added = addCustomSearchRelay(target);
    expect(added).toBe(target);
    expect(getSearchRelayUrls()).toContain(target);
    expect(getRemovedDefaultSearchRelays()).toEqual([]);
  });

  it('custom relays append after active defaults, deduped', () => {
    const custom = addCustomSearchRelay('https://my-relay.example');
    expect(custom).toBe('wss://my-relay.example/');
    const pool = getSearchRelayUrls();
    expect(pool[pool.length - 1]).toBe('wss://my-relay.example/');
    expect(new Set(pool).size).toBe(pool.length);

    removeCustomSearchRelay('wss://my-relay.example/');
    expect(getSearchRelayUrls()).not.toContain('wss://my-relay.example/');
  });

  it('normalizes onion hosts to ws:// by default', () => {
    expect(normalizeRelayUrl('abc123.onion')).toBe('ws://abc123.onion/');
    expect(normalizeRelayUrl('wss://abc123.onion/')).toBe('wss://abc123.onion/');
    expect(normalizeRelayUrl('relay.example.com')).toBe('wss://relay.example.com/');
  });

  it('preserves relay paths', () => {
    expect(normalizeRelayUrl('wss://jskitty.cat/nostr')).toBe('wss://jskitty.cat/nostr');
  });
});
