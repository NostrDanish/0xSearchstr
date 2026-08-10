/**
 * Search Index Protocol (SIP-01) — reference implementation.
 * Canonical spec v1.1: https://github.com/NostrDanish/SIP-01
 * (public/spec/SIP-01.md). Byte-compatible with the §13 test vectors.
 *
 * One addressable event (kind 39697) per indexed web document:
 *   d = "widx:" + sha256(normalized_url)[0:32]   ← URL identity (§3)
 *   u = canonical URL (§7 normalization)
 *   x = sha256(title + "\n" + description)       ← content identity (§8)
 *   v = "1"                                      ← schema version (§10)
 *   content = { title, description?, image? }
 *
 * The event NEVER contains a search query, a user identity, or anything
 * about who surfaced the page. Indexer identity = the event pubkey (§14).
 */
import type { NostrEvent } from '@nostrify/nostrify';

import type { SearchResult } from '@/lib/providers/types';

/** Web Index Observation kind (addressable). Draft allocation — see spec. */
export const WEB_INDEX_KIND = 39697;

/** Current schema version. */
export const WEB_INDEX_SCHEMA_VERSION = '1';

/** d-tag namespace prefix. */
export const WEB_INDEX_D_PREFIX = 'widx:';

/* Limits (hard caps, spec §5/§6) */
const MAX_TITLE_LEN = 300;
const MAX_DESCRIPTION_LEN = 1000;
const MAX_IMAGE_LEN = 2048;
const MAX_URL_LEN = 2048;
const MAX_ALT_LEN = 1000;
const MAX_TAGS = 8;
const MAX_SOURCE_LEN = 100;

/** Topic tag shape per spec §6: lowercase keyword, 1–100 chars. */
const TOPIC_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;

/** Tracking parameters stripped during normalization (spec §8.5). */
const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'dclid', 'mc_cid', 'mc_eid', 'igshid', 'ref_src',
  'spm', 'si',
]);

/**
 * Normalize a URL for document identity (spec §8).
 * Implementations MUST produce byte-identical output for the same page.
 * Returns null for invalid or disallowed (non-http/https) URLs.
 */
export function normalizeIndexUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  // Lowercase host handled by URL; strip leading www.
  url.hostname = url.hostname.replace(/^www\./, '');

  // Default ports.
  if ((url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')) {
    url.port = '';
  }

  // Fragment never identifies content for indexing purposes.
  url.hash = '';

  // Strip tracking params, keep everything else, sort deterministically.
  if (url.search) {
    const params = [...url.searchParams.entries()]
      .filter(([key]) => !TRACKING_PARAMS.has(key.toLowerCase()))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    url.search = '';
    for (const [key, value] of params) url.searchParams.append(key, value);
  }

  // Trailing slash on non-root paths.
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

/** SHA-256 hex (lowercase) of a UTF-8 string. */
async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Document identity for a URL: "widx:" + first 32 hex chars of sha256(normalized). */
export async function documentId(normalizedUrl: string): Promise<string> {
  const hex = await sha256Hex(normalizedUrl);
  return `${WEB_INDEX_D_PREFIX}${hex.slice(0, 32)}`;
}

/** Content hash per spec §9: sha256(title + "\n" + description). */
export async function contentHash(title: string, description: string): Promise<string> {
  return sha256Hex(`${title}\n${description}`);
}

/** Input for building an observation event. */
export interface IndexObservationInput {
  url: string;
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
  language?: string;
  published?: number;
  source?: string; // indexer software id, e.g. "0xsearchstr-web/1"
  /* Extension tags (spec §9.2) — optional, ignored by unaware consumers. */
  type?: string;     // page | article | repository | video | image | file | …
  platform?: string; // github | gitlab | youtube | …
  network?: string;  // clearnet | tor | i2p | …
  mime?: string;     // e.g. application/pdf
  country?: string;  // ISO 3166-1 alpha-2, uppercased
}

export interface UnsignedIndexEvent {
  kind: number;
  content: string;
  tags: string[][];
}

/**
 * Build an unsigned web-index observation event.
 * Returns null when the input is unusable (bad URL, empty title).
 */
export async function buildIndexEvent(
  input: IndexObservationInput,
): Promise<UnsignedIndexEvent | null> {
  const normalized = normalizeIndexUrl(input.url);
  if (!normalized || normalized.length > MAX_URL_LEN) return null;

  const title = input.title.trim().slice(0, MAX_TITLE_LEN);
  if (!title) return null;

  const description = (input.description ?? '').trim().slice(0, MAX_DESCRIPTION_LEN);

  let image = (input.image ?? '').trim().slice(0, MAX_IMAGE_LEN);
  if (image && !/^https:\/\//i.test(image)) image = ''; // images: https only

  const d = await documentId(normalized);
  // x is computed over the TRUNCATED title/description we actually publish,
  // so relays can verify it against the content (spec §8 + guide §1.4).
  const x = await contentHash(title, description);

  // Topics: lowercase, keyword-shaped per spec §6, deduped, max 8.
  const topics = (input.tags ?? [])
    .map((t) => t.toLowerCase().trim().replace(/\s+/g, '-'))
    .filter((t) => TOPIC_RE.test(t))
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, MAX_TAGS);

  // Language: ISO 639-1 two-letter shape (spec §6).
  const langRaw = (input.language ?? '').trim().toLowerCase();
  const language = /^[a-z]{2}$/.test(langRaw) ? langRaw : '';

  const content: Record<string, string> = { title };
  if (description) content.description = description;
  if (image) content.image = image;

  // Keyword-shaped extension values (spec §9.1.5).
  const kw = (v?: string) => {
    const s = (v ?? '').trim().toLowerCase();
    return /^[a-z0-9][a-z0-9_-]{0,49}$/.test(s) ? s : '';
  };
  const country = (input.country ?? '').trim().toUpperCase();

  const tags: string[][] = [
    ['d', d],
    ['u', normalized],
    ...topics.map((t): string[] => ['t', t]),
    ...(language ? [['l', language] as string[]] : []),
    ['x', x],
    ['v', WEB_INDEX_SCHEMA_VERSION],
    ...(input.published ? [['published', String(Math.floor(input.published))] as string[]] : []),
    ...(input.source ? [['source', input.source.trim().slice(0, MAX_SOURCE_LEN)] as string[]] : []),
    // Extension tags (§9.2) — all optional.
    ...(kw(input.type) ? [['type', kw(input.type)] as string[]] : []),
    ...(kw(input.platform) ? [['platform', kw(input.platform)] as string[]] : []),
    ...(kw(input.network) ? [['network', kw(input.network)] as string[]] : []),
    ...(/^[A-Z]{2}$/.test(country) ? [['country', country] as string[]] : []),
    ...(input.mime && /^[a-z0-9][a-z0-9!#$&^_+-]*\/[a-z0-9][a-z0-9!#$&^_+.-]*$/i.test(input.mime.trim())
      ? [['mime', input.mime.trim().toLowerCase()] as string[]] : []),
    ['alt', `Web index observation: ${title}`.slice(0, MAX_ALT_LEN)],
  ];

  return { kind: WEB_INDEX_KIND, content: JSON.stringify(content), tags };
}

/** A parsed, validated observation. */
export interface IndexObservation {
  /** Document id (d tag). */
  d: string;
  /** Canonical URL (u tag). */
  url: string;
  title: string;
  description: string;
  image?: string;
  topics: string[];
  language?: string;
  contentHash?: string;
  published?: number;
  source?: string;
  /* Extension tags (spec §9.2), when present. */
  type?: string;
  platform?: string;
  network?: string;
  country?: string;
  mime?: string;
  /** Event created_at — the observation time. */
  observedAt: number;
  /** Indexer pubkey (event author). */
  indexer: string;
  /** The raw event, for provenance. */
  event: NostrEvent;
}

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([n]) => n === name)?.[1];
}

/**
 * Parse + validate a kind 39697 event. Returns null for anything malformed:
 * wrong kind, missing required fields, bad URL scheme, unsupported version.
 * Cheap synchronous checks only (hash verification is left to search nodes).
 */
export function parseIndexEvent(event: NostrEvent): IndexObservation | null {
  if (event.kind !== WEB_INDEX_KIND) return null;

  // Required single-occurrence tags (spec §5): exactly one d, u, v, alt.
  const d = getTag(event, 'd');
  const url = getTag(event, 'u');
  const version = getTag(event, 'v');
  const alt = getTag(event, 'alt');
  if (
    !d?.startsWith(WEB_INDEX_D_PREFIX) || !url || !alt ||
    version !== WEB_INDEX_SCHEMA_VERSION
  ) {
    return null;
  }
  if (url.length > MAX_URL_LEN || alt.length > MAX_ALT_LEN) return null;

  const normalized = normalizeIndexUrl(url);
  if (!normalized) return null;

  let title = '';
  let description = '';
  let image: string | undefined;
  try {
    const parsed = JSON.parse(event.content) as Record<string, unknown>;
    title = typeof parsed.title === 'string' ? parsed.title.trim().slice(0, MAX_TITLE_LEN) : '';
    description = typeof parsed.description === 'string' ? parsed.description.trim().slice(0, MAX_DESCRIPTION_LEN) : '';
    if (typeof parsed.image === 'string' && /^https:\/\//i.test(parsed.image)) {
      image = parsed.image.slice(0, MAX_IMAGE_LEN);
    }
  } catch {
    return null;
  }
  if (!title) return null;

  // Topics: keep only keyword-shaped ones (spec §6).
  const topics = event.tags
    .filter(([n]) => n === 't')
    .map(([, v]) => v)
    .filter((v) => TOPIC_RE.test(v))
    .slice(0, MAX_TAGS);

  const publishedTag = getTag(event, 'published');
  const published = publishedTag ? parseInt(publishedTag, 10) : NaN;

  return {
    d,
    url: normalized,
    title,
    description,
    image,
    topics,
    language: getTag(event, 'l'),
    contentHash: getTag(event, 'x'),
    published: Number.isFinite(published) ? published : undefined,
    source: getTag(event, 'source'),
    type: getTag(event, 'type'),
    platform: getTag(event, 'platform'),
    network: getTag(event, 'network'),
    country: getTag(event, 'country'),
    mime: getTag(event, 'mime'),
    observedAt: event.created_at,
    indexer: event.pubkey,
    event,
  };
}

/** Convert a search result into an observation input (for auto-indexing). */
export function observationFromResult(result: SearchResult): IndexObservationInput | null {
  if (!result.url || !/^https?:\/\//i.test(result.url)) return null;
  if (!result.title?.trim()) return null;
  return {
    url: result.url,
    title: result.title,
    description: result.snippet,
    image: result.thumbnail,
    tags: result.tags,
    published: result.timestamp,
    source: '0xsearchstr-web/1',
  };
}
