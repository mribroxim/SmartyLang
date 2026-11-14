#!/usr/bin/env bash
# Run on the explicitly selected development host after uploading both archives.
set -euo pipefail
umask 077
release_id="${1:?release ID required}"
case "$release_id" in *[!a-zA-Z0-9-]*) echo 'Invalid release ID' >&2; exit 1 ;; esac
export DEVELOPMENT_HOST="${2:?private development bind address required}"
export DEVELOPMENT_PORT="${DEVELOPMENT_PORT:-3100}"
base="${DEVELOPMENT_ROOT:-/srv/smartylang/development}"
release="$base/releases/$release_id"
test ! -e "$release"
mkdir -p "$release" "$base/shared/.tts-cache" /etc/smartylang
chgrp smartylang "$base" "$base/releases"
chmod 0750 "$base" "$base/releases"
tar -xzf "/tmp/smartylang-$release_id-source.tgz" -C "$release"
for script in "$release"/scripts/ops/*.sh; do sed -i 's/\r$//' "$script"; done
mkdir -p "$release/dist"
tar -xzf "/tmp/smartylang-$release_id-dist.tgz" -C "$release/dist"
cd "$release"
npm ci --omit=dev --no-audit --no-fund

python3 - <<'PY'
import json, os, secrets, subprocess
from pathlib import Path
from urllib.parse import urlparse
import ipaddress
dev_host=str(ipaddress.ip_address(os.environ['DEVELOPMENT_HOST']))
dev_port=int(os.environ.get('DEVELOPMENT_PORT','3100'))
if not 1024 <= dev_port <= 65535: raise ValueError('Invalid development port')
env_path=Path('/etc/smartylang/development.env')
def read_env(path):
    result={}
    if path.exists():
        for line in path.read_text().splitlines():
            if line and not line.startswith('#') and '=' in line:
                name,value=line.split('=',1);result[name]=value.strip().strip('"').strip("'")
    return result
existing=read_env(env_path)
production=read_env(Path('/etc/smartylang/app.env'))
password=(urlparse(existing.get('DATABASE_URL','')).password or secrets.token_hex(24))
def sql(text):
    return subprocess.run(['runuser','-u','postgres','--','psql','-X','-At','-v','ON_ERROR_STOP=1'],input=text,text=True,capture_output=True,check=True).stdout.strip()
if sql("SELECT 1 FROM pg_roles WHERE rolname='smarty_dev';")!='1':
    sql("CREATE ROLE smarty_dev LOGIN PASSWORD '"+password+"';")
if sql("SELECT 1 FROM pg_database WHERE datname='smartylang_development';")!='1':
    sql('CREATE DATABASE smartylang_development OWNER smarty_dev;')
values={k:v for k,v in production.items() if k in ['AZURE_SPEECH_KEY','AZURE_SPEECH_REGION','OPENROUTER_API_KEY','GOOGLE_TRANSLATE_API_KEY','CONTENT_SAFETY_ENDPOINT','CONTENT_SAFETY_KEY','CONTENT_SAFETY_LANGUAGES']}
values.update(existing)
values.update({'NODE_ENV':'development','SERVE_BUILT_APP':'1','HOST':dev_host,'PORT':str(dev_port),'APP_URL':f'http://{dev_host}:{dev_port}','DEV_ALLOWED_ORIGINS':f'http://localhost:{dev_port}','DATABASE_URL':'postgres://smarty_dev:'+password+'@127.0.0.1:5432/smartylang_development','DATABASE_SSL':'false','DEMO_LOGIN':'1','AGE_PROOF_SECRET':existing.get('AGE_PROOF_SECRET') or secrets.token_hex(32),'AI_DAILY_REQUEST_CAP':'100'})
# Do not inherit a live merchant or production OAuth callback into a demo server.
values={k:v for k,v in values.items() if not k.startswith('DODO_') and not k.startswith('GOOGLE_OAUTH_')}
env_path.write_text(''.join(k+'='+str(v)+'\n' for k,v in values.items()))
os.chmod(env_path,0o600)
print('Prepared isolated development database and protected server configuration; secrets omitted.')
PY

set -a
source /etc/smartylang/development.env
set +a
npm run db:migrate
node --experimental-strip-types --input-type=module <<'JS'
import { query, closeDatabase } from './server/db.ts';
const now=Date.now();
for (const kind of ['max','free']) {
  const uid=`dev_demo_${kind}`;
  const profile={ displayName:`Demo ${kind === 'max' ? 'Max' : 'Free'}`,email:`${kind}@demo.test`,role:'student',createdAt:now,startingLevel:'Beginner',onboardingCompletedAt:now,dailyMinutes:10,agePolicyVersion:1,ageVerifiedAt:now,adultAgeCheck:true,...(kind==='max'?{plan:'smarty-max',planStartedAt:now,planExpiresAt:now+365*86400000}:{})};
  await query('INSERT INTO app_users (uid,email,display_name,role,created_at,profile) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (uid) DO NOTHING',[uid,profile.email,profile.displayName,'student',now,JSON.stringify(profile)]);
  await query('INSERT INTO user_progress (user_uid,data,updated_at) VALUES ($1,$2,$3) ON CONFLICT (user_uid) DO NOTHING',[uid,JSON.stringify({xp:kind==='max'?1800:30,coins:kind==='max'?120:60,league:kind==='max'?'Sapphire':'Bronze',room:{legacy:true},section_jumps_v1:{en:1}}),now]);
}
await closeDatabase();
console.log('Prepared two synthetic development demo accounts; existing data preserved.');
JS

chown -R smartylang:smartylang "$release" "$base/shared"
chmod 0750 "$release"
ln -s "$base/shared/.tts-cache" "$release/.tts-cache"
previous=''
if [ -L "$base/current" ]; then
  candidate="$(readlink -f "$base/current" 2>/dev/null || true)"
  case "$candidate" in "$base/releases/"*) if [ -d "$candidate" ]; then previous="$candidate"; fi ;; esac
fi
ln -s "$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
cat > /etc/systemd/system/smartylang-development.service <<'UNIT'
[Unit]
Description=SmartyLang private development review
After=network-online.target postgresql.service
Wants=network-online.target
[Service]
Type=simple
User=smartylang
Group=smartylang
WorkingDirectory=/srv/smartylang/development/current
EnvironmentFile=/etc/smartylang/development.env
ExecStart=/usr/bin/node --experimental-strip-types /srv/smartylang/development/current/server.ts
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/srv/smartylang/development/shared/.tts-cache
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable smartylang-development.service >/dev/null
systemctl restart smartylang-development.service
ready=0
for attempt in $(seq 1 20); do
  if curl -fsS "http://$DEVELOPMENT_HOST:$DEVELOPMENT_PORT/api/ready" >/dev/null; then ready=1; break; fi
  sleep 1
done
if [ "$ready" != 1 ]; then
  if [ -n "$previous" ]; then ln -s "$previous" "$base/current.rollback"; mv -Tf "$base/current.rollback" "$base/current"; systemctl restart smartylang-development.service; fi
  echo 'Development readiness failed; previous development release restored when available.' >&2
  exit 1
fi
printf 'Development ready: http://%s:%s (release %s)\n' "$DEVELOPMENT_HOST" "$DEVELOPMENT_PORT" "$release_id"
systemctl is-active smartylang.service smartylang-development.service
