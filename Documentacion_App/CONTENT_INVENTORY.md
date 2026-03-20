# Inventario de Contenido de la Aplicación (Actualizado Mar 2026)

Este documento resume el volumen de pruebas, retos y preguntas disponibles en **Beep!**. Se ha implementado un sistema robusto que mezcla listas estáticas antiguas con las nuevas implementaciones (Extras 1, 2 y 3).

## 📊 Volumen Aproximado por Categoría

### Modos Fiesta & Bebida
- **Clásico / Retos Base**: ~450+ pruebas (incluye `clasico`, `clasicoExtra`, `clasicoExtra2`, `clasicoExtra3`).
- **Yo Nunca**: ~350+ afirmaciones.
- **Picante (+18)**: ~250+ retos y preguntas.
- **Quién es más probable (Votación)**: ~200+ escenarios.
- **España Nostálgica (Pacovers)**: ~200+ referencias españolas y memes.
- **En la Cama Y...**: ~150+ frases para completar.
- **Categorías Letras/Retos**: ~100+ temáticas de listas.
- **Duelos**: ~25 minijuegos 1vs1 físicos, sociales y de suerte.
- **Mímica**: ~50+ situaciones absurdas para actuar.
- **Normas de Ronda**: ~30 leyes temporales que afectan a todos.

### Modos Trivia & Cultura
- **Cultura General**: ~400+ preguntas (base original + `cultureQuestionsNew2025` que incorpora historia, ciencia, tecnología, IA, cine, música y actualidad 2024-2025).
- **Fútbol Trivia**: ~150+ preguntas de historia de los mundiales, ligas europeas, jugadores legendarios y anécdotas.

### MegaBoard 3D (Tablero 100 Casillas)
El tablero de la Oca genera **casillas infinitas dinámicas** extrayendo de todo el pool anterior, pero tiene preconfiguradas un sinfín de eventos especiales en casillas:
- **Trampas (💀)**: Retrocesos, pérdidas de turno, sentadillas, motes.
- **Bonus (⭐)**: Tiros extra, escudos, robos de experiencia, XP x2.
- **Eventos Random (🎲)**: Intercambios de posición, dados de la muerte, lotería.
- **Eventos Bebida (🍺)**: Cascadas, chupitos grupales, duelos de bebida, brindis.

## ⚙️ Sistema de Aleatoriedad (Shuffle Engine)
Todo el contenido pasa por `shuffleUtils.ts`.
1. Emplea un algoritmo de mezcla **Fisher-Yates (Durstenfeld)** para máxima entropía.
2. Contiene **Session Trackers (Map)** que recuerdan qué índices de matrices ya se han usado.
3. El juego nunca repetirá un reto, prueba o pregunta hasta que se haya completado el 100% de la categoría en esa misma sesión del navegador.
