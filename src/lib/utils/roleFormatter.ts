import { UserRole } from '@/types';

/**
 * Centralized Role Display Name Formatter.
 * Maps internal database keys ('USER', 'ADMIN', 'SUPER_ADMIN')
 * to clean human-readable titles ('User', 'Admin', 'Super Admin').
 * Gracefully handles unknown/future role keys without crashing.
 */
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  USER: 'Member',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

export function formatRoleName(role?: string | null): string {
  if (!role || typeof role !== 'string') return 'Member';

  const trimmed = role.trim();
  if (ROLE_DISPLAY_NAMES[trimmed]) {
    return ROLE_DISPLAY_NAMES[trimmed];
  }

  // Graceful fallback for unknown/future role keys (e.g. 'EVENT_ADMIN' -> 'Event Admin')
  return trimmed
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
