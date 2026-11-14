import type { UserAccountProfile } from '../firebase';
import { normalizePlanId } from './plans';
import { paidPlanEnded } from './entitlements';

export type AccountType = 'user' | 'smarty-max' | 'business' | 'admin' | 'content-manager';

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  'user':            'User',
  'smarty-max':      'SmartyLang Max',
  'business':        'SmartyLang Business',
  'admin':           'Admin',
  'content-manager': 'Content Manager',
};

/** Legacy teacher/organization roles map to business. */
export function isBusinessRole(role?: string | null): boolean {
  return role === 'business' || role === 'teacher' || role === 'organization';
}

export const accountTypeOf = (p?: UserAccountProfile | null): AccountType => {
  if (!p) return 'user';
  if (p.role === 'admin') return 'admin';
  if (p.role === 'content-manager') return 'content-manager';
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
  return t !== 'user';
};

export const isPreviewMode = (p?: UserAccountProfile | null): boolean => {
  const t = accountTypeOf(p);
  return t === 'business' || t === 'content-manager';
};

export const isFreeUser = (p?: UserAccountProfile | null): boolean => {
  return accountTypeOf(p) === 'user';
};

export const canUseBites = (p?: UserAccountProfile | null): boolean => !!p && !p.suspended;
export const hasUnlimitedHearts = (p?: UserAccountProfile | null): boolean => canPractice(p);
export function isFreeLearningRoute(tab: string, path: string[]): boolean {
  return tab === 'lessons' && (!path.length || ['path', 'bite', 'today', 'hearts'].includes(path[0]));
}
