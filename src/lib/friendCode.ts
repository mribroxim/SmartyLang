export const FRIEND_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const FRIEND_CODE_LENGTH = 8;
export const LEGACY_FRIEND_CODE_LENGTH = 18;

const shortCode = new RegExp(`^[${FRIEND_CODE_ALPHABET}]{${FRIEND_CODE_LENGTH}}$`);
const legacyCode = new RegExp(`^[A-F0-9]{${LEGACY_FRIEND_CODE_LENGTH}}$`);

export function normalizeFriendCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '');
}

export function isFriendCode(code: string): boolean {
  return shortCode.test(code) || legacyCode.test(code);
}
