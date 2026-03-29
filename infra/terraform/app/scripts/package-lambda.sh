#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
BUILD_DIR="${REPO_ROOT}/infra/terraform/app/build"
LAMBDA_ZIP_PATH="${BUILD_DIR}/lambda.zip"
TMP_ZIP_PATH="${REPO_ROOT}/infra/terraform/app/lambda.tmp.zip"
API_NODE_MODULES_DIR="${REPO_ROOT}/apps/api/node_modules"

# Compile API sources for Lambda handlers into the Terraform build directory.
pnpm --filter api exec tsc --outDir ../../infra/terraform/app/build --rootDir src

# Ensure Node.js treats compiled .js files as ESM in Lambda.
cat > "${BUILD_DIR}/package.json" <<'JSON'
{
  "type": "module"
}
JSON

# Copy runtime dependencies needed by compiled handlers.
mkdir -p "${BUILD_DIR}/node_modules/zod" "${BUILD_DIR}/node_modules/dotenv"
cp -RL "${API_NODE_MODULES_DIR}/zod/." "${BUILD_DIR}/node_modules/zod"
cp -RL "${API_NODE_MODULES_DIR}/dotenv/." "${BUILD_DIR}/node_modules/dotenv"

# Package Lambda artifact while excluding source maps and type declarations.
rm -f "${TMP_ZIP_PATH}" "${LAMBDA_ZIP_PATH}"
(
  cd "${BUILD_DIR}"
  zip -qr "${TMP_ZIP_PATH}" . \
    -x "*.d.ts" \
    -x "*.d.ts.map" \
    -x "*.js.map"
)
mv "${TMP_ZIP_PATH}" "${LAMBDA_ZIP_PATH}"

echo "Created ${LAMBDA_ZIP_PATH}"
