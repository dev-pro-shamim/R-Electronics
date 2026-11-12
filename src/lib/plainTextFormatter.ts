/**
 * Helpers for converting copy-pasted plain text (Word, ChatGPT, Notes)
 * into clean, structured HTML without requiring admins to write HTML tags,
 * and for converting legacy HTML back into readable plain text.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyInlineFormatting(escapedLine: string): string {
  return escapedLine.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function hasHtmlBlockTags(input: string): boolean {
  return /<\s*(h[1-6]|p|ul|ol|li|div|table|section|article|br)\b/i.test(input);
}

/**
 * Converts HTML policy/CMS content into clean human-readable plain text
 * so admins can edit without touching raw HTML tags.
 */
export function htmlToReadableText(raw: string): string {
  if (!raw) return "";
  if (!hasHtmlBlockTags(raw)) return raw.trim();

  return raw
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/(h[1-6]|p|div|tr)\s*>/gi, "\n\n")
    .replace(/<\s*h[1-6][^>]*>/gi, "\n## ")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\s*\/li\s*>/gi, "\n")
    .replace(/<\s*\/(ul|ol)\s*>/gi, "\n")
    .replace(/<\s*strong[^>]*>(.*?)<\/\s*strong\s*>/gi, "**$1**")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Formats either legacy HTML or plain copy-pasted text into clean semantic HTML.
 */
export function formatRichOrPlainToHtml(raw: string): string {
  const input = (raw || "").trim();
  if (!input) return "";
  if (hasHtmlBlockTags(input)) {
    return input;
  }

  const lines = input.split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      closeLists();
      continue;
    }

    if (line.startsWith("### ")) {
      closeLists();
      out.push(`<h3>${applyInlineFormatting(escapeHtml(line.slice(4).trim()))}</h3>`);
      continue;
    }
    if (line.startsWith("## ") || line.startsWith("# ")) {
      closeLists();
      const heading = line.replace(/^#{1,2}\s+/, "").trim();
      out.push(`<h2>${applyInlineFormatting(escapeHtml(heading))}</h2>`);
      continue;
    }

    const bulletMatch = line.match(/^(?:[•\-*✓✔▸▪])\s+(.+)$/);
    if (bulletMatch) {
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push('<ul class="list-disc pl-5 space-y-1.5">');
        inUl = true;
      }
      out.push(`<li>${applyInlineFormatting(escapeHtml(bulletMatch[1].trim()))}</li>`);
      continue;
    }

    const numMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (numMatch) {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push('<ol class="list-decimal pl-5 space-y-1.5">');
        inOl = true;
      }
      out.push(`<li>${applyInlineFormatting(escapeHtml(numMatch[1].trim()))}</li>`);
      continue;
    }

    closeLists();
    const nextLine = (lines[i + 1] || "").trim();
    const looksLikeHeading =
      line.length <= 65 &&
      !line.endsWith(".") &&
      (line.endsWith(":") || (nextLine.length > 0 && !/^(?:[•\-*✓✔]|\d+[.)])/.test(nextLine)));

    if (looksLikeHeading && line.endsWith(":")) {
      out.push(`<h3>${applyInlineFormatting(escapeHtml(line.slice(0, -1)))}</h3>`);
    } else {
      out.push(`<p>${applyInlineFormatting(escapeHtml(line))}</p>`);
    }
  }

  closeLists();
  return out.join("\n");
}

/**
 * Parses pasted specifications text (e.g. "Capacity: 1.5 Ton", "Brand - Hisense",
 * or tab-separated lines) into clean key-value rows.
 */
export function parsePlainSpecsText(raw: string): { label: string; value: string }[] {
  if (!raw) return [];
  const rows: { label: string; value: string }[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const clean = rawLine.replace(/^[•\-*✓✔▸▪\s]+/, "").trim();
    if (!clean) continue;

    let label = "";
    let value = "";
    if (clean.includes("\t")) {
      const parts = clean.split("\t").map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        label = parts[0];
        value = parts.slice(1).join(" ");
      }
    } else if (clean.includes(":")) {
      const idx = clean.indexOf(":");
      label = clean.slice(0, idx).trim();
      value = clean.slice(idx + 1).trim();
    } else if (clean.includes(" - ")) {
      const idx = clean.indexOf(" - ");
      label = clean.slice(0, idx).trim();
      value = clean.slice(idx + 3).trim();
    }

    if (label && value) {
      rows.push({ label, value });
    } else if (clean.length > 0) {
      rows.push({ label: "Feature", value: clean });
    }
  }
  return rows;
}
