function j(){return typeof window<"u"&&localStorage.getItem("fiesta_gemini_active_model")||"gemini-1.5-flash"}function v(){return{VITE_GEMINI_API_KEY:"AIzaSyBBf2ttcyeMR27Sq22n_NtIyHBufs3tzmE",BASE_URL:"./",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_GEMINI_API_KEY}function S(){const o=v();return typeof o=="string"&&o.trim().length>0&&!o.includes("placeholder")}function m(){return localStorage.getItem("fiesta_party_theme")||""}async function t(o,e){var s,i,p,c,g;const n=v(),a=e||j(),r=`https://generativelanguage.googleapis.com/v1beta/models/${a}:generateContent?key=${n}`;try{const l=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:o}]}],generationConfig:{responseMimeType:"application/json"}})});if(!l.ok){const h=await l.text();if(console.error(`Gemini Client: API error (${l.status}) for model ${a}:`,h),l.status===404&&!e){const E=["gemini-1.5-flash-latest","gemini-2.5-flash","gemini-2.0-flash","gemini-1.5-flash"];for(const u of E){if(u===a)continue;console.log(`Gemini Client: Attempting fallback to model "${u}"...`);const y=await t(o,u);if(y)return console.log(`Gemini Client: Fallback model "${u}" was successful! Saving to cache.`),typeof window<"u"&&localStorage.setItem("fiesta_gemini_active_model",u),y}}return null}const f=await l.json(),b=(g=(c=(p=(i=(s=f==null?void 0:f.candidates)==null?void 0:s[0])==null?void 0:i.content)==null?void 0:p.parts)==null?void 0:c[0])==null?void 0:g.text;if(!b)return console.warn("Gemini Client: Empty response"),null;let d=b.trim();return d.startsWith("```json")?d=d.replace(/^```json/,"").replace(/```$/,"").trim():d.startsWith("```")&&(d=d.replace(/^```/,"").replace(/```$/,"").trim()),JSON.parse(d)}catch(l){return console.error("Gemini Client: Execution error:",l),null}}async function N(o,e){const n=m(),a=n?`
- El grupo ha establecido que la fiesta de hoy tiene este tema especial: "${n}". ES OBLIGATORIO que el reto esté fuertemente inspirado en este tema, haciendo chistes, referencias, o dinámicas relacionadas.`:"",r=`Referencias y tendencias actuales (2025) que puedes usar para hacer los retos más frescos y virales:
- Series/pelis: La Casa de Papel (nueva temporada), Stranger Things final, Squid Game S2, La Mesías, Sé quién eres, Un lugar tranquilo
- Música: Bad Bunny, Karol G, Bizarrap sessions, Quevedo, Aitana, C. Tangana, Rosalía virales, reggaeton nuevo
- Memes/viral: "Sí señor", "Bro realmente pensó", "Que me quiten lo bailao", el baile de Saltburn, trends TikTok España 2025
- Tecnología: ChatGPT en la vida diaria, deepfakes, vídeollamadas de trabajo, influencers, OnlyFans cultura
- Deportes: Eurovisión España, Rafa Nadal retirada, Real Madrid, Barça, La Roja, nuevo escándalo fútbol
- Cultura pop española: Operación Triunfo, programas de TV, memes de Twitter/X España`,s=`
Eres el motor de IA de un juego de fiesta interactivo y atrevido llamado BEEP. Año: 2025.
Genera un reto de fiesta divertido, picante y personalizado para los siguientes jugadores activos: ${e.join(", ")}.${a}

Historial reciente de la partida (úsalo para crear piques y rivalidades entre jugadores):
${JSON.stringify(o.slice(-15))}

${r}

Instrucciones:
- Crea una carta con un reto único. Puede ser: "Yo nunca", "Reto individual", "Verdad", "Duelo 1v1", "Castigo" o "🛌 En la cama y...".
- OBLIGATORIO: usa referencias de tendencias 2025 de la lista de arriba para hacer el reto más actual y gracioso.
- Ocasionalmente genera "🛌 En la cama y..." con doble sentido por turnos (Ej: '¡Está muy caliente!', '¡Cabe otro!').
- Sé muy divertido, sarcástico, irónico y atrevido (mayores de 18, fiesta en bar o casa).
- OBLIGATORIO: menciona a uno o varios jugadores por su nombre real (${e.join(", ")}). NUNCA uses '{player}'.
- La salida es un JSON con la propiedad "card". Solo JSON, nada más.

{"card": "texto del reto en español"}
`,i=await t(s);return(i==null?void 0:i.card)||null}async function O(o,e,n,a){const r=m(),s=r?`
- Tema especial de la fiesta de hoy: "${r}". Intenta reescribir el reto para integrar sutilmente este tema o palabras clave de forma hilarante.`:"",i='Tendencias 2025 que puedes citar para hacer el salseo más viral: Bad Bunny, Karol G, Bizarrap, La Mesías, Squid Game S2, memes TikTok España, ChatGPT en el trabajo, Saltburn baile, Rafa Nadal retirada, Eurovisión, operación triunfo, "Bro realmente pensó", streamers españoles.',p=`
Eres el motor de salseo del juego de fiesta BEEP (2025). Añades ironía, dinamismo y referencias actuales a los retos usando los nombres y stats de los jugadores.
Reto original: "${o}"
Protagonista del turno: "${a}"
Jugadores: ${n.join(", ")}
Stats (úsalos de forma sarcástica): ${e}${s}
${i}

Instrucciones:
- Reescribe el reto integrando nombres, stats y alguna referencia de tendencia 2025 de forma natural y graciosa.
- El protagonista es "${a}". Involucra a ${n.filter(g=>g!==a).join(", ")||"los demás"} por nombre.
- Si hay "🛌" o "En la cama y...", mantén el formato de ronda de doble sentido con 2 ejemplos pícaros al final.
- Pulla divertida sobre quién lleva más tragos 🍻 o quién está fallando.
- Mantén la esencia del reto (duelo→duelo, beber→beber).
- Solo JSON: {"enriched": "texto reescrito en español"}
`,c=await t(p);return(c==null?void 0:c.enriched)||null}async function $(o,e,n,a){const r=`
Eres el narrador estrella y maestro de ceremonias teatral del juego de fiesta BEEP.
Se va a disputar un duelo decisivo de torneo 1v1 entre ${o} y ${e}.
El reto del duelo es: "${n}"
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
`,s=await t(r);return(s==null?void 0:s.announcement)||null}async function q(o,e,n,a){const r=`
Eres el analista oficial y comentarista irónico de la barra del bar en el juego de fiesta BEEP.
Ha terminado la ronda número ${e} de la partida.
Jugadores activos: ${o.join(", ")}
Eventos que han ocurrido en esta ronda:
${JSON.stringify(n)}
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
`,s=await t(r);return(s==null?void 0:s.comment)||null}async function I(o,e){const n=m(),r=`
Eres el cronista del corazón y reportero más cotilla del juego de fiesta BEEP.
Ha terminado la partida. Aquí tienes los resultados finales, XP y estadísticas globales de los jugadores:${n?`
- El tema de la noche era: "${n}".`:""}
- Jugadores y su XP final:
${o.map(i=>`- ${i.name}: ${i.score} XP`).join(`
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
`,s=await t(r);return(s==null?void 0:s.chronicle)||null}async function P(o,e){const n=`
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
`,a=await t(n);return(a==null?void 0:a.ruling)||null}async function T(o,e){const n=m(),a=n?` El castigo debe estar inspirado en el tema especial de la fiesta: "${n}".`:"",r=`
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
`,s=await t(r);return(s==null?void 0:s.punishment)||null}async function A(){const o=m(),n=`
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
`,a=await t(n);return a&&a.category&&a.word&&a.fakeWord&&a.hint?a:null}async function J(o,e){const n=`
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
`,a=await t(n);return(a==null?void 0:a.coachAnalysis)||null}async function C(o){const e=`
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
`;return await t(e)||null}export{O as geminiEnrichChallenge,N as geminiGenerateCard,T as geminiGenerateCustomPunishment,A as geminiGenerateImpostorRound,I as geminiGeneratePartyChronicle,J as geminiGenerateProfileCoach,q as geminiGenerateRoundAnalysis,C as geminiGenerateSecretsTrivia,$ as geminiGenerateTorneoAnnouncement,P as geminiResolveDispute,v as getGeminiApiKey,m as getPartyTheme,S as isGeminiConfigured};
