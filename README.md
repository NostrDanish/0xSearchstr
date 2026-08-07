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
 │  Cache Index    DuckDuckGo  Stack Overflow   Community      │
 │       │              │          │              Index         │
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
4. **Auto-indexing** — every search publishes results back to Nostr as cache events
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

The cache protocol (`0xsearchstr:cache:*` d-tags, kind 30078) is **shared with [0xPresearchstr](https://github.com/NostrDanish/0xPresearchstr) and open to any fork**. Each app signs cache events with its own indexer key; readers trust every known indexer:

| App | Indexer pubkey |
|-----|----------------|
| 0xSearchstr bot | `12ad55ad1fdb918f5314c9e9a5cd135be9b746e6eee15fd871df131a5677d199` |
| 0xPresearchstr bot | `e34726ccb624f4bb6aebabdfd9a41f5e160ca97ba2ea13fad8f8ff29a7f84bca` |

A search on 0xPresearchstr warms the cache for 0xSearchstr users and vice versa. Running a fork? Add your pubkey to `INDEXER_PUBKEYS` in [`src/lib/searchIndex.ts`](src/lib/searchIndex.ts) and you join the same index. Full spec in [NIP.md](NIP.md).

### 🔍 Explore the Index

[`/explore`](https://0xSearchstr.shakespeare.wtf/explore) turns the cache into discoverable content: trending queries from all federated indexers, result counts, and aggregate stats. Every search becomes content. The hero page and empty states surface trending queries too — you're never left with a dead end.

### ⌨️ Quality of Life

- **OpenSearch** — add 0xSearchstr as a browser search engine (`/opensearch.xml`)
- **Keyboard shortcuts** — `Ctrl+K` / `Cmd+K` or `/` focuses the search bar from anywhere
- **Shareable searches** — `?q=query&source=web` URL params
- **Smart snippets** — Nostr notes show the relevant window around your query terms (Google-style), not just the note head; hashtag/link-stuffed spam is filtered out
- **Graceful degradation** — a failing provider shows a muted "skipped" state instead of a red error when others delivered

---

## Auto-Indexing (Community Cache)

The killer feature: **every search grows the index.**

When you search, results from web providers get published as Nostr events (kind 30078) under this app's indexer account. Next time *anyone* — on any compatible client — searches the same query, results come from Nostr instantly, no external API call needed.

```
Search "best monero wallet"
       │
       ├─→ Check Nostr cache (federated index, all trusted indexers)
       │     └─→ Cache HIT? → instant results
       │
       ├─→ Run all providers in parallel
       │     └─→ Merge + deduplicate + rank
       │
       └─→ Publish results back to Nostr (auto-index)
             └─→ Next user gets instant cache hit
```

The more people use any compatible client, the smarter every client gets. No crawler. No database. Just Nostr.

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
├── cached-index.ts   ← Federated Nostr cache (reads first, trusts all indexers)
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
| **Cache Index** | Federated Nostr index | WebSocket | 🟢 Nostr | Reads previously cached results first |
| **Nostr** | NIP-50 relays | WebSocket | 🟢 Nostr | 4 default search relays + user customs |
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
- **Search Relays (NIP-50)** — the pool that powers Nostr search + the community index. Our four defaults are pinned; add your own (e.g. a self-hosted NIP-50 relay), and use the built-in latency tester to check reachability and round-trip times.

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

All custom event schemas — the federated cache, community submissions, trusted indexer list, and Nostra Search interop — are documented in [NIP.md](NIP.md).

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
