/**
 * Strict Bangladesh 11-digit mobile validation & anti-bot / anti-scam order checks.
 */

export function normalizeBangladeshPhone(raw: string): string {
  let digits = String(raw || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+880")) {
    digits = "0" + digits.slice(4);
  } else if (digits.startsWith("880") && digits.length >= 13) {
    digits = "0" + digits.slice(3);
  } else if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }
  return digits.replace(/\D/g, "");
}

export function validateBangladeshPhone(raw: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = normalizeBangladeshPhone(raw);
  if (!/^01[3-9]\d{8}$/.test(normalized)) {
    return {
      valid: false,
      normalized,
      error:
        "Please enter a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX, 018XXXXXXXX, 019XXXXXXXX).",
    };
  }
  // Reject repeated-digit fake/bot numbers like 01700000000 or 01811111111
  const tailUnique = new Set(normalized.slice(3).split("")).size;
  if (tailUnique <= 1) {
    return {
      valid: false,
      normalized,
      error: "Please enter a real 11-digit Bangladesh mobile number.",
    };
  }
  return { valid: true, normalized };
}

export function validateCustomerName(raw: string): boolean {
  const clean = String(raw || "").trim();
  if (clean.length < 2 || clean.length > 100) return false;
  return /[A-Za-z\u0980-\u09FF]{2,}/.test(clean);
}

export function validateDeliveryAddress(raw: string): boolean {
  const clean = String(raw || "").trim();
  return clean.length >= 6 && clean.length <= 350;
}
