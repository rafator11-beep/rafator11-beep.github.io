# 🔥 PROMPT DEFINITIVO — Lavado de Cara TOTAL de BEEP: Todos los Modos

## Instrucciones

Copia **todo** el bloque entre los dos `---` y pégalo en Claude Opus.

---

Actúa como un ingeniero senior full-stack + arquitecto de producto + el creador definitivo de juegos de beber para fiestas españolas. Conoces la cultura de botellón, tardeo, despedidas, erasmus, y fiestas de pueblo como nadie.

Estamos trabajando en "BEEP", una app web premium de juegos de beber (React + Vite + TypeScript). La app tiene 15 modos de juego y un sistema de contenido distribuido en 13 archivos TypeScript. Necesita un LAVADO DE CARA TOTAL: limpieza de duplicados + generación masiva de contenido nuevo para TODOS los modos.

⚠️ ORDEN DE PRIORIDAD:
1. PRIMERO: Mejoras de código (breve, solo las 3 más críticas)
2. SEGUNDO: Criterios de limpieza por categoría
3. TERCERO: Generar contenido nuevo POR BLOQUES
Si te quedas sin espacio, termina con "Pídeme el siguiente bloque en otro mensaje."

═══════════════════════════════════════════════════
INVENTARIO ACTUAL DE CONTENIDO (DATOS REALES)
═══════════════════════════════════════════════════

He analizado automáticamente los 13 archivos de datos. Estos son los números exactos:

📊 RESUMEN GLOBAL: 9.201 items de contenido + archivos especiales

| Categoría              | Preguntas | Duplicados | Estado      |
|------------------------|-----------|------------|-------------|
| Yo Nunca               | 3.195     | 978 grupos | ⚠️ CRÍTICO  |
| Clásico                | 644       | 122 grupos | ⚠️ REGULAR  |
| Picante                | 408       | 32 grupos  | ⚠️ REGULAR  |
| Votación/Más Probable  | 597       | 97 grupos  | ⚠️ REGULAR  |
| Pacovers               | 444       | 16 grupos  | ✅ ACEPTABLE |
| España Nostálgica      | 51        | 1 grupo    | ❌ MUY POCO |
| En la cama y...        | 99        | 0 grupos   | ❌ POCO     |
| Categorías/Listados    | 84        | 0 grupos   | ❌ POCO     |
| Retos                  | 111       | 0 grupos   | ❌ POCO     |
| Normas de Ronda        | 292       | 0 grupos   | ✅ OK       |
| Verdad o Bebe          | 113       | 8 grupos   | ❌ POCO     |
| Cadena (Reto Cadena)   | 114       | 6 grupos   | ❌ POCO     |
| Salseo                 | 70        | 7 grupos   | ❌ POCO     |
| Mímica                 | 150       | 13 grupos  | ✅ ACEPTABLE |
| **Total**              | **9.201** |            |             |

📁 ARCHIVOS ESPECIALES:
| Archivo                   | Líneas | Tamaño | Contenido              |
|---------------------------|--------|--------|------------------------|
| duelosContent.ts          | 226    | 36KB   | 224 duelos 1v1         |
| impostorContent.ts        | 92     | 9KB    | 80 rondas impostor     |
| footballQuestionsNew.ts   | 1.945  | 178KB  | Trivia de fútbol       |
| cultureQuestions.ts       | 1.142  | 184KB  | Trivia cultura general |
| cultureQuestionsNew2025.ts| 128    | 20KB   | Extra cultura 2025     |
| customPartyRetos.ts       | 17     | 1KB    | 5 retos custom         |

═══════════════════════════════════════════════════
PARTE 1: MEJORAS DE CÓDIGO (solo las 3 esenciales)
═══════════════════════════════════════════════════

MEJORA 1 — isIndividualCard() completa
PartyGame.tsx ya importa esta función. Debe cubrir TODOS los prefijos:

```typescript
export function isIndividualCard(cardText: string): boolean {
  const t = cardText.toLowerCase();
  if (t.startsWith('🎯') || t.includes('reto:')) return true;
  if (t.startsWith('🎤') || t.includes('verdad o bebe')) return true;
  if (t.startsWith('⚡') || t.includes('trivia express')) return true;
  if (t.startsWith('🔤') || t.includes('categorías')) return true;
  if (t.startsWith('⚔️') || t.includes('duelo')) return true;
  if (t.includes('{player}')) return true;
  return false; // General → NO avanza turno
}
```

MEJORA 2 — En PartyGame.tsx, al pulsar "Siguiente":

```typescript
const shouldAdvancePlayer = isIndividualCard(currentCardText);
performTurnAdvance(!shouldAdvancePlayer); // true=skip, false=advance
```

MEJORA 3 — Borrar gameContent_orig.ts (542KB copia exacta inútil)

Dame SOLO estas 3 modificaciones con el código exacto.

═══════════════════════════════════════════════════
PARTE 2: CRITERIOS DE LIMPIEZA POR CATEGORÍA
═══════════════════════════════════════════════════

Para CADA categoría, aplica estos criterios de eliminación:

A) DUPLICADOS LITERALES: misma frase en 2+ archivos → conservar 1
B) VARIANTES LAZY: misma plantilla, distinto relleno → conservar 2-3 mejores
C) SURREALISTAS: probabilidad < 1% de que alguien lo haya hecho → borrar
D) CORTADAS: frases truncadas sin sentido → borrar
E) DEMASIADO CASUALES: todo el mundo bebe, cero sorpresa → borrar

Dame 5 ejemplos de cada criterio para CADA categoría que tenga problemas (Yo Nunca, Clásico, Picante, Votación). No me des listas enormes — solo los criterios y ejemplos.

═══════════════════════════════════════════════════
PARTE 3: CONTENIDO NUEVO — FORMATO POR CATEGORÍA
═══════════════════════════════════════════════════

⚠️ FORMATOS EXACTOS (cópialos tal cual en el código):

**Yo Nunca** (strings simples, SIN prefijo "Yo nunca" ni emoji):

```typescript
export const yoNuncaMegaBloque1: string[] = [
  "he copiado en un examen usando el Tipp-Ex como escondite de chuleta",
  // ...
];
```

**Clásico** (preguntas/acciones genéricas):

```typescript
export const clasicoNuevo: string[] = [
  "Si tienes más de 3 ex en tu lista de contactos, bebe 2",
  // ...
];
```

**Picante +18** (strings simples):

```typescript
export const picanteNuevo: string[] = [
  "Enséñale al grupo tu último emoji de fuego en un chat o bebe 3",
  // ...
];
```

**Votación / Quién es más probable** (strings simples):

```typescript
export const votacionNuevo: string[] = [
  "¿Quién es más probable que acabe llorando esta noche?",
  // ...
];
```

**Retos individuales** (con {player}):

```typescript
export const retosNuevo: string[] = [
  "Reto: {player} manda un audio a la última persona que te escribió diciendo 'te echo de menos'. Si no lo haces, bebe 3",
  // ...
];
```

**Verdad o Bebe** (con {player} y formato completo):

```typescript
export const verdadOBebeNuevo: string[] = [
  "🎤 VERDAD O BEBE: {player} — ¿Cuál es la mentira más gorda que has contado en este grupo? Si no respondes, bebe 3. 🍻",
  // ...
];
```

**En la cama y...** (frase corta que se lee añadiendo "En la cama y..."):

```typescript
export const enLaCamaNuevo: string[] = [
  "En la cama y... 'No me toques que tengo calor'",
  // ...
];
```

**Cadenas grupales** (formato completo con emoji):

```typescript
export const cadenaNuevo: string[] = [
  "🔗 CADENA: Por turnos, decid cosas que se hacen cuando estás nervioso/a. El que repita bebe 2. 🍻",
  // ...
];
```

**Categorías / Listados** (tema para jugar por turnos):

```typescript
export const categoriasNuevo: string[] = [
  "Categorías: Excusas para no ir a trabajar",
  // ...
];
```

**Pacovers / España** (referencia cultural española):

```typescript
export const pacoversNuevo: string[] = [
  "Si te sabías de memoria la dirección de tu casa porque la repetías para pedir cosas por correo, bebe",
  // ...
];
```

**Normas de Ronda** (regla que aplica a TODOS):

```typescript
export const normasNuevas: string[] = [
  "NORMA: Prohibido usar la mano dominante para beber. Quien lo haga, bebe doble.",
  // ...
];
```

**Mímica** (cosa que actuar sin palabras):

```typescript
export const mimicaNueva: string[] = [
  "🎭 MÍMICA: Imita a alguien poniendo una lavadora por primera vez",
  // ...
];
```

**Salseo** (preguntas comprometidas del grupo):

```typescript
export const salseoNuevo: string[] = [
  "Yo nunca he hablado mal de alguien del grupo y esa persona está aquí. Si lo has hecho, bebe 3. 🍻",
  // ...
];
```

**Duelos 1v1** (formato objeto con name, description, type):

```typescript
export const duelosNuevo = [
  { name: "Duelo de Shazam", description: "El grupo pone una canción. El primero que la identifique reparte 4 tragos.", type: "tech" },
  // ...
];
```

**Rondas Impostor** (formato objeto):

```typescript
export const impostorNuevo: ImpostorRound[] = [
  { category: "Música", normalQuestion: "Di una canción de Estopa", impostorQuestion: "Di una canción de Melendi", hint: "¿Seguro que es de Estopa?" },
  // ...
];
```

═══════════════════════════════════════════════════
PARTE 4: CANTIDAD DE CONTENIDO NUEVO POR MODO
═══════════════════════════════════════════════════

Genera contenido nuevo en BLOQUES. Cada bloque = 1 mensaje.

**BLOQUE 1 — Yo Nunca: INFANCIA + PRIMARIA (200)**
El recreo, cromos, flauta dulce, Art Attack, Bollycao, la comunión, los Reyes Magos, el compañero que te gustaba, caer de los columpios, la excursión del cole, piojos, el autobús escolar, los deberes, el bocata de Nocilla...

**BLOQUE 2 — Yo Nunca: INSTITUTO + ESO (200)**
Las pellas, primera borrachera, liarte en el recreo, botellones con 15 años, el viaje de fin de curso, Tuenti, MSN, la selectividad, copiar con pinganillo, las fiestas de pueblo, el grupo del insti, los septiembre, el profe que olía a café...

**BLOQUE 3 — Yo Nunca: UNIVERSIDAD + ERASMUS (200)**
El piso de estudiantes, comer pasta 5 días, salir de martes a jueves, ir en pijama a clase, biblioteca a las 3AM, Erasmus, liarte con 3 del grupo, fiestas de facultad, TFG a última hora, prácticas sin cobrar...

**BLOQUE 4 — Yo Nunca: CURRO + ADULTOS (200)**
Primer sueldo, jefe tóxico, grupo WhatsApp trabajo, hipoteca imposible, cenas de empresa, pagar impuestos, crisis de los 25, boda a la que no querías ir, vivir con tu ex...

**BLOQUE 5 — Yo Nunca: FIESTA + SALSEO (200)**
After, drama del grupo, quién besó a quién, el que desaparece en fiestas, pierde el móvil, llora borracho, se duerme en sofá, sinpa, vergüenza del lunes, kebab a las 6AM...

**BLOQUE 6 — Picante +18 (200)**
Situaciones sexuales REALISTAS: Tinder, mensajes calientes, vergüenzas en la cama, pillar a alguien, el típico "me arrepiento", cosas que solo pasan de noche. NADA surrealista.

**BLOQUE 7 — Votación + Verdad o Bebe (200 de cada uno = 400)**
Votación: "¿Quién es más probable que..." con situaciones que generen debate.
Verdad o Bebe: Preguntas personales comprometidas con formato {player}.

**BLOQUE 8 — Retos + Cadenas + Categorías (150 de cada uno = 450)**
Retos: Con {player}, retos de MÓVIL (mandar audio, enseñar galería), FÍSICOS (flexiones, imitar) y SOCIALES (confesar algo).
Cadenas: Temas para decir por turnos.
Categorías: Temas de listado rápido.

**BLOQUE 9 — En la cama + Pacovers + España + Normas (100+100+100 = 300)**
En la cama: Frases graciosas que se dicen.
Pacovers/España: Cultura española, cosas de pueblo, infancia, frases de padre/madre.
Normas: Reglas locas que aplican a todos durante varias rondas.

**BLOQUE 10 — Mímica + Salseo + Duelos + Impostor (80+50+50+30 = 210)**
Mímica: Cosas para actuar sin hablar.
Salseo: Preguntas que generan drama real en el grupo.
Duelos: Formato {name, description, type}.
Impostor: Formato {category, normalQuestion, impostorQuestion, hint}.

═══════════════════════════════════════════════════
REGLAS INQUEBRANTABLES PARA TODO EL CONTENIDO
═══════════════════════════════════════════════════

1. **REALISMO**: Si una persona normal de 20 años en España no lo ha hecho/dicho nunca, NO vale.
2. **GRACIA**: Debe provocar una REACCIÓN — risas, gritos de "¡TÚ!", señalar, drama.
3. **3-4 de 10**: La pregunta ideal hace que 3-4 de una mesa de 10 beban.
4. **JERGA ESPAÑOLA**: "liarse", "pillar cacho", "cubata", "perreo", "ghostear", "match", "tardeo", "after", "empalmada", "sinpa", "rallarse", "quedada", "botellón", "chupito", "garrafón", "priva", "rebujito", "macro"...
5. **10-30 palabras**: Ni muy cortas ni un párrafo.
6. **CERO frases cortadas**: Toda frase debe tener sentido completo.
7. **CERO repeticiones**: No repetir conceptos que ya existen en las 9.201 preguntas actuales.
8. **VARIEDAD**: No hacer 20 preguntas con la misma estructura cambiando una palabra.

═══════════════════════════════════════════════════
EMPIEZA
═══════════════════════════════════════════════════

1. Dame las 3 mejoras de código (breve)
2. Dame los criterios de limpieza con ejemplos
3. Empieza con el BLOQUE 1 (Yo Nunca: Infancia + Primaria — 200 preguntas)

Si te quedas sin espacio, termina con exactamente:
"Bloque X completado. Pídeme el bloque X+1 en el siguiente mensaje."

---

## Cómo usarlo

1. **Mensaje 1**: Pega todo lo de arriba → Claude dará código + criterios + Bloque 1
2. **Mensaje 2**: "Dame el Bloque 2 (Yo Nunca: Instituto/ESO — 200)"
3. **Mensaje 3**: "Dame el Bloque 3 (Yo Nunca: Universidad/Erasmus — 200)"
4. **Mensaje 4**: "Dame el Bloque 4 (Yo Nunca: Curro/Adultos — 200)"
5. **Mensaje 5**: "Dame el Bloque 5 (Yo Nunca: Fiesta/Salseo — 200)"
6. **Mensaje 6**: "Dame el Bloque 6 (Picante +18 — 200)"
7. **Mensaje 7**: "Dame el Bloque 7 (Votación + Verdad o Bebe — 400)"
8. **Mensaje 8**: "Dame el Bloque 8 (Retos + Cadenas + Categorías — 450)"
9. **Mensaje 9**: "Dame el Bloque 9 (EnLaCama + Pacovers + Normas — 300)"
10. **Mensaje 10**: "Dame el Bloque 10 (Mímica + Salseo + Duelos + Impostor — 210)"

**Total nuevo: ~2.660 items de contenido fresco** 🚀
