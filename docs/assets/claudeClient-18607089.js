const p="claude-haiku-4-5-20251001",E="https://api.anthropic.com/v1/messages";function u(){return{BASE_URL:"./",MODE:"production",DEV:!1,PROD:!0,SSR:!1}.VITE_ANTHROPIC_API_KEY||localStorage.getItem("fiesta_claude_key")||""}function m(){const n=u();return typeof n=="string"&&n.trim().length>0&&!n.includes("placeholder")}function c(){return localStorage.getItem("fiesta_party_theme")||""}async function i(n,o){var t,r;if(!m())return console.warn("Claude Client: No API Key configured"),null;try{const e=await fetch(E,{method:"POST",headers:{"content-type":"application/json","x-api-key":u(),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:p,max_tokens:512,system:n,messages:[{role:"user",content:o}]})});if(!e.ok)return console.error(`Claude Client: API error (${e.status})`),null;const a=await e.json(),s=(((r=(t=a==null?void 0:a.content)==null?void 0:t[0])==null?void 0:r.text)??"").trim().replace(/^```json/,"").replace(/^```/,"").replace(/```$/,"").trim();return JSON.parse(s)}catch(e){return console.error("Claude Client error:",e),null}}const g=m;async function f(n,o){const t=c(),r=t?`
Tema especial de la fiesta: "${t}". El reto DEBE inspirarse en este tema.`:"",e="Eres el motor de IA del juego de fiesta BEEP. Generas retos de fiesta divertidos y atrevidos para mayores de 18 años. Respondes ÚNICAMENTE con JSON válido.",a=`Jugadores: ${o.join(", ")}.${r}
Historial reciente: ${JSON.stringify(n.slice(-15))}

Genera un reto único de fiesta (Yo nunca, Reto individual, Verdad, Duelo 1v1, Castigo o En la cama y...). Involucra a los jugadores por su nombre. Tono: irónico, divertido, ligeramente atrevido.

Responde SOLO con: {"card": "texto del reto en español"}`,s=await i(e,a);return(s==null?void 0:s.card)||null}async function y(n,o,t,r){const e=c(),a=e?`
Tema especial: "${e}". Intégralo sutilmente.`:"",s="Eres el motor de salseo del juego de fiesta BEEP. Reescribes retos añadiendo ironía y referencias a los jugadores. Respondes ÚNICAMENTE con JSON válido.",d=`Reto original: "${n}"
Jugador protagonista: "${r}"
Todos los jugadores: ${t.join(", ")}
Estadísticas: ${o}${a}

Reescribe el reto integrando nombres y estadísticas de forma gamberra. Si contiene "🛌" o "En la cama y...", mantén el formato de ronda de doble sentido con 2 ejemplos graciosos.

Responde SOLO con: {"enriched": "texto reescrito en español"}`,l=await i(s,d);return(l==null?void 0:l.enriched)||null}async function N(n,o,t,r){const e="Eres el narrador dramático del juego de fiesta BEEP, estilo presentador de boxeo gamberro. Respondes ÚNICAMENTE con JSON válido.",a=`Duelo: ${n} vs ${o}
Reto: "${t}"
Historial: ${JSON.stringify(r)}

Escribe una presentación emocionante y divertida (máx. 2 frases) con mucho hype y piques amistosos.

Responde SOLO con: {"announcement": "texto en español"}`,s=await i(e,a);return(s==null?void 0:s.announcement)||null}async function h(n,o,t,r){const e="Eres el comentarista irónico de bar del juego de fiesta BEEP. Respondes ÚNICAMENTE con JSON válido.",a=`Ronda ${o} terminada. Jugadores: ${n.join(", ")}
Eventos: ${JSON.stringify(t)}
Stats: ${JSON.stringify(r)}

Escribe un comentario humorístico de 2-3 frases sobre la ronda con emojis.

Responde SOLO con: {"comment": "texto en español"}`,s=await i(e,a);return(s==null?void 0:s.comment)||null}async function O(n,o){const t=c(),r=t?`
Tema de la noche: "${t}".`:"",e="Eres el cronista cotilla del juego de fiesta BEEP. Respondes ÚNICAMENTE con JSON válido.",a=`Partida terminada.${r}
Jugadores y XP: ${n.map(d=>`${d.name}: ${d.score} XP`).join(", ")}
Tragos: ${JSON.stringify((o==null?void 0:o.drinkCounts)||{})}
Votos: ${JSON.stringify((o==null?void 0:o.voteCounts)||{})}
Skips: ${JSON.stringify((o==null?void 0:o.skipCounts)||{})}
Virus: ${JSON.stringify((o==null?void 0:o.virusReceived)||{})}

Escribe una crónica divertida (máx. 150 palabras) con títulos de fiesta para cada jugador según sus stats.

Responde SOLO con: {"chronicle": "texto en español con emojis"}`,s=await i(e,a);return(s==null?void 0:s.chronicle)||null}async function $(n,o){const t='Eres el "Juez de la Barra", árbitro sarcástico y divertido del juego de fiesta BEEP. Respondes ÚNICAMENTE con JSON válido.',r=`Jugadores: ${n.join(", ")}
Disputa: "${o}"

Dicta una sentencia firme y graciosa (máx. 2-3 frases) sobre quién bebe.

Responde SOLO con: {"ruling": "sentencia en español"}`,e=await i(t,r);return(e==null?void 0:e.ruling)||null}async function S(n,o){const t=c(),r=t?` Inspírate en el tema: "${t}".`:"",e="Eres el motor de castigos del juego de fiesta BEEP. Respondes ÚNICAMENTE con JSON válido.",a=`Jugador: "${n}". Stats: ${o}.${r}
Genera un castigo divertido, realizable y ligeramente vergonzoso (máx. 1-2 frases).

Responde SOLO con: {"punishment": "castigo en español"}`,s=await i(e,a);return(s==null?void 0:s.punishment)||null}async function v(){const n=c(),o=n?`
Tema especial: "${n}". Los términos DEBEN encajar con este tema.`:"",t="Eres el motor del juego del Impostor en BEEP. Respondes ÚNICAMENTE con JSON válido.",r=`Genera una ronda del Impostor divertida y original.${o}
- category: tema general
- word: palabra real para el grupo
- fakeWord: palabra falsa para el impostor (similar pero distinta)
- hint: pista general que se lee en voz alta

Responde SOLO con: {"category":"...","word":"...","fakeWord":"...","hint":"..."}`,e=await i(t,r);return e!=null&&e.category&&(e!=null&&e.word)&&(e!=null&&e.fakeWord)&&(e!=null&&e.hint)?e:null}export{S as a,v as b,f as c,y as d,N as e,h as f,$ as g,O as h,g as i};
