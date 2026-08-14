import { normalizeDisplayName } from './nameNormalization';

describe('Google Display Name Normalization', () => {
  it('correctly strips student ID prefixes from display names', () => {
    expect(normalizeDisplayName('24F2002110 Amrutanshu Sahoo')).toBe('Amrutanshu Sahoo');
    expect(normalizeDisplayName('26DS1XXXX John Doe')).toBe('John Doe');
    expect(normalizeDisplayName('25F11XXXX Jane Doe')).toBe('Jane Doe');
  });

  it('retains regular names without student ID prefixes', () => {
    expect(normalizeDisplayName('Amrutanshu Sahoo')).toBe('Amrutanshu Sahoo');
    expect(normalizeDisplayName('John Doe')).toBe('John Doe');
  });

  it('handles null, undefined, and empty string gracefully', () => {
    expect(normalizeDisplayName(null)).toBe('Kaziranga Student');
    expect(normalizeDisplayName(undefined)).toBe('Kaziranga Student');
    expect(normalizeDisplayName('')).toBe('Kaziranga Student');
  });
});
