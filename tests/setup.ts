import { beforeEach } from 'vitest';
import { setStorageUid } from '../src/lib/userStorage';
const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: unknown) => values.set(key, String(value)), removeItem: (key: string) => values.delete(key), clear: () => values.clear() } });
let sequence = 0;
beforeEach(() => { values.clear(); setStorageUid(`vitest-${++sequence}`); });
