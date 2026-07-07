import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { createLogger } from './logger.js';
import type { PolicyVerdict } from './types.js';

const log = createLogger('content-policy');

// ─── Blocklist paths (mounted via Docker volume or local config) ───
const DOMAIN_BLOCKLIST_PATH = process.env.DOMAIN_BLOCKLIST_PATH || './config/blocklists/domains.txt';
const HASH_BLOCKLIST_PATH = process.env.HASH_BLOCKLIST_PATH || './config/blocklists/hashes.txt';
const KEYWORD_BLOCKLIST_PATH = process.env.KEYWORD_BLOCKLIST_PATH || './config/blocklists/keywords.json';

// ─── In-memory blocklist sets ───
let blockedDomains: Set<string> = new Set();
let blockedHashes: Set<string> = new Set();
let keywordRules: KeywordRule[] = [];

interface KeywordRule {
  category: string;
  patterns: RegExp[];
  weight: number;
}

/** Threshold above which content is blocked (0-1 scale). */
const BLOCK_THRESHOLD = 0.6;

/**
 * Load blocklists from disk into memory.
 * Called at startup and can be refreshed periodically.
 */
export function loadBlocklists(): void {
  // Domain blocklist: one domain per line, # for comments.
  if (existsSync(DOMAIN_BLOCKLIST_PATH)) {
    const raw = readFileSync(DOMAIN_BLOCKLIST_PATH, 'utf-8');
    blockedDomains = new Set(
      raw.split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line && !line.startsWith('#'))
    );
    log.info(`Loaded ${blockedDomains.size} blocked domains`);
  } else {
    log.warn(`Domain blocklist not found at ${DOMAIN_BLOCKLIST_PATH}`);
  }

  // Content hash blocklist: one SHA-256 hash per line.
  if (existsSync(HASH_BLOCKLIST_PATH)) {
    const raw = readFileSync(HASH_BLOCKLIST_PATH, 'utf-8');
    blockedHashes = new Set(
      raw.split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line && !line.startsWith('#'))
    );
    log.info(`Loaded ${blockedHashes.size} blocked content hashes`);
  } else {
    log.warn(`Hash blocklist not found at ${HASH_BLOCKLIST_PATH}`);
  }

  // Keyword rules: JSON array of { category, patterns, weight }.
  if (existsSync(KEYWORD_BLOCKLIST_PATH)) {
    try {
      const raw = readFileSync(KEYWORD_BLOCKLIST_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Array<{
        category: string;
        patterns: string[];
        weight: number;
      }>;
      keywordRules = parsed.map(rule => ({
        category: rule.category,
        patterns: rule.patterns.map(p => new RegExp(p, 'i')),
        weight: rule.weight,
      }));
      log.info(`Loaded ${keywordRules.length} keyword rule categories`);
    } catch (err) {
      log.error({ err }, 'Failed to parse keyword blocklist');
    }
  } else {
    log.warn(`Keyword blocklist not found at ${KEYWORD_BLOCKLIST_PATH}`);
  }
}

/**
 * Check if a domain is on the blocklist.
 */
export function isDomainBlocked(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  return blockedDomains.has(normalized);
}

/**
 * Check if content matches a known-bad hash.
 * Uses SHA-256 of the raw content string.
 */
export function isContentHashBlocked(content: string): boolean {
  const hash = createHash('sha256').update(content).digest('hex');
  return blockedHashes.has(hash);
}

/**
 * Run keyword classifier against content.
 * Returns the highest-scoring category and its confidence.
 */
export function classifyContent(content: string): { category: string; confidence: number } | null {
  let bestMatch: { category: string; confidence: number } | null = null;

  for (const rule of keywordRules) {
    let matchCount = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(content)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      // Confidence is (matched patterns / total patterns) * rule weight.
      const confidence = (matchCount / rule.patterns.length) * rule.weight;
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { category: rule.category, confidence };
      }
    }
  }

  return bestMatch;
}

/**
 * Full content policy check. Returns a verdict.
 *
 * Pipeline: domain check -> hash check -> keyword classifier.
 * If ANY check triggers above threshold, content is blocked.
 */
export function checkContentPolicy(
  content: string,
  options?: { domain?: string; url?: string },
): PolicyVerdict {
  // 1. Domain blocklist.
  if (options?.domain && isDomainBlocked(options.domain)) {
    log.warn({ domain: options.domain }, 'Blocked: domain on blocklist');
    return {
      allowed: false,
      category: 'blocked-domain',
      confidence: 1.0,
      matchedRule: `domain:${options.domain}`,
    };
  }

  // 2. Extract domain from URL if not provided.
  if (options?.url && !options?.domain) {
    try {
      const urlDomain = new URL(options.url).hostname;
      if (isDomainBlocked(urlDomain)) {
        log.warn({ domain: urlDomain }, 'Blocked: domain on blocklist (from URL)');
        return {
          allowed: false,
          category: 'blocked-domain',
          confidence: 1.0,
          matchedRule: `domain:${urlDomain}`,
        };
      }
    } catch {
      // Invalid URL, continue with other checks.
    }
  }

  // 3. Content hash check.
  if (isContentHashBlocked(content)) {
    log.warn('Blocked: content hash on blocklist');
    return {
      allowed: false,
      category: 'blocked-hash',
      confidence: 1.0,
      matchedRule: 'hash-match',
    };
  }

  // 4. Keyword classifier.
  const classification = classifyContent(content);
  if (classification && classification.confidence >= BLOCK_THRESHOLD) {
    log.warn(
      { category: classification.category, confidence: classification.confidence },
      'Blocked: keyword classifier triggered',
    );
    return {
      allowed: false,
      category: classification.category,
      confidence: classification.confidence,
      matchedRule: `keyword:${classification.category}`,
    };
  }

  return { allowed: true, confidence: 0 };
}

// Auto-load blocklists on module import.
loadBlocklists();
