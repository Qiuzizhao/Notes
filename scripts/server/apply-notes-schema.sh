#!/usr/bin/env bash
set -euo pipefail

SUPABASE_PROJECT_DIR="${SUPABASE_PROJECT_DIR:-/opt/notes-supabase}"
SCHEMA_FILE="${1:-supabase/migrations/20260623173000_notes_schema.sql}"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Schema file not found: $SCHEMA_FILE" >&2
  echo "Usage: SUPABASE_PROJECT_DIR=/opt/notes-supabase $0 /path/to/notes_schema.sql" >&2
  exit 1
fi

SCHEMA_PATH="$(cd "$(dirname "$SCHEMA_FILE")" && pwd -P)/$(basename "$SCHEMA_FILE")"

if [ ! -d "$SUPABASE_PROJECT_DIR" ]; then
  echo "Supabase project directory not found: $SUPABASE_PROJECT_DIR" >&2
  exit 1
fi

cd "$SUPABASE_PROJECT_DIR"

if [ ! -f docker-compose.yml ]; then
  echo "docker-compose.yml not found in $SUPABASE_PROJECT_DIR" >&2
  echo "Run this against the self-hosted Supabase project directory copied from supabase/docker." >&2
  exit 1
fi

docker compose ps db >/dev/null

echo "Applying Notes schema to Supabase database..."
docker compose exec -T db psql -U postgres -d postgres < "$SCHEMA_PATH"

echo "Verifying Notes tables..."
docker compose exec -T db psql -U postgres -d postgres -c "
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('quick_notes', 'note_settings')
order by tablename;
"

echo "Notes schema applied."
