import { describe, it, expect, beforeEach } from 'vitest';

import {
  INDEX_RELAYS,
  SEARCH_RELAYS,
  GIT_RELAYS,
  WIKI_RELAYS,
  getIndexRelayUrls,
  getSearchRelayUrls,
  getHiddenIndexRelays,
  hideDefaultIndexRelay,
  restoreDefaultIndexRelay,
  restoreAllDefaultIndexRelays,
  addCustomIndexRelay,
  removeCustomIndexRelay,
  hideDefaultSearchRelay,
  restoreDefaultSearchRelay,
  normalizeRelayUrl,
  toSecureRelayUrl,
} from './appRelays';

describe('relay pools', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ships the UNCAGED ecosystem index defaults (incl. the Tor relay)', () => {
    expect(INDEX_RELAYS).toContain('wss://relay-na1.metanomalist.com/');
    expect(INDEX_RELAYS).toContain('wss://jskitty.cat/nostr');
    expect(INDEX_RELAYS).toContain('wss://nostr.hifish.org/');
    expect(INDEX_RELAYS).toContain('wss://search.nos.today/');
    expect(INDEX_RELAYS).toContain('wss://relay.primal.net/');
    expect(INDEX_RELAYS).toContain('wss://relay.ditto.pub/');
    // The Tor index relay (ws://, reachable over Tor only).
    expect(INDEX_RELAYS.some((u) => u.startsWith('ws://') && u.includes('.onion'))).toBe(true);
  });

  it('ships git + wiki read-only pools', () => {
    expect(GIT_RELAYS.length).toBeGreaterThan(0);
    expect(WIKI_RELAYS).toContain('wss://relay.wikifreedia.xyz/');
    expect(SEARCH_RELAYS.length).toBeGreaterThan(0);
  });

  it('every default relay is hideable and restorable', () => {
    const target = INDEX_RELAYS[0];
    hideDefaultIndexRelay(target);
    expect(getIndexRelayUrls()).not.toContain(target);
    expect(getHiddenIndexRelays()).toContain(target);
    // The constant itself is untouched (restore always possible).
    expect(INDEX_RELAYS).toContain(target);

    restoreDefaultIndexRelay(target);
    expect(getIndexRelayUrls()).toContain(target);
    expect(getHiddenIndexRelays()).toEqual([]);
  });

  it('restoreAll brings back every hidden default', () => {
    hideDefaultIndexRelay(INDEX_RELAYS[0]);
    hideDefaultIndexRelay(INDEX_RELAYS[1]);
    hideDefaultSearchRelay(SEARCH_RELAYS[0]);
    restoreAllDefaultIndexRelays();
    expect(getIndexRelayUrls()).toEqual([...INDEX_RELAYS]);
    restoreDefaultSearchRelay(SEARCH_RELAYS[0]);
    expect(getSearchRelayUrls()).toContain(SEARCH_RELAYS[0]);
  });

  it('re-adding a hidden default restores it instead of duplicating', () => {
    const target = INDEX_RELAYS[2];
    hideDefaultIndexRelay(target);
    expect(getIndexRelayUrls()).not.toContain(target);

    const added = addCustomIndexRelay(target);
    expect(added).toBe(target);
    expect(getIndexRelayUrls()).toContain(target);
    expect(getHiddenIndexRelays()).toEqual([]);
  });

  it('custom index relays append after active defaults, deduped', () => {
    const custom = addCustomIndexRelay('https://my-relay.example');
    expect(custom).toBe('wss://my-relay.example/');
    const pool = getIndexRelayUrls();
    expect(pool[pool.length - 1]).toBe('wss://my-relay.example/');
    expect(new Set(pool).size).toBe(pool.length);

    removeCustomIndexRelay('wss://my-relay.example/');
    expect(getIndexRelayUrls()).not.toContain('wss://my-relay.example/');
  });

  it('normalizes onion hosts to ws:// by default', () => {
    expect(normalizeRelayUrl('abc123.onion')).toBe('ws://abc123.onion/');
    expect(normalizeRelayUrl('wss://abc123.onion/')).toBe('wss://abc123.onion/');
    expect(normalizeRelayUrl('relay.example.com')).toBe('wss://relay.example.com/');
  });

  it('preserves relay paths', () => {
    expect(normalizeRelayUrl('wss://jskitty.cat/nostr')).toBe('wss://jskitty.cat/nostr');
  });

  it('never upgrades ws:// .onion relays to wss:// (they are ws-only by nature)', () => {
    const onion = 'ws://acuy3mjnv26tkyaaucndlxmg2ocntz4rtebhavk57vgruozm42iaznqd.onion/';
    expect(toSecureRelayUrl(onion)).toBe(onion);
  });

  it('excludes default .onion relays from the effective pool on clearnet origins', () => {
    // jsdom runs on http://localhost — a clearnet (non-.onion) origin.
    const onion = INDEX_RELAYS.find((u) => u.includes('.onion'))!;
    expect(onion).toBeDefined();
    expect(getIndexRelayUrls()).not.toContain(onion);
    // The constant still lists it (it activates on .onion deployments).
    expect(INDEX_RELAYS).toContain(onion);
  });

  it('user-added custom .onion relays are always attempted (explicit choice)', () => {
    const custom = addCustomIndexRelay('ws://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.onion/');
    expect(custom).toBe('ws://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.onion/');
    expect(getIndexRelayUrls()).toContain(custom!);
  });
});
