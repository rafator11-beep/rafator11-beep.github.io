#!/bin/bash
# DEPLOY SCRIPT - GitHub Pages sirve desde /docs en rama main
# Usar siempre este script para publicar cambios

set -e

echo ">> Instalando dependencias..."
cd app
npm ci

echo ">> Building app..."
npm run build

if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
  echo "ERROR: dist/ vacío o no existe. Build fallido."
  exit 1
fi

echo ">> Syncing to /docs..."
cd ..
rm -rf docs/*
cp -r app/dist/* docs/

echo ">> Committing..."
git add docs/
git diff --cached --quiet && echo "Sin cambios en docs/ — nada que commitear." && exit 0
git commit -m "deploy: rebuild + sync to /docs [$(date '+%Y-%m-%d %H:%M')]"
git push origin main

echo ">> Done. GitHub Pages updated."
