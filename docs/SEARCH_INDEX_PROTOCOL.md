# Search Index Protocol (SIP-01)

> **The canonical specification has moved to its own repository:**
> **[github.com/NostrDanish/SIP-01](https://github.com/NostrDanish/SIP-01)**
> — specifically [`public/spec/SIP-01.md`](https://github.com/NostrDanish/SIP-01/blob/main/public/spec/SIP-01.md) (**v1.2**).
>
> That document is the single source of truth for the wire format. This file
> documents **0xSearchstr's implementation** of it and stays intentionally thin
> so the two never drift apart.
>
> **v1.2 note:** documentation-only revision — NIP references re-audited
> (NIP-33 folded into NIP-01; the `l` tag convention lives in NIP-32, used here
> in the bare two-element form per §12.5; NIP-50 operator support is
> SHOULD-level per relay — prefer `site:` over the colliding `domain:`), plus
> the §20.1 NIP dependency table. **The wire format is unchanged** — schema
> `v` stays `"1"` and every v1/v1.1 event remains valid.

**One shared decentralized index. Many independent indexers. Many independent
search nodes. Many independent search engines. No mandatory identity. No single
owner.**

---

## What SIP-01 is

A signed, addressable Nostr event (kind **39697**) per `(indexer, normalized
URL)` — a *Web Index Observation*:

> "Indexer `pubkey` observed this web document at this time, and here is its
> lightweight metadata."

Three identities, kept separate: URL identity (`d` = `"widx:" +
sha256(normalized_url)[0:32]`), canonical URL (`u`), and content identity
(`x` = `sha256(title + "\n" + description)`). Schema version `v = 1`.

## 0xSearchstr's implementation

| Concern | File | Notes |
|---|---|---|
| Protocol core | [`src/lib/webIndex.ts`](../src/lib/webIndex.ts) | `normalizeIndexUrl`, `documentId`, `contentHash`, `buildIndexEvent`, `parseIndexEvent`. Byte-compatible with spec §13 test vectors (enforced by `webIndex.test.ts`). |
| Indexer identity | [`src/lib/indexerIdentity.ts`](../src/lib/indexerIdentity.ts) | Per-device keypair (spec §14): generated locally, never the personal key, replaceable, exportable. |
| Writer | [`src/hooks/useSearchIndexer.ts`](../src/hooks/useSearchIndexer.ts) | After each search, signs one observation per unique web URL with the device key. Never publishes the query. |
| Reader | [`src/lib/providers/web-index.ts`](../src/lib/providers/web-index.ts) | Baseline plain filters + NIP-50 `search` acceleration (spec §15); groups by `d`, counts distinct indexers. |
| Discovery UI | [`src/hooks/useRecentIndexedDocs.ts`](../src/hooks/useRecentIndexedDocs.ts), `/explore` | Recently indexed pages with independent-indexer counts. |
| Identity UI | Settings → Indexing | npub display, export (nsec), regenerate (with new-indexer warning). |

### Extension tags (spec §9)

The builder accepts and the parser surfaces the registered v1 extensions —
`type`, `platform`, `network`, `country`, `mime` — all optional, keyword-shaped,
and ignored by consumers that don't know them. `network: tor|i2p` routes an
observation into the corresponding source tab.

### Query acceleration (spec §15)

The reader sends both a plain `{ kinds: [39697], limit }` filter (baseline,
works on every NIP-01 relay) and a NIP-50 `{ kinds: [39697], search: "…" }`
filter. SIP-01-aware relays (e.g. the [UNCAGED Index
Relay](https://github.com/NostrDanish/UNCAGED-Index-Relay)) answer the latter
server-side with operators like `site:`, `lang:`, `after:`; stock relays
ignore unsupported operators per NIP-50 and fall back to default behavior.
Results from both paths merge by event id.

### Legacy compatibility (spec §17)

The kind 30078 query cache (`d: "0xsearchstr:cache:*"`) is frozen legacy data:
this client **reads** it (backward compatibility with 0xPresearchstr and older
deployments) but never writes it. New document indexing uses kind 39697 only.
There is no flag day. See [../NIP.md](../NIP.md) for the legacy schemas.

## Verifying this implementation

The test suite ([`src/lib/webIndex.test.ts`](../src/lib/webIndex.test.ts))
reproduces all six canonical §13 test vectors — URL identity (`d`) and content
identity (`x`). If those pass, this client is wire-compatible with every
crawler, relay, and engine in the ecosystem.

## Links

- Canonical spec (v1.1): <https://github.com/NostrDanish/SIP-01>
- Implementation guide: <https://github.com/NostrDanish/SIP-01/blob/main/docs/IMPLEMENTATION-GUIDE.md>
- Ecosystem: [Crawlstr](https://github.com/NostrDanish/Crwalstr) (crawler),
  [UNCAGED-ENGINE](https://github.com/NostrDanish/UNCAGED-ENGINE) (reference engine),
  [UNCAGED-Index-Relay](https://github.com/NostrDanish/UNCAGED-Index-Relay) (validating relay),
  [0xPresearchstr](https://github.com/NostrDanish/0xPresearchstr) (sister engine)
