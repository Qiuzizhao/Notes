# Notes Supabase Server Deploy

This app uses Supabase for email/password auth and manual note sync. The app only needs the Supabase API URL and publishable key at runtime.

## Target Architecture

- Server: one self-hosted Supabase stack installed with the official Docker Compose setup.
- App schema: `public.quick_notes` and `public.note_settings`, with row level security by `auth.uid()`.
- Client: Expo app configured with:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Server Requirements

Use a Linux VPS with at least:

- 2 CPU cores
- 4 GB RAM, 8 GB preferred
- 40 GB SSD, 80 GB preferred
- Docker Engine and Docker Compose
- A domain name is strongly preferred for HTTPS, for example `sync.example.com`.

Current Notes deployment:

- Server: `43.155.250.122`
- SSH: `ubuntu@43.155.250.122:23456`
- Supabase directory: `/opt/notes-supabase`
- Public domain planned: `supabase.qiuzizhao.com`
- Current blocker for HTTPS public access: add DNS record `supabase.qiuzizhao.com -> 43.155.250.122`.

## Install Self-Hosted Supabase

On the server, install the official Supabase Docker project. Keep it outside this Expo app directory so multiple apps can reuse the same Supabase server.

Recommended directory:

```bash
sudo mkdir -p /opt
sudo chown "$USER":"$USER" /opt
cd /opt
```

Manual install:

```bash
git clone --depth 1 https://github.com/supabase/supabase supabase-src
mkdir -p /opt/notes-supabase
cp -a /opt/supabase-src/docker/. /opt/notes-supabase/
cp /opt/supabase-src/docker/.env.example /opt/notes-supabase/.env
cd /opt/notes-supabase
```

Generate secure keys and API keys:

```bash
sh utils/generate-keys.sh
sh utils/add-new-auth-keys.sh
```

Edit `/opt/notes-supabase/.env` before starting:

```bash
SUPABASE_PUBLIC_URL=https://supabase.qiuzizhao.com
API_EXTERNAL_URL=https://supabase.qiuzizhao.com
SITE_URL=https://supabase.qiuzizhao.com
DASHBOARD_USERNAME=your_admin_name
DASHBOARD_PASSWORD=yourStrongPassword
```

Start Supabase:

```bash
cd /opt/notes-supabase
sh run.sh start
docker compose ps
```

All required services should be `Up` and healthy.

## HTTPS

For production, put Caddy or Nginx in front of Supabase's Kong gateway. This server proxies `supabase.qiuzizhao.com` to Kong on local port `18000`.

Keep Postgres and internal service ports closed to the public Internet unless you explicitly need them.

Current server exposure:

- Open: `80`, `443`
- Closed publicly: Supabase Kong direct port, Postgres, pooler, and internal container ports

Current local-only Supabase ports on the server:

- Kong HTTP: `127.0.0.1:18000`
- Kong HTTPS: `127.0.0.1:18443`
- Postgres pooler session: `127.0.0.1:15432`
- Postgres pooler transaction: `127.0.0.1:16543`

Nginx site installed on the server:

```nginx
server {
    listen 80;
    server_name supabase.qiuzizhao.com;

    location / {
        proxy_pass http://127.0.0.1:18000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Apply Notes Schema

From this repo on your Mac, after the server stack is already running:

```bash
NOTES_SERVER=root@your-server-ip \
SUPABASE_PROJECT_DIR=/opt/notes-supabase \
scripts/server/deploy-notes-schema-remote.sh
```

Or copy the SQL to the server and run it there:

```bash
SUPABASE_PROJECT_DIR=/opt/notes-supabase \
scripts/server/apply-notes-schema.sh /path/to/notes_schema.sql
```

The script applies:

- `public.quick_notes`
- `public.note_settings`
- RLS policies allowing each user to read and write only their own rows
- grants for the `authenticated` role

## Configure the App

On the server, print the values from `/opt/notes-supabase/.env`:

```bash
cd /opt/notes-supabase
grep -E '^(SUPABASE_PUBLIC_URL|SUPABASE_PUBLISHABLE_KEY)=' .env
```

Set this app's `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://supabase.qiuzizhao.com
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<server ANON_KEY>
```

Then restart Expo so the environment variables are compiled into the app bundle:

```bash
npx expo start --ios --clear
```

## Smoke Test

Test the API gateway from your Mac:

```bash
curl "$EXPO_PUBLIC_SUPABASE_URL/auth/v1/settings" \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
```

Until DNS is added, verify Nginx and Kong from a machine that can reach the server IP:

```bash
curl --noproxy '*' \
  -H 'Host: supabase.qiuzizhao.com' \
  -H "apikey: $EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  http://43.155.250.122/auth/v1/settings
```

Then in the app:

1. Register a test account.
2. Create one note and one custom category color.
3. Tap the manual sync button.
4. Log in to Supabase Studio and verify rows in `quick_notes` and `note_settings`.

## Upgrade Notes

Keep the self-hosted Supabase Docker project as its own server directory. Update that stack from the official upstream project, then re-run this app's schema script only when the Notes schema changes.
