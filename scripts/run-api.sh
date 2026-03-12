#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${ROOT_DIR}"
./.dotnet/dotnet run --project Atendai.API/Atendai.API.csproj --launch-profile http
