import type { RelayMetadata } from '@/contexts/AppContext';

/**
 * App default relays. Used as the initial `relayMetadata` for new users and as
 * a fallback when the user has no NIP-65 relay list configured (e.g. during
 * nostrconnect handshakes before any user relays have been loaded).
 */
export const APP_RELAYS: RelayMetadata = {
  relays: [
    { url: 'wss://relay.ditto.pub/', read: true, write: true },
    { url: 'wss://relay.nostr.band/', read: true, write: false },
    { url: 'wss://relay.primal.net/', read: false, write: true },
    { url: 'wss://relay.damus.io/', read: false, write: true },
  ],
  updatedAt: 0,
};

/**
 * Relays that power Nostr search + the shared web index (SIP-01).
 * These are queried in parallel for every search, and index observations
 * are published to them.
 *
 * The default pool mixes the UNCAGED ecosystem relays (SIP-01-aware index
 * relays), community NIP-50 search relays, and one Tor onion relay (only
 * reachable over Tor — it fails fast and silently elsewhere):
 *
 * relay-na1.metanomalist.com — UNCAGED SIP-01 index relay (NIP-50 operators)
 * relay.ditto.pub            — Ditto relay with search support
 * jskitty.cat/nostr          — community NIP-50 search relay
 * acuy3m…nqd.onion           — Tor index relay (darknet federation)
 * search.nos.today           — NOS search relay
 * relay.primal.net           — Primal relay (index storage/replication)
 * nostr.hifish.org           — community relay
 * relay.nostr.band           — the most comprehensive NIP-50 search relay
 * relay.noswhere.com         — Noswhere relay with NIP-50
 *
 * EVERY default is user-removable (Settings → Search Relays): removed
 * defaults live in localStorage and can be restored individually.
 */
export const SEARCH_RELAYS = [
  'wss://relay-na1.metanomalist.com/',
  'wss://relay.ditto.pub/',
  'wss://jskitty.cat/nostr',
  'ws://acuy3mjnv26tkyaaucndlxmg2ocntz4rtebhavk57vgruozm42iaznqd.onion/',
  'wss://search.nos.today/',
  'wss://relay.primal.net/',
  'wss://nostr.hifish.org/',
  'wss://relay.nostr.band/',
  'wss://relay.noswhere.com/',
];

/* ------------------------------------------------------------------ */
/* Custom search relays (user-managed, localStorage)                   */
/* ------------------------------------------------------------------ */

const LS_CUSTOM_SEARCH_RELAYS = '0xsearchstr:search-relays:custom';
const LS_REMOVED_DEFAULT_RELAYS = '0xsearchstr:search-relays:removed-defaults';

function readCustomSearchRelays(): string[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_SEARCH_RELAYS);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

function writeCustomSearchRelays(urls: string[]): void {
  try {
    localStorage.setItem(LS_CUSTOM_SEARCH_RELAYS, JSON.stringify(urls));
  } catch {
    // Storage unavailable — non-fatal.
  }
}

function readRemovedDefaults(): string[] {
  try {
    const raw = localStorage.getItem(LS_REMOVED_DEFAULT_RELAYS);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

function writeRemovedDefaults(urls: string[]): void {
  try {
    localStorage.setItem(LS_REMOVED_DEFAULT_RELAYS, JSON.stringify(urls));
  } catch {
    // Storage unavailable — non-fatal.
  }
}

/** Normalize a relay URL: ws/wss only, with trailing slash (matches SEARCH_RELAYS style). */
export function normalizeRelayUrl(input: string): string | null {
  let url = input.trim();
  if (!url) return null;
  if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
    // .onion relays are typically ws:// (no CA-issued TLS); everything else wss://.
    url = url.includes('.onion') ? `ws://${url}` : `wss://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'wss:' && parsed.protocol !== 'ws:') return null;
    // Canonical form: origin + pathname, trailing slash on bare hosts.
    const path = parsed.pathname === '/' ? '/' : parsed.pathname;
    return `${parsed.protocol}//${parsed.host}${path}`;
  } catch {
    return null;
  }
}

/** Get the user's custom search relays. */
export function getCustomSearchRelays(): string[] {
  return readCustomSearchRelays();
}

/** Add a custom search relay. Returns the normalized URL, or null if invalid. */
export function addCustomSearchRelay(input: string): string | null {
  const normalized = normalizeRelayUrl(input);
  if (!normalized) return null;
  // Re-adding a removed default restores it instead of creating a custom entry.
  if ((SEARCH_RELAYS as readonly string[]).includes(normalized)) {
    restoreDefaultSearchRelay(normalized);
    return normalized;
  }
  const current = readCustomSearchRelays();
  if (!current.includes(normalized)) {
    writeCustomSearchRelays([...current, normalized]);
  }
  return normalized;
}

/** Remove a custom search relay. */
export function removeCustomSearchRelay(url: string): void {
  writeCustomSearchRelays(readCustomSearchRelays().filter((u) => u !== url));
}

/* ------------------------------------------------------------------ */
/* Removable defaults                                                  */
/* ------------------------------------------------------------------ */

/** Remove a default relay from the effective pool (restorable). */
export function removeDefaultSearchRelay(url: string): void {
  const removed = readRemovedDefaults();
  if (!removed.includes(url)) writeRemovedDefaults([...removed, url]);
}

/** Restore a previously removed default relay. */
export function restoreDefaultSearchRelay(url: string): void {
  writeRemovedDefaults(readRemovedDefaults().filter((u) => u !== url));
}

/** Default relays the user has removed. */
export function getRemovedDefaultSearchRelays(): string[] {
  return readRemovedDefaults().filter((u) => (SEARCH_RELAYS as readonly string[]).includes(u));
}

/** The active default relays (defaults minus user-removed). */
export function getActiveDefaultSearchRelays(): string[] {
  const removed = new Set(readRemovedDefaults());
  return SEARCH_RELAYS.filter((u) => !removed.has(u));
}

/**
 * The effective search relay pool: active defaults first, then the user's
 * custom relays (deduped). This ONE list drives NIP-50 search, web-index
 * reads, cache reads, and index publishing — and every entry is
 * user-changeable.
 */
export function getSearchRelayUrls(): string[] {
  const seen = new Set<string>();
  const pool: string[] = [];
  for (const url of [...getActiveDefaultSearchRelays(), ...readCustomSearchRelays()]) {
    if (!seen.has(url)) {
      seen.add(url);
      pool.push(url);
    }
  }
  return pool;
}
