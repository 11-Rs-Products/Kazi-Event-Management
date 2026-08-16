/**
 * Helper utility to validate official IITM study email addresses.
 * Requires the email to strictly end with 'study.iitm.ac.in' after normalization.
 * Prevents loose substring matches like 'user@study.iitm.ac.in.example.com'.
 */
export function isIITMEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  return clean.endsWith('study.iitm.ac.in');
}
