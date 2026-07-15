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
 * Relays that support NIP-50 search queries.
 * These are queried in parallel for every Nostr search.
 *
 * relay.nostr.band — the most comprehensive NIP-50 search relay
 * relay.ditto.pub — Ditto relay with search support
 * search.nos.today — NOS search relay
 * relay.noswhere.com — Noswhere relay with NIP-50
 */
export const SEARCH_RELAYS = [
  'wss://relay.nostr.band/',
  'wss://relay.ditto.pub/',
  'wss://search.nos.today/',
  'wss://relay.noswhere.com/',
];
