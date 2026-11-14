import type { UiStringKey } from './uiStrings';

/** Display labels only. Persisted role/account-type identifiers remain unchanged. */
export function accountUiLabel(t: (key: UiStringKey) => string, role?: string | null): string {
  switch (role) {
    case 'smarty-max': return 'SmartyLang Max';
    case 'business': return 'SmartyLang Business';
    case 'admin': return t('core.accountRole.admin');
    case 'content-manager': return t('core.accountRole.contentManager');
    case 'teacher': return t('core.accountRole.teacher');
    case 'organization': return t('core.accountRole.organization');
    case 'student': return t('core.accountRole.student');
    default: return t('core.accountRole.user');
  }
}
