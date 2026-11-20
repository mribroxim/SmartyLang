import type { OrgTeacher } from '../../firebase';

/** Light client-side email check; the server validates again. */
export function isValidTeacherEmail(value: string): boolean {
  const v = value.trim();
  return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function summarizeTeachers(teachers: Pick<OrgTeacher, 'classCount' | 'studentCount'>[]): { teachers: number; classes: number; students: number } {
  return teachers.reduce((acc, t) => ({ teachers: acc.teachers + 1, classes: acc.classes + t.classCount, students: acc.students + t.studentCount }), { teachers: 0, classes: 0, students: 0 });
}
