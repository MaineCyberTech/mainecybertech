#!/usr/bin/env bash
#
# Refuse to stage a real .env file. Called by the pre-commit hook, but runnable
# by hand:
#
#   ./scripts/check-no-dotenv.sh .env apps/api/.env
#
# A committed .env is how the current mess started. `.env.example` and
# `.env.*.example` are fine and are the documented way to share the shape of the
# config without the values.

set -euo pipefail

status=0

for f in "$@"; do
  [ -e "$f" ] || continue

  case "$f" in
    *.example|*.example.*|*example.env)
      continue
      ;;
  esac

  case "$(basename "$f")" in
    .env|.env.*)
      echo "refusing to stage a real env file: $f" >&2
      echo "  -> commit ${f}.example (names only, no values) instead" >&2
      status=1
      ;;
  esac
done

exit "$status"
