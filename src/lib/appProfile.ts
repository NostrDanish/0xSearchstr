/**
 * 0xSearchstr Application Profile — the single source of truth for this
 * engine's identity. One core SIP-01 stack, many independently branded
 * engines (Presearchstr, Dsearch, Savedd, …) — this profile is ours.
 *
 * Rules:
 *  - Protocol identifiers (SIP-01 kind 39697, `widx:*` d-tags, the shared
 *    federation namespaces) NEVER come from here — they are the shared
 *    protocol layer and stay identical across engines.
 *  - Application identity (name, branding, control-plane namespaces,
 *    indexer source id, feature flags) comes from HERE and nowhere else.
 *
 * Nothing in this file is a secret.
 */

export const APP_PROFILE = {
  /** Machine id (lowercase, used for storage + protocol namespaces). */
  appId: '0xsearchstr',
  /** Display name. */
  appName: '0xSearchstr',
  /** Control-plane namespace — all app-specific Nostr data lives under it. */
  namespace: '0xsearchstr',
  /** Production origin. */
  siteUrl: 'https://0xsearchstr.shakespeare.wtf',
  /** Short product description. */
  description: 'Decentralized search aggregator — Nostr first, web when needed.',
  /** Hero tagline. */
  tagline: 'Decentralized search. No trackers. No surveillance.',

  sip: {
    /** Protocol id this engine implements. */
    protocol: 'SIP-01',
    /**
     * Indexer software id stamped as the `source` tag on every SIP-01
     * kind 39697 observation this engine publishes (spec §6). One id per
     * branded engine, so the network attributes contributions to this
     * engine — not to the shared stack it runs on.
     */
    indexerSource: '0xsearchstr-web/1',
  },

  features: {
    /** Partner referral links (?ref=npub…), kind 34967 pings + kind 6079 clicks. */
    referrals: true,
    /** Owner-managed affiliate URL tagging (kind 30078 rule list). */
    affiliates: true,
    /** NIP-56 abuse reporting (0xsearchstr.abuse). */
    reports: true,
    /** NIP-32 team moderation labels (0xsearchstr.moderation). */
    moderation: true,
    /** Keyword staking (shared federation namespace 0xsearchstr:stake:*). */
    stakes: true,
    /** Optional AI answer layer (BYOK / engine tier via 0xSigner-class proxy). */
    ai: true,
  },
} as const;

export type AppProfile = typeof APP_PROFILE;
