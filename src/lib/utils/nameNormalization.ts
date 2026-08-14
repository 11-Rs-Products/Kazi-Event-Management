/**
 * Normalizes Google display names by stripping leading student IDs or numerical identifiers
 * e.g., "24F2002110 Amrutanshu Sahoo" -> "Amrutanshu Sahoo"
 * "26DS1XXXX John Doe" -> "John Doe"
 * "25F11XXXX Jane Doe" -> "Jane Doe"
 */
export function normalizeDisplayName(rawName: string | null | undefined): string {
  if (!rawName || typeof rawName !== 'string') {
    return 'Kaziranga Student';
  }

  const trimmed = rawName.trim();
  if (!trimmed) return 'Kaziranga Student';

  // Pattern matches student IDs at the beginning: e.g. 24F2002110, 26DS12345, 25F119999, etc.
  // 2 digits followed by letters/digits (like F2002110, DS1234), followed by whitespace
  const studentIdRegex = /^([0-9]{2}[A-Za-z0-9]{4,12})\s+(.+)$/i;

  const match = trimmed.match(studentIdRegex);
  if (match && match[2]) {
    const cleanedName = match[2].trim();
    if (cleanedName.length > 0) {
      return cleanedName;
    }
  }

  // Fallback check for standard pure numeric prefixes e.g. "123456 John"
  const numericPrefixRegex = /^\d{5,12}\s+(.+)$/;
  const numericMatch = trimmed.match(numericPrefixRegex);
  if (numericMatch && numericMatch[1]) {
    return numericMatch[1].trim();
  }

  return trimmed;
}
