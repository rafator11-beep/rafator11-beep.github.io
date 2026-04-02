#!/bin/bash
# DEPLOY SCRIPT - GitHub Pages sirve desde /docs en rama main
# Usar siempre este script para publicar cambios

set -e

echo ">> Building app..."
cd app
npm run build

echo ">> Syncing to /docs..."
cd ..
rm -rf docs/*
cp -r app/dist/* docs/

echo ">> Committing..."
git add docs/
git commit -m "deploy: rebuild + sync to /docs"
git push origin main

echo ">> Done. GitHub Pages updated."
