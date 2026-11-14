#!/usr/bin/env bash
set -euo pipefail
umask 077
development_url="${1:?development review URL required}"
if [[ ! "$development_url" =~ ^http://[a-zA-Z0-9.:-]+$ ]]; then echo 'Private HTTP review URL required' >&2; exit 1; fi
app="${DEVELOPMENT_ROOT:-/srv/smartylang/development}/current"
install -d -m 0755 /usr/local/lib/smartylang
sed 's/\r$//' "$app/scripts/ops/backup-postgres.sh" > /usr/local/lib/smartylang/backup-postgres.sh
chmod 0755 /usr/local/lib/smartylang/backup-postgres.sh
install -d -m 0750 -o root -g postgres /var/backups/smartylang
install -d -m 0700 -o postgres -g postgres /var/backups/smartylang/development
identity="${BACKUP_IDENTITY_FILE:?set a private recovery identity path}"
if [ ! -f "$identity" ]; then age-keygen -o "$identity" 2>/dev/null; fi
chmod 0600 "$identity"
recipient="$(age-keygen -y "$identity")"
cat > /etc/smartylang/development-backup.env <<ENV
DATABASE_URL=postgresql:///smartylang_development?host=/var/run/postgresql
BACKUP_AGE_RECIPIENT=$recipient
BACKUP_DIR=/var/backups/smartylang/development
ENV
chmod 0600 /etc/smartylang/development-backup.env
cat > /etc/systemd/system/smartylang-development-backup.service <<'UNIT'
[Unit]
Description=Encrypted development database backup
After=postgresql.service
[Service]
Type=oneshot
User=postgres
EnvironmentFile=/etc/smartylang/development-backup.env
ExecStart=/usr/bin/bash /usr/local/lib/smartylang/backup-postgres.sh
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/backups/smartylang/development
UNIT
cat > /etc/systemd/system/smartylang-development-backup.timer <<'UNIT'
[Unit]
Description=Daily encrypted development backup
[Timer]
OnCalendar=*-*-* 02:00:00 UTC
Persistent=true
RandomizedDelaySec=300
[Install]
WantedBy=timers.target
UNIT
cat > /etc/systemd/system/smartylang-development-uptime.service <<UNIT
[Unit]
Description=Development readiness probe
[Service]
Type=oneshot
User=smartylang
WorkingDirectory=/srv/smartylang/development/current
Environment=APP_URL=$development_url
ExecStart=/usr/bin/node scripts/ops/uptime.mjs
UNIT
cat > /etc/systemd/system/smartylang-development-uptime.timer <<'UNIT'
[Unit]
Description=Development readiness every minute
[Timer]
OnBootSec=30s
OnUnitActiveSec=60s
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl start smartylang-development-backup.service
systemctl enable --now smartylang-development-backup.timer smartylang-development-uptime.timer >/dev/null
systemctl start smartylang-development-uptime.service

# Verify a real decrypt/restore into a uniquely named disposable database.
latest="$(find /var/backups/smartylang/development -maxdepth 1 -name 'smartylang-*.dump.age' -type f | sort | tail -1)"
test -s "$latest"
sha256sum -c "$latest.sha256"
restore_db="smartylang_dev_restore_$(date -u +%s)"
case "$restore_db" in smartylang_dev_restore_[0-9]*) ;; *) exit 1 ;; esac
runuser -u postgres -- createdb "$restore_db"
trap 'runuser -u postgres -- dropdb --if-exists "$restore_db"' EXIT
started=$SECONDS
age -d -i "$identity" "$latest" | runuser -u postgres -- pg_restore --no-owner --no-acl --dbname="$restore_db"
count="$(runuser -u postgres -- psql -X -At -d "$restore_db" -c 'SELECT COUNT(*) FROM app_users')"
printf 'Encrypted development backup restored successfully: %s accounts, %ss restore.\n' "$count" "$((SECONDS-started))"
systemctl is-active smartylang-development-backup.timer smartylang-development-uptime.timer
echo 'Recovery identity remains root-only on this host. Copy it to separate secure storage before relying on disaster recovery.'
