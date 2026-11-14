# Production deployment and release gates

Use Node 22.18+ (native type stripping), PostgreSQL 16+, an HTTPS reverse proxy,
and a dedicated non-root service account. The code is prepared locally; no
production host, credentials, paid product catalog or real phones are implied.

## Configuration

Copy `.env.example` to `/etc/smartylang/app.env`, owned by the service user and
mode 0600. Set `NODE_ENV=production`, `APP_URL=https://your-domain`, `PORT=3000`,
`TRUST_PROXY=1` only when exactly one trusted proxy fronts the app. Bind/firewall
the Node port so clients cannot bypass that proxy. Never set any secret with a
`VITE_` prefix. Never deploy `.env`, backups, demo account notes or model caches.

Set `DATABASE_URL`, `DATABASE_SSL=true` and, for a private CA,
`DATABASE_CA_CERT`. TLS verifies the database certificate. Do not embed `sslmode`
in the connection URL; it can override driver TLS options. Provision a valid
Postgres server certificate and a least-privilege application database role.

Set server-only `OPENROUTER_API_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` and
optional translation and Google OAuth credentials. Register the exact OAuth
callback `${APP_URL}/api/auth/google/callback`. Give OpenRouter a dedicated key
with a provider-enforced credit limit; configure `AI_DAILY_REQUEST_CAP` (default
1000 across replicas, user cap 30/10 minutes). The request cap is not a dollar
cap because token use and provider pricing vary. Alert on `ai_budget_80_percent`
and `ai_budget_exhausted` log events and remaining provider credit.

Set `CONTENT_SAFETY_ENDPOINT`, `CONTENT_SAFETY_KEY` and a reviewed
`CONTENT_SAFETY_LANGUAGES` allowlist. The default covers eight languages; other
languages and any moderation outage return the safe localized prompt. Review
language-specific safety performance before extending the allowlist.

Set `AGE_PROOF_SECRET` to at least 32 cryptographically random characters,
`LEGAL_OPERATOR`, and `LEGAL_CONTACT_EMAIL`. The default consent threshold is
16 for every jurisdiction. This conservative implementation still requires
legal review of the audience, legal bases, retention periods, international
transfers, the consent procedure and the final operator details.

For Dodo set `DODO_PAYMENTS_ENVIRONMENT=live_mode`, API key, webhook secret and
recurring product IDs for Max (1 seat, 1 language) and Business (5 seats, 1
language). Set `DODO_PAYMENTS_PRICE_CATALOG` to a JSON object mapping every
supported `plan:seats:languages` combination to its recurring product ID. Match
each product price to `computeMonthlyUSD` and use quantity 1. Unconfigured
variants fail closed. Seat increases use the provider's change-plan flow with
payment collection and `prevent_change` on failure. Register payment and
subscription webhooks at `${APP_URL}/api/payments/webhook` and verify retries.
Do not mix test and live products or signing secrets.

## Build, migrate and start

1. Check out the approved release commit. `npm ci`.
2. `npm run check`, `npm test`, `npm run locales:audit`, `npm run build`,
   `node scripts/check-client-secrets.mjs`.
3. Take an encrypted backup. Run `npm run db:migrate` using the production env.
   Migrations are ordered, transactional, recorded and protected by a DB lock.
4. Install `deploy/smartylang.service`; set production environment and restart.
   Startup also applies pending migrations. Do not deploy incompatible schema
   changes without a separate rollback/compatibility plan.
5. Install the Nginx configuration after replacing host names and certificate
   paths. Issue/renew certificates; redirect HTTP to HTTPS. Expose only 80/443.
6. Check `/api/health` (liveness), `/api/ready` (DB readiness), cookie flags,
   blocked foreign Origin, demo-login 404 and the actual public hostname.

Promote a first administrator through a controlled database operation after
verifying the person's identity; public registration always creates students.
The old `ADMIN_EMAIL` registration shortcut is removed.

## Backups and restore rehearsal

Install `postgresql-client`, `python3` and `age`, a backup read role, a dedicated
`smartylang-backup` service user and `/var/backups/smartylang` mode 0700. Store
`DATABASE_URL`, `BACKUP_AGE_RECIPIENT` and database trust configuration in
`/etc/smartylang/backup.env`. The age private identity stays off the app server.
Enable the supplied backup timer after a successful manual invocation.
Copy encrypted dumps and the deletion ledger to independent encrypted storage
with a restricted backup service; configure retention (suggested starting
policy: 30 daily backups) and alert if no successful backup exists within 26h.
The script does not delete historical backups automatically.

Rehearse restore to an isolated database: verify SHA256, decrypt using an
authorized backup identity, `pg_restore --no-owner --no-acl`, apply migrations,
and reapply all deletion hashes newer than the dump before permitting traffic.
Revoke sessions after restore. Confirm account counts and known progress,
vocabulary, room and unlock samples. Record RPO/RTO and actual duration. No
backup is considered operational until this rehearsal and offsite copy pass.

## Privacy and consent operations

Under-16 learners are stopped before account fields/OAuth. Staff must deliver
the parent notice, verify parental responsibility using an approved process,
and retain an auditable verification receipt with an appropriate retention
policy. Only then may an authenticated admin POST to
`/api/safety/parent-consent/issue` with `verificationMethod`, an external
`verificationReceipt` reference (not an identity-document image), and
`noticeVersion: 1`. The returned single-use code expires after seven days.
Do not send unsolicited messages. Revoke a consent when a parent withdraws it;
the API checks consent on protected requests. Do not call this legal compliance
certification: the operational verification and counsel approval remain gates.

Settings exports account records and provides deletion with password or recent
Google reauthentication. Cancel recurring billing first. Deletion removes
active learning data, classes and invitations, anonymizes retained payment
records, and retains a UID hash so restored backups can honor deletion.
Legacy browser recordings may be unscoped; purge them on a shared device when
the owner requests deletion and verify no other user's recordings are lost.

## Monitoring

Structured HTTP logs contain request IDs, route templates, status and latency.
Client diagnostics send a fixed error category and numeric source position to
the same server. Aggregated errors are admin-only at `/api/monitor/errors`.
No external Sentry destination is enabled. Wire log delivery and paging in the
actual hosting environment, including 5xx, AI budget and backup freshness.
Enable the uptime timer or an independent external probe; configure failure
notifications before launch. Purge old `ai_usage` buckets and diagnostics under
the approved retention policy. Keep provider logs free of transcripts.

## Open release gates

- Actual live payment lifecycle and business-seat purchase, including refund
  and out-of-order webhook handling; use the QA checklist and a bounded charge.
- Parent verification procedure, operator details and reviewed legal copy.
- NLLB model license review before commercial use (CC-BY-NC-4.0), plus native
  review of machine translations, especially legal and safety wording.
- Real iOS Safari/Android microphone, audio, layout and low-end performance.
- Production TLS, backup restore/offsite copy, alerts and deployment rehearsal.

## Development templates

The optional development deployment script takes a release ID and an explicit
private bind address. It prepares a separate service/database and synthetic
demos while retaining the previous release for rollback. The backup setup
script takes the review URL. Keep real host addresses, connection instructions,
recovery locations and credentials in a protected local handoff, outside Git.
Package Unix source with `git -c core.autocrlf=false archive` to retain LF endings.
