#!/bin/bash
# DEPLOY — GitHub Pages sirve beep/docs/ (rama main, carpeta /docs).
# El código fuente está en beep/app/. vite.config compila DIRECTO a ../docs,
# así que este script solo construye, commitea y sube.
set -e

cd "$(dirname "$0")/app"
echo ">> Build..."
npm run build

cd ..
if [ ! -f docs/index.html ]; then
  echo "ERROR: docs/index.html no existe. Build fallido."
  exit 1
fi

echo ">> Commit + push..."
git add docs/
if git diff --cached --quiet; then
  echo "Sin cambios en docs/ — nada que subir."
  exit 0
fi
git commit -m "deploy: rebuild [$(date '+%Y-%m-%d %H:%M')]"
git push origin main
echo ">> Listo. GitHub Pages se actualiza en 1-2 min."
