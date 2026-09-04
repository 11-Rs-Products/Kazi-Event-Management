/**
 * Utility functions for validating and normalizing web links across the application.
 */

/**
 * Checks whether a given string is a valid web URL.
 * 
 * Supports:
 * - Standard web URLs: https://drive.google.com/file/..., http://github.com/...
 * - URLs without protocol: meet.google.com/abc-xyz, figma.com/@user
 * 
 * Rejects:
 * - Empty or whitespace-only strings
 * - Arbitrary text without a domain: "my submission", "google"
 * - Malformed protocols or domains: "http://", "https://.", "http://com"
 * - Insecure or malicious URI schemes: javascript:, data:, file:, vbscript:
 */
export function isValidUrl(input?: string | null): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  if (!trimmed) return false;

  // Reject dangerous schemes immediately
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return false;
  }

  // If protocol is missing, check if it looks like a valid domain before prepending https://
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const candidate = hasProtocol ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    // Protocol must strictly be http: or https:
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname;
    // Hostname must exist, have no whitespace, and not start/end with dot
    if (!hostname || hostname.includes(' ') || hostname.startsWith('.') || hostname.endsWith('.')) {
      return false;
    }

    // Hostname must contain at least one dot (unless localhost for local development)
    if (hostname !== 'localhost' && !hostname.includes('.')) {
      return false;
    }

    // Validate TLD (Top Level Domain)
    if (hostname !== 'localhost') {
      const parts = hostname.split('.');
      const tld = parts[parts.length - 1];
      // TLD must be at least 2 alphabetic characters (e.g. com, in, org, io, ac)
      if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL string by trimming whitespace and prepending https:// if missing.
 * Returns empty string if input is empty or invalid.
 */
export function normalizeUrl(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
