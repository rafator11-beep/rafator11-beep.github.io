const v="gemini-1.5-flash";function g(){return{VITE_SUPABASE_URL:"https://atswsltnjjsokouvfbut.supabase.co",VITE_SUPABASE_ANON_KEY:"sb_publishable_7uCsMmM6xhL7O9psmckrQw_Y4hjYk10",VITE_GEMINI_API_KEY:"AIzaSyBBf2ttcyeMR27Sq22n_NtIyHBufs3tzmE",BASE_URL:"./",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_GEMINI_API_KEY}function y(){const o=g();return typeof o=="string"&&o.trim().length>0&&!o.includes("placeholder")}function c(){return localStorage.getItem("fiesta_party_theme")||""}async function i(o){var a,n,s,t,p;const e=g(),r=`https://generativelanguage.googleapis.com/v1beta/models/${v}:generateContent?key=${e}`;try{const l=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:o}]}],generationConfig:{responseMimeType:"application/json"}})});if(!l.ok){const b=await l.text();return console.error(`Gemini Client: API error (${l.status}):`,b),null}const u=await l.json(),m=(p=(t=(s=(n=(a=u==null?void 0:u.candidates)==null?void 0:a[0])==null?void 0:n.content)==null?void 0:s.parts)==null?void 0:t[0])==null?void 0:p.text;if(!m)return console.warn("Gemini Client: Empty response"),null;let d=m.trim();return d.startsWith("```json")?d=d.replace(/^```json/,"").replace(/```$/,"").trim():d.startsWith("```")&&(d=d.replace(/^```/,"").replace(/```$/,"").trim()),JSON.parse(d)}catch(l){return console.error("Gemini Client: Execution error:",l),null}}async function f(o,e){const r=c(),a=r?`
- El grupo ha establecido que la fiesta de hoy tiene este tema especial: "${r}". ES OBLIGATORIO que el reto esté fuertemente inspirado en este tema, haciendo chistes, referencias, o dinámicas relacionadas.`:"",n=`
Eres el motor de IA de un juego de fiesta interactivo y atrevido llamado BEEP.
Genera un reto de fiesta divertido, picante y personalizado para los siguientes jugadores activos: ${e.join(", ")}.${a}
Aquí tienes el historial reciente de eventos del juego para darte contexto y poder crear rivalidades o piques divertidos:
${JSON.stringify(o.slice(-15))}

Instrucciones de generación:
- Crea una carta con un reto único. Puede ser del tipo "Yo nunca", "Reto individual", "Verdad", "Duelo 1v1", "Castigo" o del tipo "🛌 Cosas que puedes decir en la cama y...".
- Ocasionalmente, puedes generar una carta del tipo "🛌 En la cama y..." siguiendo un patrón de comparación de doble sentido: "Cosas que puedes decir en la cama y... [en otro lugar/situación]. Por turnos, cada jugador dice una frase de doble sentido que sirva para ambos contextos. Quien repita o falle, bebe X tragos. (Ej: '¡Está muy caliente!', '¡Cabe otro!')".
- Sé muy divertido, sarcástico, irónico y ligeramente atrevido (apto para mayores de 18 años jugando de fiesta en un bar o casa).
- Involucra a los jugadores activos y haz referencia a su historial de eventos si es gracioso (ej. si alguien lleva muchos tragos, se niega a confesar, o va invicto).
- IMPORTANTE: La salida debe ser un objeto JSON válido con la propiedad "card".
- El texto de la carta debe estar en español y redactado con un tono dinámico y juvenil.

Formato JSON esperado:
{
  "card": "El texto del reto personalizado en español"
}
No devuelvas nada más que el objeto JSON.
`,s=await i(n);return(s==null?void 0:s.card)||null}async function E(o,e,r){const a=c(),n=a?`
- Tema especial de la fiesta de hoy: "${a}". Intenta reescribir el reto para integrar sutilmente este tema o palabras clave de forma hilarante.`:"",s=`
Eres el motor de IA del juego de fiesta BEEP. Tu misión es añadir salseo, ironía y dinamismo a un reto existente utilizando la memoria real de los jugadores involucrados.
Reto original: "${o}"
Jugadores implicados en este reto: ${r.join(", ")}
Estadísticas de estos jugadores (¡úsalas de forma sarcástica para picarlos o justificar el reto!):
${e}${n}

Instrucciones:
- Reescribe el reto original de forma ingeniosa para integrar sus estadísticas de forma orgánica.
- IMPORTANTE: Si el reto original contiene el emoji "🛌" o menciona "En la cama y..." o "Cosas que puedes decir en la cama y...", la reescritura DEBE seguir el formato de una ronda por turnos de doble sentido: "Cosas que puedes decir en la cama y... [en otro lugar/situación]. Por turnos, cada jugador dice una frase que sirva en ambos contextos. El primero que repita o falle, bebe X tragos". Además, incluye al final de la carta 2 ejemplos extremadamente graciosos, pícaros y con doble sentido para inspirar a los jugadores (ej: "(Ej: '¡Está saliendo líquido!', '¡Qué estrecho está esto!')").
- Haz chistes o pullas divertidas sobre quién va ganando, quién lleva más tragos 🍻, o quién no da pie con bola.
- Mantén la esencia del reto original (si es un duelo, que siga siendo un duelo; si es beber, que siga siendo beber) pero haz que parezca personalizado en vivo por un presentador de televisión gamberro.
- Si el reto original requiere beber tragos, puedes adaptarlos un poco según las estadísticas (ej. "Rafa que lleva 0 tragos bebe el doble para compensar").
- La salida debe ser un objeto JSON válido con la propiedad "enriched".
- Escribe en español.

Formato JSON esperado:
{
  "enriched": "El texto del reto reescrito con salseo en español"
}
No devuelvas nada más que el objeto JSON.
`,t=await i(s);return(t==null?void 0:t.enriched)||null}async function j(o,e,r,a){const n=`
Eres el narrador estrella y maestro de ceremonias teatral del juego de fiesta BEEP.
Se va a disputar un duelo decisivo de torneo 1v1 entre ${o} y ${e}.
El reto del duelo es: "${r}"
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
`,s=await i(n);return(s==null?void 0:s.announcement)||null}async function h(o,e,r,a){const n=`
Eres el analista oficial y comentarista irónico de la barra del bar en el juego de fiesta BEEP.
Ha terminado la ronda número ${e} de la partida.
Jugadores activos: ${o.join(", ")}
Eventos que han ocurrido en esta ronda:
${JSON.stringify(r)}
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
`,s=await i(n);return(s==null?void 0:s.comment)||null}async function N(o,e){const r=c(),n=`
Eres el cronista del corazón y reportero más cotilla del juego de fiesta BEEP.
Ha terminado la partida. Aquí tienes los resultados finales, XP y estadísticas globales de los jugadores:${r?`
- El tema de la noche era: "${r}".`:""}
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
`,s=await i(n);return(s==null?void 0:s.chronicle)||null}async function S(o,e){const r=`
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
`,a=await i(r);return(a==null?void 0:a.ruling)||null}async function q(o,e){const r=c(),a=r?` El castigo debe estar inspirado en el tema especial de la fiesta: "${r}".`:"",n=`
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
`,s=await i(n);return(s==null?void 0:s.punishment)||null}async function O(){const o=c(),r=`
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
`,a=await i(r);return a&&a.category&&a.word&&a.fakeWord&&a.hint?a:null}async function I(o,e){const r=`
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
`,a=await i(r);return(a==null?void 0:a.coachAnalysis)||null}async function P(o){const e=`
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
`;return await i(e)||null}export{E as geminiEnrichChallenge,f as geminiGenerateCard,q as geminiGenerateCustomPunishment,O as geminiGenerateImpostorRound,N as geminiGeneratePartyChronicle,I as geminiGenerateProfileCoach,h as geminiGenerateRoundAnalysis,P as geminiGenerateSecretsTrivia,j as geminiGenerateTorneoAnnouncement,S as geminiResolveDispute,g as getGeminiApiKey,c as getPartyTheme,y as isGeminiConfigured};
