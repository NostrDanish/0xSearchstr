# 0xSearchstr

**Decentralized search aggregator.** Nostr first, web when needed. No backend required.

**Live:** [https://0xSearchstr.shakespeare.wtf](https://0xSearchstr.shakespeare.wtf)

**Nostr:** `npub1z2k4ttglmwgc75c5e856tngnt05mw3hxams4lkr3muf354nh6xvskk2ew6`

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
 │       ▼              ▼          ▼           ▼          ▼    │
 │   SearchResult[] from each provider                         │
 │                                                             │
 └──────────────────────┬──────────────────────────────────────┘
                        │
                   Merge + Deduplicate + Rank
                        │
                        ▼
                   Display Results
                        │
                   Still nothing?
                        │
                        ▼
                Browser Fallback Links
          (DDG, Brave, Presearch, Mojeek, Marginalia)
```

Instead of building another centralized search engine, 0xSearchstr is a **search aggregator** with a plugin-based provider architecture:

1. **Every source is a provider** — each returns a universal `SearchResult[]`
2. **All providers run in parallel** — results stream in as each completes
3. **Nostr scores highest** — decentralized results are prioritized
4. **Never leaves you empty** — fallback links to privacy-respecting search engines

Everything runs in the browser. No backend, no crawler, no tracking.

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
├── types.ts          ← SearchResult, SearchProvider interface
├── nostr.ts          ← NIP-50 relay search
├── searxng.ts        ← SearXNG meta-search with failover
├── duckduckgo.ts     ← DuckDuckGo HTML scraper
├── wikipedia.ts      ← MediaWiki API
├── hacker-news.ts    ← Algolia HN Search API
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
  search(options: SearchOptions): Promise<ProviderSearchResponse>;
}
```

### Live Providers

| Provider | Source | API | Notes |
|----------|--------|-----|-------|
| **Nostr** | NIP-50 relays | WebSocket | relay.nostr.band + relay.ditto.pub |
| **SearXNG** | 6 public instances | CORS proxy | DDG, Brave, Wikipedia, and dozens more |
| **DuckDuckGo** | HTML scraper | CORS proxy | Direct DDG fallback when SearXNG is slow |
| **Wikipedia** | MediaWiki API | Direct (CORS) | No proxy needed |
| **Hacker News** | Algolia API | Direct (CORS) | Stories with points/comments |
| **Tor (Ahmia)** | HTML scraping | CORS proxy | Policy-compliant .onion search |

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
| **Nostr** | Profiles, notes, articles, files |
| **Web** | SearXNG meta-search |
| **Wiki** | Wikipedia articles |
| **News** | Hacker News stories |
| **Tor** | .onion hidden services via Ahmia |
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
