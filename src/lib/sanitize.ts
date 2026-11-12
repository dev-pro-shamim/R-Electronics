/**
 * Input sanitization utility for Rango Electronics
 * Prevents XSS, Script Injection, and Malicious payloads in customer inputs.
 */

export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .trim()
    // Strip HTML tags
    .replace(/<[^>]*>?/gm, "")
    // Strip javascript: URLs
    .replace(/javascript:/gi, "")
    // Escape dangerous quotes
    .replace(/['"`;]/g, "")
    // Limit continuous spaces
    .replace(/\s+/g, " ");
}

export function sanitizePhone(phone: string): string {
  if (!phone) return "";
  // Keep only digits and plus sign
  return phone.replace(/[^\d+]/g, "").slice(0, 15);
}

export function sanitizeTrxId(trxId: string): string {
  if (!trxId) return "";
  // Keep only alphanumeric uppercase
  return trxId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 24);
}
