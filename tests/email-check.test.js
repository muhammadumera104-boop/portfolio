import { describe, it, expect } from 'vitest';
import { suggestEmail, editDistance } from '../src/shared/email-check.js';

describe('editDistance', () => {
  it('counts single-character changes', () => {
    expect(editDistance('gmail.com', 'gmail.com')).toBe(0);
    expect(editDistance('gma5l.com', 'gmail.com')).toBe(1);
    expect(editDistance('gmial.com', 'gmail.com')).toBe(1); // two neighbouring letters swapped
    expect(editDistance('', 'abc')).toBe(3);
  });
});

describe('suggestEmail', () => {
  it.each([
    ['qataadahrehan123@gma5l.com', 'qataadahrehan123@gmail.com'], // the real typo that lost a reply
    ['someone@gmial.com', 'someone@gmail.com'],
    ['someone@gmai.com', 'someone@gmail.com'],
    ['someone@gmail.con', 'someone@gmail.com'],
    ['someone@gmail.co', 'someone@gmail.com'],
    ['someone@gnail.com', 'someone@gmail.com'],
    ['someone@yaho.com', 'someone@yahoo.com'],
    ['someone@hotmial.com', 'someone@hotmail.com'],
    ['someone@outlok.com', 'someone@outlook.com'],
    ['Someone@GMA5L.com', 'someone@gmail.com'],
  ])('flags %s and suggests %s', (typo, fixed) => expect(suggestEmail(typo)).toBe(fixed));

  it.each([
    'muhammadumera104@gmail.com',
    'someone@yahoo.com',
    'student@agu.edu.pk',
    'person@company.io',
    'me@my-own-domain.com',
    'a@b.co',
    'not-an-email',
    '',
    null,
  ])('leaves %s alone', (ok) => expect(suggestEmail(ok)).toBeNull());

  it('keeps the part before the @ exactly as typed (lower-cased)', () => {
    expect(suggestEmail('First.Last+tag@gmial.com')).toBe('first.last+tag@gmail.com');
  });
});
