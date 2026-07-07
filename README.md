# 0xSearchstr

**Federated, privacy-first search engine** that indexes three sources: the **Nostr protocol**, the **clearnet**, and **Tor/I2P hidden services**.

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2FNostrDanish%2F0xSearchstr.git)

---

## Overview

0xSearchstr provides a unified search experience across multiple networks from a single interface. The Nostr search works client-side right now via NIP-50 relay queries. Clearnet and dark-web search require the self-hosted backend stack.

| Source | Status | How it Works |
|--------|--------|-------------|
| **Nostr** | Live (client-side) | NIP-50 search queries to `relay.nostr.band` and `relay.ditto.pub` |
| **Clearnet** | Backend required | Polite crawler + Meilisearch full-text index |
| **Tor (.onion)** | Backend required | SOCKS5 proxy crawler with content policy enforcement |
| **I2P (.i2p)** | Backend required | i2pd HTTP proxy crawler with content policy enforcement |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React SPA)                        │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────────┐  │
│  │  NIP-50 Direct    │  │  REST API Search │  │  Abuse Report UI   │  │
│  │  (relay queries)  │  │  (via abuse-api) │  │  (POST /api/report)│  │
│  └────────┬─────────┘  └────────┬────────┘  └────────┬───────────┘  │
│           │                      │                     │              │
└───────────┼──────────────────────┼─────────────────────┼──────────────┘
            │                      │                     │
    ┌───────▼───────┐    ┌────────▼────────┐   ┌────────▼──────────┐
    │  NIP-50 Relay  │    │   Abuse API     │   │   Abuse API       │
    │  (WebSocket)   │    │   GET /api/search│   │  POST /api/report │
    └───────┬───────┘    └────────┬────────┘   └───────────────────┘
            │                      │
            └──────────┬───────────┘
                       │
              ┌────────▼────────┐
              │   MEILISEARCH   │
              │  (Search Index) │
              └────────▲────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────┴───────┐ ┌────┴─────┐ ┌─────┴──────┐
│ Nostr Crawler │ │ Clearnet │ │ Tor / I2P  │
│ (NIP-01 REQ)  │ │ Crawler  │ │ Crawler    │
└───────────────┘ └──────────┘ └─────┬──────┘
                                     │
                              ┌──────┴──────┐
                              │Content Policy│
                              │  Pipeline   │
                              └─────────────┘
```

---

## Quick Start

### Frontend Only (Nostr Search)

The frontend works standalone with no backend — Nostr search queries go directly to NIP-50-capable relays.

```bash
git clone https://github.com/NostrDanish/0xSearchstr.git
cd 0xSearchstr
npm install
npm run dev
```

Open `http://localhost:8080` and search Nostr.

### Full Stack (All Sources)

```bash
# 1. Clone and configure
git clone https://github.com/NostrDanish/0xSearchstr.git
cd 0xSearchstr
cp .env.example .env

# 2. Edit .env with your configuration
#    IMPORTANT: Change MEILI_API_KEY and ABUSE_ADMIN_TOKEN

# 3. Populate blocklists (REQUIRED before running Tor/I2P crawlers)
#    See "Content Policy" section below

# 4. Start everything
docker compose up -d

# 5. Check status
docker compose logs -f
```

### Partial Stack (No Dark Web)

To run without Tor/I2P crawling:

```bash
docker compose up -d meilisearch nostr-crawler clearnet-crawler nip50-relay abuse-api frontend
```

---

## Services

### Meilisearch (Port 7700)

The search index engine. All crawlers push documents here. The index is configured with:
- **Searchable attributes**: title, content, summary, author_name, tags, domain
- **Filterable facets**: source, kind, pubkey, domain, language, tags, timestamp
- **Custom ranking**: relevance + zap count + reactions + reply count

### Nostr Crawler

Subscribes via NIP-01 `REQ` to a configurable relay list and indexes:
- **Kind 0**: Profiles (name, about, nip05)
- **Kind 1**: Notes (short text posts)
- **Kind 30023**: Long-form articles (title, summary, content)
- **Kind 1063**: File metadata

Features:
- Deduplicates by event ID (in-memory set with LRU eviction)
- Resolves `nostr:` references for better full-text search
- Batch indexing with configurable flush intervals
- Auto-reconnect on relay disconnection

### Clearnet Crawler

Standard polite web crawler:
- **Respects `robots.txt`** for every domain (cached per domain)
- **Rate-limited** per domain (default: 2s between requests)
- **Sitemap discovery** from `robots.txt` sitemap directives
- **Link extraction** for crawl frontier (capped at 50 links per page)
- **Content extraction** via Cheerio (strips nav, footer, scripts)
- Content policy check before indexing

### Tor / I2P Crawler

The most security-critical component:
- **Tor**: Routes through local SOCKS5 proxy (`tor-proxy` container)
- **I2P**: Routes through i2pd HTTP proxy
- **Triple content policy check**: domain blocklist → raw HTML check → extracted text check
- **Slower rate limiting** (default: 5s between requests)
- **Periodic blocklist refresh** (default: every hour)

### NIP-50 Relay (Port 7777)

A lightweight Nostr relay that bridges Meilisearch to the Nostr protocol:
- Accepts standard NIP-01 `REQ` messages with NIP-50 `search` filter
- Queries Meilisearch and returns the original signed Nostr events
- Sends `EOSE` when results are complete
- Implements NIP-11 relay information document
- **Read-only**: rejects `EVENT` messages

Any existing Nostr client that supports NIP-50 can query this relay directly:
```
wss://your-server:7777
```

### Abuse API (Port 8080)

REST API for search and abuse reporting:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/search?q=...` | GET | None | Full-text search with facets |
| `/api/report` | POST | None | Submit abuse report |
| `/api/reports` | GET | Admin | List all reports |
| `/api/reports/:id` | PATCH | Admin | Review/action a report |
| `/health` | GET | None | Health check |

#### Search API

```bash
curl "http://localhost:8080/api/search?q=bitcoin&source=nostr&limit=10"
```

Response:
```json
{
  "query": "bitcoin",
  "hits": [...],
  "totalHits": 142,
  "facets": {
    "source": { "nostr": 100, "clearnet": 42 },
    "kind": { "1": 85, "30023": 15 }
  },
  "processingTimeMs": 12
}
```

#### Submit Abuse Report

```bash
curl -X POST http://localhost:8080/api/report \
  -H "Content-Type: application/json" \
  -d '{"url": "http://bad.onion/page", "reason": "CSAM content", "category": "csam"}'
```

#### Admin: Review Reports

```bash
# List pending reports
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8080/api/reports?status=pending"

# Mark as removed (also removes from search index)
curl -X PATCH -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "removed", "reviewNote": "Confirmed CSAM"}' \
  "http://localhost:8080/api/reports/REPORT_ID"
```

### Frontend (Port 3000)

React SPA with:
- Unified search bar with source facets (Nostr / Clearnet / Tor / I2P)
- Nostr results with author avatars, content, engagement hints
- Kind filtering (all / notes / profiles / articles / files)
- NIP-19 event detail pages with copy-to-clipboard
- Warning interstitials before navigating to .onion/.i2p links
- Content policy documentation page
- Abuse report form
- Dark/light theme toggle

---

## Content Policy

> **This is non-negotiable.** It mirrors how [Ahmia](https://ahmia.fi) operates. An indiscriminate crawler is how a project like this gets its domain seized or its maintainer prosecuted.

### Hard-Blocked Content

The following categories are **permanently excluded** from the index:

| Category | Filtering Method |
|----------|-----------------|
| **CSAM** | Known-bad domain lists, content hash lists (SHA-256), keyword classifiers |
| **Human Trafficking** | Domain blocklists, keyword classifiers |
| **Weapons Sales** | Marketplace pattern detection, keyword classifiers |
| **Drug Marketplace Listings** | Vendor/marketplace pattern detection, keyword classifiers |

> **Note**: Harm-reduction information, policy advocacy, and academic discussion about these topics are NOT blocked. The classifiers target active marketplace listings and illegal content, not discourse.

### Filtering Pipeline

All content passes through this pipeline **before** entering the index:

```
Crawl → Domain Blocklist → Content Hash Check → Keyword Classifier → Index
              ↓                    ↓                    ↓
          [BLOCKED]            [BLOCKED]            [BLOCKED]
         (logged)              (logged)             (logged)
```

1. **Domain Blocklist** (`config/blocklists/domains.txt`): Known-bad .onion/.i2p domains. Sourced from IWF, NCMEC, Ahmia's blocklist.
2. **Content Hash Blocklist** (`config/blocklists/hashes.txt`): SHA-256 hashes of known illegal content. Sourced from PhotoDNA, IWF, NCMEC.
3. **Keyword Classifiers** (`config/blocklists/keywords.json`): Regex-based category classifiers with confidence scoring. Threshold: 0.6 (false positives preferred over false negatives).
4. **Abuse Reports**: Human-submitted reports trigger immediate review and index removal.

### Populating Blocklists

The blocklist files ship empty. **You MUST populate them before running Tor/I2P crawlers in production.**

Sources:
- **Ahmia Blocklist**: https://ahmia.fi/blacklist/
- **IWF URL List**: Available to qualifying organizations via https://www.iwf.org.uk/
- **NCMEC**: Hash lists available to qualifying organizations
- **Project Arachnid**: https://projectarachnid.ca/

---

## Threat Model

### What This Tool Does

- Indexes publicly available content from Nostr relays, clearnet, and hidden services
- Applies content policy filters **before** indexing
- Provides an abuse-report endpoint for content removal
- Tags results by source (nostr / clearnet / tor / i2p)
- Shows warning interstitials before rendering .onion/.i2p links

### What This Tool Does NOT Do

- **Does not host, cache, or serve indexed content** — results link to original sources
- **Does not act as a proxy or gateway** to hidden services
- **Does not store user search queries** — the frontend runs client-side
- **Does not guarantee completeness** — content policy filtering means some content is intentionally excluded
- **Does not replace due diligence** — users are responsible for legal implications in their jurisdiction

### Attack Vectors Considered

| Vector | Mitigation |
|--------|-----------|
| Malicious content in index | Triple-layer content policy pipeline |
| XSS via indexed content | Content is text-indexed only; raw HTML is never rendered. Frontend sanitizes all URLs. |
| Index poisoning (spam) | Meilisearch ranking deprioritizes low-engagement content; Nostr crawler filters by engagement signals |
| Relay-based attacks | Signed events are verified; multiple relays provide redundancy |
| Abuse report flooding | Rate limiting; admin review required for action |
| Blocklist bypass | Multiple detection layers; periodic refresh; human reports as fallback |

---

## Configuration

All configuration is via environment variables. See [`.env.example`](.env.example) for the complete list.

### Key Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MEILI_API_KEY` | (required) | Meilisearch master key |
| `NOSTR_RELAYS` | Built-in list | Comma-separated relay URLs |
| `TOR_SOCKS_PROXY` | `socks5h://tor-proxy:9050` | Tor SOCKS5 proxy address |
| `I2P_HTTP_PROXY` | `http://i2pd:4444` | I2P HTTP proxy address |
| `ABUSE_ADMIN_TOKEN` | (required) | Token for admin API access |
| `LOG_LEVEL` | `info` | Logging level (debug/info/warn/error) |

---

## Tech Stack

### Frontend
- React 19 + TypeScript
- TailwindCSS 4 + shadcn/ui
- Nostrify (NIP-50 relay queries)
- TanStack Query (data fetching)
- Vite (build tool)

### Backend
- Node.js 22 + TypeScript (ESM)
- Meilisearch (search index)
- WebSocket (NIP-50 relay)
- Cheerio (HTML parsing)
- socks-proxy-agent (Tor connectivity)
- pino (structured logging)

### Infrastructure
- Docker + Docker Compose
- Tor proxy (dperson/torproxy)
- i2pd (purplei2p/i2pd)
- nginx (frontend static serving)

---

## Project Structure

```
0xSearchstr/
├── src/                          # Frontend (React SPA)
│   ├── components/               # UI components
│   │   ├── SearchBar.tsx         # Unified search input
│   │   ├── SourceTabs.tsx        # Nostr/Clearnet/Tor/I2P tabs
│   │   ├── KindFilter.tsx        # Note/Profile/Article filter
│   │   ├── NostrResultCard.tsx   # Nostr event result rendering
│   │   ├── BackendRequired.tsx   # Backend status cards
│   │   ├── OnionWarningDialog.tsx# .onion/.i2p warning interstitial
│   │   ├── Layout.tsx            # App layout with header/footer
│   │   └── ...
│   ├── hooks/
│   │   └── useNostrSearch.ts     # NIP-50 search hook
│   ├── pages/
│   │   ├── Index.tsx             # Home + search results
│   │   ├── Policy.tsx            # Content policy page
│   │   ├── About.tsx             # Architecture + threat model
│   │   └── NIP19Page.tsx         # Event/profile detail views
│   └── lib/
│       ├── searchRelays.ts       # NIP-50 relay connections
│       ├── nostrHelpers.ts       # Nostr utility functions
│       └── sanitizeUrl.ts        # URL sanitization
│
├── backend/                      # Backend services
│   ├── shared/                   # Shared modules
│   │   └── src/
│   │       ├── types.ts          # Unified document schema
│   │       ├── meili.ts          # Meilisearch client + index config
│   │       ├── content-policy.ts # Content policy pipeline
│   │       └── logger.ts         # Structured logging
│   │
│   ├── nostr-crawler/            # Nostr NIP-01 subscriber
│   │   └── src/index.ts
│   │
│   ├── clearnet-crawler/         # Polite web crawler
│   │   └── src/index.ts
│   │
│   ├── tor-crawler/              # Tor + I2P crawler
│   │   └── src/index.ts
│   │
│   ├── nip50-relay/              # NIP-50 search relay proxy
│   │   └── src/index.ts
│   │
│   ├── abuse-api/                # REST API + abuse reports
│   │   └── src/index.ts
│   │
│   ├── config/                   # Configuration files
│   │   ├── blocklists/
│   │   │   ├── domains.txt       # Blocked domains
│   │   │   ├── hashes.txt        # Blocked content hashes
│   │   │   └── keywords.json     # Keyword classifier rules
│   │   ├── seeds-clearnet.txt    # Clearnet seed URLs
│   │   ├── seeds-onion.txt       # Tor seed URLs
│   │   └── seeds-i2p.txt         # I2P seed URLs
│   │
│   ├── Dockerfile.crawler        # Multi-stage Dockerfile for crawlers
│   ├── Dockerfile.relay          # Dockerfile for relay + API
│   └── Dockerfile.frontend       # Dockerfile for frontend
│
├── docker-compose.yml            # Full stack orchestration
├── .env.example                  # Environment configuration template
├── CONTRIBUTING.md               # Contribution guidelines
└── SECURITY.md                   # Security policy + vulnerability reporting
```

---

## Development

### Frontend

```bash
npm install
npm run dev        # Start dev server on :8080
npm run build      # Production build to dist/
npm test           # Type check + lint + tests + build
```

### Backend (individual services)

```bash
cd backend/nostr-crawler
npm install
npm run dev        # Start with file watching

# Or run all backends via Docker:
docker compose up -d meilisearch
docker compose up nostr-crawler    # Runs in foreground with logs
```

---

## Deployment

### Ports

| Service | Port | Protocol |
|---------|------|----------|
| Frontend | 3000 | HTTP |
| Meilisearch | 7700 | HTTP |
| NIP-50 Relay | 7777 | WebSocket |
| Abuse API | 8080 | HTTP |
| Tor Proxy | 9050 | SOCKS5 |
| I2P HTTP Proxy | 4444 | HTTP |
| I2P Web Console | 7070 | HTTP |

### Reverse Proxy (nginx example)

```nginx
# Frontend
server {
    listen 443 ssl;
    server_name search.yourdomain.com;
    location / { proxy_pass http://127.0.0.1:3000; }
}

# NIP-50 Relay
server {
    listen 443 ssl;
    server_name relay.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:7777;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# REST API
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    location / { proxy_pass http://127.0.0.1:8080; }
}
```

---

## License

MIT

---

*Vibed with [Shakespeare](https://shakespeare.diy)*
