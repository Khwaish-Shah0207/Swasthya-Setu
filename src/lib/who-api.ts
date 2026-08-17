import fs from "fs";
import path from "path";
import type { WHOConceptRef } from "./types";

// ---------------------------------------------------------------------------
// WHO ICD-11 API service module
//
//   Frontend  ->  Swasthya-Setu backend  ->  OAuth 2.0  ->  WHO ICD-11 API
//
// Credentials (WHO_CLIENT_ID / WHO_CLIENT_SECRET) are read from server-side
// environment variables ONLY. This module is never imported by client
// components. If credentials are absent, or the WHO token/API endpoints are
// unreachable (as is the case in most sandboxed/offline dev environments),
// every public function here transparently falls back to the last
// synchronised local snapshot in data/who-snapshot.json and reports that
// fact back to the caller via `source`.
// ---------------------------------------------------------------------------

const TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token";
const API_BASE = "https://id.who.int/icd";
const REQUEST_TIMEOUT_MS = 6000;
const MAX_RETRIES = 2;

const SNAPSHOT_PATH = path.join(process.cwd(), "data", "who-snapshot.json");

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let tokenCache: CachedToken | null = null;

function credentialsConfigured(): boolean {
  return Boolean(process.env.WHO_CLIENT_ID && process.env.WHO_CLIENT_SECRET);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function withRetries<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

/**
 * Acquires (and caches) an OAuth 2.0 client-credentials access token from
 * the WHO ICD Access Management service. Throws if credentials are missing
 * or the token endpoint is unreachable — callers should catch and fall back.
 */
async function getAccessToken(): Promise<string> {
  if (!credentialsConfigured()) {
    throw new Error("WHO_CLIENT_ID / WHO_CLIENT_SECRET not configured");
  }
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5000) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.WHO_CLIENT_ID as string,
    client_secret: process.env.WHO_CLIENT_SECRET as string,
    scope: "icdapi_access",
  });

  const res = await withRetries(() =>
    fetchWithTimeout(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
  );

  if (!res.ok) {
    throw new Error(`WHO token request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return tokenCache.accessToken;
}

async function callWhoApi(pathSuffix: string): Promise<unknown> {
  const token = await getAccessToken();
  const res = await withRetries(() =>
    fetchWithTimeout(`${API_BASE}${pathSuffix}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Language": "en",
        "API-Version": "v2",
      },
    })
  );
  if (!res.ok) {
    throw new Error(`WHO API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function loadSnapshot(): { snapshotVersion: string; capturedAt: string; concepts: Omit<WHOConceptRef, "source">[] } {
  const raw = fs.readFileSync(SNAPSHOT_PATH, "utf-8");
  return JSON.parse(raw);
}

export interface WhoStatus {
  connected: boolean;
  mode: "live" | "snapshot-fallback";
  reason?: string;
  snapshotVersion?: string;
  snapshotCapturedAt?: string;
}

/**
 * Checks live WHO API connectivity without throwing. Used by the API status
 * panel and the admin sync screen.
 */
export async function checkWhoConnection(): Promise<WhoStatus> {
  if (!credentialsConfigured()) {
    const snap = loadSnapshot();
    return {
      connected: false,
      mode: "snapshot-fallback",
      reason: "WHO_CLIENT_ID / WHO_CLIENT_SECRET not configured",
      snapshotVersion: snap.snapshotVersion,
      snapshotCapturedAt: snap.capturedAt,
    };
  }
  try {
    await getAccessToken();
    return { connected: true, mode: "live" };
  } catch (err) {
    const snap = loadSnapshot();
    return {
      connected: false,
      mode: "snapshot-fallback",
      reason: err instanceof Error ? err.message : "Unknown WHO API error",
      snapshotVersion: snap.snapshotVersion,
      snapshotCapturedAt: snap.capturedAt,
    };
  }
}

/**
 * Looks up a single WHO concept by the code stored alongside the NAMASTE
 * record (either a Biomedicine ICD-11 code or an internal TM2 reference
 * code used in the demo dataset). Tries the live API first, then falls
 * back to the local snapshot cache.
 */
export async function lookupWhoConcept(code: string): Promise<WHOConceptRef | null> {
  if (credentialsConfigured()) {
    try {
      // NOTE: WHO's real MMS linearization search endpoint is
      // `${API_BASE}/release/11/2024-01/mms/search?q=<code>`. We search by
      // the code text; in production this would resolve through the
      // ConceptMap's stored WHO entity URI instead of a text search.
      const data = (await callWhoApi(`/release/11/2024-01/mms/search?q=${encodeURIComponent(code)}`)) as {
        destinationEntities?: { theCode?: string; title?: { "@value"?: string }; id?: string }[];
      };
      const match = data.destinationEntities?.find((e) => e.theCode === code) ?? data.destinationEntities?.[0];
      if (match) {
        return {
          code: match.theCode ?? code,
          title: match.title?.["@value"] ?? "Unknown title",
          uri: match.id ?? "",
          linearization: "Biomedicine",
          source: "who-api-live",
        };
      }
    } catch {
      // fall through to snapshot
    }
  }

  const snapshot = loadSnapshot();
  const found = snapshot.concepts.find((c) => c.code === code);
  if (!found) return null;
  return { ...found, source: "who-snapshot-cache" };
}

export function getSnapshotMeta() {
  const snap = loadSnapshot();
  return { snapshotVersion: snap.snapshotVersion, capturedAt: snap.capturedAt, count: snap.concepts.length };
}
