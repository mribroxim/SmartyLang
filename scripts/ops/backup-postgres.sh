#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_AGE_RECIPIENT:?An age encryption recipient is required}"
backup_dir="${BACKUP_DIR:-/var/backups/smartylang}"
mkdir -p "$backup_dir"
backup_dir="$(realpath "$backup_dir")"
case "$backup_dir" in /var/backups/smartylang|/var/backups/smartylang/*) ;; *) echo 'Backup directory must be under /var/backups/smartylang' >&2; exit 1 ;; esac
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$backup_dir/smartylang-$stamp.dump.age"
export PGSSLMODE=verify-full
db_command() {
  python3 - "$@" <<'PY'
import os, sys
from urllib.parse import urlparse, parse_qs, unquote
uri=urlparse(os.environ['DATABASE_URL'])
options=parse_qs(uri.query)
env=dict(os.environ)
env['PGDATABASE']=unquote(uri.path.lstrip('/'))
for name,value in {'PGHOST':options.get('host',[uri.hostname])[-1],'PGPORT':options.get('port',[str(uri.port) if uri.port else None])[-1],'PGUSER':unquote(uri.username) if uri.username else None,'PGPASSWORD':unquote(uri.password) if uri.password else None,'PGSSLROOTCERT':options.get('sslrootcert',[None])[-1]}.items():
    if value is not None: env[name]=value
# Credentials stay in the subprocess environment, never process arguments/logs.
os.execvpe(sys.argv[1],sys.argv[1:],env)
PY
}
db_command pg_dump --format=custom --no-owner --no-acl | age -r "$BACKUP_AGE_RECIPIENT" -o "$target.partial"
mv "$target.partial" "$target"
sha256sum "$target" > "$target.sha256"
# Preserve deletion hashes separately so a restore can reapply newer deletions.
db_command psql -X -q -t -A -c 'SELECT uid_hash FROM account_deletions ORDER BY uid_hash' | age -r "$BACKUP_AGE_RECIPIENT" -o "$backup_dir/deletions-$stamp.txt.age"
printf 'Encrypted backup created: %s\n' "$target"
if [ -n "${BACKUP_OFFSITE_COMMAND:-}" ]; then
  echo 'Run the configured offsite copy using a separate restricted service.'
fi
