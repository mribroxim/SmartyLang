import type { UserAccountProfile } from '../firebase';
import { normalizePlanId } from './plans';
import { paidPlanEnded } from './entitlements';

export type AccountType = 'user' | 'smarty-max' | 'teacher' | 'business' | 'admin';

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  'user':            'User',
  'smarty-max':      'SmartyLang Max',
  'teacher':         'Teacher',
  'business':        'SmartyLang Business',
  'admin':           'Admin',
};

/** Business: a school or company that buys student seats in bulk (legacy "organization" too). */
export function isBusinessRole(role?: string | null): boolean {
  return role === 'business' || role === 'organization';
}
/** Teacher: a free account that runs classes (no seats); its students get a discount on Smarty Max. */
export function isTeacherRole(role?: string | null): boolean {
  return role === 'teacher';
}
/** Anyone who runs classes, assignments and live games. */
export function isEducatorRole(role?: string | null): boolean {
  return isTeacherRole(role) || isBusinessRole(role);
}
/** Discount on Smarty Max for students in a teacher's class. */
export const TEACHER_STUDENT_DISCOUNT = 0.1;

export const accountTypeOf = (p?: UserAccountProfile | null): AccountType => {
  if (!p) return 'user';
  if (p.role === 'admin') return 'admin';
  if (isTeacherRole(p.role)) return 'teacher';
  if (isBusinessRole(p.role)) return paidPlanEnded(p) ? 'user' : 'business';
  if (normalizePlanId(p.plan ?? undefined) === 'smarty-max' && !maxEnded(p)) return 'smarty-max';
  return 'user';
};

/** A cancelled Smarty Max runs until its paid period ends, then the account is free again. */
export function maxEnded(p?: UserAccountProfile | null, now = Date.now()): boolean {
  return paidPlanEnded(p, now);
}

/** Cancelled but still active: show "ends on …" and offer to keep it. */
export function maxEndsAt(p?: UserAccountProfile | null): number | null {
  return typeof p?.planCancelAt === 'number' && !maxEnded(p) ? p.planCancelAt : null;
}

export const canPractice = (p?: UserAccountProfile | null): boolean => {
  const t = accountTypeOf(p);
  return t === 'smarty-max' || t === 'admin';
};

export const canPreview = (p?: UserAccountProfile | null): boolean => {
  const t = accountTypeOf(p);
  return t !== 'user' && t !== 'teacher';
};

export const isPreviewMode = (p?: UserAccountProfile | null): boolean => {
  const t = accountTypeOf(p);
  return t === 'business';
};

export const isFreeUser = (p?: UserAccountProfile | null): boolean => {
  const t = accountTypeOf(p);
  return t === 'user' || t === 'teacher';
};

export const canUseBites = (p?: UserAccountProfile | null): boolean => !!p && !p.suspended;
export const hasUnlimitedHearts = (p?: UserAccountProfile | null): boolean => canPractice(p);
export function isFreeLearningRoute(tab: string, path: string[]): boolean {
  return ['vocabulary', 'gamification', 'classes'].includes(tab) || tab === 'practice' && !path.length
    || tab === 'lessons' && (!path.length || ['path', 'bite', 'refine', 'hearts', 'unit-one', 'assessment', 'test'].includes(path[0]));
}
