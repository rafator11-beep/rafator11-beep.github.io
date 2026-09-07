/**
 * ACTUALIZACIÓN POST-VERANO 2026
 * ------------------------------------------------------------------
 * Batería nueva de contenido para BEEP. Objetivo:
 *  - Tono de gente de ~30 con ganas de fiesta: humor negro, del día a día,
 *    autodestructivo, nada de "haz 10 flexiones".
 *  - Cero solapamiento con el contenido antiguo (clásico/picante genéricos).
 *  - Cada modo con IDENTIDAD propia (ver ANALISIS.md).
 *  - Referencias de actualidad / virales que un adulto pilla.
 *
 * Formato: strings. Huecos disponibles → {player}, {player2}.
 * El PartyDirector rellena esos huecos con nombres reales y añade el pique.
 */

// ═══════════════════════════════════════════════════════════════════
//  YO NUNCA — confesión adulta, incómoda y cotidiana (no "de fiesta")
// ═══════════════════════════════════════════════════════════════════
export const yoNuncaV5: string[] = [
  "Yo nunca he calculado cuánto cobro por hora mientras estaba en una reunión que podía haber sido un correo.",
  "Yo nunca he mirado pisos que no me puedo permitir a las 2 de la mañana para hacerme daño.",
  "Yo nunca he dicho 'yo es que sin cafeína no soy persona' como si fuera una personalidad.",
  "Yo nunca he tenido una crisis existencial en un pasillo de Mercadona.",
  "Yo nunca he pedido cita con el médico, me la han dado para dentro de tres semanas y para entonces ya estaba curado o muerto.",
  "Yo nunca he fingido problemas de cobertura para colgar una llamada del trabajo.",
  "Yo nunca he vuelto a abrir una conversación de Hinge/Tinder solo por aburrimiento y me he arrepentido al instante.",
  "Yo nunca he guardado capturas de una discusión 'por si acaso'.",
  "Yo nunca he dicho que tenía plan para no quedar y el plan era estar en el sofá.",
  "Yo nunca he llorado por una serie más que por algo de mi vida real.",
  "Yo nunca he pedido a domicilio estando el restaurante a 200 metros.",
  "Yo nunca he tenido 47 pestañas abiertas y ni una sola era importante.",
  "Yo nunca he hecho como que no veía a un conocido por la calle para no tener que hablar.",
  "Yo nunca he mandado un correo a las 23:50 para que constara que trabajo mucho.",
  "Yo nunca he googleado los síntomas y me he autodiagnosticado algo terminal antes de cenar.",
  "Yo nunca he dicho 'esto lo hablamos con calma' sabiendo que no íbamos a hablarlo nunca.",
  "Yo nunca he cambiado de acera para no cruzarme con alguien del pueblo/instituto.",
  "Yo nunca he tenido una suscripción que no uso desde hace más de un año y me sigue cobrando.",
  "Yo nunca he mentido en una encuesta de satisfacción por pena del que me atendía.",
  "Yo nunca he mirado quién ha visto mi estado de WhatsApp más veces de las que admito.",
  "Yo nunca he dicho 'me lo apunto' sabiendo que no me lo apuntaba.",
  "Yo nunca he brindado con agua y he sentido que estaba mintiendo a la mesa.",
  "Yo nunca he tenido celos de la vida que enseña alguien en Instagram sabiendo que es mentira.",
  "Yo nunca he fingido que conocía a un grupo/serie/político para no quedar mal en una cena.",
  "Yo nunca he hecho una lista de tareas solo para tachar 'hacer la lista'.",
  "Yo nunca he dejado morir una planta y le he echado la culpa a la planta.",
  "Yo nunca he dicho 'yo con poco soy feliz' desde un piso que me come el 40% del sueldo.",
  "Yo nunca he vuelto andando de fiesta para ahorrarme el taxi y he tardado una hora y media.",
  "Yo nunca he tenido una conversación entera con alguien pensando en cómo salir de la conversación.",
  "Yo nunca he pospuesto la alarma tantas veces que he dormido menos que si no la pongo.",
  "Yo nunca he comprado ropa de deporte con la que solo he hecho el deporte de ir a por el pan.",
  "Yo nunca he dicho 'el año que viene me organizo mejor' cinco años seguidos.",
  "Yo nunca he sentido alivio cuando me han cancelado un plan que yo quería cancelar.",
  "Yo nunca he tenido un grupo de WhatSapp de un viaje que no se ha vuelto a hacer.",
  "Yo nunca he pagado por adelantado un curso online para motivarme y no he pasado del módulo 2.",
  "Yo nunca he discutido con la pareja sobre a quién le toca vaciar el lavavajillas como si fuera Yalta.",
  "Yo nunca he ido a una boda haciendo cuentas de cuánto me estaba costando ir a esa boda.",
  "Yo nunca he mirado el móvil en el semáforo en rojo y he seguido mirándolo en verde.",
  "Yo nunca he dicho 'me quedo un ratito y me voy' y he cerrado el bar.",
  "Yo nunca he tenido una edad a la que mis padres ya tenían casa, hijos y coche, y yo tengo una suscripción a tres plataformas.",
  "Yo nunca he fingido entusiasmo por el plan de otro para que no se notara que no me apetecía nada.",
  "Yo nunca he abierto la nevera, no he visto nada, la he cerrado y la he vuelto a abrir por si había cambiado algo.",
  "Yo nunca he tenido una crush con alguien solo porque me trató con un mínimo de amabilidad.",
  "Yo nunca he dicho 'total, un día es un día' un martes cualquiera.",
  "Yo nunca he hecho scroll tanto rato que la app me ha preguntado si sigo ahí.",
  "Yo nunca he ido al gimnasio en enero y he pagado la cuota hasta diciembre sin volver.",
  "Yo nunca he tenido una discusión imaginaria en la ducha y he ganado por goleada.",
  "Yo nunca he dicho que 'no bebo entre semana' un miércoles con una caña en la mano.",
  "Yo nunca he sentido que soy demasiado mayor para esto y demasiado joven para lo otro a la vez.",
  "Yo nunca he hecho una transferencia a un amigo con un concepto que era todo un chiste privado.",
];

// ═══════════════════════════════════════════════════════════════════
//  RETOS — interacción real entre jugadores (no numeritos de gimnasio)
// ═══════════════════════════════════════════════════════════════════
export const retosV5: string[] = [
  "Reto: {player}, describe a {player2} como si fueras su ex escribiéndole a las 3 de la mañana. Si a {player2} le da vergüenza, bebe {player2}.",
  "Reto: {player}, haz una llamada perdida a la última persona con la que discutiste. Sin explicar por qué.",
  "Reto: {player}, enseña la última foto que le mandaste a alguien. La que sea.",
  "Reto: {player}, {player2} coge tu móvil y publica un estado de WhatsApp que tú no puedes ver hasta la próxima ronda.",
  "Reto: {player}, imita cómo cuenta {player2} una anécdota. Si el grupo se ríe más que con la versión original, bebe {player2}.",
  "Reto: {player}, di en voz alta el nombre de la persona a la que más veces has stalkeado este mes. Si mientes y se nota, bebes 3.",
  "Reto: {player}, haz un brindis dedicado a tu yo de hace 10 años. Que sea sincero. Si te emocionas, la mesa bebe contigo.",
  "Reto: {player}, cuéntale a {player2} el peor consejo que te ha dado alguien y que seguiste igualmente.",
  "Reto: {player}, deja que {player2} elija un audio de tu WhatsApp para que lo pongas en alto. Tú eliges de qué chat.",
  "Reto: {player}, explica tu trabajo como si tu abuela tuviera que entenderlo. Si no lo entiende la mesa, bebes.",
  "Reto: {player} y {player2}: os intercambiáis un miedo real. El que se lo tome a broma, bebe 2.",
  "Reto: {player}, di tres cosas que envidias (de verdad) de alguien de esta mesa. Sin decir de quién. Que adivinen.",
  "Reto: {player}, manda 'oye, ¿estás despierto?' a un contacto al azar de la letra que diga {player2}. Enseña la respuesta cuando llegue.",
  "Reto: {player}, cuenta la mentira más grande que le has dicho a tus padres siendo ya adulto.",
  "Reto: {player}, haz de comercial y véndele a {player2} el peor rasgo de tu personalidad como si fuera una virtud.",
  "Reto: {player}, pon el móvil en el centro de la mesa. Si te llega una notificación en 2 minutos, la lees en alto. Si no, bebes por tener una vida triste.",
  "Reto: {player}, describe tu última resaca con todo lujo de detalles. Si a alguien le dan náuseas, ha ganado.",
  "Reto: {player}, elige a alguien de la mesa para intercambiar el fondo de pantalla del móvil durante toda la partida.",
  "Reto: {player}, cuenta cuánto dinero te has gastado este mes en tonterías. En voz alta. Redondeando hacia abajo si quieres, pero con dignidad.",
  "Reto: {player}, {player2} te hace una pregunta incómoda y tú tienes que contestar la verdad o beber 3. Solo una.",
  "Reto: {player}, imita a un cuñado explicando por qué él no paga impuestos de más. 20 segundos.",
  "Reto: {player}, di qué canción sonaría en tu funeral y por qué. Si la mesa aprueba, repartes 2 tragos.",
  "Reto: {player}, abre tus notas del móvil y lee una en alto. Tú eliges cuál, pero tiene que dar un poco de vergüenza.",
  "Reto: {player}, cuenta la vez que peor quedaste en el trabajo. Cuanto peor, menos bebes.",
  "Reto: {player} y {player2}: cara a cara, decíos algo bonito de verdad. El primero que haga una broma para cortar la tensión, bebe.",
  "Reto: {player}, enséñale a la mesa tu playlist más vergonzosa de Spotify. Sin editar nada.",
  "Reto: {player}, describe cómo te ve tu jefe en una frase. Luego cómo te ves tú. Bebe por cada mentira.",
  "Reto: {player}, llama a tu madre/padre y dile que le quieres sin dar más explicaciones. Cuelga rápido.",
  "Reto: {player}, cuenta el plan más patético que has tenido un sábado noche en el último año.",
  "Reto: {player}, {player2} dice una época de tu vida y tú tienes que contar una cosa de la que no te sientas orgulloso de entonces.",
  "Reto: {player}, haz una reseña de una estrella de esta fiesta como si fuera un restaurante. Sé cruel.",
  "Reto: {player}, di el nombre de alguien a quien deberías haber pedido perdón y nunca lo hiciste.",
  "Reto: {player}, enséñale al grupo tu carrito de la compra online abandonado. Explica cada cosa.",
  "Reto: {player}, cuenta una cosa que hacías con 20 años que ahora te da pereza infinita.",
  "Reto: {player}, mira a {player2} y adivina cuánto se ha gastado hoy. Si te acercas, bebe {player2}. Si te pasas mucho, bebes tú.",
];

// ═══════════════════════════════════════════════════════════════════
//  PICANTE +18 — de verdad incómodo y adulto, NADA que ver con clásico
// ═══════════════════════════════════════════════════════════════════
export const picanteV5: string[] = [
  "{player}, ¿cuál es la mentira más grande que has dicho en la cama para no herir a nadie?",
  "{player}, ordena a los presentes de más a menos probable de recibir tu 'te echo de menos' a las 4am. Bebe el último.",
  "{player}, cuenta el lío más raro que has tenido y en qué lugar poco recomendable pasó.",
  "{player}, ¿alguna vez te has vuelto a liar con alguien sabiendo que era un error garrafal? Bebe 2 y explícalo.",
  "{player} y {player2}: contad cómo os conocisteis pero versión 'lo que de verdad pasó esa noche'.",
  "{player}, ¿qué es lo más caro que has hecho para impresionar a alguien que no valía la pena?",
  "{player}, enseña (o describe) el último meme que le mandaste a un lío. Sin contexto.",
  "{player}, ¿a quién de tus ex invitarías a esta fiesta solo por ver el caos? Bebe si no te atreves a decir el nombre.",
  "{player}, cuenta la excusa más floja que has puesto para no repetir con alguien.",
  "{player}, ¿cuántas veces has borrado y recuperado el número de la misma persona? Redondea al alza.",
  "{player}, describe tu 'tipo' físico y de personalidad, y luego admite qué tipo eliges siempre de verdad.",
  "{player}, ¿qué secreto de un amigo te has callado en esta mesa hasta ahora? (no hace falta contarlo, solo di que existe y bebe).",
  "{player}, cuenta la vez que peor gestionaste un rechazo. Cuanto más patético, más repartes.",
  "{player} y {player2}: uno dice un número del 1 al 10, el otro dice qué le pondría de nota a la última cita de {player}. Si coinciden, bebe la mesa.",
  "{player}, ¿te has hecho el dormido alguna vez para evitar algo? Bebe 2 si sí.",
  "{player}, di qué app de citas has tenido instalada más tiempo y a qué hora la mirabas más.",
  "{player}, cuenta la conversación más incómoda que has tenido a la mañana siguiente.",
  "{player}, ¿qué mensaje tuyo, si se hiciera público, te destrozaría la reputación? Descríbelo sin leerlo.",
  "{player}, ordena a la mesa por quién crees que ligaba más con 20 años. Los últimos brindan por su gloria pasada.",
  "{player}, ¿alguna vez has fingido que te gustaba un plan/hobby/deporte por alguien? ¿Cuánto duró la mentira?",
  "{player}, cuenta el regalo más pasivo-agresivo que has hecho o recibido de una pareja.",
  "{player}, admite una cosa vergonzosa que tienes guardada en la galería 'oculta' del móvil. Categoría, no contenido.",
  "{player}, ¿a quién de esta mesa le pedirías consejo antes de una primera cita y a quién ni de broma? Bebe el descartado.",
  "{player}, cuenta la vez que más caro te salió un 'total, ¿qué puede pasar?'.",
];

// ═══════════════════════════════════════════════════════════════════
//  QUIÉN ES MÁS PROBABLE — con mala leche, señalar y beber
// ═══════════════════════════════════════════════════════════════════
export const votacionV5: string[] = [
  "¿Quién de aquí acabará viviendo en un pueblo con gallinas y un podcast? El más votado bebe 2.",
  "¿Quién sería el primero en caer en una estafa piramidal 'de suplementos'? Señalad. Bebe.",
  "¿Quién ha llorado más veces en un baño de discoteca? El más votado brinda por su fortaleza.",
  "¿Quién tiene el móvil con más capturas de conversaciones ajenas? Bebe.",
  "¿Quién montaría un grupo de WhatsApp para organizar algo que nunca va a pasar? El más votado lo crea ahora mismo.",
  "¿Quién es más de decir 'yo pago' y luego hacer Bizum del céntimo exacto? Bebe.",
  "¿Quién de aquí ha vuelto con un ex más veces? El ganador bebe por cada vez, si se acuerda.",
  "¿Quién acabaría en las noticias por algo ni grave ni heroico, simplemente ridículo? Bebe.",
  "¿A quién de la mesa le durará menos el propósito de año nuevo? El más votado brinda por febrero.",
  "¿Quién ha dicho más veces 'es que yo soy muy sincero' antes de soltar una barbaridad? Bebe 2.",
  "¿Quién tiene ahora mismo una notificación sin leer de hace más de un mes? El que menos, reparte 2.",
  "¿Quién sería peor compañero de piso: el que no limpia o el que limpia y te lo recuerda? Votad y beba el bando perdedor.",
  "¿Quién de aquí ha ghosteado a alguien y luego se ha ofendido cuando le han hecho lo mismo? Bebe.",
  "¿Quién gastaría el sueldo entero en un festival y comería atún el resto del mes? El más votado lo confirma o bebe 3.",
  "¿Quién tiene la relación más rara con su jefe? Explíquelo el más votado.",
  "¿Quién de la mesa se ha inventado más una anécdota para quedar mejor? Bebe.",
  "¿Quién sería el primero al que 'la IA le quita el trabajo'? Consuélenle con un trago repartido.",
  "¿Quién ha comprado algo caro 'porque me lo merezco' en su peor momento económico? Bebe.",
  "¿Quién tiene más posibilidades de mandar un mensaje al grupo equivocado esta misma noche? Que deje el móvil en el centro.",
  "¿Quién de aquí sigue esperando 'a que las cosas se calmen en el trabajo' desde hace tres años? Bebe.",
  "¿A quién llamaríais para que os ayude a mudaros y a quién ni se os ocurriría? Bebe el descartado.",
  "¿Quién ha dicho 'yo no soy celoso' con el móvil de la pareja en la mano? Bebe 2.",
  "¿Quién acabará dando consejos de vida en LinkedIn? El más votado escribe el primer post en voz alta.",
  "¿Quién de la mesa tiene el 'ahora te llamo' más largo de la historia? Bebe.",
  "¿Quién sería el que, en un apocalipsis zombi, muere el primero por volver a por el cargador? Brinde por su dependencia.",
];

// ═══════════════════════════════════════════════════════════════════
//  CLÁSICO — cultura chupística + categorías con criterio adulto
// ═══════════════════════════════════════════════════════════════════
export const clasicoV5: string[] = [
  "Cultura Chupística: excusas para no ir a una boda. El que repita o dude, bebe.",
  "Cultura Chupística: cosas que dice un cuñado en Nochebuena. El que falle, bebe.",
  "Cultura Chupística: apps que tienes en el móvil y no abres nunca. Ronda rápida, el que se pare bebe.",
  "Cultura Chupística: series que todo el mundo dice que ha visto. El que repita, bebe.",
  "Cultura Chupística: motivos reales para cancelar un plan. Sin repetir. El que se atasque, bebe 2.",
  "Cultura Chupística: dolores nuevos que te salen a partir de los 30. El que no aporte, bebe.",
  "Cultura Chupística: frases de jefe en una reunión inútil. El que falle, bebe.",
  "Cultura Chupística: cosas que compras en el chino y no sabías que necesitabas. Ronda rápida.",
  "Cultura Chupística: gastos fijos que odias pero pagas. El que repita, bebe.",
  "Cultura Chupística: mentiras piadosas de currículum. El que se ría, bebe.",
  "Categorías: pueblos con nombre gracioso de España.",
  "Categorías: grupos de los 2000 que se han reunido por dinero.",
  "Categorías: marcas blancas que son mejores que la original.",
  "Categorías: frases de horóscopo que valen para cualquiera.",
  "Categorías: excusas para llegar tarde al trabajo.",
  "Categorías: cosas que tu madre guarda 'por si acaso'.",
  "Categorías: planes de domingo por la tarde con bajón.",
  "Categorías: tipos de compañero de oficina insufrible.",
  "Categorías: chollos de Wallapop que esconden algo.",
  "Categorías: cosas que dices que vas a hacer 'en septiembre'.",
  "Reto rápido: {player}, di una serie que dejaste a medias y jura que la vas a retomar. La mesa decide si te cree.",
  "Reto rápido: {player}, nombra 5 cosas de tu lista de pendientes de hace un año. Por cada una sin hacer, un trago.",
  "Reto rápido: {player}, imita a alguien pidiendo en un bar sin saber lo que quiere. 15 segundos.",
];

// ═══════════════════════════════════════════════════════════════════
//  EN LA CAMA Y... — doble sentido de verdad, más contextos
// ═══════════════════════════════════════════════════════════════════
export const enLaCamaV5: string[] = [
  "Cosas que puedes decir en la cama y... montando un mueble de IKEA. Por turnos, frases de doble sentido. Quien falle o repita, bebe 2.",
  "Cosas que puedes decir en la cama y... en una reunión de trabajo por videollamada. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en el dentista. Por turnos. Quien falle o repita, bebe 3.",
  "Cosas que puedes decir en la cama y... jugando al pádel. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en misa. Por turnos. Quien falle o repita, bebe 3.",
  "Cosas que puedes decir en la cama y... montando una estantería con tu pareja. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en la ITV. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en una cata de vinos pija. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en el gimnasio a las 7 de la mañana. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en una barbacoa familiar. Por turnos. Quien falle o repita, bebe 2.",
  "Cosas que puedes decir en la cama y... en el aeropuerto en el control de seguridad. Por turnos. Quien falle, bebe 3.",
  "Cosas que puedes decir en la cama y... en una escape room. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en la pescadería del mercado. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en una entrevista de trabajo para un puesto serio. Por turnos. Quien falle, bebe 3.",
  "Cosas que puedes decir en la cama y... en una clase de yoga. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... arreglando el router con el de Movistar al teléfono. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en la cola de Hacienda. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en un funeral (otra vez, sí). Por turnos. Quien falle o repita, bebe 3.",
  "Cosas que puedes decir en la cama y... en un grupo de senderismo. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la cama y... en el probador de Zara un sábado. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en el gimnasio y... en la cama (a la inversa: pon frase de gimnasio con doble sentido). Quien falle, bebe 2.",
  "Cosas que puedes decir en la cocina y... en la cama. Por turnos, doble sentido culinario. Quien falle, bebe 2.",
  "Cosas que puedes decir jugando al parchís y... en la cama. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir en la playa y... en la cama. Por turnos. Quien falle, bebe 2.",
  "Cosas que puedes decir montando en bici y... en la cama. Por turnos. Quien falle, bebe 2.",
];

// ═══════════════════════════════════════════════════════════════════
//  ESPAÑA / PACOVERS — nostalgia concreta, no genérica
// ═══════════════════════════════════════════════════════════════════
export const espanaV5: string[] = [
  "España: si tu casa tuvo funda de sofá de esas que resbalaban, bebe.",
  "España: si has dicho 'apaga la luz del pasillo que no estamos en un teatro', bebe.",
  "España: si de pequeño te taparon el asiento del coche con una toalla en verano, bebe.",
  "España: nombra 3 chuches del kiosco que ya no existen. Si dudas, bebes.",
  "España: si tu abuela tenía plásticos en los mandos a distancia, bebe.",
  "España: si has grabado una canción de la radio en un casete y te ha cortado el locutor, bebe.",
  "España: si has hecho cola en Blockbuster/videoclub un viernes, bebe.",
  "España: canta la sintonía de un programa de sobremesa de los 90. Si nadie la reconoce, bebes.",
  "España: si en tu casa se comía viendo el telediario en silencio absoluto, bebe.",
  "España: si has tenido una mochila con ruedas y te ha dado vergüenza, bebe.",
  "España: si sabes lo que es 'la del pañuelo verde' en un centro comercial, bebe.",
  "España: si has soplado un cartucho de la consola pensando que servía de algo, bebe.",
  "España: di 3 anuncios navideños míticos. Si no te sale ninguno, bebes 2.",
  "España: si tu madre te ha llamado por el nombre completo y sabías que era grave, bebe.",
  "España: si has llevado el bocadillo envuelto en papel de aluminio hecho una pelota, bebe.",
  "España: si has jugado a 'el suelo es lava' en un salón con muebles de los 90, bebe.",
  "España: si te sabes el teléfono fijo de tu casa de la infancia y no el de tu pareja, bebe.",
  "España: si has tenido que levantarte a cambiar de canal porque el mando 'era para las visitas', bebe.",
  "España: nombra 4 coches que tuvo tu familia. El que menos recuerde, bebe.",
  "España: si has dicho 'esto en mis tiempos' teniendo menos de 35 años, bebe 2.",
];

// ═══════════════════════════════════════════════════════════════════
//  NORMAS — duran toda la partida (dan identidad al Megamix)
// ═══════════════════════════════════════════════════════════════════
export const normasV5: string[] = [
  "NORMA: prohibido decir 'literal'. Quien lo diga, bebe. Dura toda la partida.",
  "NORMA: cada vez que alguien mire el móvil sin que sea su turno, bebe.",
  "NORMA: a partir de ahora hay que llamar a {player} 'jefe/jefa'. Quien no lo haga, bebe.",
  "NORMA: prohibido señalar con el dedo. Se señala con el codo. Quien falle, bebe.",
  "NORMA: nadie puede decir la palabra 'no'. Hay que buscar otra forma. Quien la diga, bebe.",
  "NORMA: cada vez que alguien diga 'yo es que...', toda la mesa bebe un sorbito.",
  "NORMA: {player} es el/la sommelier: nadie bebe sin que dé permiso. Si tarda, bebe él/ella.",
  "NORMA: prohibido decir nombres propios. Todo el mundo es 'oye tú'. Quien falle, bebe.",
  "NORMA: hay que terminar todas las frases con 'y punto'. Quien se olvide, bebe.",
  "NORMA: el último en tocarse la nariz cuando alguien diga 'brindis' bebe. Se activa cuando menos lo esperéis.",
  "NORMA: prohibido reírse en los duelos. Quien se ría, pierde y bebe.",
  "NORMA: cada vez que suene una canción que alguien sepa, tiene que decir el año. Si falla por más de 3 años, bebe.",
  "NORMA: {player} y {player2} no pueden hablarse directamente el resto de la partida. Necesitan intérprete. Quien incumpla, bebe.",
  "NORMA: obligatorio brindar antes de cada trago diciendo por quién brindas. Sin repetir persona. Quien repita, bebe doble.",
  "NORMA: el móvil de quien lo saque se queda en el centro hasta que otro lo saque. Al final, el que más tiempo lo haya tenido, bebe 3.",
];

// ═══════════════════════════════════════════════════════════════════
//  DUELOS 1v1 — munición para el bracket de Megamix
// ═══════════════════════════════════════════════════════════════════
export const duelosV5: string[] = [
  "DUELO {player} vs {player2}: pulso de miradas. El primero que parpadee o se ría, bebe 2 y queda eliminado del cruce.",
  "DUELO {player} vs {player2}: decid ciudades por turnos sin repetir. El que falle o tarde 3 segundos, pierde.",
  "DUELO {player} vs {player2}: cada uno cuenta una anécdota vergonzosa. La mesa vota cuál es peor. El de la peor... gana (y el otro bebe).",
  "DUELO {player} vs {player2}: brazo de hierro. El que pierda bebe 3.",
  "DUELO {player} vs {player2}: piedra, papel, tijera al mejor de 5. El perdedor bebe 3.",
  "DUELO {player} vs {player2}: cada uno se inventa un eslogan para vender al otro como pareja ideal. La mesa vota. El menos convincente bebe.",
  "DUELO {player} vs {player2}: aguantar la risa mientras el resto de la mesa intenta haceros reír. El primero que se ría, pierde.",
  "DUELO {player} vs {player2}: memoria. La mesa dice 5 objetos, cada uno los repite en orden. El que falle, pierde.",
  "DUELO {player} vs {player2}: 20 segundos hablando sin parar sobre un tema que diga la mesa. El que se atasque, pierde.",
  "DUELO {player} vs {player2}: cada uno enseña la última foto de su galería. La mesa decide cuál da más vergüenza. Ese, gana; el otro bebe.",
  "DUELO {player} vs {player2}: imitación. Los dos imitan a la misma persona de la mesa a la vez. La mejor imitación gana.",
  "DUELO {player} vs {player2}: trivial exprés, 3 preguntas de cultura general que haga la mesa. Quien acierte más, gana.",
];
