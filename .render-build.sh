set -euo pipefail
echo "[Render] Node: $(node -v)  NPM: $(npm -v)"
echo "[Render] Skip TS build. Using prebuilt dist/"
if [ ! -f dist/server.js ]; then
  echo "[Render] dist/server.js fehlt. Abbruch."
  exit 1
fi
ls -lah dist | head -n 50
echo "[Render] OK."
