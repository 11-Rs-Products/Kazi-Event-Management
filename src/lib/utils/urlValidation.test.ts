import { isValidUrl, normalizeUrl } from './urlValidation';

describe('isValidUrl', () => {
  it('returns true for standard web URLs with http or https', () => {
    expect(isValidUrl('https://google.com')).toBe(true);
    expect(isValidUrl('https://drive.google.com/drive/folders/12345')).toBe(true);
    expect(isValidUrl('http://github.com/my-org/my-project')).toBe(true);
    expect(isValidUrl('https://meet.google.com/abc-defg-hij')).toBe(true);
    expect(isValidUrl('https://figma.com/file/123/Project?node-id=0%3A1')).toBe(true);
    expect(isValidUrl('https://sub.domain.co.in/path/to/file.pdf?query=1#hash')).toBe(true);
  });

  it('returns true for web URLs without explicit protocol', () => {
    expect(isValidUrl('meet.google.com/abc-defg-hij')).toBe(true);
    expect(isValidUrl('drive.google.com/file/d/123')).toBe(true);
    expect(isValidUrl('github.com/my-repo')).toBe(true);
    expect(isValidUrl('images.unsplash.com/photo-123456')).toBe(true);
  });

  it('returns false for plain text or incomplete links', () => {
    expect(isValidUrl('just random text')).toBe(false);
    expect(isValidUrl('hello world')).toBe(false);
    expect(isValidUrl('google')).toBe(false);
    expect(isValidUrl('drive.google')).toBe(false);
    expect(isValidUrl('https://')).toBe(false);
    expect(isValidUrl('http://')).toBe(false);
    expect(isValidUrl('http://.com')).toBe(false);
  });

  it('blocks dangerous or non-web schemes', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidUrl('file:///etc/passwd')).toBe(false);
    expect(isValidUrl('ftp://ftp.example.com')).toBe(false);
  });

  it('handles empty and null values gracefully', () => {
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('   ')).toBe(false);
    expect(isValidUrl(null)).toBe(false);
    expect(isValidUrl(undefined)).toBe(false);
  });
});

describe('normalizeUrl', () => {
  it('preserves existing https:// or http:// protocols', () => {
    expect(normalizeUrl('https://drive.google.com')).toBe('https://drive.google.com');
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('prepends https:// when protocol is missing', () => {
    expect(normalizeUrl('meet.google.com/abc')).toBe('https://meet.google.com/abc');
    expect(normalizeUrl('github.com/repo')).toBe('https://github.com/repo');
  });

  it('returns empty string for empty inputs', () => {
    expect(normalizeUrl('')).toBe('');
    expect(normalizeUrl('   ')).toBe('');
    expect(normalizeUrl(null)).toBe('');
    expect(normalizeUrl(undefined)).toBe('');
  });
});
