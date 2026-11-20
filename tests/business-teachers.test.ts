import { describe, expect, it } from 'vitest';
import { isValidTeacherEmail, summarizeTeachers } from '../src/features/Business/teachers';

describe('business teachers helpers', () => {
  it('validates emails', () => {
    expect(isValidTeacherEmail(' a@b.co ')).toBe(true);
    expect(isValidTeacherEmail('nope')).toBe(false);
    expect(isValidTeacherEmail('a b@c.de')).toBe(false);
  });
  it('sums classes and students', () => {
    expect(summarizeTeachers([{ classCount: 2, studentCount: 10 }, { classCount: 1, studentCount: 4 }])).toEqual({ teachers: 2, classes: 3, students: 14 });
    expect(summarizeTeachers([])).toEqual({ teachers: 0, classes: 0, students: 0 });
  });
});
