#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOTNET_CMD="$("${ROOT_DIR}/scripts/resolve-dotnet.sh" run)"
API_DIR="${ROOT_DIR}/Atendai.API"

cd "${ROOT_DIR}"
./.dotnet/dotnet build Atendai.API/Atendai.API.csproj

cd "${API_DIR}"
export ASPNETCORE_ENVIRONMENT=Development
export ASPNETCORE_URLS="http://localhost:5155"

exec "${DOTNET_CMD}" ./bin/Debug/net8.0/Atendai.API.dll
