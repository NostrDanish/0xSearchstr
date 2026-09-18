# 0xSearchstr

**Decentralized search aggregator.** Nostr first, web when needed. No backend required.

**Live:** [https://0xSearchstr.shakespeare.wtf](https://0xSearchstr.shakespeare.wtf) · **nsite mirror:** [https://0xsearchstr.shakespeare.to](https://0xsearchstr.shakespeare.to)

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

[`/explore`](https://0xSearchstr.shakespeare.wtf/explore) turns the index into discoverable content: **recently indexed pages** (with independent-indexer counts), trending terms, staked keywords, and aggregate stats. Every search becomes content.

### 💎 Keyword Staking (Presearch-style, Nostr-native)

Stake **your identity** on a keyword instead of tokens: sign an addressable kind 30078 event (`0xsearchstr:stake:<keyword>`) binding a keyword to your link. Anyone searching that keyword — on any compatible client — sees your link as the top "Community Stake" placement. One stake per keyword per npub; re-staking replaces it. No tokens, no auction.

### 👍 Voting & Reporting

Every result card carries 👍/👎 votes and a report flag:

- **Votes** are NIP-25 reactions (kind 7; `e` tag for events, `r` tag with the SIP-01-normalized URL for pages). **Anonymous by default** — signed by this device's indexing identity, never your npub. Settings → Indexing has an opt-in "vote with my npub" toggle.
- **Reports** are NIP-56 kind 1984 events (`0xsearchstr.abuse` namespace), landing in the team's `/admin` inbox.

### 📈 Trending Terms (k-anonymity)

Trending searches with **no plaintext queries anywhere**: each device publishes only `sha256(normalized query)` under its indexing identity (`0xsearchstr:term:*`). A term's plaintext is revealed by the network only once **3+ independent devices** searched it — the reveal is self-verifying (readers re-hash and compare). Rare or sensitive queries (NIP-19 ids, NIP-05 addresses, URLs, math) are never signaled at all.

### 🛡 Team Console (`/admin`)

A hidden, role-gated dashboard (not linked in nav — team members see "Admin console" in their account menu when logged in with a team key):

- **Stats** — indexed pages, stakes, open reports, relay pool sizes
- **Reports** — the NIP-56 abuse inbox, one-click "hide from results"
- **Moderation** — team-signed NIP-32 labels (kind 1985, `0xsearchstr.moderation`) hide URLs/event ids from **every user's** results; un-hiding publishes a NIP-09 deletion. Clients trust labels from the owner + role-list pubkeys only
- **Roles** (owner) — add/remove admins & moderators by npub (owner-signed `0xsearchstr:admin-roles` / `0xsearchstr:mod-roles` addressable events)
- **Filter test** — check whether a URL or event id is currently filtered

### 🤖 AI Answers (optional, off by default)

An AI answer layer sits on top of the federation: the top results become a numbered evidence pack, the model answers **only** from it, with clickable `[n]` citations. Ephemeral — never indexed into SIP-01. Tiers: your own key (BYOK — PPQ.ai, OpenRouter, Ollama, any OpenAI-compatible endpoint) → a built-in free tier (shared rate-limited PPQ key, public by design). Privacy boundaries hold: NIP-19/05, URLs, and math keep their deterministic paths; Nostr results are excluded from evidence unless you opt in.

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
├── stakes.ts         ← Keyword stakes (Presearch-style top placements)
├── community.ts      ← Community-curated index (+ Nostra Search interop + NIP-B0)
├── git.ts            ← NIP-34 repos/issues/PRs (ngit/GRASP pool, read-only)
├── wiki.ts           ← NIP-54 wiki articles (wikifreedia pool, read-only)
├── brave.ts          ← Brave Search API (BYOK, off by default)
├── searxng.ts        ← SearXNG meta-search with failover
├── duckduckgo.ts     ← DuckDuckGo HTML scraper
├── wikipedia.ts      ← MediaWiki API
├── hacker-news.ts    ← Algolia HN Search API
├── stackoverflow.ts  ← StackExchange API
├── tor.ts            ← Ahmia.fi .onion search
├── registry.ts       ← Provider catalog (+ per-engine enable/disable)
└── index.ts          ← Barrel export

src/lib/
├── webIndex.ts        ← SIP-01 protocol: URL normalization, build/parse/verify
├── indexerIdentity.ts ← Per-device anonymous indexer keypair
├── keywordStakes.ts   ← Stake schema (0xsearchstr:stake:*)
├── termSignals.ts     ← k-anonymity trending (0xsearchstr:term:*)
├── votes.ts           ← NIP-25 result votes (device identity by default)
├── reports.ts         ← NIP-56 abuse reports (0xsearchstr.abuse)
├── moderation.ts      ← NIP-32 team labels (0xsearchstr.moderation) + roles
├── queryClassify.ts   ← Query understanding (URL/nip19/nip05/math detection)
├── resultRank.ts      ← Coverage-ranked result merging
└── ai/                ← Optional AI answer layer (BYOK + built-in free tier)
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
| **Web Index** | Nostr kind 39697 | WebSocket | 🟢 Nostr | Shared document observations from all indexers (SIP-01), integrity-verified (`d`↔`u`, `x`↔content) |
| **Cache Index** | Federated Nostr index | WebSocket | 🟢 Nostr | Legacy query cache, read-only (frozen) — off by default |
| **Nostr** | NIP-50 relays | WebSocket | 🟢 Nostr | UNCAGED + community default relays, fully user-editable |
| **Keyword Stakes** | Nostr kind 30078 | WebSocket | 🟢 Nostr | Community-staked keyword placements |
| **Community** | Nostr kind 30078 + 39701 | WebSocket | 🟢 Nostr | User-submitted links + NIP-B0 bookmarks + Nostra Search index |
| **Git Repos** | ngit/GRASP relays (NIP-34) | WebSocket, read-only | 🟢 Nostr | Repos, issues, PRs & patches — pool editable in Settings |
| **Nostr Wiki** | Wiki relays (NIP-54) | WebSocket, read-only | 🟢 Nostr | Wikifreedia corpus — pool editable in Settings |
| **SearXNG** | Dynamic instance pool | CORS proxy | 🔴 Proxied | DDG, Brave, Wikipedia, and dozens more |
| **DuckDuckGo** | HTML scraper | CORS proxy | 🔴 Proxied | Direct DDG fallback when SearXNG is slow |
| **Brave** | Brave Search API | CORS proxy | 🔴 Proxied | Off by default — BYOK in Settings → Engines |
| **Wikipedia** | MediaWiki API | Direct (CORS) | 🟡 Direct | Off by default — enable in Settings → Engines |
| **Hacker News** | Algolia API | Direct (CORS) | 🟡 Direct | Stories with points/comments |
| **Stack Overflow** | StackExchange API | Direct (CORS) | 🟡 Direct | Off by default — enable in Settings → Engines |
| **Tor (Ahmia)** | HTML scraping | CORS proxy | 🔴 Proxied | Off by default — policy-compliant .onion search |

Every engine can be toggled off in **Settings → Search Engines** — off engines never run and never see your query. The tab bar is modular too: **Settings → Search Tabs** picks visible tabs, order, and the default landing tab.

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
- **Search Relays (index pool)** — the pool that powers Nostr search, the shared web index, and index publishing. Defaults: the [UNCAGED index relay](https://github.com/NostrDanish/UNCAGED-Index-Relay) (`relay-na1.metanomalist.com`), community NIP-50 relays (ditto, jskitty.cat, nos.today, nostr.band, noswhere), Primal + Hifish for replication, and a Tor index relay (`.onion`). **Every default is removable** — removed defaults can be restored, and customs (including your own self-hosted NIP-50 relay) can be added. A built-in latency tester checks reachability and round-trip times. The `.onion` relay is only contacted when the app itself runs on a `.onion` origin — on clearnet it's skipped silently (a connection could never succeed, and on devices with a local Tor resolver the attempt trips Chrome/Brave's local-network permission prompt).

### Incremental Results

All providers run in parallel. The UI shows live status:
```
✔ Nostr (124ms)  ✔ Wikipedia (230ms)  ⏳ SearXNG...  ⏳ HN...
```

Results appear as each provider finishes — no waiting for the slowest one.

---

## Search Tabs

The tab bar is **fully modular** — Settings → Search Tabs lets every user pick which tabs show, reorder them, and star the tab a fresh visit starts on. Deep links (`/?source=tor&q=…`) keep working even for hidden tabs.

| Tab | Sources |
|-----|---------|
| **Web** | Web Index (SIP-01) + Stakes + Community + SearXNG + DuckDuckGo + Brave (BYOK) |
| **Index** | The community index only — SIP-01 observations + legacy cache |
| **All** | All providers merged + ranked (stakes on top) |
| **Nostr** | Profiles, notes, articles, Wikifreedia, files, torrents, code snippets |
| **News** | Hacker News stories |
| **Wiki** | Nostr wiki articles (NIP-54 pool); Wikipedia engine off until enabled |
| **Code** | Git repos/issues/PRs (NIP-34 via ngit/GRASP) + NIP-C0 snippets; Stack Overflow off until enabled |
| **Tor** | .onion hidden services via Ahmia + index-observed onion pages |
| **I2P** | Eepsite directory links + index-observed eepsites |

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
