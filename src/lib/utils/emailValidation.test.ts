import { isIITMEmail } from './emailValidation';

describe('isIITMEmail Suffix Validation', () => {
  it('returns true for valid IITM study email addresses', () => {
    expect(isIITMEmail('24f2002110@ds.study.iitm.ac.in')).toBe(true);
    expect(isIITMEmail('student@study.iitm.ac.in')).toBe(true);
    expect(isIITMEmail('24F2002110@DS.STUDY.IITM.AC.IN  ')).toBe(true);
  });

  it('returns false for personal or non-IITM email addresses', () => {
    expect(isIITMEmail('user@gmail.com')).toBe(false);
    expect(isIITMEmail('john.doe@yahoo.com')).toBe(false);
    expect(isIITMEmail('student@iitm.ac.in')).toBe(false);
  });

  it('returns false for emails containing but not ending with study.iitm.ac.in', () => {
    expect(isIITMEmail('user@study.iitm.ac.in.example.com')).toBe(false);
    expect(isIITMEmail('study.iitm.ac.in@gmail.com')).toBe(false);
    expect(isIITMEmail('user@study.iitm.ac.in.org')).toBe(false);
  });

  it('handles null, undefined, and empty input gracefully', () => {
    expect(isIITMEmail(null)).toBe(false);
    expect(isIITMEmail(undefined)).toBe(false);
    expect(isIITMEmail('')).toBe(false);
  });
});
