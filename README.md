# 0xSearchstr

**Decentralized search aggregator.** Nostr first, web when needed. No backend required.

**Live:** [https://0xSearchstr.shakespeare.wtf](https://0xSearchstr.shakespeare.wtf)

**Nostr:** `npub1z2k4ttglmwgc75c5e856tngnt05mw3hxams4lkr3muf354nh6xvskk2ew6`

**Sister app:** [0xPresearchstr](https://github.com/NostrDanish/0xPresearchstr) — same engine, shared index (see [Federation](#federation-one-index-many-clients))

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2FNostrDanish%2F0xSearchstr.git)

---

## How It Works

```
User Search
       │
       ▼
 ┌─────────────── All providers run in parallel ──────────────┐
 │                                                             │
 │  Nostr (NIP-50)  SearXNG   Wikipedia   Hacker News   Tor   │
 │       │              │          │           │          │    │
 │  Web Index     DuckDuckGo  Stack Overflow   Community      │
 │  Cache Index        │          │              Index         │
 │       ▼              ▼          ▼              ▼             │
 │   SearchResult[] from each provider                         │
 │                                                             │
 └──────────────────────┬──────────────────────────────────────┘
                        │
              Instant Answer? (calculator · npub · Wikipedia)
                        │
                   Merge + Deduplicate + Rank
                        │
                        ▼
                   Display Results
                        │
                   Still nothing?
                        │
                        ▼
              Trending cached queries + Browser Fallback Links
```

Instead of building another centralized search engine, 0xSearchstr is a **search aggregator** with a plugin-based provider architecture:

1. **Every source is a provider** — each returns a universal `SearchResult[]`
2. **All providers run in parallel** — results stream in as each completes
3. **Nostr scores highest** — decentralized results are prioritized
4. **Auto-indexing** — every search publishes discovered pages back to Nostr as document observations (never the query)
5. **Community-curated** — any Nostr user can submit links to the shared index
6. **Never leaves you empty** — trending cached queries + fallback links to privacy-respecting search engines

Everything runs in the browser. No backend, no crawler, no tracking.

---

## Features

### 🔦 Honest Privacy (traffic-light indicator)

Every provider is classified by **who can see your query**, and a traffic-light indicator sits next to the search bar at all times:

| Light | Tier | Providers | Who sees the query |
|-------|------|-----------|--------------------|
| 🟢 | **Nostr** | Cache Index, Nostr, Community | Relay operators only (query + IP, no account linked) |
| 🟡 | **Direct** | Wikipedia, Hacker News, Stack Overflow | The API operator (query + IP in standard logs) |
| 🔴 | **Proxied** | SearXNG, DuckDuckGo, Ahmia | A CORS proxy *and* the destination service |

- **Privacy Mode** (Settings) — one switch to run Nostr-tier providers only. Zero third-party exposure, at the cost of fewer results.
- The full, honest threat model lives on the [About page](https://0xSearchstr.shakespeare.wtf/about). "No backend" ≠ "no one sees anything" — we document exactly who does.

### ⚡ Instant Answers

Direct answers above the result list, no waiting:

- **Calculator** — `2^10`, `(3+4)*5`, `15% of 80` — safe recursive-descent parser, computed locally, never sent anywhere
- **Nostr profiles** — paste a bare `npub1…` / `nprofile1…` → rich profile card (avatar, banner, NIP-05, bio)
- **Wikipedia summaries** — strong title matches render the article's first paragraph + thumbnail (auto-disabled in Privacy Mode)

### 🗂 Community Index (curated by Nostr users)

The index isn't just a bot cache — **any logged-in Nostr user can submit links** (kind 30078, signed with their own key) via the **Submit** button. Submissions support `https://`, `magnet:`, `ipfs://`, and `.onion` links with automatic content-type detection (Torrent, IPFS, Video, Audio, PDF badges).

- **URL allowlist** blocks `javascript:`/`data:` at parse time; onion submissions render behind a Tor warning interstitial
- **Independent project, credit where due**: 0xSearchstr was built on its own, but the idea of letting *every user* curate the index — not just bots and crawlers — was adopted after we discovered [Nostra Search](https://github.com/nostrasearch/nostrasearch.github.io), a project exploring the same territory. Thanks for the spark. Our implementation is our own, with an improved schema (unique per-URL d-tags fix their one-entry-per-author limitation)
- **Nostra read-interop**: we also read Nostra Search's own index (`nostra:index`), including their AES-GCM obfuscated payloads — their community's curation shows up here, attributed as "Nostra Index"

### 🌐 Federation: One Index, Many Clients

The **Search Index Protocol** (kind 39697, canonical spec: **[NostrDanish/SIP-01](https://github.com/NostrDanish/SIP-01)**) is **shared with [0xPresearchstr](https://github.com/NostrDanish/0xPresearchstr), the [UNCAGED Index Relay](https://github.com/NostrDanish/UNCAGED-Index-Relay), the [Crawlstr](https://github.com/NostrDanish/Crwalstr) crawler, and open to any fork or third-party engine**. Every browser is its own indexer — there is no central signing key:

- **Per-device identity** — each browser generates its own indexer keypair on first use (Settings → Indexing). Pseudonymous, replaceable, exportable.
- **Independent observations** — when indexer A and indexer B both see `example.com`, they publish separate events with the *same* `d` tag. Search nodes count distinct indexers per document — "7 independent indexers saw this page."
- **Any relay works** — plain Nostr filters (`#d`, `#t`) on ordinary relays; NIP-50 is an optional acceleration, never a requirement.

The legacy query cache (kind 30078, `0xsearchstr:cache:*`) remains federated with 0xPresearchstr during migration — readers trust both bot pubkeys, and old clients keep a warm cache. Full legacy spec in [NIP.md](NIP.md).

### 🔍 Explore the Index

[`/explore`](https://0xSearchstr.shakespeare.wtf/explore) turns the index into discoverable content: **recently indexed pages** (with independent-indexer counts) plus trending cached queries, result counts, and aggregate stats. Every search becomes content. The hero page and empty states surface trending queries too — you're never left with a dead end.

### ⌨️ Quality of Life

- **OpenSearch** — add 0xSearchstr as a browser search engine (`/opensearch.xml`)
- **Keyboard shortcuts** — `Ctrl+K` / `Cmd+K` or `/` focuses the search bar from anywhere
- **Shareable searches** — `?q=query&source=web` URL params
- **Smart snippets** — Nostr notes show the relevant window around your query terms (Google-style), not just the note head; hashtag/link-stuffed spam is filtered out
- **Graceful degradation** — a failing provider shows a muted "skipped" state instead of a red error when others delivered

---

## Auto-Indexing (Shared Web Index)

The killer feature: **every search grows the index.**

When you search, useful web results are published to Nostr as **document observations** — one lightweight, addressable event per URL (kind **39697**, [SIP-01](https://github.com/NostrDanish/SIP-01)), signed by **this browser's own dedicated indexing identity**. No account, no login, no central signing key — and **your search query is never published**, only the pages' public metadata.

```
Search "best monero wallet"
       │
       ├─→ Read the shared web index (kind 39697) + legacy cache (kind 30078)
       │     └─→ HIT? → instant results from Nostr
       │
       ├─→ Run all providers in parallel
       │     └─→ Merge + deduplicate + rank
       │
       └─→ Index the useful pages (auto-index)
             ├─→ kind 39697 per URL, signed by your device's indexer key
             └─→ every compatible client can now find those pages
```

**Indexing identity:** each browser generates its own keypair on first use (Settings → Indexing). It is pseudonymous, replaceable, exportable, and never linked to your personal Nostr identity. Key separation is guaranteed; network anonymity is not (relays see IP/timing — be honest about that).

The more people use any compatible client, the smarter every client gets. No crawler. No database. Just Nostr.

> **Migration note:** the legacy query→results cache (kind 30078) is frozen legacy data (SIP-01 §17) — 0xSearchstr still **reads** it for backward compatibility with 0xPresearchstr and older clients, but no longer writes it. The only signer in this codebase is the per-device indexing identity.

---

## Quick Start

```bash
git clone https://github.com/NostrDanish/0xSearchstr.git
cd 0xSearchstr
npm install
npm run dev
```

Open `http://localhost:8080` and search.

---

## Provider Architecture

```
src/lib/providers/
├── types.ts          ← SearchResult, SearchProvider interface (privacy tiers!)
├── web-index.ts      ← Shared web index — SIP-01 kind 39697 observations (reads first)
├── cached-index.ts   ← Legacy federated query cache (kind 30078, read for compatibility)
├── nostr.ts          ← NIP-50 relay search
├── community.ts      ← Community-curated index (+ Nostra Search interop)
├── searxng.ts        ← SearXNG meta-search with failover
├── duckduckgo.ts     ← DuckDuckGo HTML scraper
├── wikipedia.ts      ← MediaWiki API
├── hacker-news.ts    ← Algolia HN Search API
├── stackoverflow.ts  ← StackExchange API
├── tor.ts            ← Ahmia.fi .onion search
├── registry.ts       ← Provider catalog
└── index.ts          ← Barrel export

src/lib/
├── webIndex.ts        ← SIP-01 protocol: URL normalization, event build/parse/validate
└── indexerIdentity.ts ← Per-device anonymous indexer keypair (generate/export/regenerate)
```

### Adding a Provider

1. Create `src/lib/providers/my-provider.ts` implementing `SearchProvider`
2. Import it in `registry.ts` and add to `ALL_PROVIDERS`
3. Done — the orchestrator picks it up automatically

### SearchProvider Interface

```typescript
interface SearchProvider {
  id: string;
  name: string;
  source: SearchSource;
  /** Extra tabs this provider also runs under (e.g. community runs under 'tor' too) */
  additionalSources?: SearchSource[];
  /** Privacy tier — who can observe the query. Drives the traffic-light + Privacy Mode. */
  privacy: 'nostr' | 'direct' | 'proxied';
  /** Honest one-liner about who sees the query (shown in the privacy popover). */
  privacyNote: string;
  search(options: SearchOptions): Promise<ProviderSearchResponse>;
}
```

### Live Providers

| Provider | Source | API | Privacy | Notes |
|----------|--------|-----|---------|-------|
| **Web Index** | Nostr kind 39697 | WebSocket | 🟢 Nostr | Shared document observations from all indexers (SIP-01) |
| **Cache Index** | Federated Nostr index | WebSocket | 🟢 Nostr | Legacy query cache, still read for compatibility |
| **Nostr** | NIP-50 relays | WebSocket | 🟢 Nostr | UNCAGED + community default relays, fully user-editable |
| **Community** | Nostr kind 30078 | WebSocket | 🟢 Nostr | User-submitted links + Nostra Search index |
| **SearXNG** | Dynamic instance pool | CORS proxy | 🔴 Proxied | DDG, Brave, Wikipedia, and dozens more |
| **DuckDuckGo** | HTML scraper | CORS proxy | 🔴 Proxied | Direct DDG fallback when SearXNG is slow |
| **Wikipedia** | MediaWiki API | Direct (CORS) | 🟡 Direct | No proxy needed |
| **Hacker News** | Algolia API | Direct (CORS) | 🟡 Direct | Stories with points/comments |
| **Stack Overflow** | StackExchange API | Direct (CORS) | 🟡 Direct | Questions with votes/answers |
| **Tor (Ahmia)** | HTML scraping | CORS proxy | 🔴 Proxied | Policy-compliant .onion search |

### Dynamic SearXNG Instance Pool (searxist-style)

Instead of a hardcoded instance list, the SearXNG provider uses a **self-healing dynamic pool** (inspired by [searxist](https://codeberg.org/searxist)):

```
┌── Tier 1: Custom ──────┐   Your self-hosted / trusted instances (always first)
├── Tier 2: Discovered ──┤   Live from searx.space, privacy-filtered:
│                        │     • no analytics  • clearnet  • ≥80% search success
└── Tier 3: Seeds ───────┘   Hardcoded bootstrap fallback
```

- **Auto-discovery** — the pool refreshes from [searx.space](https://searx.space) every 24h, client-side
- **Quality-aware health tracking** — per-instance success/failure/latency **and result-count** stats (EMA) in localStorage; failing or thin instances sink, fast and complete ones rise
- **Self-hosting friendly** — add your own instance in Settings and it runs first on every search
- **Zero backend** — discovery, health, and ranking all happen in the browser

### Relay Management

Two layers, both manageable at [`/settings`](https://0xSearchstr.shakespeare.wtf/settings):

- **Your Relays (NIP-65)** — your personal relay list with read/write flags; publishes kind 10002 when logged in. Defaults to the 0xSearchstr app relays for new users.
- **Search Relays (index pool)** — the pool that powers Nostr search, the shared web index, and index publishing. Defaults: the [UNCAGED index relay](https://github.com/NostrDanish/UNCAGED-Index-Relay) (`relay-na1.metanomalist.com`), community NIP-50 relays (ditto, jskitty.cat, nos.today, nostr.band, noswhere), Primal + Hifish for replication, and a Tor index relay (`.onion`, reachable over Tor only). **Every default is removable** — removed defaults can be restored, and customs (including your own self-hosted NIP-50 relay) can be added. A built-in latency tester checks reachability and round-trip times.

### Incremental Results

All providers run in parallel. The UI shows live status:
```
✔ Nostr (124ms)  ✔ Wikipedia (230ms)  ⏳ SearXNG...  ⏳ HN...
```

Results appear as each provider finishes — no waiting for the slowest one.

---

## Search Tabs

| Tab | Sources |
|-----|---------|
| **All** | All providers merged + ranked |
| **Nostr** | Profiles, notes, articles, Wikifreedia, files |
| **Web** | Community index, SearXNG + DuckDuckGo meta-search, cache |
| **Wiki** | Wikipedia articles |
| **News** | Hacker News stories |
| **Code** | Stack Overflow questions |
| **Tor** | .onion hidden services via Ahmia + curated community onion links |
| **I2P** | Eepsite directory links |

---

## Self-Hosted Backend (Optional)

The `backend/` directory contains a full self-hosted stack for when you want to run your own search infrastructure:

| Service | Description |
|---------|-------------|
| **Meilisearch** | Full-text search index engine |
| **Nostr Crawler** | NIP-01 subscriber indexing kinds 0/1/30023/1063 |
| **Clearnet Crawler** | Polite web crawler (robots.txt, rate-limited) |
| **Tor/I2P Crawler** | Hidden service crawler with content policy enforcement |
| **NIP-50 Relay** | Search relay proxy bridging Meilisearch to Nostr |
| **Abuse API** | REST search API + abuse report management |

```bash
cp .env.example .env   # Edit MEILI_API_KEY + ABUSE_ADMIN_TOKEN
docker compose up -d
```

See the [backend README](backend/) and [Content Policy](CONTRIBUTING.md) for details.

---

## Protocol Spec

The interoperable web-document index is specified by **SIP-01** — canonical spec at **[github.com/NostrDanish/SIP-01](https://github.com/NostrDanish/SIP-01)** (kind 39697) — designed so an independent developer can implement a compatible indexer, search node, or search engine without reading this codebase. 0xSearchstr's implementation is byte-compatible with the spec's §13 test vectors (see [docs/SEARCH_INDEX_PROTOCOL.md](docs/SEARCH_INDEX_PROTOCOL.md)).

App-specific legacy schemas — the federated query cache, community submissions, trusted indexer list, and Nostra Search interop — are documented in [NIP.md](NIP.md).

---

## Content Policy

The self-hosted backend enforces content policy modeled on [Ahmia](https://ahmia.fi). Hard-blocked categories: CSAM, human trafficking, weapons sales, drug marketplace listings. See the [Policy page](https://0xSearchstr.shakespeare.wtf/policy) for details.

---

## Tech Stack

- **React 19** + TypeScript + Vite
- **TailwindCSS 4** + shadcn/ui
- **Nostrify** — NIP-50 relay search
- **SearXNG** — meta-search fallback
- **Wikipedia** — MediaWiki API
- **Hacker News** — Algolia search
- **TanStack Query** — data fetching + caching

---

## License

MIT

---

*Vibed with [Shakespeare](https://shakespeare.diy)*
