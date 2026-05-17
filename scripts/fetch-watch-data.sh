#!/usr/bin/env bash
# Fetch watch data from remote API and save to data/watch.json
# This ensures builds don't fail if the remote service is down,
# and eliminates runtime dependency on external API during Hugo builds.

set -euo pipefail

DATA_FILE="data/watch.json"
API_URL="https://postgrest-tianheg.up.railway.app/watch"

mkdir -p data

echo "Fetching watch data from ${API_URL}..."

STATUS=$(curl -s -o "${DATA_FILE}" -w "%{http_code}" --max-time 15 "${API_URL}")

if [ "${STATUS}" -ne 200 ]; then
  echo "Warning: API returned HTTP ${STATUS}"
  if [ ! -f "${DATA_FILE}" ] || [ ! -s "${DATA_FILE}" ]; then
    echo "Creating empty fallback data file"
    echo '[]' > "${DATA_FILE}"
  fi
fi

echo "Watch data saved to ${DATA_FILE} ($(wc -c < "${DATA_FILE}") bytes)"