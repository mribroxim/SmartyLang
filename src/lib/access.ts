// Unified account-type model.
//
// The codebase historically stored two separate fields on UserAccountProfile:
//   - role: 'student' | 'teacher' | 'organization' | 'admin'
//   - plan: 'smarty-max' | 'teacher' | 'organization' | undefined
//
// User-facing UI now treats these as a single concept ("Account Type") with
// 5 values: User, SmartyLang Max, Teacher, Organization, Admin.
//
// Access rules:
//   - User            → no access to any practice or learning material (locked behind paywall)
//   - SmartyLang Max  → full access to everything
//   - Teacher         → preview-only (can see materials, cannot record or submit)
//   - Organization    → preview-only (same as Teacher)
//   - Admin           → full access (with admin tools)
//
// Use these helpers everywhere instead of inspecting role/plan directly.

import type { UserAccountProfile } from '../firebase';

export type AccountType = 'user' | 'smarty-max' | 'teacher' | 'organization' | 'admin' | 'content-manager';

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  'user':            'User',
  'smarty-max':      'SmartyLang Max',
  'teacher':         'Teacher',
  'organization':    'Organization',
  'admin':           'Admin',
  'content-manager': 'Content Manager',
};

/** Derive the unified account type from a profile. Null/undefined → 'user'. */
export const accountTypeOf = (p?: UserAccountProfile | null): AccountType => {
  if (!p) return 'user';
  if (p.role === 'admin') return 'admin';
  if (p.role === 'content-manager') return 'content-manager';
  if (p.role === 'teacher') return 'teacher';
  if (p.role === 'organization') return 'organization';
  if (p.plan === 'smarty-max') return 'smarty-max';
  return 'user';
};

/** Can this account fully use practice features (record, submit, save progress)? */
export const canPractice = (p?: UserAccountProfile | null): boolean => {
  const t = accountTypeOf(p);
  return t === 'smarty-max' || t === 'admin';
};

/** Can this account view materials (read texts, see exercises) — even if read-only? */
export const canPreview = (p?: UserAccountProfile | null): boolean => {
  const t = accountTypeOf(p);
  return t !== 'user';
};

/** Is this account in preview-only mode (sees content but can't interact)? */
export const isPreviewMode = (p?: UserAccountProfile | null): boolean => {
  const t = accountTypeOf(p);
  return t === 'teacher' || t === 'organization' || t === 'content-manager';
};

/** Is this a free User account (no plan)? */
export const isFreeUser = (p?: UserAccountProfile | null): boolean => {
  return accountTypeOf(p) === 'user';
};
