/**
 * AI config — localStorage-backed settings for the AI Answer Layer.
 *
 * AI is OFF by default and fully opt-in. The API key never leaves the
 * browser except inside requests to the chosen provider (via the CORS
 * proxy — disclosed in Settings → AI).
 *
 * Credential precedence (exactly):
 *
 *   1. USER-PROVIDED key — the user's own provider/endpoint/model, stored
 *      in this browser's localStorage only, sent nowhere except the chosen
 *      provider's request path. Removing it drops to the next tier.
 *   2. KEYLESS provider — e.g. a local Ollama; no key by design.
 *   3. ENGINE-PROVIDED AI — the operator's key, held SERVER-SIDE by an
 *      0xSigner-class proxy at /api/ai. The browser calls the same-origin
 *      proxy with NO key; the key is never in the bundle, localStorage,
 *      or any API response. Available only when the operator deployed and
 *      configured it (status comes from GET /api/ai/status). Inert on this
 *      workerless static deployment.
 *   4. AI UNAVAILABLE — otherwise. There is NO built-in key: provider
 *      credentials never ship in the client bundle (security standard).
 */

import { getAIProvider } from '@/lib/ai/registry';
import type { EngineAIStatus } from '@/lib/ai/engineProxy';

export type { EngineAIStatus } from '@/lib/ai/engineProxy';

/** Same-origin base of the engine-AI proxy (0xSigner-class server proxy). */
export const ENGINE_AI_BASE = '/api/ai';

const LS_KEY = '0xsearchstr:ai-config';

export interface AIConfig {
  /** Master switch — AI answers only run when enabled. */
  enabled: boolean;
  /** Provider id from the registry ('ppq', 'openrouter', 'ollama', 'custom', …). */
  providerId: string;
  /** API base URL (editable for custom/self-hosted). */
  endpoint: string;
  /** The USER's API key (sk-…). Empty = fall through to the engine tier. */
  apiKey: string;
  /** Model id ('auto' = provider's router default). Ignored on the engine tier. */
  model: string;
  /** Privacy: also include Nostr-tier results in the evidence sent to the AI. */
  includeNostr: boolean;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  providerId: 'ppq',
  endpoint: 'https://api.ppq.ai/v1',
  apiKey: '',
  model: 'auto',
  includeNostr: false,
};

/** True when the user has pasted their own API key (top precedence). */
export function hasOwnAIKey(cfg: AIConfig): boolean {
  return cfg.apiKey.trim().length > 0;
}

/** The effective runtime config after applying the precedence chain. */
export interface ResolvedAIConfig {
  providerId: string;
  endpoint: string;
  apiKey: string;
  model: string;
  /** Which tier answered: user's own key → engine proxy → built-in → none. */
  tier: 'user' | 'engine' | 'keyless' | 'unavailable';
  /** Engine-tier display info (provider label + model), when tier='engine'. */
  engine?: { providerName?: string; model?: string };
}

/** Engine tier usable right now? */
export function engineAIAvailable(engine: EngineAIStatus | null | undefined): boolean {
  return !!engine && engine.configured && engine.enabled;
}

/**
 * Resolve what a search actually runs with:
 *  1. user's own key            → their provider/endpoint/model
 *  2. keyless provider selected → their config as-is (e.g. local Ollama)
 *  3. engine configured+enabled → the same-origin proxy (no key, server model)
 *  4. built-in key present      → shared free tier (locked provider+model)
 *  5. otherwise                 → AI unavailable
 */
export function resolveAIConfig(cfg: AIConfig, engine?: EngineAIStatus | null): ResolvedAIConfig {
  if (hasOwnAIKey(cfg)) {
    return {
      providerId: cfg.providerId,
      endpoint: cfg.endpoint,
      apiKey: cfg.apiKey.trim(),
      model: cfg.model,
      tier: 'user',
    };
  }

  const provider = getAIProvider(cfg.providerId);
  if (provider && provider.requiresKey === false) {
    return {
      providerId: cfg.providerId,
      endpoint: cfg.endpoint,
      apiKey: '',
      model: cfg.model,
      tier: 'keyless',
    };
  }

  if (engineAIAvailable(engine) && engine) {
    return {
      providerId: 'engine',
      endpoint: ENGINE_AI_BASE,
      apiKey: '', // the key lives server-side; the browser never holds it
      model: engine.model || 'auto',
      tier: 'engine',
      engine: { providerName: engine.providerName, model: engine.model },
    };
  }

  // No built-in tier: provider credentials never ship in the client bundle,
  // and the code never silently falls back to one (security standard §13/§16).
  // Operators who want a shared tier deploy the engine proxy (0xSigner-class).
  return {
    providerId: cfg.providerId,
    endpoint: cfg.endpoint,
    apiKey: '',
    model: cfg.model,
    tier: 'unavailable',
  };
}

export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AIConfig>;
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

export function setAIConfig(patch: Partial<AIConfig>): AIConfig {
  const next = { ...getAIConfig(), ...patch };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — config just won't persist.
  }
  return next;
}
