import { formatRoleName } from './roleFormatter';

describe('Role Name Formatter', () => {
  it('formats standard database role keys to human-readable names', () => {
    expect(formatRoleName('USER')).toBe('User');
    expect(formatRoleName('ADMIN')).toBe('Admin');
    expect(formatRoleName('SUPER_ADMIN')).toBe('Super Admin');
  });

  it('handles unknown or future role keys gracefully without crashing', () => {
    expect(formatRoleName('MODERATOR_ROLE')).toBe('Moderator Role');
    expect(formatRoleName('EVENT_MANAGER')).toBe('Event Manager');
  });

  it('handles empty, null, or undefined values gracefully', () => {
    expect(formatRoleName(null)).toBe('User');
    expect(formatRoleName(undefined)).toBe('User');
    expect(formatRoleName('')).toBe('User');
  });
});
