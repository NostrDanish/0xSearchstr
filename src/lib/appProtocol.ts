/**
 * 0xSearchstr control-plane protocol — the single source of truth for which
 * parts of the Nostr surface are SIP-01 (shared search/index protocol) and
 * which are 0xSearchstr application control-plane data.
 *
 * Architecture:
 *
 *                      SIP-01
 *                shared search protocol
 *                (kind 39697, widx:*, NIP-50/77…)
 *                        │
 *         ┌──────────────┴──────────────┐
 *         │                             │
 *    Search/index data            0xSearchstr control plane
 *    (SIP-01, untouched)          (this module's namespaces)
 *         │                             │
 *         │                  OWNER_PUBKEY (trust root)
 *         │                             │ defines
 *         │                    admins ──┘        (owner only)
 *         │                             │ delegate
 *         │      reports / moderation / affiliates / referrals
 *         │
 *         └──── MUST KEEP WORKING — do not rename SIP-01 identifiers.
 *
 * Shared federation note: SIP-01 observations plus the 0xsearchstr federated
 * search namespaces (`0xsearchstr:cache:*`, `0xsearchstr:term:*`,
 * `0xsearchstr:stake:*`, `0xsearchstr-submit`) are SHARED with 0xPresearchstr
 * and compatible forks by design — they are search data, not control-plane
 * data, and are not governed by this module.
 */
import type { NostrEvent } from '@nostrify/nostrify';

import {
  OWNER_PUBKEY,
  ROLES_KIND,
  ADMIN_ROLES_D_TAG,
  MOD_ROLES_D_TAG,
  ROLES_T_TAG,
} from '@/lib/moderation';

/** The trust root, re-exported so control-plane modules import one place. */
export { OWNER_PUBKEY } from '@/lib/moderation';

/* ------------------------------------------------------------------ */
/* Namespaces                                                          */
/* ------------------------------------------------------------------ */

/** Canonical 0xSearchstr control-plane namespaces — the only ones written. */
export const APP_PROTOCOL = {
  /** kind 30078, d-tag: owner-signed admin pubkey list. */
  adminRoles: ADMIN_ROLES_D_TAG, // '0xsearchstr:admin-roles'
  /** kind 30078, d-tag: owner-signed moderator pubkey list. */
  moderatorRoles: MOD_ROLES_D_TAG, // '0xsearchstr:mod-roles'
  /** kind 30078, d-tag: owner/admin-signed affiliate rule config. */
  affiliateRules: '0xsearchstr:affiliate-rules',
  /** kind 30078, d-tag: owner/admin-signed partner referral config. */
  referralConfig: '0xsearchstr:referral-config',
  /** NIP-32 label namespace (kind 1985): hidden results. */
  moderation: '0xsearchstr.moderation',
  /** NIP-32 self-label namespace on kind 1984 abuse reports. */
  abuse: '0xsearchstr.abuse',
  /** t-tag marker on role-list events. */
  rolesTag: ROLES_T_TAG, // '0xsearchstr-roles'
} as const;

/** Nostr kinds used by the 0xSearchstr control plane. */
export { ROLES_KIND } from '@/lib/moderation';
export const MODERATION_KIND = 1985; // NIP-32 label
export const REPORT_KIND = 1984; // NIP-56 report
export const DELETE_KIND = 5; // NIP-09 deletion
/** Referral attribution ping — addressable, one per device per partner. */
export const REFERRAL_PING_KIND = 34967;
/** Affiliate click attributed to a partner — regular, one per click. */
export const AFFILIATE_CLICK_KIND = 6079;

/* ------------------------------------------------------------------ */
/* Roles + permission matrix                                           */
/* ------------------------------------------------------------------ */

export type AppRole = 'owner' | 'admin' | 'moderator' | 'user';

/** Resolve a pubkey's role from the effective (owner-signed) team lists. */
export function roleForPubkey(pubkey: string, admins: string[], mods: string[]): AppRole {
  if (pubkey === OWNER_PUBKEY) return 'owner';
  if (admins.includes(pubkey)) return 'admin';
  if (mods.includes(pubkey)) return 'moderator';
  return 'user';
}

/**
 * The permission matrix:
 *
 *   Action                        owner  admin  moderator  user
 *   search / read SIP-01          yes    yes    yes        yes
 *   view + process abuse reports  yes    yes    yes        no
 *   moderate (hide/unhide)        yes    yes    yes        no
 *   manage affiliate rules        yes    yes    no         no
 *   manage referral config        yes    yes    no         no
 *   manage admins/moderators      yes    no     no         no
 *   change owner / trust root     no*    no     no         no
 *
 * (* even the owner can't "transfer" ownership in-protocol — the trust root
 * is a code constant; changing it is a deploy, by design.)
 */
export const PERMISSIONS = {
  canViewReports: (role: AppRole): boolean => role !== 'user',
  canModerate: (role: AppRole): boolean => role !== 'user',
  canManageAffiliates: (role: AppRole): boolean => role === 'owner' || role === 'admin',
  canManageReferralConfig: (role: AppRole): boolean => role === 'owner' || role === 'admin',
  canManageRoles: (role: AppRole): boolean => role === 'owner',
} as const;

/* ------------------------------------------------------------------ */
/* Role-list event resolution                                          */
/* ------------------------------------------------------------------ */

/** All role-list d-tags readers should query. */
export const ROLE_LIST_D_TAGS = [
  APP_PROTOCOL.adminRoles,
  APP_PROTOCOL.moderatorRoles,
] as const;

export interface ResolvedRoles {
  admins: string[];
  mods: string[];
}

/**
 * Resolve the effective team lists from role events. Rules:
 *   - ONLY owner-signed events count (the trust root; anyone can publish
 *     these d-tags, only the owner's signature is authoritative).
 *   - Latest event per d-tag wins.
 */
export function resolveRoleEvents(events: NostrEvent[]): ResolvedRoles {
  const latestByD = new Map<string, NostrEvent>();
  for (const event of events) {
    if (event.kind !== ROLES_KIND) continue;
    if (event.pubkey !== OWNER_PUBKEY) continue; // trust boundary
    const d = event.tags.find(([n]) => n === 'd')?.[1];
    if (!d) continue;
    const existing = latestByD.get(d);
    if (!existing || event.created_at > latestByD.get(d)!.created_at) latestByD.set(d, event);
  }

  const read = (d: string): string[] => {
    const event = latestByD.get(d);
    if (!event) return [];
    try {
      const parsed: unknown = JSON.parse(event.content);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((p): p is string => typeof p === 'string' && /^[0-9a-f]{64}$/i.test(p));
    } catch {
      return [];
    }
  };

  return {
    admins: read(APP_PROTOCOL.adminRoles),
    mods: read(APP_PROTOCOL.moderatorRoles),
  };
}
