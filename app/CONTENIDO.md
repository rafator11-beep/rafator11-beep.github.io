# Cómo mantener BEEP fresco y actualizado

No hay IA ni servidor: el "salseo" (piques, callbacks, rivalidades, crónicas) lo
genera **`src/lib/partyDirector.ts`** con plantillas + los datos reales de la
partida (quién bebe más, quién falla, rivalidades, tema de la fiesta). Cada
partida ya se baraja de cero y, además, las cartas vistas en sesiones recientes
se mandan al fondo del mazo (`beep_recent_cards` en localStorage), así que
Megamix se siente nuevo cada noche.

## Añadir preguntas/retos nuevos (2 min)

1. Abre el archivo del modo que quieras ampliar en `src/data/`:
   - Megamix / Clásico → `gameContentExtra*.ts`, `gameContentMega*.ts`, `customPartyRetos.ts`
   - Yo Nunca → `yoNunca*` dentro de esos mismos archivos
   - Cultura / Fútbol → `cultureQuestionsNew2025.ts`, `footballQuestionsNew.ts`
   - Impostor → `impostorContent.ts`
2. Añade tus líneas al array (mismo formato que las que ya hay). Puedes usar
   estos huecos y el Director los rellena con nombres reales:
   `{player}` (jugador del turno) · `{rival}` / `{player2}` · `{someone}` · `{tema}`
3. `npm run build` y sube (ver abajo). Los usuarios reciben el contenido nuevo
   automáticamente (la PWA se auto-actualiza).

## Publicar (GitHub Pages)

```bash
npm run build          # genera /docs
git add -A
git commit -m "contenido: nuevas cartas"
git push
```

GitHub Pages sirve este repo desde **rama `main` → carpeta `/docs`**.
URL para compartir: **https://rafator11-beep.github.io/**

- **Offline**: funciona como PWA (se instala desde el navegador, "Añadir a
  pantalla de inicio"). El contenido va embebido, no necesita conexión.
- **Online**: la misma URL. El juego multijugador usa Supabase/PeerJS si está
  configurado; si no, cae a modo local automáticamente.

## Afinar el salseo

Todo está en `src/lib/partyDirector.ts`:
- `SYNTH_TEMPLATES` — cartas nuevas que se inventa el Director a mitad de partida.
- `pique()` — la frase de contexto que engancha una ronda con lo que acaba de pasar.
- `PUNISHMENTS`, `partyTitle()`, `geminiGenerateProfileCoach()` — castigos, títulos del podio, roast del entrenador.

Añade plantillas a esas listas y sube. Sin claves, sin backend, sin coste.
