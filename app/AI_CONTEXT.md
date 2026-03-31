# BEEP - Contexto para IA (AI Handoff)

Este documento ha sido generado para ayudar a otras IAs o desarrolladores a comprender rápidamente la estructura, arquitectura y estado actual del proyecto BEEP.

## 📱 ¿Qué es BEEP?
BEEP es una aplicación Web (PWA) orientada a ser el juego definitivo para fiestas, reuniones y "previas". Los usuarios se reúnen, añaden sus nombres y juegan en un mismo dispositivo (offline/local, pasando el móvil) o en modo multijugador online a través de salas.
**Restricción clave de UI:** La interfaz debe ser estrictamente **Mobile-First**, con botones grandes (fat-finger friendly), colores oscuros/neón, animaciones fluidas, y protección contra toques accidentales (confirmaciones al salir).

## 🛠️ Stack Tecnológico
- **Core:** React 18, Vite, TypeScript.
- **Estilos:** Tailwind CSS, `classnames` / `clsx` y `tailwind-merge` vía `src/lib/utils.ts`.
- **Componentes UI:** Shadcn UI (Radix Primitives) para modales, diálogos y botones.
- **Iconos:** `lucide-react`.
- **Estado/Backend:** Supabase (Database + Realtime para multijugador, auth anónimo para invitaciones) y/o `localStorage` para el modo "offline" que es la forma en la que la mayoría de los usuarios juegan rápido en un móvil.
- **Animaciones:** Framer Motion (para transiciones entre cartas, contadores de puntos) y React Confetti.

## 📂 Estructura del Código Fuente
El código vive principalmente en la carpeta `app/src/`:
- `components/game/`: Componentes específicos de cada minijuego y de la UI de las partidas (`PartyGame.tsx`, `MegaBoardGame.tsx`, `TriviaQuestionCard.tsx`, `ScoreBoard.tsx`).
- `components/ui/`: Elementos reutilizables base (Botones, Modales, Inputs).
- `pages/`: Las pantallas principales (`Index.tsx` para el Home, `GameModeSelection.tsx` para elegir juego, `Lobby.tsx` para configurar jugadores, `Game.tsx` para la pantalla de juego en vivo).
- `hooks/`: La lógica de estado. Los más importantes son:
  - `useGame.ts`: Controla el ciclo de vida de la partida (crear partida, añadir jugador, pasar turno, cambiar ronda). Sincroniza el estado con Supabase si está online o lo guarda en LocalStorage si no hay conexión a Supabase.
  - `useGameContent.ts`: (Muy importante) Contiene la base de datos hardcodeada de preguntas y retos para el modo Offline. Devuelve preguntas aleatorias y gestiona el mazo "megamix".
  - `useAudio.ts` & `useVibration.ts`: Para efectos de feedback háptico y sonoro en cada botón de la app.
- `types/game.ts`: Tipos estrictos (interfaces) para `Game`, `Player`, `Team`, `Question`, y los catálogos enumerados de Modos de Juego (`GameMode`).

## 🎮 Modos de Juego Principales (`GameMode`)
BEEP centraliza los juegos en dos pestañas (`TabId`):
1. **Fiesta:** Centrados en beber o hacer pruebas en grupo (`megamix`, `clasico`, `yo_nunca`, `picante`, `megaboard`, `pacovers`, etc.). No usan necesariamente puntajes estrictos, sino retos tipo "cartas".
2. **Juego:** Exigen conocimiento y se pueden jugar por equipos (`cultura`, `trivia_futbol`, `futbol` (3 en raya táctico)).

## 🧠 Convenciones y Reglas de Modificación (Para la IA)
1. **No rompas el modo Offline:** La mayoría de los usuarios juegan enviándose el móvil mutuamente en la fiesta en modo offline. `useGame.ts` maneja esto mediante `localStorage`. Al modificar ciclos de turnos, asume que `isSupabaseConfigured` puede ser `false`.
2. **Modificaciones en Cartas / Lógica (PartyGame):** En el archivo `PartyGame.tsx` y `useGameContent.ts` está el motor principal de los juegos "Fiesta". Si añades una nueva categoría, asegúrate de añadirla al pool de preguntas local.
3. **No uses `alert` o `confirm` nativos:** Usa los modales de Radix (`Dialog`, `AlertDialog`) que ya están en el sistema o notificaciones de `sonner` (`toast`).
4. **Diseño Visual:** Todo debe parecer una app de fiesta de alta calidad (fondos oscuros abstractos `modern_bg.png`, gradientes en el texto, cristalismo `backdrop-blur`).

---
*Este documento fue creado para facilitar la transferencia de contexto sobre el estado actual de la base de código. Si haces cambios mayores en la arquitectura, ¡actualízalo!*
