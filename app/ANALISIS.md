# Análisis de BEEP — modos de juego y contenido

_Post-verano 2026. Para decidir en qué trabajar y por qué los modos se parecían tanto._

---

## 1. El problema real: por qué los modos se parecían

### 1.1. La mayor parte del contenido escrito NO estaba conectada

`useGameContent.ts` solo mezclaba: `clasico`, `clasicoExtra`, `Extra2`, `Extra3` y `V4` (Extra13).

**`gameContentExtra4`–`Extra19` y `gameContentMega1`–`Mega8` (24 archivos, ~3.000+ frases) no los importaba nadie.** Los commits "1300+ cartas" añadieron ficheros que nunca llegaron al juego. Resultado: el jugador solo veía la primera tanda, la más antigua, genérica y con erratas ("se ra", "prximo", "Qu prefers").

→ **Arreglado en esta actualización**: barrel `src/data/extraContentIndex.ts` conecta todo ese contenido a los modos correctos.

### 1.2. Los modos comparten pool y no tienen mecánica propia

- `picante` empezaba con **4 frases idénticas, copiadas literalmente de `clasico`**.
- `nostalgia` era `export const nostalgia = pacovers` → **"España Nostálgica" y "Pacovers" servían exactamente el mismo mazo.**
- `clasico`, `picante`, `espana`, `pacovers` todos tiran de "Reto: {player} haz X" + "Categorías: Y". Cambia el nombre del modo, no la experiencia.
- No hay verbo propio por modo: todo es "responde o bebe".

### 1.3. Registro demasiado básico

Nivel "cuenta un chiste / haz 10 flexiones / di 5 capitales". Falta el tono de gente de 30 con hipoteca, curro tóxico y resaca de tres días: humor negro, autodestructivo, del día a día, referencias que un adulto pilla.

### 1.4. Sin cierre

No hay pantalla final de **resumen + clasificación** consistente en todos los modos (Podio existe, pero no un "así ha quedado la liga de la noche" con datos).

---

## 2. Qué debería ser cada modo (identidad)

| Modo | Verbo | Debe sentirse como | Contenido propio |
|---|---|---|---|
| **Megamix** | *Todo, con caos* | Un programa de late night: bloques, normas que duran, cruces de duelos, cambios de ritmo | Estructura por bloques + **bracket de duelos** + normas persistentes |
| **Clásico** | *Jugar* | Juego de mesa de toda la vida, cero incomodidad, apto para cuñados | Categorías, cadenas, cultura chupística, retos suaves |
| **Yo Nunca** | *Confesar* | Terapia de grupo con alcohol. Cotidiano e incómodo, no "de fiesta loca" | Confesiones adultas por etapa vital (infancia→curro→ahora) |
| **Picante +18** | *Exponerse* | Tensión real: exs, ligues, mentiras en la cama, rankings crueles | NADA reutilizado de clásico. Preguntas directas y personales |
| **Quién es más probable** | *Señalar* | Juicio popular con mala leche cariñosa | "¿Quién de aquí…?" con puñal, siempre termina en beber |
| **España Nostálgica** | *Recordar* | Bajón de nostalgia noventera muy concreto (no "di un programa de tele") | Objetos, escenas y frases específicas de una infancia española |
| **Pacovers / Veteranos** | *Quejarse* | Humor de "ya no tengo edad": lumbago, Omeprazol, hipoteca | Achaques, gastos fijos, nostalgia de cuñado — distinto de España |
| **En la cama y…** | *Doble sentido* | Juego de ingenio por turnos, sube de tono solo | Muchos contextos + variantes invertidas (gimnasio↔cama, cocina↔cama) |
| **Cultura / Fútbol / Speed** | *Competir* | Quiz picado 1v1 o equipos | Ya tienen buen pool; falta rejugabilidad (rotación) |

---

## 3. Guía de tono para escribir contenido nuevo

**Sí:**
- Humor negro y autodestructivo: "Yo nunca he mirado pisos que no me puedo permitir a las 2am para hacerme daño".
- Cotidiano de los 30: hipoteca, curro que podía ser un correo, Bizum del céntimo, suscripciones que no usas, gimnasio de enero.
- Actualidad / viral que un adulto pilla: "el primero al que la IA le quita el trabajo", apps de citas, LinkedIn.
- Interacción real entre jugadores: "{player}, describe a {player2} como su ex a las 3am".
- Cosas que (no) te han pasado en 30 años de vida: patético, específico, reconocible.

**No:**
- "Haz 10 flexiones", "di 5 capitales", "cuenta un chiste".
- Frases que valdrían para un cumpleaños infantil.
- Repetir el mismo molde 20 veces cambiando una palabra.
- Erratas (revisar tildes y signos de apertura ¿¡).

---

## 4. Lo hecho en esta actualización

1. **Contenido conectado**: `extraContentIndex.ts` engancha `Extra4-19` + `Mega1-7` (~3.000 frases que estaban muertas) a sus modos.
2. **Pack nuevo**: `updatePostVerano2026.ts` — ~230 frases nuevas escritas con el tono de arriba, repartidas con identidad por modo (`yoNuncaV5`, `retosV5`, `picanteV5`, `votacionV5`, `clasicoV5`, `enLaCamaV5`, `espanaV5`, `normasV5`, `duelosV5`).
3. **"En la cama y…"** ampliado (de 10 a ~35 contextos, con variantes invertidas).
4. **`picante` separado de `clasico`**: ahora `picante` tira de `picanteV5` (preguntas personales) y ya no arranca con frases clonadas.
5. **Rotación entre partidas** (`beep_recent_cards`): lo visto hace poco se manda al fondo del mazo. Megamix se siente nuevo cada noche.
6. **6 errores de TypeScript preexistentes**: corregidos. `tsc --noEmit` limpio.

---

## 5. Roadmap

### A. Bracket de duelos en Megamix  ✅ HECHO
`MegamixTournament.tsx` ahora es un **cuadro continuo**: al coronar campeón de una llave, botón **"🔁 Nueva llave"** que rebaraja los cruces y arranca otra eliminatoria; **"Terminar"** vuelve a la partida. Mantiene una **"Liga de duelos"** persistente (`beep_bracket_wins`) que se muestra en la pantalla de campeón. Retos de duelo desde pool ampliado (`torneoRetos` + `duelosV5` + `moreTorneoRetos`) **sin repetir** dentro de la sesión (`beep_duel_retos_seen`). Los duelos sueltos cada 10 turnos también tiran de ese pool.

### B. Coherencia por respuesta (callbacks literales)  ✅ HECHO
`useGameMemory.formatCallback()` coge un evento jugoso de hace ≥2 turnos (yo-nunca=sí, reto fallado, más votado, verdad, duelo perdido) y lo cita textualmente. `enrichChallengeWithAI` lo pasa al PartyDirector, que lo antepone al reto (~65 %): _"🔁 Recordad que Ana confesó que SÍ a «he vuelto con un ex»..."_.

### C. Sin repeticiones + clasificación final  ✅ HECHO
- El mazo ya no se repetía igual al agotarse: ahora se **re-baraja con otra semilla en cada vuelta** (`seededShuffle` por lap) en `useGameContent`.
- **Podio** con **tabla de clasificación final** de todos los jugadores (puesto · XP · 🍺 tragos), además de los títulos que ya había.

### D. Anti-repetición en Cultura / Fútbol / Speed  ✅ HECHO
Nuevo `src/lib/recentContent.ts` (`pickFreshQuiz` / `rememberQuizIds`): memoria de preguntas vistas entre partidas en localStorage.
- **Speed Round** (`beep_speed_seen_<cat>`): cada partida prioriza preguntas no vistas.
- **Cultura** standalone (`beep_culture_seen`): idem, sobre el pool completo (`cultureQuestions` + `cultureQuestionsNew2025`).
- **Trivia por cartas** en `useGameContent` (`beep_trivia_seen_<cat>`): filtra por vistas de sesiones anteriores además del `usedQuestionIds` de la partida.

### E. Segunda oleada de contenido  ✅ HECHO (wave 2)
`src/data/updatePostVerano2026_v2.ts` — ~280 frases nuevas más, misma guía de tono, sin repetir la oleada 1: `yoNuncaV5b`, `retosV5b`, `picanteV5b`, `votacionV5b`, `clasicoV5b`, `enLaCamaV5b`, `espanaV5b`, `normasV5b`, `duelosV5b`. Conectadas a sus modos y a Megamix.
_(Pendiente wave 3+ para llegar a los 500+/modo que pediste — es trabajo incremental; la identidad ya está fijada.)_
