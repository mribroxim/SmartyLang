# SmartyLang — Design System

Codified from the actual patterns in use across `src/`. There is no shared component
library today — every screen hand-rolls Tailwind utility classes. This document is the
single source of truth going forward: new UI should match these tokens and component
specs, and the audit below tracks where existing screens still drift.

---

## 1. Design Tokens

### Color

Tailwind's default zinc/slate palette *is* the brand palette — no custom hex values
needed except the two noted exceptions below. Always use the Tailwind class, never a
raw hex, so the global dark-mode overrides in `src/index.css` keep working.

| Role | Light tokens | Usage |
|---|---|---|
| **Primary / CTA** | `bg-zinc-900` → `hover:bg-black`, `text-white` | Primary buttons, active nav state, key actions |
| **Neutral surface** | `bg-white`, `bg-slate-50`, `bg-zinc-50` | Page backgrounds, cards |
| **Neutral text** | `text-zinc-900` (headings), `text-slate-600` (body), `text-slate-400` (muted) | Default text hierarchy |
| **Neutral border** | `border-slate-200` / `border-zinc-200` | Default card/input border |
| **Success** | `bg-emerald-50` / `text-emerald-700` / `border-emerald-200` | Correct answers, completed states, positive scores |
| **Danger / destructive** | `bg-rose-50` / `text-rose-700` / `border-rose-200` | Errors, admin/destructive actions, logout |
| **Warning / premium** | `bg-amber-50` / `text-amber-700` / `border-amber-200`; gradient `from-amber-400 to-amber-600` | SmartyLang Max / upgrade CTAs, warnings |
| **Info / teacher tier** | `bg-blue-50` / `text-blue-700`; gradient `from-indigo-600 to-emerald-600` | Teacher-tier badges, hero gradients |
| **Organization tier** | `bg-violet-50` / `text-violet-700` / `border-violet-200` | Org-tier badges |
| **Ghost hover (exception)** | `bg-[#f2f2f2]` (hover), `bg-[#ebebeb]` (active) | Sidebar nav item hover/active — the one place a raw hex is intentional; pair with `dark:bg-zinc-700` |

**Rule:** every accent color is used as a 50/700/200 triad (`bg-{color}-50 text-{color}-700 border-{color}-200`) for badges/pills. Don't introduce a new accent color without adding it to this table and to the dark-mode override block in `src/index.css`.

### Typography

Defined in `src/index.css` `@theme`:

| Token | Value | Usage |
|---|---|---|
| `font-sans` (default) | Inter | All body text — no class needed |
| `font-serif` | Montserrat | Headings, wordmark/branding (`font-serif font-black tracking-tighter uppercase`) |
| `font-mono` | system mono | IDs/codes in data-heavy admin screens |

| Scale | Use |
|---|---|
| `text-xs` / `text-sm` | Labels, badges, nav, secondary body text — most common sizes in the app |
| `text-base` | Default body copy |
| `text-lg` / `text-xl` | Card titles, section sub-headings |
| `text-3xl`–`text-5xl` | Hero headings, page titles, stat call-outs |

| Weight | Use |
|---|---|
| `font-medium` | Nav items, buttons |
| `font-semibold` | Sub-headings, labels |
| `font-bold` | Default heading weight |
| `font-black` | Hero numbers, wordmark, big stats only |

### Spacing & Radius

| Token | Use |
|---|---|
| `gap-2` | Icon-to-label gaps, tight inline groups |
| `px-3 py-2` / `px-4 py-2` | Buttons, inputs |
| `p-4` | Compact card padding |
| `p-6` / `p-8` | Standard / large card padding |
| `mb-4` / `mb-6` | Section spacing |
| `max-w-4xl` | Reading-width content (Exercises, ReadingView) |
| `max-w-6xl` / `max-w-7xl` | Marketing/dashboard-width layouts (HomePage) |
| `rounded-lg` / `rounded-xl` | Default card, input, button radius |
| `rounded-2xl` | Feature cards, larger panels |
| `rounded-full` | Pills, primary CTA buttons, avatars |

### Elevation

| Token | Use |
|---|---|
| `shadow-sm` | Default card elevation |
| `shadow-md` | Hover state on interactive cards |
| `shadow-xl` / `shadow-2xl` | Hero CTAs, modals, primary marketing buttons |

`src/index.css` already darkens every shadow level under `.dark` — don't hand-roll dark shadow values in components.

### Icons

`lucide-react`, used in 46+ files.

| Size | Use |
|---|---|
| `w-4 h-4` | Default — inline/nav icons (most common) |
| `w-5 h-5` | Slightly larger emphasis contexts |
| `w-[22px] h-[22px]` | MobileNav tab bar only (custom, intentional) |

### Motion

CSS-first. Prefer the existing keyframe utilities over pulling in `motion` (framer-motion) for simple transitions:

| Utility | Use |
|---|---|
| `transition-colors` / `transition-all` | Hover/active color & shadow changes |
| `hover:-translate-y-0.5` / `hover:-translate-y-1` | Card/button lift on hover |
| `active:scale-95` | Tap feedback |
| `.animate-slide-up` | Bottom sheets / drawers |
| `.animate-fade-up` | Toasts, inline reveals |
| `.animate-bounce-subtle` | Playful emphasis (gamification) |

Reserve the `motion` library (currently only in `Gamification.tsx`) for genuinely complex/orchestrated animation — not simple hover/enter transitions.

### Dark Mode

Class-based (`.dark`), handled two ways — both are correct, use whichever fits:
1. **Default:** write normal light-mode classes (`bg-white`, `text-slate-900`, `bg-emerald-50`, etc.) — `src/index.css` remaps them globally via unlayered `.dark` selectors. No extra work needed for standard surfaces/text/borders/shadows.
2. **Exception:** for opacity/blur or custom-hex values the global override can't target (e.g. `bg-white/90`, `bg-[#ebebeb]`), add an explicit `dark:` variant alongside it, as `Sidebar.tsx` and `MobileNav.tsx` do.

---

## 2. Components

### Button — Primary
```
px-7 py-3.5 bg-zinc-900 text-white font-bold rounded-full hover:bg-black transition-colors
```
Add `shadow-xl hover:shadow-2xl hover:-translate-y-0.5` for hero/marketing contexts (`HomePage.tsx`). Use `rounded-xl` instead of `rounded-full` in dense UI (sidebar CTA).

### Button — Secondary / Outline
```
bg-white text-zinc-900 border-2 border-zinc-200 hover:border-zinc-900 rounded-full
```
or, for less prominent secondary actions:
```
border border-slate-200 font-bold text-slate-600 hover:bg-slate-50
```

### Button — Ghost / Nav item
```
text-zinc-600 hover:bg-[#f2f2f2] hover:text-zinc-900   /* default */
bg-[#ebebeb] dark:bg-zinc-700                            /* active state */
```

### Card
```
bg-white rounded-2xl p-8 border border-slate-200 shadow-sm
```
Interactive variant adds:
```
hover:shadow-md hover:border-zinc-400 hover:-translate-y-1 transition-all
```

### Badge / Pill
```
inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border
```
paired with a semantic 50/700/200 color triad (see color table). This is the pattern behind `ACCOUNT_TYPE_BADGE` in `Sidebar.tsx`.

### Input
```
border border-slate-200 rounded-xl px-3 py-2 focus-within:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-300
```

### Navigation
Two separate hand-built implementations, intentionally not unified (different interaction models):
- **Sidebar** (`src/components/Sidebar.tsx`) — desktop, `lg:flex w-64`, persistent left rail.
- **MobileNav** (`src/components/MobileNav.tsx`) — `lg:hidden`, bottom tab bar + slide-up sheet (`.animate-slide-up`).

---

## 3. Audit Summary

| Category | Status | Notes |
|---|---|---|
| Color tokens | ⚠️ | No formal tokens — palette is implicit in Tailwind defaults + this doc. Risk: future accent colors added ad hoc won't get a dark-mode override and will look broken in dark mode. |
| Typography | ✅ | Consistent: Inter/Montserrat split is respected everywhere checked. |
| Spacing/radius | ⚠️ | Mostly consistent, but `rounded-lg` vs `rounded-xl` vs `rounded-2xl` choice looks ad hoc rather than tied to a clear size rule. |
| Components | ❌ | No shared `Button`/`Card`/`Badge`/`Input` components exist — every file re-implements the same className strings. High risk of drift (already two slightly different "secondary button" styles found). |
| Dark mode | ✅ | Well covered by the global override block; hybrid `dark:` variant approach is documented above. |
| Icons | ✅ | Consistent library and sizing. |

### Priority Actions
1. **Extract shared primitives** (`Button`, `Card`, `Badge`, `Input`) under `src/components/ui/` using the exact className strings documented above — this is the single biggest consistency risk today, since every screen currently copy-pastes button/card markup by hand.
2. **Lock the color-to-semantic mapping** in this doc (done above) and treat it as the only place new accent colors get approved — each new accent needs a matching entry in the `src/index.css` dark-mode override block.
3. **Standardize the radius scale** (e.g. `rounded-lg` = inputs/buttons, `rounded-2xl` = cards, `rounded-full` = pills/avatars only) and sweep existing screens to match.
