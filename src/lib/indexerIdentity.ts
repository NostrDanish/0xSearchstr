/**
 * Anonymous Indexing Identity (Search Index Protocol §10)
 *
 * Every browser/device automatically gets its own dedicated indexer keypair,
 * generated locally on first use. This key signs web-index observation events
 * (kind 39697) — it is NOT the user's personal Nostr identity, and the two
 * are never automatically linked.
 *
 * Properties:
 *  - generated locally (cryptographically random);
 *  - stored locally (localStorage), never uploaded as a private key;
 *  - pseudonymous: not cryptographically tied to the personal identity;
 *  - replaceable: regenerating creates a NEW indexer (old events keep the
 *    old key and their history; reputation does not transfer);
 *  - exportable only when the user explicitly asks.
 *
 * Storage note: the secret lives in localStorage (plaintext), like any
 * browser-side Nostr key. That is acceptable here because the key is
 * disposable and pseudonymous — it signs public document metadata, and
 * regenerating is cheap. It must never hold funds or personal identity.
 *
 * Privacy honesty: this guarantees KEY SEPARATION, not network anonymity.
 * Relay operators and network observers can still see IP/timing.
 */
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { nip19 } from 'nostr-tools';

/** localStorage key for the device indexer secret (hex). */
const LS_INDEXER_SECRET = 'sip:indexer:secret';

export interface IndexerIdentity {
  /** Secret key, 64-char lowercase hex. NEVER send anywhere. */
  secretHex: string;
  /** Public key, 64-char lowercase hex. Safe to display. */
  pubkeyHex: string;
  /** Public key, npub bech32. Safe to display. */
  npub: string;
  /** True when the key was generated during this call (first use / after regenerate). */
  fresh: boolean;
}

function isValidSecretHex(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
}

function readStored(): string | null {
  try {
    const raw = localStorage.getItem(LS_INDEXER_SECRET);
    return isValidSecretHex(raw) ? raw.toLowerCase() : null;
  } catch {
    return null;
  }
}

function writeStored(secretHex: string): void {
  try {
    localStorage.setItem(LS_INDEXER_SECRET, secretHex);
  } catch {
    // Storage unavailable (private mode etc.) — identity becomes session-only.
  }
}

function toIdentity(secretHex: string, fresh: boolean): IndexerIdentity {
  const pubkeyHex = bytesToHex(getPublicKey(hexToBytes(secretHex)));
  return {
    secretHex,
    pubkeyHex,
    npub: nip19.npubEncode(pubkeyHex),
    fresh,
  };
}

/**
 * Get this device's indexing identity, generating and persisting a fresh
 * keypair on first use. Deterministic across reloads in the same browser
 * profile; different profiles get different keys.
 */
export function getIndexerIdentity(): IndexerIdentity {
  const existing = readStored();
  if (existing) return toIdentity(existing, false);

  const secretHex = bytesToHex(generateSecretKey());
  writeStored(secretHex);
  return toIdentity(secretHex, true);
}

/**
 * Regenerate the indexing identity. This creates a NEW indexer:
 * previously published events stay signed by the old key, and no
 * reputation/history carries over. The old key is discarded.
 */
export function regenerateIndexerIdentity(): IndexerIdentity {
  const secretHex = bytesToHex(generateSecretKey());
  writeStored(secretHex);
  return toIdentity(secretHex, true);
}

/**
 * Export the indexing secret as an nsec (bech32). Handle with care —
 * this is the only time the secret should leave the module.
 */
export function exportIndexerNsec(): string {
  const identity = getIndexerIdentity();
  return nip19.nsecEncode(hexToBytes(identity.secretHex));
}

/** The device's indexer pubkey (hex), generating the identity if needed. */
export function getIndexerPubkey(): string {
  return getIndexerIdentity().pubkeyHex;
}

/** The raw secret key bytes for signing. Never expose beyond signing. */
export function getIndexerSecretKey(): Uint8Array {
  return hexToBytes(getIndexerIdentity().secretHex);
}
