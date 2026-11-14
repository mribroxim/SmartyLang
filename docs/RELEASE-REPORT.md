# Release report — 14 November 2026

**Recommendation: ready for isolated development review; no-go for full public release.**

## Changes

- Preserved the redesign on `codex/public-release` in six requested logical
  commits, then fixed all four known TypeScript errors.
- Hardened authentication, API ownership, production demo guard, cookies,
  CORS, security headers, database TLS and shared AI quotas. Removed the
  unverified-email admin registration shortcut.
- Regenerated 28 translation packs offline: 1,839 keys each, including legal,
  safety and furniture labels. Removed 1,132 unused source keys while retaining
  dynamic families. Added strict final validation and Windows write retries.
- Made payment entitlements depend on provider subscription data; added
  provider cancellation/resume and timestamp-checked webhooks. Matched the live
  Max price of $13/month (the app previously displayed $12.99); Business $65.
- Added policy/terms drafts, age/verified-parent-consent gates, consent
  revocation, account export/deletion and moderation before chat display/speech.
  Unavailable moderation returns the localized safe prompt without buying a
  model response.
- Added compatibility merges and synchronization for room ownership, feeding
  dates, old leagues, daily quest claims and section tests.
- Added Vitest, CI, 55 automated tests, same-server error aggregation,
  structured logs, readiness checks, encrypted backup/timer scripts, an ops
  guide and a real-device checklist. Updated vulnerable dependencies.
- Added shared popup focus/escape handling, accessible names, stronger text
  contrast and room QA evidence at five viewport sizes.

## Verification

| Check | Result |
| --- | --- |
| TypeScript | Clean; all four original errors fixed |
| Automated tests | 50 Vitest + 5 locale-tool tests passed |
| Isolated local HTTP/database integration | 25 checks passed; disposable fixtures cleaned up |
| Existing-account progress | Read-only load/compatibility round-trip passed; no account data logged |
| Locale packs | 28 × 1,839 keys; zero structural audit errors |
| Static visible-copy inventory | Zero candidates, with seven intentional teaching/code examples excluded |
| Production build | Passed; large-chunk warnings remain |
| Client secret scan | All built artifacts scanned; zero potential exposures; local translation backups excluded |
| Native Node startup | Documented start command booted successfully |
| Live Dodo product inspection | Recurring USD prices verified, Max 1300 cents / Business 6500 cents |
| AI provider spending limit | Read-only API confirmed a finite $3 weekly key credit limit |
| Dependency audit | No critical/high findings after fixes; six moderate dev-tool findings remain |
| Browser | Under-16 stop, adult demo access, shop focus wrap/Escape/return, deletion dialog and privacy navigation checked |
| Responsive room | 320×568, 360×640, 390×844, 412×915, 1440×900; no document horizontal overflow |

The browser checks used desktop Chromium viewport overrides. They do not pass
the physical iPhone/Android, microphone, low-end performance or screen-reader
rows in `RELEASE-QA.md`. The deletion endpoint was exercised only with disposable
test identities, never an existing account. No live customer charge or AI
completion was created by these tests.

## Measured balance

70 furniture variants; 6 catalog freebies plus one extra starter gift. Paid
catalog prices are 30–80 coins; buying everything after the starter gift costs
3,240 coins. Four ordinary bites produce one meal worth 10 coins, so 4 bites/day
alone imply about 3 days for a 30-coin item and 8 days for an 80-coin item. These
are calculated steady-state scenarios, excluding quests, tests and Practice.

Unit-test bites pay 15/20 coins; passed section jumps 25; Practice 10/15. Three
daily quests can contribute up to three fish pieces (7.5 coins/day long-run).
The 28-day free quest sample included XP on all 28 days; selection is not uniform.
Section tests sample 12 words from the first 30 lessons and pass at an 80% rounded
unweighted average of step percentages. The meow prompt targets about 16.7% of
replies; no empirical model sample was collected. Full numbers: `balance-report.json`.

## Remaining release gates

1. A real live buy/cancel/resume/expiry cycle, business-seat change and webhook
   delivery/reordering still need an authorized customer/payment method and
   completed merchant configuration for additional product variants. Catalog
   reads and mocked lifecycle/security checks do not replace that transaction.
2. Physical iPhone Safari/Android audio, microphones, offline behavior, low-end
   performance, full screen-reader and every-popup/contrast QA remain pending.
3. Operator/contact details, retention periods and the operational parent
   verification procedure require approval. Safety-provider credentials are
   absent in the local setup, so chat currently uses the safe fallback. Review
   multilingual moderation and legal translations with qualified reviewers.
4. NLLB's CC-BY-NC-4.0 model license needs a commercial-use decision or a licensed
   replacement before commercial release. Structural translation checks are
   not native-speaker certification.
5. Production TLS, offsite encrypted backup/restore and paging need operator
   setup. Supplied systemd files do not by themselves activate those services.
   The six moderate advisories belong to legacy Firebase lint dependencies.
6. Existing unscoped browser recordings require an ownership-safe migration
   and deletion procedure. Current account deletion covers active database data
   and account-scoped localStorage, not every legacy IndexedDB blob or another
   device's cache. Do not promise complete local recording erasure yet.
7. Economy rewards are client-authored. Practice has no daily coin ceiling,
   section-test replay can mint coins, and simultaneous offline quest claims
   can award duplicate fish before their claims merge. These need a product
   decision and authoritative claims before treating the economy as tamper-proof.

The existing public server is preserved. The requested SSH deployment uses a
separate private development instance and synthetic demo accounts; it is not a
public launch approval.

## Development verification

A separate development instance was deployed with synthetic Max/free accounts.
The existing public service and database were preserved. A deployed furniture
purchase changed the synthetic balance from 120 to 90 coins and persisted the
selected bed. Encrypted daily development backups and a readiness timer are
active. A checksum-verified encrypted dump was decrypted and restored into an
isolated temporary database: two demo accounts, one-second restore. Independent
key storage, offsite copying and paging remain pending. Host-specific connection
and recovery details are kept only in the ignored local deployment handoff.
