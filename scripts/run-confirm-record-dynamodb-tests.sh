#!/usr/bin/env bash
set -euo pipefail
if [ -z "${DDB_ENDPOINT:-}" ]; then
  ddb_test_dir="${RUNNER_TEMP:-/tmp}/wardrobe-confirm-dynamodb"
  mkdir -p "$ddb_test_dir"
  if [ ! -f "$ddb_test_dir/DynamoDBLocal.jar" ]; then
    curl --fail --location --retry 0 'https://s3.ap-northeast-1.amazonaws.com/dynamodb-local-tokyo/dynamodb_local_latest.tar.gz' -o "$ddb_test_dir/dynamodb.tar.gz"
    (cd "$ddb_test_dir" && echo '55b425a9a42cfc728436eaf0e4ae64d688b64d177c99c4f4c4d7e3dbb3ac6c09  dynamodb.tar.gz' | sha256sum --check && tar -xzf dynamodb.tar.gz)
  fi
  java -Djava.library.path="$ddb_test_dir/DynamoDBLocal_lib" -jar "$ddb_test_dir/DynamoDBLocal.jar" -inMemory -sharedDb -port 8765 > "$ddb_test_dir/server.log" 2>&1 &
  ddb_test_pid=$!
  trap 'kill "$ddb_test_pid" 2>/dev/null || true' EXIT
  export DDB_ENDPOINT=http://127.0.0.1:8765
  for attempt in {1..30}; do
    if curl --silent --output /dev/null "$DDB_ENDPOINT"; then break; fi
    sleep 1
  done
fi
pnpm --filter api exec node --import tsx/esm scripts/check-confirm-record-dynamodb-spec.mjs
