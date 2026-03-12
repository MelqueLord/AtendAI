#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="${1:-atendai}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux nao encontrado. Instale com: sudo apt install tmux"
  exit 1
fi

if tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
  echo "Sessao tmux '${SESSION_NAME}' ja existe."
  echo "Anexe com: tmux attach -t ${SESSION_NAME}"
  exit 1
fi

tmux new-session -d -s "${SESSION_NAME}" -n api
tmux send-keys -t "${SESSION_NAME}:api" "cd '${ROOT_DIR}' && ./.dotnet/dotnet run --project Atendai.API/Atendai.API.csproj --launch-profile http" C-m

tmux new-window -t "${SESSION_NAME}" -n bridge
tmux send-keys -t "${SESSION_NAME}:bridge" "cd '${ROOT_DIR}/whatsapp-web-bridge' && node server.mjs" C-m

tmux new-window -t "${SESSION_NAME}" -n web
tmux send-keys -t "${SESSION_NAME}:web" "cd '${ROOT_DIR}/Atendai.Web' && npm run dev" C-m

echo "Sessao tmux '${SESSION_NAME}' criada."
echo "Janelas:"
echo "- api"
echo "- bridge"
echo "- web"
echo
echo "Anexar: tmux attach -t ${SESSION_NAME}"
echo "Parar tudo: ${ROOT_DIR}/scripts/dev-tmux-stop.sh ${SESSION_NAME}"
