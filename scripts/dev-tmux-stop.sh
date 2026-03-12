#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="${1:-atendai}"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux nao encontrado."
  exit 1
fi

if ! tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
  echo "Sessao '${SESSION_NAME}' nao existe."
  exit 1
fi

tmux kill-session -t "${SESSION_NAME}"
echo "Sessao '${SESSION_NAME}' encerrada."
