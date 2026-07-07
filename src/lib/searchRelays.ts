import { NRelay1 } from '@nostrify/nostrify';

/** Dedicated NIP-50 search relay connections, separate from the main pool. */
const relayCache = new Map<string, NRelay1>();

export function getSearchRelay(url: string): NRelay1 {
  let relay = relayCache.get(url);
  if (!relay) {
    relay = new NRelay1(url);
    relayCache.set(url, relay);
  }
  return relay;
}
