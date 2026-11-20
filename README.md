# SmartyLang

**President Tech Award Hackathon submission**

> Students study languages for years — and still can't speak them.  
> **SmartyLang listens while you read, and corrects every word in real time — in 29 languages.**

**Live product:** [smartylang.com](https://smartylang.com) · [smartyenglish.uz](https://smartyenglish.uz)

---

## The problem

Language classrooms teach grammar and vocabulary, then test on paper. One teacher with 30 students has about **90 seconds per learner** — not enough to listen, correct pronunciation, and coach speaking. Free apps gamify streaks; tutors don't scale. Result: millions who can *read* a language but cannot *speak* it.

## Our solution

SmartyLang is a full browser-based language academy with a core loop that schools cannot offer at scale:

1. You open a passage and press the mic  
2. You read aloud  
3. **Every word turns green / yellow / red as you speak**  
4. You fix mistakes in the same breath — not a week later  

That real-time reading feedback sits inside a complete learning platform: placement → lessons → vocabulary (SRS) → exercises → AI writing & speaking examiners → teacher / school tooling.

---

## Demo (hackathon)

Open **[smartylang.com](https://smartylang.com)** (Chrome recommended for speech recognition):

1. Sign in → open **Reading** practice  
2. Start the microphone and **read the passage out loud**  
3. Watch words light up **live** (correct / slight mistake / incorrect)  
4. Optionally mispronounce a word on purpose — it should turn red  
5. Try **AI Writing** for IELTS-style 4-criteria scoring  
6. Switch the UI language to show the **29-language** interface  

> Tip for judges: run the reading demo in **English** for the strongest ASR. Low-resource languages are labeled honestly where recognition quality is beta.

---

## What we built

| Area | Details |
|------|---------|
| **Real-time reading** | Browser speech recognition + per-word alignment (Levenshtein / language-specific profiles). Homophones & numbers handled so "two/to/too" don't false-fail. |
| **29 languages** | Learn any of 29 as the *subject*; use any of 29 as the *interface* — including Uzbek. RTL + CJK tokenization supported. |
| **Vocabulary** | Sense-aligned static DB (~4,125 senses), spaced repetition (SRS) |
| **Practice** | Reading, listening, dictation, interactive stories, 9 exercise modes, pronunciation drills |
| **AI examiners** | Writing & speaking scored on 4 IELTS-style criteria with actionable feedback |
| **Levels** | 5 CEFR-aligned paths (Beginner → Advanced) |
| **Roles** | Student, SmartyLang Max, Teacher (seats + class analytics), Organization (30+ seats, staff invites), Admin / Content Manager |
| **Payments** | ATMOS (Uzbekistan) — pay in so'm with local checkout |
| **Gamification** | XP, leagues, streaks, activity history |

---

## Why it matters (Uzbekistan & beyond)

- Language skill gates jobs, universities, and mobility  
- IELTS prep is expensive; unlimited speaking practice is rare  
- One teacher + AI feedback can support **dozens of students** instead of one-at-a-time grading  
- Works on any phone browser — **no app install**  
- Uzbek-first UI option + local payment rails (ATMOS)

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Motion |
| Backend | Firebase Auth, Firestore, Hosting, Cloud Functions |
| Speech | Web Speech API (live reading) · Azure Speech (TTS) |
| Vocab | Prebuilt static multilingual shards under `public/data/vocab/` |
| Payments | ATMOS hosted checkout |

Architecture note: vocabulary moved off live translation APIs onto a **prebuilt sense database**, so lookups stay fast, cheap, and consistent across all 29 languages.

---

## Repository layout

```
src/                 React app (features, components, lib)
functions/           Firebase Cloud Functions (TTS, translate fallback, …)
public/data/         Language packs, vocab shards, shadowing audio
scripts/             Vocab build / quality tools
firestore.rules      Security rules
firebase.json        Hosting + Functions config
```

---

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.example .env
# Fill Firebase web config + optional Azure / ATMOS keys
npm run dev
```

Open the URL printed by the dev server (typically `http://localhost:3000`).

### Local demo accounts

Run `npm run dev:demo` from the repository root. It starts the app at `http://localhost:3000` with its own PostgreSQL database and creates three demo accounts. It uses PostgreSQL 17's default install path on Windows and searches your `PATH` on other platforms. Set `DEMO_POSTGRES_BIN` to the PostgreSQL `bin` directory if it is installed elsewhere.

- [Open the Max demo](http://localhost:3000/api/dev/demo-login?as=max)
- [Open the Free demo](http://localhost:3000/api/dev/demo-login?as=free)
- [Open the Teacher demo](http://localhost:3000/api/dev/demo-login?as=teacher)

Use separate browser profiles to keep the demo accounts signed in at the same time. The teacher hosts games in Demo Classroom, and both learners can join from My Classes. The demo stores progress locally in `.tmp-local-demo` between restarts.

### Compare TranslateGemma passage translations

With `translategemma:12b` available in local Ollama, run `node scripts/localize/compare-translategemma.mjs`. Use `--model translategemma:4b` to compare a different installed tag, or add `--prepare` to lay out the 20 review cases while the download is in progress. Open `.tmp-translategemma-review/comparison.md` to score the English passages, current Uzbek passages, and TranslateGemma candidates. Completed passages are saved as the comparison runs so you can resume it. Keep the report for review before deciding which translations to publish.

### Useful scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local app + Express API |
| `npm run build` | Production Vite build → `dist/` |
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm run build:vocab` | Rebuild vocab shards |
| `npm run verify:vocab` | Vocab quality checks |

### Deploy (Firebase)

```bash
npm run build
firebase deploy --only hosting,firestore:rules
# Functions need secrets set first, e.g.:
# firebase functions:secrets:set AZURE_SPEECH_KEY
```

---

## Plans (product)

| Plan | Price | Who |
|------|-------|-----|
| **SmartyLang Max** | **$12.99 / mo** | 1 learning language included; +$8.99/mo per extra language (UI free in all 29) |
| **Teacher** | **$65 / mo** | 5 seats + 1 class language; +$8.99/seat; extra languages $4.99 × seats |
| **Organization** | **$8.99 / seat / mo** | Min 20 seats; 1 language included; extra languages $4.99 × seats |

---

## Security & privacy

- Secrets live in `.env` / Firebase Functions secrets — **not** in this repo (see `.env.example`)  
- Reading practice uses **on-device browser speech recognition**; we do not upload raw mic audio for word alignment  
- Firestore rules gate student / teacher / org / admin access  

---

## Status & roadmap

**Shipped:** live student journey, real-time reading feedback, 29-language packs, AI examiners, teacher/org roles, ATMOS payments, custom domains.

**Next:** deeper school LMS (assignments, gradebook), native mobile + offline packs, more exam tracks, school partnerships.

---

## Team

*SmartyLang — President Tech Award Hackathon*

Contact / demo: [smartylang.com](https://smartylang.com)

---

## License

Private / all rights reserved unless otherwise stated by the authors.
