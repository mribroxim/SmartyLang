# Release security review

Reviewed Express routes in `server.ts`, `server/dataApi.ts`,
`server/paymentsApi.ts`, `server/ageSafety.ts`, `server/accountData.ts` and
`server/monitoring.ts`. This is an implementation review plus targeted tests,
not an independent penetration-test certification.

| Route/action family | Boundary |
| --- | --- |
| health, ready, legal, payment status | Public, limited non-sensitive state |
| auth register / Google start | Registration always student; pending accounts enter onboarding and require signed age/consent before protected features |
| Google callback | Cross-site GET permitted; cookie-bound unpredictable OAuth state checked before token exchange |
| login / session / logout | Password or verified OAuth identity, session hash/expiry; logout clears only caller cookie |
| dev demo-login | Never registered under `NODE_ENV=production` |
| TTS, dictionary, translation | Signed-in, age-cleared account; bounded inputs and IP limits |
| AI | Signed-in, age-cleared and unexpired Max/admin; shared database quota and provider key credit cap |
| data profile/progress/vocab/completions/lesson/summary writes | Self or admin; non-admin profile patch allowlist excludes role, plan and consent |
| profile role/plan/suspend/list, stats, audit list, payments records/list | Admin only |
| class create/change/delete and teacher lists | Business/admin; ownership constraints, including legacy business roles |
| summaries/activity/notifications for students | Self/admin or teacher who owns a class containing that student |
| global league summaries | Signed-in; reduced leaderboard fields, no email/other private summary fields |
| assignment read/submit | Class member/owner/admin; student submits only their own work |
| assignment grading/submissions | Class owner/admin; business role alone is insufficient |
| sponsor invitations | Self/admin sponsor; paid quota serialized under a row lock; revocation cannot target another sponsor |
| announcements | Class membership/ownership; only admin publishes global content |
| Published content reads | Signed-in; content manager, editor writes, and vocabulary-miss review endpoints removed |
| checkout, cancel, resume, payment confirmation | Self; server quote/product map; provider-owned metadata and current subscription state |
| payment webhook | Raw-body HMAC, constant-time comparison, ±5 minute timestamp window; provider state lookup and idempotent payment record |
| parent consent issue/revoke | Admin after external verification; single-use, expiring grants; revocation deletes child sessions |
| account export/delete | Self, with recent authentication/password plus email confirmation for deletion |
| diagnostics | Fixed category/position only; aggregate view admin-only; no external telemetry destination |

Same-origin CORS/CSRF checks reject foreign Origin and cross-site Fetch Metadata.
Only an explicit loopback origin can be added in development; production uses
the configured HTTPS origin. Cookies are HttpOnly/SameSite=Lax and always Secure
in production. Only a configured trusted proxy is honored. Production database
TLS verifies certificates; secrets are read exclusively by server code. The
built client secret scan compares configured secret values without printing them.

Legacy Firebase API handlers now return 410 in production so they cannot bypass
the self-hosted guards. Their deployed versions must be retired/redeployed by
the operator; local source changes do not remove previously deployed endpoints.

Remaining gates include native-language moderation evaluation, approved parent
verification operations and legal text, data/recording retention, provider
webhook live lifecycle, six moderate advisories in legacy Firebase lint tooling,
and a separate security review before public launch.
