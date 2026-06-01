function h(){return typeof window<"u"&&localStorage.getItem("fiesta_gemini_active_model")||"gemini-1.5-flash"}function v(){return{VITE_GEMINI_API_KEY:"AIzaSyBBf2ttcyeMR27Sq22n_NtIyHBufs3tzmE",BASE_URL:"./",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_GEMINI_API_KEY}function q(){const o=v();return typeof o=="string"&&o.trim().length>0&&!o.includes("placeholder")}function m(){return localStorage.getItem("fiesta_party_theme")||""}async function i(o,e){var r,t,c,p,b;const s=v(),a=e||h(),n=`https://generativelanguage.googleapis.com/v1beta/models/${a}:generateContent?key=${s}`;try{const l=await fetch(n,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:o}]}],generationConfig:{responseMimeType:"application/json"}})});if(!l.ok){const E=await l.text();if(console.error(`Gemini Client: API error (${l.status}) for model ${a}:`,E),l.status===404&&!e){const j=["gemini-1.5-flash-latest","gemini-2.5-flash","gemini-2.0-flash","gemini-1.5-flash"];for(const u of j){if(u===a)continue;console.log(`Gemini Client: Attempting fallback to model "${u}"...`);const y=await i(o,u);if(y)return console.log(`Gemini Client: Fallback model "${u}" was successful! Saving to cache.`),typeof window<"u"&&localStorage.setItem("fiesta_gemini_active_model",u),y}}return null}const g=await l.json(),f=(b=(p=(c=(t=(r=g==null?void 0:g.candidates)==null?void 0:r[0])==null?void 0:t.content)==null?void 0:c.parts)==null?void 0:p[0])==null?void 0:b.text;if(!f)return console.warn("Gemini Client: Empty response"),null;let d=f.trim();return d.startsWith("```json")?d=d.replace(/^```json/,"").replace(/```$/,"").trim():d.startsWith("```")&&(d=d.replace(/^```/,"").replace(/```$/,"").trim()),JSON.parse(d)}catch(l){return console.error("Gemini Client: Execution error:",l),null}}async function N(o,e){const s=m(),a=s?`
- El grupo ha establecido que la fiesta de hoy tiene este tema especial: "${s}". ES OBLIGATORIO que el reto esté fuertemente inspirado en este tema, haciendo chistes, referencias, o dinámicas relacionadas.`:"",n=`
Eres el motor de IA de un juego de fiesta interactivo y atrevido llamado BEEP.
Genera un reto de fiesta divertido, picante y personalizado para los siguientes jugadores activos: ${e.join(", ")}.${a}
Aquí tienes el historial reciente de eventos del juego para darte contexto y poder crear rivalidades o piques divertidos:
${JSON.stringify(o.slice(-15))}

Instrucciones de generación:
- Crea una carta con un reto único. Puede ser del tipo "Yo nunca", "Reto individual", "Verdad", "Duelo 1v1", "Castigo" o del tipo "🛌 Cosas que puedes decir en la cama y...".
- Ocasionalmente, puedes generar una carta del tipo "🛌 En la cama y..." siguiendo un patrón de comparación de doble sentido: "Cosas que puedes decir en la cama y... [en otro lugar/situación]. Por turnos, cada jugador dice una frase de doble sentido que sirva para ambos contextos. Quien repita o falle, bebe X tragos. (Ej: '¡Está muy caliente!', '¡Cabe otro!')".
- Sé muy divertido, sarcástico, irónico y ligeramente atrevido (apto para mayores de 18 años jugando de fiesta en un bar o casa).
- IMPORTANTE: Involucra obligatoriamente a uno o varios de los jugadores activos (${e.join(", ")}) llamándolos por sus nombres reales en el texto del reto (ej: "Rafa tiene que..." o "España y Asdased compiten..."). NO utilices marcadores genéricos como '{player}' o '{player1}'. Usa sus nombres reales de la lista proporcionada.
- IMPORTANTE: La salida debe ser un objeto JSON válido con la propiedad "card".
- El texto de la carta debe estar en español y redactado con un tono dinámico y juvenil.

Formato JSON esperado:
{
  "card": "El texto del reto personalizado en español"
}
No devuelvas nada más que el objeto JSON.
`,r=await i(n);return(r==null?void 0:r.card)||null}async function S(o,e,s,a){const n=m(),r=n?`
- Tema especial de la fiesta de hoy: "${n}". Intenta reescribir el reto para integrar sutilmente este tema o palabras clave de forma hilarante.`:"",t=`
Eres el motor de IA del juego de fiesta BEEP. Tu misión es añadir salseo, ironía y dinamismo a un reto existente utilizando la memoria real y nombres de los jugadores del grupo.
Reto original: "${o}"
El jugador que tiene el turno actual (el protagonista del reto) es: "${a}".
Todos los jugadores del grupo son: ${s.join(", ")}
Estadísticas de los jugadores (¡úsalas de forma sarcástica para picarlos, retarlos o justificar el reto!):
${e}${r}

Instrucciones:
- Reescribe el reto original de forma ingeniosa para integrar sus nombres y estadísticas de forma orgánica.
- El reto DEBE ir dirigido principalmente a "${a}" o tenerle como protagonista del turno.
- DEBES involucrar a otros jugadores del grupo (como ${s.filter(p=>p!==a).join(", ")||"alguien del grupo"}) por sus nombres reales en la reescritura del reto para crear preguntas graciosas, retos de complicidad, piques o duelos de beber.
- IMPORTANTE: Si el reto original contiene el emoji "🛌" o menciona "En la cama y..." o "Cosas que puedes decir en la cama y...", la reescritura DEBE seguir el formato de una ronda por turnos de doble sentido: "Cosas que puedes decir en la cama y... [en otro lugar/situación]. Por turnos, cada jugador dice una frase que sirva en ambos contextos. El primero que repita o falle, bebe X tragos". Además, incluye al final de la carta 2 ejemplos extremadamente graciosos, pícaros y con doble sentido para inspirar a los jugadores (ej: "(Ej: '¡Está saliendo líquido!', '¡Qué estrecho está esto!')").
- Haz chistes o pullas divertidas sobre quién va ganando, quién lleva más tragos 🍻, o quién no da pie con bola.
- Mantén la esencia del reto original (si es un duelo, que siga siendo un duelo; si es beber, que siga siendo beber) pero haz que parezca personalizado en vivo por un presentador de televisión gamberro.
- Si el reto original requiere beber tragos, puedes adaptarlos un poco según las estadísticas (ej. "${a} que lleva 0 tragos bebe el doble para compensar").
- La salida debe ser un objeto JSON válido con la propiedad "enriched".
- Escribe en español.

Formato JSON esperado:
{
  "enriched": "El texto del reto reescrito con salseo en español"
}
No devuelvas nada más que el objeto JSON.
`,c=await i(t);return(c==null?void 0:c.enriched)||null}async function O(o,e,s,a){const n=`
Eres el narrador estrella y maestro de ceremonias teatral del juego de fiesta BEEP.
Se va a disputar un duelo decisivo de torneo 1v1 entre ${o} y ${e}.
El reto del duelo es: "${s}"
Historial de eventos recientes de la partida para dar contexto:
${JSON.stringify(a)}

Instrucciones:
- Escribe una presentación súper emocionante, divertida, dramática e irónica.
- Emplea un tono de presentador de boxeo de Las Vegas o de un espectáculo gamberro.
- Pica a ambos jugadores de forma amistosa resaltando piques del historial de eventos.
- El texto debe ser corto (máximo 2 frases) pero con muchísima energía y "hype".
- La salida debe ser un objeto JSON válido con la propiedad "announcement".
- Escribe en español.

Formato JSON esperado:
{
  "announcement": "El espectacular anuncio del duelo en español"
}
No devuelvas nada más que el objeto JSON.
`,r=await i(n);return(r==null?void 0:r.announcement)||null}async function $(o,e,s,a){const n=`
Eres el analista oficial y comentarista irónico de la barra del bar en el juego de fiesta BEEP.
Ha terminado la ronda número ${e} de la partida.
Jugadores activos: ${o.join(", ")}
Eventos que han ocurrido en esta ronda:
${JSON.stringify(s)}
Resumen de estadísticas de toda la partida:
${JSON.stringify(a)}

Instrucciones:
- Escribe un comentario humorístico, irónico y muy divertido resumiendo lo que ha pasado en esta ronda y cómo va la partida en general.
- Señala con gracia quién es el rey de la bebida (lleva más tragos 🍻), quién es un campeón invicto, quién está fallando todos sus retos, o algún pique interesante surgido.
- Utiliza emojis y mantén un estilo cercano, ingenioso y de bar de copas. Máximo 2-3 frases.
- La salida debe ser un objeto JSON válido con la propiedad "comment".
- Escribe en español.

Formato JSON esperado:
{
  "comment": "Tu comentario sarcástico y divertido sobre la ronda en español"
}
No devuelvas nada más que el objeto JSON.
`,r=await i(n);return(r==null?void 0:r.comment)||null}async function I(o,e){const s=m(),n=`
Eres el cronista del corazón y reportero más cotilla del juego de fiesta BEEP.
Ha terminado la partida. Aquí tienes los resultados finales, XP y estadísticas globales de los jugadores:${s?`
- El tema de la noche era: "${s}".`:""}
- Jugadores y su XP final:
${o.map(t=>`- ${t.name}: ${t.score} XP`).join(`
`)}
- Tragos totales acumulados:
${JSON.stringify((e==null?void 0:e.drinkCounts)||{})}
- Votos recibidos en dinámicas de grupo:
${JSON.stringify((e==null?void 0:e.voteCounts)||{})}
- Veces que pasaron/hicieron skip:
${JSON.stringify((e==null?void 0:e.skipCounts)||{})}
- Virus totales recibidos:
${JSON.stringify((e==null?void 0:e.virusReceived)||{})}

Instrucciones:
- Redacta una crónica de la partida súper divertida, irónica, gamberra y muy picante.
- Asigna un "Rol o Título de Fiesta" ingenioso a cada jugador según sus estadísticas (ej. "Rafa: Hígado de Adamantio por sus 15 tragos", "Ana: La Cobardica Mayor por pasar de 3 retos").
- Describe con humor la transcurso del juego y los piques.
- Estructura el texto en párrafos cortos, desenfadados y con emojis festivos. Máximo 150 palabras.
- IMPORTANTE: Devuelve un objeto JSON válido con la propiedad "chronicle".
- Escribe en español.

Formato JSON esperado:
{
  "chronicle": "El texto humorístico completo de la crónica en español"
}
No devuelvas nada más que el objeto JSON.
`,r=await i(n);return(r==null?void 0:r.chronicle)||null}async function P(o,e){const s=`
Eres el "Juez de la Barra", un árbitro de bar de copas legendario, sabio, sarcástico y sumamente divertido.
Varios amigos jugando al juego de fiesta BEEP tienen una disputa acalorada y requieren que dictes sentencia.
Jugadores involucrados: ${o.join(", ")}
Descripción de la disputa: "${e}"

Instrucciones:
- Analiza la disputa con mucha ironía y humor.
- Dicta una sentencia firme y graciosa de quién tiene la razón y quién tiene que ser castigado o beber.
- Sé contundente, no te andes con rodeos. Sé canalla pero amigable. Máximo 2-3 frases.
- IMPORTANTE: Devuelve un objeto JSON válido con la propiedad "ruling".
- Escribe en español.

Formato JSON esperado:
{
  "ruling": "Tu divertida y firme sentencia arbitral en español"
}
No devuelvas nada más que el objeto JSON.
`,a=await i(s);return(a==null?void 0:a.ruling)||null}async function A(o,e){const s=m(),a=s?` El castigo debe estar inspirado en el tema especial de la fiesta: "${s}".`:"",n=`
Eres el motor de tortura divertida y gamberra del juego de fiesta BEEP.
El jugador "${o}" ha decidido no beber tragos y en su lugar quiere someterse a la Ruleta de Castigos de la IA.
Estadísticas del jugador: ${e}.${a}

Instrucciones:
- Genera un castigo único, atrevido, físico o social, que tenga que realizar el jugador en vivo frente al grupo.
- Ejemplos: Hacer una llamada a alguien y decirle algo loco, dejar que otro jugador le envíe un mensaje en WhatsApp, actuar de forma graciosa durante un turno, etc.
- El castigo debe ser realizable, seguro pero muy divertido y ligeramente vergonzoso para generar risas en el grupo.
- Mantén el texto corto (máximo 1-2 frases).
- IMPORTANTE: Devuelve un objeto JSON válido con la propiedad "punishment".
- Escribe en español.

Formato JSON esperado:
{
  "punishment": "La descripción del castigo a realizar en español"
}
No devuelvas nada más que el objeto JSON.
`,r=await i(n);return(r==null?void 0:r.punishment)||null}async function J(){const o=m(),s=`
Eres el motor de IA del juego de fiesta BEEP. Tu misión es generar una ronda del juego del "Impostor".
En este juego, la mayoría de los jugadores recibe la palabra real ("word"), mientras que el Impostor recibe la palabra falsa ("fakeWord") o una pista ligeramente descolorida. También hay un tema general o categoría ("category") y una pista general común ("hint").

Genera una ronda súper divertida, picante o ingeniosa.${o?`
- Tema especial de la fiesta de hoy: "${o}". ES OBLIGATORIO que los términos generados encajen de forma divertidísima con este tema.`:""}

Instrucciones:
- "category": El tema general o categoría (ej. "Comida rápida", "Posturas de yoga", "Cosas de resaca").
- "word": La palabra real que el grupo recibirá (ej. "Hamburguesa").
- "fakeWord": La palabra falsa que el impostor recibirá (debe ser muy parecida o del mismo tipo para que pueda disimular, pero distinta, ej. "Kebab").
- "hint": Una pista general que se lee en voz alta para toda la mesa (ej. "Se come con las manos y da sed").
- IMPORTANTE: Devuelve un objeto JSON válido con las cuatro propiedades indicadas.
- Escribe en español.

Formato JSON esperado:
{
  "category": "La categoría",
  "word": "La palabra real",
  "fakeWord": "La palabra falsa",
  "hint": "La pista general"
}
No devuelvas nada más que el objeto JSON.
`,a=await i(s);return a&&a.category&&a.word&&a.fakeWord&&a.hint?a:null}async function x(o,e){const s=`
Eres el "AI Party Coach", un entrenador de fiesta legendario, sarcástico, exagerado y sumamente divertido.
Analiza el perfil histórico del jugador "${o}" a partir de sus estadísticas acumuladas de juego y redacta un informe/diagnóstico hilarante sobre su personalidad fiestera:
Estadísticas históricas:
- Nivel de jugador: ${e.level}
- XP total: ${e.xp}
- Partidas totales jugadas: ${e.gamesPlayed}
- Partidas ganadas: ${e.gamesWon}
- Victorias en Megamix: ${e.megamixWins}
- Victorias en Clásico: ${e.clasicoWins}
- Victorias en Picante: ${e.picanteWins}
- Fichas ganadas en Poker: ${e.pokerChips}
- Victorias en Parchís: ${e.parchisWins}

Instrucciones:
- Crea un informe/diagnóstico canalla, sarcástico y muy divertido sobre su estilo de juego.
- Invierte mucha personalidad: ponle un mote descabellado y divertido (ej. "Rafa 'El Hígado de Acero'", "Carlos 'El Amagador Silencioso'").
- Haz chistes sobre si juega mucho pero no gana nada, si solo juega al póker de farol, o si es un crack en los retos atrevidos pero le teme a la mímica.
- Dale un "Consejo Científico de Fiesta" hilarante y absurdo al final (ej. "Consejo: Bebe más agua para diluir la vergüenza del próximo Yo Nunca").
- Estructura el texto con emojis de fiesta y párrafos muy ágiles. Máximo 100-120 palabras.
- IMPORTANTE: Devuelve un objeto JSON válido con la propiedad "coachAnalysis".
- Escribe en español.

Formato JSON esperado:
{
  "coachAnalysis": "El texto del diagnóstico en español con formato Markdown y emojis"
}
No devuelvas nada más que el objeto JSON.
`,a=await i(s);return(a==null?void 0:a.coachAnalysis)||null}async function T(o){const e=`
Eres el motor de IA del juego de fiesta BEEP.
Aquí tienes una lista de confesiones y secretos anónimos introducidos por los propios jugadores en el lobby:
${JSON.stringify(o)}

Tu misión es crear preguntas de opción múltiple divertidísimas (tipo trivia/quiz de chismes) para adivinar de quién es cada confesión.
Instrucciones:
- Para cada secreto/confesión relevante, crea una pregunta graciosa y salseante.
- Ejemplo: "Alguien de este grupo confesó: 'Una vez me detuvieron por hacer ruido en el parque'. ¿Quién de estos sospechosos cometió tal atrocidad?"
- Genera 4 opciones de respuesta ("options"), que deben ser nombres reales de los jugadores participantes (¡saca los nombres de la lista de confesiones!).
- Indica la respuesta correcta ("correct_answer") que debe ser exactamente el nombre del jugador que confesó ese secreto.
- Indica el índice de la respuesta correcta en la lista de opciones ("correctIndex", 0-indexed).
- Asigna una dificultad de 2 a 4.
- Agrega una pista divertida ("hint") si es posible.
- IMPORTANTE: Devuelve un array JSON válido de objetos pregunta. Cada objeto debe tener la estructura indicada abajo.
- Escribe en español.

Formato JSON esperado:
[
  {
    "question": "¿Quién de los presentes confesó: '...'?",
    "options": ["Nombre1", "Nombre2", "Nombre3", "Nombre4"],
    "correctIndex": 1,
    "hint": "Una pista graciosa...",
    "difficulty": 3,
    "category": "Quiz de Chismes 🤫"
  }
]
No devuelvas nada más que el array JSON.
`;return await i(e)||null}export{S as geminiEnrichChallenge,N as geminiGenerateCard,A as geminiGenerateCustomPunishment,J as geminiGenerateImpostorRound,I as geminiGeneratePartyChronicle,x as geminiGenerateProfileCoach,$ as geminiGenerateRoundAnalysis,T as geminiGenerateSecretsTrivia,O as geminiGenerateTorneoAnnouncement,P as geminiResolveDispute,v as getGeminiApiKey,m as getPartyTheme,q as isGeminiConfigured};
