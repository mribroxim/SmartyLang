import React from 'react';
import { User, Shield, BookOpen, Building2, Crown, Layers, User as UserIcon, Flame, Zap } from 'lucide-react';
import { accountTypeOf, ACCOUNT_TYPE_LABEL, type AccountType } from '../lib/access';
import type { UserAccountProfile } from '../firebase';

const TYPE_META: Record<AccountType, { icon: React.ElementType; color: string }> = {
  'user':         { icon: UserIcon,      color: 'text-slate-600 bg-slate-50 border-slate-200' },
  'smarty-max':   { icon: Crown,         color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'teacher':      { icon: BookOpen,      color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'organization': { icon: Building2,     color: 'text-violet-600 bg-violet-50 border-violet-200' },
  'admin':        { icon: Shield,        color: 'text-rose-600 bg-rose-50 border-rose-200' },
  'content-manager': { icon: Layers,    color: 'text-sky-600 bg-sky-50 border-sky-200' },
};

export function ProfileIdentityCard({
  photoURL,
  displayName,
  email,
  accountProfile,
  streak = 0,
  xp = 0,
  showEmail = true,
}: {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
  accountProfile: UserAccountProfile;
  streak?: number;
  xp?: number;
  showEmail?: boolean;
}) {
  const accountType = accountTypeOf(accountProfile);
  const roleMeta = { ...TYPE_META[accountType], label: ACCOUNT_TYPE_LABEL[accountType] };
  const RoleIcon = roleMeta.icon;
  const name = displayName || accountProfile.displayName || 'User';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3.5">
      {photoURL || accountProfile.photoURL ? (
        <img src={photoURL || accountProfile.photoURL} alt="" className="w-14 h-14 rounded-full ring-2 ring-slate-200" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center">
          <User className="w-7 h-7 text-zinc-500" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-zinc-900 truncate">{name}</h2>
        {showEmail && email ? (
          <p className="text-slate-500 text-sm truncate">{email}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${roleMeta.color}`}>
            <RoleIcon className="w-3.5 h-3.5" /> {roleMeta.label}
          </div>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-100">
              <Flame className="w-3.5 h-3.5" /> {streak} day{streak === 1 ? '' : 's'}
            </span>
          )}
          {xp > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
              <Zap className="w-3.5 h-3.5" /> {xp.toLocaleString()} XP
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
