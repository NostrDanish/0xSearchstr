# 0xSearchstr

**Decentralized search aggregator.** Nostr first, web when needed. No backend required.

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2FNostrDanish%2F0xSearchstr.git)

---

## How It Works

```
User Search
       │
       ▼
  Search Nostr (NIP-50)
       │
       ├── Profiles
       ├── Notes
       ├── Articles (NIP-23)
       └── Files
       │
  Enough results?
  │            │
 Yes          No
  │            │
  ▼            ▼
Show        Query SearXNG
Results     (instance pool with failover)
               │
    ┌──────────┼──────────┐
    │          │          │
  DDG      Brave    Wikipedia  ...
    │          │          │
    └──────────┴──────────┘
               │
          Merge + Show
               │
          Also search Tor?
          │            │
         Yes          No
          │            │
          ▼            ▼
      Query Ahmia   Done
      (.onion search)
               │
          Still nothing?
               │
               ▼
       Browser Fallback Links
  (DDG, Brave, Presearch, Mojeek, Marginalia)
```

Instead of building another centralized search engine, 0xSearchstr is a **search aggregator** that:

1. **Searches Nostr first** — NIP-50 queries to `relay.nostr.band` and `relay.ditto.pub`
2. **Falls back to SearXNG** — queries public meta-search instances that aggregate dozens of engines
3. **Never leaves you empty** — direct fallback links to privacy-respecting search engines

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

## Architecture

| Layer | Source | How |
|-------|--------|-----|
| **Nostr** | NIP-50 relays | Direct WebSocket queries to search-capable relays. Profiles, notes, articles, files. |
| **Web** | SearXNG instances | Meta-search across DDG, Brave, Wikipedia, and dozens more. Pool of public instances with automatic failover. |
| **Tor** | Ahmia.fi | Policy-compliant .onion search engine. Results show warning interstitials before opening. Fallback links to Torch and Haystak. |
| **I2P** | Eepsite directories | Directory links to Identiguy, notbob.i2p, stats.i2p. No public I2P search API exists yet. |
| **Fallback** | Browser links | Direct links to DDG, Brave Search, Presearch, Mojeek, Marginalia. |

### Nostr-First Strategy

The app always searches Nostr first. If Nostr returns enough results (8+), web search is skipped entirely. This means:
- Most Nostr-native queries never touch the clearnet
- Web results only appear when they'd actually add value
- The "All" tab intelligently merges both sources

### SearXNG Integration

[SearXNG](https://docs.searxng.org/) is an open-source meta-search engine that aggregates results from dozens of search engines without tracking users. 0xSearchstr queries public SearXNG instances:

- **Automatic failover**: if one instance is down, try the next
- **CORS proxy**: browser-based access via proxy
- **Rich results**: titles, snippets, engines, dates, suggestions

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

The self-hosted backend enforces content policy modeled on [Ahmia](https://ahmia.fi). Hard-blocked categories: CSAM, human trafficking, weapons sales, drug marketplace listings. See the [Policy page](/policy) for details.

---

## Tech Stack

- **React 19** + TypeScript + Vite
- **TailwindCSS 4** + shadcn/ui
- **Nostrify** — NIP-50 relay search
- **SearXNG** — meta-search fallback
- **TanStack Query** — data fetching + caching

---

## License

MIT

---

*Vibed with [Shakespeare](https://shakespeare.diy)*
