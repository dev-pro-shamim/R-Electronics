import fs from "fs";
import path from "path";

export interface CourierSecretConfig {
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  secretKey?: string;
  apiToken?: string;
  authHeaderName?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  storeId?: string;
  customName?: string;
  trackingUrlPattern?: string;
}

export type CourierProviderSecrets = CourierSecretConfig;

export interface ServerSecretsStore {
  smtpPassword?: string;
  resendApiKey?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  couriers: Record<string, CourierSecretConfig>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const SECRETS_PATH = path.join(DATA_DIR, "server-secrets.json");

export function readServerSecrets(): ServerSecretsStore {
  try {
    if (!fs.existsSync(SECRETS_PATH)) {
      return { couriers: {} };
    }
    const raw = fs.readFileSync(SECRETS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      smtpPassword: parsed?.smtpPassword || undefined,
      resendApiKey: parsed?.resendApiKey || undefined,
      googleClientId: parsed?.googleClientId || undefined,
      googleClientSecret: parsed?.googleClientSecret || undefined,
      couriers: parsed?.couriers && typeof parsed.couriers === "object" ? parsed.couriers : {},
    };
  } catch {
    return { couriers: {} };
  }
}

export function getGoogleOAuthConfig(): { clientId: string; clientSecret: string } {
  const store = readServerSecrets();
  return {
    clientId: (process.env.GOOGLE_CLIENT_ID || store.googleClientId || "").trim(),
    clientSecret: (process.env.GOOGLE_CLIENT_SECRET || store.googleClientSecret || "").trim(),
  };
}

export function writeServerSecrets(next: ServerSecretsStore) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(SECRETS_PATH, JSON.stringify(next, null, 2), "utf8");
}

export function maskSecret(value?: string): string {
  if (!value) return "";
  const clean = value.trim();
  if (!clean) return "";
  if (clean.length <= 4) return "••••";
  return `${"•".repeat(Math.min(10, clean.length - 4))}${clean.slice(-4)}`;
}

export function getCourierSecretsForProvider(providerId: string): CourierSecretConfig {
  const store = readServerSecrets();
  const saved = store.couriers[providerId] || {};

  // Environment variables act as authoritative overrides/defaults on server
  if (providerId === "pathao") {
    return {
      baseUrl: saved.baseUrl || process.env.PATHAO_BASE_URL || "https://api-hermes.pathao.com",
      clientId: saved.clientId || process.env.PATHAO_CLIENT_ID || "",
      clientSecret: saved.clientSecret || process.env.PATHAO_CLIENT_SECRET || "",
      username: saved.username || process.env.PATHAO_USERNAME || "",
      password: saved.password || process.env.PATHAO_PASSWORD || "",
      storeId: saved.storeId || process.env.PATHAO_STORE_ID || "",
    };
  }
  if (providerId === "steadfast") {
    return {
      baseUrl: saved.baseUrl || process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1",
      apiKey: saved.apiKey || process.env.STEADFAST_API_KEY || "",
      apiSecret: saved.apiSecret || process.env.STEADFAST_SECRET_KEY || "",
    };
  }
  if (providerId === "redx") {
    return {
      baseUrl: saved.baseUrl || process.env.REDX_BASE_URL || "https://openapi.redx.com.bd/v1.0.0-beta",
      apiKey: saved.apiKey || process.env.REDX_API_TOKEN || "",
      storeId: saved.storeId || process.env.REDX_STORE_ID || "",
    };
  }
  if (providerId === "paperfly") {
    return {
      baseUrl: saved.baseUrl || process.env.PAPERFLY_BASE_URL || "https://api.paperfly.com.bd",
      apiKey: saved.apiKey || process.env.PAPERFLY_API_KEY || "",
      username: saved.username || process.env.PAPERFLY_USERNAME || "",
      password: saved.password || process.env.PAPERFLY_PASSWORD || "",
    };
  }
  return { ...saved };
}

export function getMaskedCourierSummary(providerId: string): Record<string, string> {
  const cfg = getCourierSecretsForProvider(providerId);
  const summary: Record<string, string> = {};
  if (cfg.baseUrl) summary.baseUrl = cfg.baseUrl;
  if (cfg.storeId) summary.storeId = cfg.storeId;
  if (cfg.username) summary.username = cfg.username;
  if (cfg.clientId) summary.clientId = maskSecret(cfg.clientId);
  if (cfg.clientSecret) summary.clientSecret = maskSecret(cfg.clientSecret);
  if (cfg.apiKey) summary.apiKey = maskSecret(cfg.apiKey);
  if (cfg.apiSecret) summary.apiSecret = maskSecret(cfg.apiSecret);
  if (cfg.password) summary.password = maskSecret(cfg.password);
  if (cfg.customName) summary.customName = cfg.customName;
  if (cfg.trackingUrlPattern) summary.trackingUrlPattern = cfg.trackingUrlPattern;
  return summary;
}

export function hasCourierCredentials(providerId: string): boolean {
  const cfg = getCourierSecretsForProvider(providerId);
  if (providerId === "pathao") {
    return Boolean(cfg.clientId && cfg.clientSecret && cfg.username && cfg.password);
  }
  if (providerId === "steadfast") {
    return Boolean(cfg.apiKey && cfg.apiSecret);
  }
  if (providerId === "redx") {
    return Boolean(cfg.apiKey);
  }
  if (providerId === "paperfly") {
    return Boolean((cfg.username && cfg.password) || cfg.apiKey);
  }
  return Boolean(cfg.baseUrl && cfg.apiKey);
}
