# INSTRUCCIONES DE DEPLOY — Gemini Flash

## Regla principal
GitHub Pages sirve SOLO desde `/docs` en la rama `main`.
La raíz del repo NO se publica. Todo lo que pongas fuera de `/docs` es invisible en la web.

## Cuando hagas cambios en el código fuente
Después de editar archivos en `app/src/`, ejecuta siempre:

```bash
bash deploy.sh
```

O manualmente:
```bash
cd app && npm run build
rm -rf ../docs/*
cp -r dist/* ../docs/
cd ..
git add docs/
git commit -m "deploy: build sync"
git push origin main
```

## Nunca hagas esto
- `cp -r dist/* ../` (copia a la raíz — no sirve de nada)
- `cp -r dist/* ../assets/` (misma raíz — invisible en la web)
- Commits con archivos de build fuera de `docs/`

## Estructura
```
App Final/
├── app/          ← código fuente (editar aquí)
│   ├── src/
│   └── dist/     ← output del build (temporal)
├── docs/         ← LO QUE VE GITHUB PAGES (copiar dist/* aquí)
└── deploy.sh     ← script que hace todo automáticamente
```
