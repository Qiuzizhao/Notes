#!/usr/bin/env bash
set -euo pipefail

: "${NOTES_SERVER:?Set NOTES_SERVER, for example: NOTES_SERVER=root@203.0.113.10}"

SUPABASE_PROJECT_DIR="${SUPABASE_PROJECT_DIR:-/opt/notes-supabase}"
REMOTE_TMP_DIR="${REMOTE_TMP_DIR:-/tmp/notes-supabase-deploy}"
LOCAL_SCHEMA_FILE="${LOCAL_SCHEMA_FILE:-supabase/migrations/20260623173000_notes_schema.sql}"
LOCAL_APPLY_SCRIPT="${LOCAL_APPLY_SCRIPT:-scripts/server/apply-notes-schema.sh}"

if [ ! -f "$LOCAL_SCHEMA_FILE" ]; then
  echo "Local schema file not found: $LOCAL_SCHEMA_FILE" >&2
  exit 1
fi

if [ ! -f "$LOCAL_APPLY_SCRIPT" ]; then
  echo "Local apply script not found: $LOCAL_APPLY_SCRIPT" >&2
  exit 1
fi

ssh "$NOTES_SERVER" "mkdir -p '$REMOTE_TMP_DIR'"
scp "$LOCAL_SCHEMA_FILE" "$NOTES_SERVER:$REMOTE_TMP_DIR/notes_schema.sql"
scp "$LOCAL_APPLY_SCRIPT" "$NOTES_SERVER:$REMOTE_TMP_DIR/apply-notes-schema.sh"

ssh "$NOTES_SERVER" "
  chmod +x '$REMOTE_TMP_DIR/apply-notes-schema.sh' &&
  SUPABASE_PROJECT_DIR='$SUPABASE_PROJECT_DIR' '$REMOTE_TMP_DIR/apply-notes-schema.sh' '$REMOTE_TMP_DIR/notes_schema.sql'
"
