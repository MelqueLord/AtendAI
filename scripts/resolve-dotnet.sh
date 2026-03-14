#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_DOTNET="${ROOT_DIR}/.dotnet/dotnet"
LOCAL_DOTNET_CMD="./.dotnet/dotnet"
MODE="${1:-run}"

supports_dotnet_command() {
  local candidate="$1"
  command -v "${candidate}" >/dev/null 2>&1
}

supports_net8_runtime() {
  local candidate="$1"

  "${candidate}" --list-runtimes 2>/dev/null | grep -Eq '^Microsoft\.(AspNetCore|NETCore)\.App 8\.'
}

if [ "${MODE}" != "run" ]; then
  echo "Uso: ${0} [run]" >&2
  exit 1
fi

if supports_dotnet_command dotnet && supports_net8_runtime dotnet; then
  echo "dotnet"
  exit 0
fi

if [ -x "${LOCAL_DOTNET}" ] && supports_net8_runtime "${LOCAL_DOTNET}"; then
  echo "${LOCAL_DOTNET_CMD}"
  exit 0
fi

echo "Nenhum runtime .NET 8 encontrado para rodar a API." >&2

if supports_dotnet_command dotnet; then
  echo "Runtimes do dotnet do sistema:" >&2
  dotnet --list-runtimes >&2 || true
fi

if [ -x "${LOCAL_DOTNET}" ]; then
  echo "Runtimes do dotnet local (${LOCAL_DOTNET}):" >&2
  "${LOCAL_DOTNET}" --list-runtimes >&2 || true
fi

exit 1
