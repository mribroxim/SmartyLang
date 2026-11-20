import { useCallback, useEffect, useState } from 'react';
import { getStudentClasses, getTeacherClasses, type ClassRoom } from '../firebase';

export const CLASSES_CHANGED = 'smarty:classes-changed';
export const announceClassesChanged = () => window.dispatchEvent(new Event(CLASSES_CHANGED));

/** The classes this user is in (students) or teaches (teachers); re-reads when a class is joined. */
export function useMyClasses(uid: string | undefined, kind: 'student' | 'teacher' | null) {
  const [classes, setClasses] = useState<ClassRoom[] | null>(null);
  const load = useCallback(async () => {
    if (!uid || !kind) { setClasses([]); return; }
    try { setClasses(await (kind === 'teacher' ? getTeacherClasses(uid) : getStudentClasses(uid))); }
    catch { setClasses(current => current ?? []); }
  }, [uid, kind]);
  useEffect(() => {
    setClasses(null);
    void load();
    const refresh = () => { if (!document.hidden) void load(); };
    window.addEventListener(CLASSES_CHANGED, refresh);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener(CLASSES_CHANGED, refresh); window.removeEventListener('focus', refresh); };
  }, [load]);
  return { classes, reload: load };
}
