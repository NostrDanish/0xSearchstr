# 0xSearchstr Custom Event Schemas

## Search Cache (kind 30078)

0xSearchstr uses **kind 30078** (NIP-78 Application-specific Data) to cache search results on Nostr.

### Purpose

Every time a user searches and gets results from external providers (SearXNG, DuckDuckGo, Wikipedia, Hacker News, etc.), the results are published to Nostr as an addressable event. Subsequent searches for the same query read from this cache first — instant results, no external API call.

The cache is **community-driven**: every user's search grows the index. The more people use 0xSearchstr, the smarter it gets.

### Event Structure

```json
{
  "kind": 30078,
  "pubkey": "<0xSearchstr bot pubkey>",
  "content": "<JSON array of cached SearchResult objects>",
  "tags": [
    ["d", "0xsearchstr:cache:<normalized-query>"],
    ["t", "0xsearchstr"],
    ["t", "search-cache"],
    ["query", "<original query text>"],
    ["cached_at", "<unix timestamp>"],
    ["result_count", "<number of cached results>"],
    ["alt", "0xSearchstr cached results for: <query>"]
  ]
}
```

### Security

- Only events from the **0xSearchstr bot account** (`12ad55ad1fdb918f5314c9e9a5cd135be9b746e6eee15fd871df131a5677d199`) are trusted.
- Readers always filter by `authors: [BOT_PUBKEY]` to prevent cache poisoning.
- Events are addressable — newer caches replace older ones for the same query.
- Cache expires after **24 hours** (client-side staleness check).

### Content Schema (SearchResult)

```typescript
interface CachedResult {
  id: string;        // unique key
  title: string;
  url: string;
  snippet: string;
  source: string;    // 'web' | 'wiki' | 'news' | 'code' | 'tor'
  provider: string;  // 'searxng' | 'duckduckgo' | 'wikipedia' | 'hackernews' | etc.
  timestamp?: number;
  author?: string;
  domain?: string;
  thumbnail?: string;
  kind?: string;     // 'Encyclopedia' | 'Story' | 'Question' | '.onion'
  engine?: string;
  tags?: string[];
}
```

### Query Normalization

Queries are normalized before use as d-tags:
1. Lowercased
2. Trimmed
3. Whitespace collapsed to single spaces
4. Punctuation stripped

This means "Bitcoin mining" and "bitcoin  mining!" map to the same cache entry.
