/**
 * Unified search document schema for Meilisearch.
 * All crawlers normalize their content into this shape before indexing.
 */
export interface SearchDocument {
  /** Unique identifier. For Nostr: event ID. For web: URL hash. */
  id: string;
  /** Content source: nostr, clearnet, tor, i2p */
  source: 'nostr' | 'clearnet' | 'tor' | 'i2p';
  /** Full-text searchable content */
  content: string;
  /** Title (articles, web pages) */
  title?: string;
  /** Short summary or excerpt */
  summary?: string;
  /** URL to the original content */
  url?: string;
  /** Unix timestamp (seconds) */
  timestamp: number;
  /** ISO 8601 date string for Meilisearch date filtering */
  date: string;

  // ─── Nostr-specific fields ───
  /** Nostr event kind */
  kind?: number;
  /** Author pubkey (hex) */
  pubkey?: string;
  /** Author display name (denormalized for search) */
  author_name?: string;
  /** NIP-19 encoded event identifier */
  nip19?: string;
  /** Hashtags from t-tags */
  tags?: string[];
  /** Raw signed Nostr event JSON (for NIP-50 relay responses) */
  raw_event?: string;

  // ─── Web-specific fields ───
  /** Domain of the crawled page */
  domain?: string;
  /** Full URL of the page */
  page_url?: string;
  /** Language (ISO 639-1) */
  language?: string;

  // ─── Engagement signals (Nostr) ───
  /** Number of reply events referencing this event */
  reply_count?: number;
  /** Number of kind-6 reposts */
  repost_count?: number;
  /** Number of kind-7 reactions */
  reaction_count?: number;
  /** Total zap amount in millisats */
  zap_total_msats?: number;
}

/** Nostr event as received from relays (NIP-01). */
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

/** Configuration for relay health checking. */
export interface RelayHealth {
  url: string;
  lastSeen: number;
  latencyMs: number;
  supportsNip50: boolean;
  connected: boolean;
}

/** Abuse report submitted via the API. */
export interface AbuseReport {
  id: string;
  url: string;
  reason: string;
  category: 'csam' | 'trafficking' | 'weapons' | 'drugs' | 'other';
  reportedAt: number;
  status: 'pending' | 'reviewed' | 'removed' | 'dismissed';
  reviewedAt?: number;
  reviewNote?: string;
}

/** Content policy verdict from the classifier pipeline. */
export interface PolicyVerdict {
  allowed: boolean;
  category?: string;
  confidence: number;
  matchedRule?: string;
}

/** Crawler status for monitoring. */
export interface CrawlerStatus {
  name: string;
  running: boolean;
  documentsIndexed: number;
  documentsBlocked: number;
  lastActivity: number;
  errors: number;
}
