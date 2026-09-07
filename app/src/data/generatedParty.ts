/**
 * GENERADOR DE CARTAS DE FIESTA (oleada 4)
 * ------------------------------------------------------------------
 * En vez de escribir 15.000 cartas a mano, aquí hay listas de "vocabulario"
 * (acciones, temas, predicados...) y unas cuantas PLANTILLAS con el mismo
 * formato que las cartas que ya existen. Al importar el módulo se multiplican
 * y salen miles de cartas coherentes.
 *
 * Para crear más: añade líneas a las listas de vocabulario de abajo. Cada
 * línea nueva en YN_ACC se convierte en ~9 cartas, cada COSA en ~6, etc.
 *
 * Huecos: {player}, {player2} (los rellena el juego).
 */

const uniq = (arr: string[]) => Array.from(new Set(arr.map(s => s.replace(/\s+/g, ' ').trim()))).filter(Boolean);

// ══════════════════════════════════════════════════════════════════════
//  VOCABULARIO
// ══════════════════════════════════════════════════════════════════════

// "he ___" → Yo nunca he ___
const YN_ACC: string[] = [
  "mentido sobre por qué llegaba tarde", "borrado un mensaje para que no me pillaran",
  "stalkeado a un ex hasta tres años atrás", "fingido una llamada para escapar de una conversación",
  "dicho 'me voy ya' y me he quedado una hora más", "vuelto con alguien sabiendo que era mala idea",
  "llorado con un anuncio", "llorado en el baño de una discoteca",
  "puesto el móvil en avión para no contestar", "dejado a alguien en visto más de un día a propósito",
  "comprado algo caro en mi peor momento económico", "llamado 'inversión' a un capricho",
  "pedido a domicilio estando el restaurante al lado", "hecho la compra con hambre y traído medio súper",
  "fingido que me quedaba sin batería para irme", "cancelado un plan y sentido alivio",
  "mirado pisos que no me puedo permitir a las 2 de la mañana", "guardado capturas de una discusión 'por si acaso'",
  "dicho 'yo mañana madrugo' y no ha pasado", "mandado un audio del que me arrepiento",
  "cantado en el coche pensando que nadie me veía", "hecho como que no veía a un conocido por la calle",
  "fingido interés en el hobby de alguien durante meses", "revisado el móvil de una pareja o ex",
  "dicho 'te quiero' sin sentirlo del todo", "hecho ghosting a alguien que me caía bien",
  "vuelto de vacaciones más cansado de lo que me fui", "tenido una crisis existencial en el súper",
  "discutido por elegir restaurante", "discutido por cómo se carga el lavavajillas",
  "comprado ropa de deporte para hacer solo el deporte de ir a por el pan", "pagado el gimnasio de enero hasta diciembre sin volver",
  "tenido una discusión imaginaria en la ducha y ganado", "juzgado el carrito de la compra de alguien en la cola",
  "dicho 'qué guay' a un plan que me parecía horrible", "fingido problemas de audio en una videollamada",
  "tenido una cuenta secundaria para ver stories sin que se sepa", "comprado ropa una talla menos 'para motivarme'",
  "dicho que iba al gimnasio y he ido a dar una vuelta", "mirado el horóscopo y luego dicho que no creo en eso",
  "dicho 'yo invito' esperando que dijeran que no", "tenido celos de un amigo por hacer planes con otro",
  "vuelto a leer una conversación antigua para torturarme", "puesto una excusa de trabajo para no ir a una cena familiar",
  "escuchado a propósito la playlist de 'cuando esté triste'", "alegrado en secreto de que a alguien le fuera regular",
  "vetado tres sitios después de decir 'me da igual dónde comamos'", "fingido acordarme de alguien que claramente me conocía",
  "pedido perdón sin sentirlo para acabar la discusión", "tenido nostalgia de una época en la que lo pasaba fatal",
  "acabado cantando después de decir 'yo con dos cervezas ya estoy'", "guardado el número de un ligue como 'no coger'",
  "dicho 'te leo luego' y no he leído nunca", "mirado el móvil debajo de la mesa en una reunión",
  "comprado billetes de avión a las 2am para un viaje que no hice", "dicho 'lo dejo cuando quiera' sobre algo que no dejo",
  "tenido una app de meditación que me estresa no usar", "gastado el triple después de decir 'ya que estamos'",
  "mirado quién me ha dejado de seguir con una app de esas", "enfadado de verdad por una conversación imaginaria",
  "dicho 'este año sí me organizo' cinco eneros seguidos", "bajado a por el domicilio para que no me vieran en pijama",
  "tenido un táper en la nevera tanto tiempo que daba miedo", "dicho 'no bebo entre semana' un martes con una caña",
  "tenido envidia de la mascota de alguien", "dicho 'ahora mismo salgo' desde la cama sin moverme",
  "fingido que me gustaba un regalo delante de quien me lo hizo", "dicho 'qué pereza todo' un viernes esperado toda la semana",
  "hecho scroll hasta que la app me pregunta si sigo ahí", "perdido un grupo de amigos solo por pereza",
  "dicho 'yo no soy celoso' con el móvil de la pareja en la mano", "pagado un curso online y no pasado del módulo dos",
  "llegado tarde y echado la culpa al transporte", "puesto más de tres alarmas por la mañana",
  "guardado una story antes de que la borraran", "evitado a alguien conocido si entraba por la puerta",
  "peleado con un desconocido en internet y perdido la tarde", "tenido ropa tendida en casa más de tres días",
  "ido a un festival deseando estar en casa", "usado 'estoy hasta arriba' como personalidad",
  "hecho una encuesta de Instagram para que respondiera una persona", "dicho 'no tengo hambre' y comido medio plato del otro",
  "pedido repetir una foto de grupo 'por otros' cuando salía yo mal", "movido la boca fingiendo saberme una canción en un concierto",
  "dicho 'ahora te llamo' y no haber llamado nunca", "tenido un cargador que solo funciona en un ángulo concreto",
  "fingido estar ocupado para no ayudar a alguien a mudarse", "llorado con una serie más que con algo de mi vida",
  "mandado 'jaja' sin que me hiciera ni pizca de gracia", "tenido 40 pestañas abiertas y ninguna importante",
  "dicho 'me lo apunto' sabiendo que no me lo apuntaba", "dejado morir una planta y echado la culpa a la planta",
  "vuelto andando de fiesta por ahorrarme el taxi y tardado una hora", "pospuesto la alarma tanto que he dormido menos",
  "mentido en una encuesta de satisfacción por pena del que me atendía", "tenido una suscripción sin usar más de un año",
  "hecho una lista de tareas para tachar 'hacer la lista'", "sentido pánico al ver una llamada entrante",
  "comprado algo 'para probar' y quedármelo sin abrir tres años", "tenido una relación que aguantó por pereza logística",
  "hecho la compra online y abandonado el carrito lleno", "mirado el móvil en el semáforo en rojo y seguido en verde",
  "dicho 'la última y nos vamos' y cerrado el bar", "sentido que soy demasiado mayor para esto y demasiado joven para lo otro",
  "pedido cita con el médico y curado antes de que me la dieran", "mandado un correo a las 23:50 para que constara que trabajo mucho",
  "cambiado de acera para no cruzarme con alguien del pueblo", "brindado con agua sintiéndome un mentiroso",
  "fingido que conocía a un grupo o político en una cena para no quedar mal", "dicho 'yo con poco soy feliz' desde un piso que me come el sueldo",
  "tenido una conversación entera pensando en cómo salir de ella", "comprado plantas 'fáciles de cuidar' y matado igual",
  "sentido alivio cuando me cancelaron un plan que yo quería cancelar", "tenido un grupo de un viaje que no se volvió a hacer",
  "discutido con la pareja sobre a quién le toca vaciar el lavavajillas", "ido a una boda haciendo cuentas de lo que me costaba ir",
  "hablado con el GPS como si me oyera", "hecho una playlist para 'concentrarme' y perdido 40 minutos montándola",
  "dicho 'total, mañana es viernes' un miércoles para sobrevivir", "tenido un grupo de amigos del trabajo que se deshizo al cambiar de trabajo",
  "comprado plantas de deporte y hecho solo el deporte de ir a por el pan", "fantaseado con huir a otra ciudad mirando alquileres",
  "dicho 'esta es la última copa' tres veces más", "tenido miedo de que me pregunten en qué gasté el sueldo este mes",
  "fingido una reunión en el calendario para no ir a otra", "dicho 'yo lo dejo cuando quiera' sobre algo que claramente no dejo",
  "hecho scroll tanto rato que la app me preguntó si seguía ahí", "tenido una relación que aguantó más de lo debido por pereza",
  "dicho que 'no bebo entre semana' un miércoles con una caña", "hecho una transferencia a un amigo con un concepto que era un chiste privado",
  "guardado un cromo repetido durante años pensando que valdría algo", "convencido a un primo de hacer la travesura que yo quería",
  "robado monedas del monedero de mi madre para el kiosco", "esperado despierto para pillar a los Reyes Magos",
  "roto la flauta dulce a propósito para no tocar en clase", "llorado el día de mi comunión por los zapatos nuevos",
  "llevado bocadillo de Nocilla toda la semana", "intercambiado 50 cromos en un solo recreo",
  "hecho pellas y luego me han pillado", "copiado en un examen con la chuleta en la manga",
  "fingido estar malo un lunes después de un puente", "guardado el teléfono fijo de mi infancia en la memoria y no el de mi pareja",
  "soplado un cartucho de la consola pensando que servía", "grabado una canción de la radio y me la ha cortado el locutor",
  "hecho cola en el videoclub un viernes", "tenido una mochila con ruedas y me ha dado vergüenza",
  "vendido limonada en la calle y no vendido ni un vaso", "dicho 'esto antes era campo' con menos de 35 años",
  "puesto excusas para no quedar con la excusa de que estaba malo", "mentido diciendo que ya había leído un libro que no abrí",
  "pedido el plato más barato para no parecer un aprovechado", "cantado a pleno pulmón en el coche y me han visto",
  "perdido diez minutos buscando el mando que tenía en la mano", "entrado a una tienda a no hacer nada y salido sin comprar",
  "dicho 'ahora mismo voy' y tardado veinte minutos en moverme", "comprado en el súper con hambre cosas que no necesito",
  "dicho que reciclo mientras tiraba el táper entero al contenedor equivocado", "mirado la esquela de alguien del pueblo para calcular la edad",
  "pedido perdón a un electrodoméstico", "tenido nostalgia de la universidad olvidando que dormía y comía fatal",
  "discutido en internet con un desconocido y perdido la tarde", "sentido pánico al ver una llamada entrante de un número guardado",
  "comprado un libro de autoayuda y dejado en la página 30 pidiendo ayuda", "hecho una lista de reproducción para estar triste y escuchado a propósito",
  "dicho 'yo a partir de las doce ya no rindo' a las doce y cinco", "tenido un plan de pensiones que no entiendo porque el del banco parecía majo",
  "abierto LinkedIn en mi peor día laboral para ver quién tenía un trabajo mejor", "comprado ropa de deporte con la que solo he ido a por el pan",
  "tenido una edad a la que mis padres ya tenían casa, hijos y coche", "sentido que soy un adulto jugando a serlo",
  "tenido una crush con alguien solo porque me trató con un mínimo de amabilidad", "dicho 'me quedo un ratito' y cerrado el bar",
  "abierto la nevera, cerrado y vuelto a abrir por si había cambiado algo", "hecho una compra impulsiva a las 2 de la mañana",
  "mirado el precio del aceite con tristeza", "dicho 'qué sueño' a las 22:30",
  "puesto el aire y las ventanillas del coche a la vez", "dicho 'yo esto lo arreglo en un momento' y tardado toda la tarde",
  "fingido que sabía usar Excel en una entrevista", "buscado en Google cómo hacer algo que ya había hecho 20 veces",
  "tenido envidia de un compañero que se ha ido de la empresa", "guardado un regalo para regalárselo yo a otra persona",
  "puesto una lavadora y dejado la ropa dentro dos días", "descongelado algo para comer y acabado pidiendo a domicilio",
  "dicho 'yo mañana lo hago' sobre algo que llevo semanas evitando", "comprado un libro por la portada y no pasado del prólogo",
  "empezado un audiolibro para dormir y no enterarme de nada", "puesto una serie de fondo mientras miraba el móvil",
  "hecho una videollamada arreglado de cintura para arriba y en calzoncillos", "fingido tomar notas en una reunión dibujando",
  "mandado un mensaje al chat equivocado y rezado para que no lo leyeran", "escrito 'jajaja' con cara totalmente seria",
  "dado 'me gusta' sin querer a una foto de hace tres años", "guardado el número de alguien como 'Juan trabajo NO coger'",
  "llamado a alguien sin querer desde el bolsillo y colgado rezando", "puesto el despertador para una siesta y dormido dos horas",
  "buscado un restaurante, leído 200 opiniones y acabado en el de siempre", "reservado mesa y llegado 40 minutos tarde sin avisar",
  "dejado propina mínima y sentido que todos me miraban", "pedido la cuenta por señas y que no me vieran nunca",
  "fingido que me sonaba una canción del karaoke moviendo la boca", "cantado a gritos una canción sabiéndome mal la letra",
  "dicho 'yo esta ronda no bebo' y bebido la siguiente doble", "escondido una copa para que no me la rellenaran",
  "dicho 'estoy bien' llorando por dentro en una comida familiar", "reído una gracia de mi jefe que no tenía ninguna gracia",
  "dado la razón a un cuñado por no discutir en Navidad", "cambiado de tema rápido cuando alguien preguntó por mi vida",
  "dicho 'qué mayor estás' a un niño y sentirme viejísimo", "calculado cuánto cobro por hora en mitad de una reunión",
  "mirado ofertas de trabajo el lunes por la mañana solo por soñar", "actualizado el currículum sin intención de mandarlo",
  "dicho 'este trabajo es temporal' llevando cuatro años", "puesto 'trabajando desde casa' y estar viendo una serie",
  "aparcado fatal y dejado una nota falsa pidiendo perdón", "tocado el claxon y arrepentirme al ver quién era",
  "puesto el intermitente tarde a propósito para no dejar pasar a nadie", "conducido cantando y frenar de golpe al ver una patrulla",
  "hecho como que no oía el telefonillo para no bajar a por un paquete", "dejado un paquete en 'ausente' estando en casa en pijama",
  "pedido comida sana y añadir postre y refresco al carrito", "comprado fruta con buena intención y tirarla pocha",
  "dicho 'esta semana cocino en casa' y pedir a domicilio tres días", "guardado sobres de kétchup y servilletas 'por si acaso'",
  "hecho la lista de la compra y olvidármela en casa", "comprado tres cosas que ya tenía por no mirar la despensa",
  "puesto el aire acondicionado y una manta a la vez", "dormido con calcetines y quitármelos a mitad de noche",
  "hecho una foto a la nevera para acordarme de lo que falta y no mirarla", "puesto una alarma con nombre motivador y darle a posponer",
  "dicho 'voy a acostarme pronto' y ver tres capítulos más", "abierto Instagram para ver una cosa y salir 40 minutos después",
  "escrito un tuit muy ingenioso y borrarlo por si acaso", "leído toda una discusión de desconocidos en un post",
  "guardado 300 recetas y cocinar siempre pasta", "guardado ideas de decoración de una casa que no tengo",
  "hecho un test de personalidad de esos y creérmelo un poco", "mirado mi carta astral para justificar por qué soy así",
  "dicho 'yo el gimnasio lo hago en casa' y no hacer nada", "comprado una esterilla de yoga que usa el gato",
  "apuntarme a una carrera popular y no presentarme", "comprar unas zapatillas caras para andar hasta el bar",
  "hacer la maleta el mismo día del viaje y olvidar el cargador", "volver de un viaje y dejar la maleta hecha una semana",
  "sacar fotos de todo en un viaje y no mirar ninguna después", "decir 'el año que viene organizamos mejor las vacaciones'",
];

// Remates para multiplicar los "Yo nunca"
const YN_TWIST: string[] = [
  "",
  " Si lo has hecho, bebes 2.",
  " Si lo has hecho, bebe 1. Si lo hiciste sobrio, bebe 3.",
  " Si te ha pasado esta semana, bebes 3.",
  " Si lo has hecho más de una vez, bebe doble.",
  " Y encima lo negué. Si te suena, bebe 2.",
  " Y me quedé tan pancho. Bebe si te ves reflejado.",
  " Delante de gente. Bebe 2 si lo has vivido.",
  " Y luego le eché la culpa a otro. Bebe si eres así.",
  " Si lo has hecho, cuéntalo o bebe 3.",
  " Si eres el único de la mesa que NO lo ha hecho, bebe por raro.",
  " Si te ha pasado este mes, bebe 2 y explica.",
  " Si lo has hecho hoy, bebe 3.",
  " Y sé de alguien de esta mesa que también. Bebéis los dos.",
  " Si lo negaras ahora aunque fuese verdad, bebe 2.",
  " Bebe 1 por hacerlo, otro por no aprender.",
];

// Temas / listas para CADENA, CATEGORÍAS, CULTURA CHUPÍSTICA y 10 SEGUNDOS
const COSAS: string[] = [
  "marcas de cerveza", "marcas de coches", "marcas blancas de súper", "marcas de refrescos",
  "equipos de Primera División", "equipos de Segunda", "equipos de la Premier", "estadios de fútbol",
  "capitales de Europa", "ríos de España", "pueblos de España", "islas del mundo",
  "películas españolas", "películas de los 90", "sagas de cine", "películas de superhéroes",
  "cantantes de los 2000", "grupos de rock español", "canciones de karaoke", "canciones de boda",
  "canciones del verano", "grupos que se han reunido por dinero", "raperos", "cantantes de reguetón",
  "programas de televisión míticos", "concursos de la tele", "presentadores de la tele", "series que dejaste a medias",
  "series que todo el mundo dice haber visto", "tipos de borracho", "tipos de resaca", "excusas para no salir",
  "excusas para llegar tarde", "razones para cancelar un plan", "razones para no contestar un mensaje",
  "cosas que se compran borracho", "cosas que se pierden de fiesta", "cosas que se dicen al llegar a casa borracho",
  "frases de cuñado", "frases que dice un jefe en una reunión inútil", "frases de horóscopo que valen para cualquiera",
  "frases de tu madre antes de colgar el teléfono", "insultos suaves de abuela", "tacos que dirías delante de tu abuela",
  "apps que tienes y no usas", "gastos fijos que odias", "suscripciones que pagas y no usas",
  "cosas que tu madre guarda 'por si acaso'", "cosas que hay en un cajón sin saber por qué",
  "dolores nuevos que salen a partir de los 30", "achaques de viejo", "medicamentos de bolso",
  "cosas que compras en el chino", "chollos de segunda mano que esconden algo", "cosas que dices que harás 'en septiembre'",
  "planes de domingo con bajón", "tipos de compañero de oficina insufrible", "tipos de vecino",
  "chuches de kiosco", "desayunos de bar", "tapas típicas", "platos de la abuela",
  "postres", "tipos de bocadillo", "cosas que se ponen en una barbacoa", "marcas de patatas fritas",
  "juegos de la infancia", "juguetes de los 90", "dibujos animados clásicos", "personajes de dibujos",
  "villanos de Disney", "princesas Disney", "personajes de Los Simpson", "personajes de Padre de Familia",
  "youtubers o streamers", "influencers", "memes clásicos de internet", "trends de redes",
  "razas de perro", "animales de granja", "animales peligrosos", "animales que dan asco",
  "profesiones", "trabajos raros de estudiante", "ministerios del Gobierno", "comunidades autónomas",
  "monumentos de España", "monumentos del mundo", "aeropuertos", "compañías de vuelo baratas",
  "operadoras de móvil", "bancos", "cadenas de supermercados", "cadenas de comida rápida",
  "cafeterías de cadena", "gimnasios de cadena", "tiendas de ropa de centro comercial",
  "discotecas o bares de tu ciudad", "festivales de música", "grupos que actuarían en tu boda",
  "cosas que se hacen en una despedida de soltero", "juegos de mesa", "deportes olímpicos raros",
  "posiciones de fútbol", "jugadores retirados", "porteros míticos", "entrenadores conocidos",
  "mundiales que ganó España", "selecciones de fútbol", "boxeadores o luchadores", "pilotos de F1",
  "modelos de móvil antiguos", "consolas de videojuegos", "videojuegos clásicos", "personajes de videojuegos",
  "webs que ya no existen", "redes sociales muertas", "cosas de Tuenti o Messenger", "cosas de la web 2.0",
  "colonias de padre", "colonias navideñas de anuncio", "anuncios navideños míticos", "eslóganes de publicidad",
  "cosas que hay en la guantera del coche", "cosas que hay en el fondo del bolso", "cosas que se pierden en casa siempre",
  "grupos de WhatsApp muertos que aún tienes", "motivos por los que te quedaste sin batería hoy",
  "cosas que compras 'de más' por si acaso", "planes que suenan bien en el grupo y nadie organiza",
  "marcas de agua embotellada", "marcas de galletas", "marcas de chocolate", "marcas de helado",
  "marcas de zapatillas", "marcas de móviles", "marcas de electrodomésticos", "marcas de tequila o ron",
  "ligas de fútbol", "países del Mundial 2022", "jugadores del Real Madrid", "jugadores del Barça",
  "delanteros históricos", "porteros de la selección", "árbitros conocidos", "apodos de futbolistas",
  "capitales de América", "capitales de Asia", "banderas que sabrías reconocer", "monedas del mundo",
  "idiomas del mundo", "planetas y lunas", "elementos de la tabla periódica", "constelaciones",
  "reyes de España", "presidentes del Gobierno", "dictadores de la historia", "batallas famosas",
  "escritores en español", "premios Nobel", "pintores famosos", "cuadros famosos",
  "instrumentos de una orquesta", "estilos de música", "musicales de teatro", "óperas o zarzuelas",
  "razas de gato", "aves que sabrías nombrar", "peces de acuario", "insectos que dan repelús",
  "dinosaurios", "superhéroes de Marvel", "villanos de cómic", "personajes de Harry Potter",
  "personajes de El Señor de los Anillos", "personajes de Star Wars", "personajes de Juego de Tronos",
  "series de HBO", "series de Netflix españolas", "realities de televisión", "programas del corazón",
  "cadenas de televisión", "emisoras de radio", "periódicos españoles", "revistas de peluquería",
  "apps de mensajería", "redes sociales actuales", "navegadores de internet", "buscadores antiguos",
  "webs de descargas que ya no existen", "foros de internet antiguos", "juegos de móvil adictivos",
  "juegos de la Game Boy", "juegos de PlayStation 2", "personajes de Pokémon", "personajes de Mario",
  "canciones de Eurovisión", "representantes de España en Eurovisión", "OTs que recuerdes",
  "grupos de los 80 españoles", "grupos de los 90 españoles", "reguetoneros actuales",
  "cantautores", "grupos de indie español", "DJs conocidos", "festivales de electrónica",
  "tipos de café", "tipos de té", "cócteles clásicos", "chupitos con nombre gracioso",
  "vinos españoles", "cervezas artesanas con nombre ridículo", "quesos", "embutidos",
  "pescados de mercado", "verduras que odiabas de pequeño", "frutas tropicales", "frutas de invierno",
  "salsas para mojar", "tipos de pan", "dulces de Navidad", "postres de restaurante",
  "comidas de after", "cosas que pides en el kebab", "toppings de pizza raros", "sabores de Fanta",
  "tipos de resacón según lo bebido", "excusas para no ir al gimnasio", "propósitos de año nuevo típicos",
  "cosas que dices que vas a hacer cuando tengas tiempo", "hobbies que has empezado y dejado",
  "manías de tu pareja o compañero de piso", "cosas que se rompen en casa", "electrodomésticos que hacen ruido raro",
  "trámites que te dan pereza", "colas en las que has estado", "papeles que hay que renovar",
  "tipos de cuñado", "tipos de suegra de comedia", "frases de tertuliano de bar", "temas que evitas en Navidad",
  "cosas que hay en la piscina municipal", "juegos de campamento", "canciones de hoguera",
  "leyendas urbanas de tu pueblo", "sitios encantados de tu ciudad", "bares míticos ya cerrados",
  "discotecas de tu adolescencia", "chiringuitos de playa", "pueblos con playa cerca de ti",
  "marcas de yogures", "marcas de cereales", "marcas de pañales de anuncio", "marcas de compresas o colonia de anuncio",
  "tipos de pasta", "tipos de arroz", "salsas de bote", "especias que tienes y no usas",
  "cortes de carne", "pescados que sabrías pedir en la pescadería", "tipos de setas", "legumbres",
  "cosas que se hacen en Thermomix según tu tía", "electrodomésticos de cocina que se usan una vez al año",
  "muebles de IKEA con nombre imposible", "plantas de interior fáciles de matar", "herramientas de una caja básica",
  "cosas que hay en un trastero", "cosas que se guardan en el maletero del coche", "objetos que siempre pierdes en casa",
  "juegos de patio del colegio", "chuches que ya no existen", "meriendas de after school de los 90",
  "personajes de la tele infantil", "canciones de los payasos de la tele", "series de dibujos de sobremesa",
  "concursos de la tele de los 90", "presentadoras míticas", "reporteros de calle famosos",
  "frases hechas de tu abuela", "refranes que te sabes a medias", "supersticiones de casa",
  "remedios caseros de madre", "cosas que 'quitan el hipo'", "cosas que 'sientan bien para el estómago'",
  "excusas para no coger el teléfono", "excusas para salir antes del trabajo", "excusas para no ir a una despedida",
  "planes de sábado que acaban en el sofá", "cosas que dices que vas a hacer 'cuando me jubile'",
  "apps de bancos que te hacen gritar", "trámites online que nunca funcionan a la primera",
  "contraseñas que has usado alguna vez", "preguntas de seguridad que ya no recuerdas",
  "tipos de mensaje de audio insoportables", "motivos para dejar a alguien en visto",
  "grupos de WhatsApp que deberías silenciar", "emojis que usas siempre",
  "cosas que se dicen en un grupo de trabajo un viernes", "frases pasivo-agresivas de oficina",
  "tipos de reunión que podían ser un correo", "compañeros de oficina que hay en todos lados",
  "cosas que pones en la ensalada para llamarla cena", "comidas de domingo de resaca",
  "sitios donde has echado una cabezada sin querer", "posturas para dormir en un avión o autobús",
  "canciones que te ponen sentimental", "canciones que no puedes escuchar por un ex",
  "grupos que verías en directo antes de morir", "conciertos a los que fuiste y apenas recuerdas",
  "cosas que se gritan en un estadio", "cánticos de grada", "celebraciones de gol famosas",
  "himnos de equipos", "penaltis históricos", "porteros que pararon un penalti importante",
  "ciclistas españoles", "tenistas", "nadadores olímpicos", "atletas de fondo",
  "monólogos que recuerdas del Club de la Comedia", "cómicos españoles", "humoristas de radio",
  "libros que dijiste que ibas a leer este año", "clásicos que fingiste haber leído en clase",
  "museos a los que 'tienes pendiente ir'", "ciudades europeas para una escapada de finde",
];

// Predicados para VOTACIÓN, MANOS ARRIBA, TODOS A LA VEZ, RANKING
// (frase que empieza por verbo, ej: "acabe viviendo en un pueblo con gallinas")
const PRED: string[] = [
  "acabe viviendo en un pueblo con gallinas y un podcast",
  "caiga en una estafa piramidal de suplementos",
  "monte un negocio con un amigo y pierda al amigo",
  "aparezca en un documental de crímenes como 'el vecino que parecía normal'",
  "acabe dando charlas de motivación en LinkedIn",
  "vuelva con un ex esta misma noche",
  "llore antes de que acabe la partida",
  "mande hoy un mensaje al grupo equivocado",
  "se quede dormido primero",
  "acabe durmiendo en el sofá",
  "se tatúe algo de lo que se arrepienta",
  "tenga una crisis a los 40 y se compre una moto",
  "acabe siendo el más rico del grupo",
  "se case por dinero",
  "gaste el sueldo entero en un festival",
  "haga cola tres horas por algo gratis que no necesita",
  "se pelee con un desconocido en internet esta semana",
  "cancele el próximo plan a última hora",
  "llegue tarde a su propia boda",
  "se invente una anécdota para quedar mejor",
  "diga 'yo soy muy sincero' antes de soltar una barbaridad",
  "tenga la relación más tóxica y encima la defienda",
  "acabe de okupa en casa de sus padres 'una temporadita'",
  "pierda el móvil esta noche",
  "llame a un ex a las cuatro de la mañana",
  "se haga famoso por algo ridículo",
  "monte un drama por algo que pasó en un sueño",
  "sea el que hace el 10% del trabajo y se lleva el mérito",
  "diga 'la última y nos vamos' y cierre el bar",
  "se arrepienta mañana de algo dicho esta noche",
  "acabe contando esto en el trabajo el lunes",
  "haga ghosting a alguien que le cae bien",
  "compre algo caro en su peor momento económico",
  "tenga el historial de navegación más raro por cosas inocentes",
  "sea el primero al que 'la IA le quita el trabajo'",
  "se quede sin batería en el peor momento",
  "diga que va a aprender inglés y no lo haga nunca",
  "se reencuentre con un ex en una boda y monte un pollo",
  "acabe llorando con una peli de Disney",
  "se haga vegano y no pare de decirlo",
  "empiece una dieta cada dos meses",
  "tenga un perro con nombre de persona y cuenta de Instagram",
  "responda un mensaje de hace un mes hoy",
  "haga un Bizum del céntimo exacto",
  "diga 'yo pago' y luego reparta la cuenta al milímetro",
  "se ofenda por una broma que ha hecho él primero",
  "acabe en urgencias por algo ridículo",
  "llore de la risa hasta que le duela la tripa esta noche",
  "sea el más dramático contando una historia normal",
  "exagere una anécdota hasta hacerla irreconocible",
  "se apunte a un gimnasio en enero y no vuelva",
  "tenga una crush con alguien solo por ser mínimamente amable",
  "se arrepienta de un audio antes de que acabe la noche",
  "diga 'total, un día es un día' un martes cualquiera",
  "acabe dando consejos de vida que nadie ha pedido",
  "compre entradas para un festival y luego no quiera ir",
  "sea el que siempre propone el after",
  "se haga el dormido para no ayudar a recoger",
  "ponga excusas de trabajo para no ir a una cena familiar",
  "tenga la casa más desordenada del grupo",
  "sea el que mejor cocina de la mesa",
  "sea el que peor cocina de la mesa",
  "aguante más bebiendo esta noche",
  "sea el más cotilla del grupo",
  "sea el más rencoroso",
  "sea el más inocente",
  "sea el que más miente sin querer",
  "sea el que más tarda en contestar los mensajes",
  "sea el que más audios largos manda",
  "sea el que más fotos hace en las salidas",
  "sea el que más veces ha dicho 'yo esto lo dejo cuando quiera'",
  "acabe casándose primero",
  "acabe teniendo hijos primero",
  "acabe emigrando a otro país",
  "acabe montando una furgoneta camper y viviendo en ella un mes",
  "gane un concurso de la tele",
  "salga en el telediario por algo ni grave ni heroico",
  "tenga más suerte en la vida",
  "tenga peor suerte en la vida",
  "sea el que peor lleva la resaca",
  "sea el que mejor liga",
  "sea el que peor liga pero más lo intenta",
  "sea el alma de la fiesta hasta que se apaga de golpe",
  "sea el primero en irse a casa sin avisar",
  "acabe montando un pódcast con un amigo", "se compre una autocaravana en su crisis de los 40",
  "se apunte a un curso de cerámica y lo deje a la tercera clase", "empiece a correr y no pare de contarlo",
  "se haga de CrossFit y lo mencione en cada conversación", "abra un bar con los ahorros y lo cierre en un año",
  "se meta a vender cosas de una marca por catálogo", "haga un máster para no buscar trabajo todavía",
  "se cambie de ciudad por amor y vuelva en seis meses", "adopte un perro por impulso un sábado",
  "se compre una moto y la use dos veces", "se tatúe una frase en un idioma que no habla",
  "se ponga a hacer pan de masa madre y llene la casa de tarros", "se compre una bici carísima para ir al trabajo dos días",
  "se haga fan de una serie y obligue a todos a verla", "se enganche a un videojuego y desaparezca un mes",
  "monte un grupo de inversión con los amigos", "empiece a meditar y lo diga en cada frase",
  "se apunte a un gimnasio nuevo cada enero", "diga que va a dejar el móvil una semana y aguante dos horas",
  "acabe de comunity manager de un bar de su barrio", "escriba un libro que no va a terminar",
  "se compre una plancha de pelo y no la use nunca", "se haga la carta astral y se la crea",
  "se ponga a hacer punto viendo series y no acabe ni una bufanda", "se apunte a clases de baile y falte siempre",
  "empiece una dieta el lunes y la rompa el martes", "se compre ropa de deporte para no hacer deporte",
  "se haga vegetariano por una semana y lo cuente como si fueran años", "vuelva a fumar 'solo los findes'",
  "se apunte a un idioma nuevo en una app y pierda la racha al tercer día", "diga que este año sí viaja y no salga de casa",
  "se lleve regular con su jefe y aun así le ría las gracias", "sea el que organiza el amigo invisible y nadie más",
  "sea el que siempre saca el tema de montar una casa rural entre todos", "sea el que propone irse a vivir a un pueblo cada dos meses",
  "sea el que dice 'hay que quedar más' y nunca propone día", "sea el que llega el último y se va el primero",
  "sea el que se queja del frío en cuanto entra en un sitio", "sea el que siempre tiene un primo que sabe de eso",
  "sea el que se pide lo mismo que el de al lado por no decidir", "sea el que apaga la fiesta contando un problema serio",
  "sea el que se ríe de sus propios chistes antes de contarlos", "sea el que manda notas de voz de cinco minutos",
  "sea el que reenvía cadenas al grupo de la familia", "sea el que hace la foto de grupo y sale mal en todas",
  "sea el que se enfada si no le esperan para pedir", "sea el que dice 'yo pago' con la cartera ya guardada",
  "sea el que tiene una anécdota mejor para cada anécdota tuya", "sea el que llega con hambre y decide dónde se cena",
  "sea el que se pone a fregar en mitad de la fiesta para que se note", "sea el que pone su canción y sube el volumen sin preguntar",
  "sea el que se lleva la última cerveza de la nevera sin avisar", "sea el que dice 'yo mañana curro' a las tres de la mañana",
  "sea el que se apunta a todo y confirma cuando ya ha empezado", "sea el que tarda una semana en contestar y luego contesta con 'ok'",
  "sea el que hace planes en el grupo y luego no aparece", "sea el que graba stories de todo menos vivir el momento",
];

// Contextos para "En la cama y..."
const CTX: string[] = [
  "en la mesa de Navidad", "en un taller de coches", "en un funeral", "en un buffet libre",
  "en una entrevista de trabajo", "jugando al parchís", "en un examen de la universidad", "en la peluquería",
  "haciendo ejercicio", "en la cola del supermercado", "montando un mueble de IKEA", "en una reunión de trabajo por videollamada",
  "en el dentista", "jugando al pádel", "en misa", "montando una estantería con tu pareja",
  "en la ITV", "en una cata de vinos pija", "en el gimnasio a las 7 de la mañana", "en una barbacoa familiar",
  "en el aeropuerto en el control de seguridad", "en una escape room", "en la pescadería del mercado", "en una clase de yoga",
  "arreglando el router con el de Movistar al teléfono", "en la cola de Hacienda", "en un grupo de senderismo", "en el probador de Zara un sábado",
  "en una reunión de comunidad de vecinos", "en la consulta del fisio", "montando una tienda de campaña", "en una cata de aceite",
  "en el estreno de una peli en el cine", "en una clase de spinning", "arreglando una gotera", "en una comida de empresa",
  "en el veterinario", "jugando al pádel con el jefe", "en una mudanza", "en la cola del pan un domingo",
  "en una excursión del colegio como acompañante", "en el probador de una tienda de bodas", "en una reunión de padres del cole",
  "en una despedida de soltero", "en la sala de espera del médico", "en un mercadillo de barrio", "en una clase de cocina",
  "en el rastro un domingo por la mañana", "en una asamblea de vecinos por el ascensor", "en la caja del supermercado",
  "en una primera cita", "en la revisión del coche", "en la cola de un concierto", "en una reunión de antiguos alumnos",
  "en una cena de empresa con el jefe delante", "en un curso de primeros auxilios", "en la peluquería canina",
  "en una boda ajena", "en un bautizo", "en una comunión", "en la sala de espera del banco",
  "en un atasco con la familia", "en la playa un día de viento", "montando en bici por el carril bici", "en la fila del cine con palomitas",
];

// Acciones para RETO
const RETO_ACC: string[] = [
  "describe a {player2} como si fueras su ex escribiéndole a las 3 de la mañana",
  "haz una llamada perdida a la última persona con la que discutiste",
  "enseña la última foto que le mandaste a alguien",
  "deja que {player2} publique un estado de WhatsApp que tú no puedes ver hasta la próxima ronda",
  "imita cómo cuenta {player2} una anécdota",
  "di el nombre de la persona a la que más has stalkeado este mes",
  "haz un brindis dedicado a tu yo de hace diez años, que sea sincero",
  "cuéntale a {player2} el peor consejo que seguiste igualmente",
  "deja que {player2} elija un audio de tu WhatsApp para que lo pongas en alto",
  "explica tu trabajo como si tu abuela tuviera que entenderlo",
  "intercambia un miedo real con {player2}",
  "di tres cosas que envidias de alguien de esta mesa sin decir de quién",
  "cuenta la mentira más grande que le has dicho a tus padres siendo ya adulto",
  "véndele a {player2} tu peor rasgo de personalidad como si fuera una virtud",
  "pon el móvil en el centro de la mesa; si te llega algo en dos minutos, lo lees en alto",
  "describe tu última resaca con todo lujo de detalles",
  "intercambia el fondo de pantalla del móvil con {player2} durante toda la partida",
  "di cuánto dinero te has gastado este mes en tonterías, en voz alta",
  "cuenta la vez que peor quedaste en el trabajo",
  "cara a cara con {player2}, decíos algo bonito de verdad sin cortar con una broma",
  "enséñale a la mesa tu playlist más vergonzosa de Spotify sin editar nada",
  "llama a tu madre o padre y dile que le quieres sin dar explicaciones, cuelga rápido",
  "cuenta el plan más patético que has tenido un sábado noche este año",
  "haz una reseña de esta fiesta como si fuera un restaurante, sé cruel",
  "di el nombre de alguien a quien deberías haber pedido perdón y nunca lo hiciste",
  "enséñale al grupo tu carrito de la compra online abandonado y explica cada cosa",
  "cuenta una cosa que hacías con veinte años que ahora te da pereza infinita",
  "mira a {player2} y adivina cuánto se ha gastado hoy",
  "imita a un cuñado explicando por qué él no paga impuestos de más durante veinte segundos",
  "di qué canción sonaría en tu funeral y por qué",
  "abre tus notas del móvil y lee una en alto, que dé un poco de vergüenza",
  "cuenta la vez que peor mentiste y te pillaron, con detalle",
  "elige a la persona que crees que menos te conoce y deja que te haga tres preguntas",
  "describe cómo te ve tu jefe en una frase y luego cómo te ves tú",
  "cuenta cuál es tu gasto mensual que más te avergüenza, en euros",
  "manda 'me acordé de ti' a alguien con quien perdiste el contacto y enseña si contesta",
  "cuenta cuánto tiempo llevas sin ver a tu mejor amigo de la infancia",
  "di tres cosas que te dan miedo de hacerte mayor, sin chiste",
  "haz de tu jefe dándote una charla motivacional, si es demasiado realista bebe la mesa",
  "enseña tu histórico de pedidos de comida a domicilio del último mes sin editar",
  "recrea la última foto de tu galería sin enseñarla y que la mesa vote si cuela",
  "habla treinta segundos sin parar sobre por qué eres el mejor jugador de la mesa, sin pruebas",
  "cuenta el peor consejo que has dado tú a alguien",
  "di qué harías con un mes libre y sin obligaciones",
  "elige a alguien de la mesa para un brindis obligatorio, bebéis los dos",
];

// Preguntas para VERDAD O BEBE
const VOB_Q: string[] = [
  "¿cuál es la cosa más vergonzosa que has hecho borracho o borracha",
  "¿a quién del grupo le mandarías un mensaje a las tres de la mañana",
  "¿cuál es tu mayor red flag en una relación",
  "¿has mentido hoy, sobre qué",
  "¿a quién del grupo le tienes más envidia",
  "¿cuál es el secreto más gordo que guardas del grupo",
  "¿con quién del grupo no compartirías habitación nunca",
  "¿cuál es la mentira más grande que le has dicho a alguien del grupo",
  "¿cuál es tu mayor obsesión que nadie sabe",
  "¿has hablado mal de alguien del grupo esta semana",
  "¿cuál es la cosa más rara que has buscado en Google",
  "¿tienes crush en alguien del grupo",
  "¿qué es lo peor que has hecho por amor",
  "¿has stalkeado a alguien del grupo en redes",
  "¿cuál es la cosa más cara que has comprado sin necesitarla",
  "¿has revisado el móvil de tu pareja o ex",
  "¿has dicho 'te quiero' sin sentirlo",
  "¿has hecho ghosting a alguien que te caía bien",
  "¿cuál es tu mayor secreto que no le has contado a nadie del grupo",
  "¿has hecho algo ilegal aunque sea pequeño",
  "¿cuál es la cosa más vergonzosa que tienes en el móvil ahora mismo",
  "¿has fingido no tener dinero para no pagar una ronda",
  "¿cuál es tu mayor vergüenza de una noche de fiesta",
  "¿has enviado un audio borracho del que te arrepientes",
  "¿cuál es la cosa más inmadura que has hecho por celos",
  "¿cuánto dinero te has gastado este mes en tonterías",
  "¿a quién de tu familia le mientes más",
  "¿qué plan has cancelado alegrándote por dentro",
  "¿cuál es el rasgo tuyo que sabes que es insoportable y no arreglas",
  "¿a quién de esta mesa le pedirías dinero prestado sin dudar",
  "¿qué opinas de verdad de la última pareja de tu mejor amigo o amiga",
  "¿cuántas veces has vuelto con la misma persona",
  "¿qué mentira hay ahora mismo en tu perfil de una app de citas",
  "¿te has hecho el dormido para evitar algo, qué era",
  "¿cuál es tu manía en la cama que no le has contado a nadie de la mesa",
  "¿qué es lo más patético que has hecho para volver a ver a alguien 'por casualidad'",
  "¿a quién de tus ex invitarías a un café mañana y a quién borrarías de tu memoria",
  "¿cuál es la excusa más floja que has puesto para no repetir con alguien",
  "¿qué costumbre tuya en pareja sabes que es objetivamente insoportable",
  "¿cuál es el gasto mensual que más te avergüenza",
];

// Situaciones para ESCENA
const ESCENA_SIT: string[] = [
  "reunión de vecinos discutiendo por el ascensor",
  "cena familiar en la que sale el tema de la política",
  "grupo de amigos decidiendo dónde cenar sin que nadie proponga nada",
  "boy o girl band de los 2000 en una entrevista",
  "atraco de barrio muy chapucero",
  "terapia de grupo para gente que no contesta los mensajes",
  "reality de convivencia con mucha tensión",
  "reunión de trabajo por videollamada y a alguien no se le oye",
  "influencers grabando un 'día en mi vida' falsísimo",
  "comida de Navidad y el cuñado tiene la razón en todo",
  "atrapados en un ascensor",
  "presentadores de un concurso cutre de televisión autonómica",
  "primera cita incomodísima",
  "grupo de senderismo y uno va quejándose todo el rato",
  "recreación de cómo os conocisteis pero versión telenovela",
  "jurado de un talent show valorando a alguien de la mesa",
  "en urgencias por algo ridículo",
  "reunión de antiguos alumnos y nadie se acuerda de nadie",
  "turistas perdidos preguntando a un local que no tiene ni idea",
  "asamblea para organizar un viaje que sabéis que no vais a hacer",
  "after a las siete de la mañana fingiendo que os lo pasáis genial",
  "camareros de un bar en hora punta y todo va mal",
  "familia en un atasco volviendo de vacaciones",
  "reunión de padres del colegio por un grupo de WhatsApp que se ha ido de madre",
  "programa de cocina en directo y algo se quema",
  "call center intentando que no te des de baja",
  "clase de gimnasio a las siete de la mañana con un monitor demasiado motivado",
  "documental de naturaleza pero narrando a la mesa",
];

// Acciones para EL MÓVIL MANDA
const MOVIL_ACC: string[] = [
  "lee en alto tu última notificación",
  "enseña la última foto que te mandaron por WhatsApp",
  "di el nombre del último contacto al que llamaste y por qué",
  "lee el último mensaje que enviaste, el que sea",
  "enseña tu tiempo de pantalla de hoy",
  "di cuál es tu app más usada de la semana",
  "pon el principio del último audio que te mandaron en alto",
  "enseña tu carrito de la compra online abandonado y explica un producto",
  "di cuántos mensajes sin leer tienes",
  "enseña la última canción que escuchaste",
  "lee la última nota que te escribiste a ti mismo",
  "manda 'oye, ¿estás despierto?' al primer contacto de la letra que diga {player2}",
  "di el nombre del último grupo de WhatsApp en el que escribiste y qué pusiste",
  "enseña la foto número diez empezando por el final, sin mirarla antes",
  "lee tu último mensaje enviado a tu madre o padre",
  "di cuál es tu fondo de pantalla y desde cuándo lo tienes",
  "enseña la última búsqueda de tu navegador",
  "di a quién le has mirado la última hora de conexión esta semana",
  "pon el móvil en el centro; si te llega algo en dos minutos lo lees en alto",
  "enseña cuántas alarmas tienes puestas y a qué horas",
  "lee el último emoji que usaste y di a quién se lo mandaste",
  "di cuántas fotos tienes en el móvil",
  "enseña la última captura de pantalla que hiciste y por qué",
  "di el último contacto que guardaste y si te acuerdas de quién es",
  "deja que {player2} te ponga un fondo de pantalla nuevo hasta la próxima ronda",
  "di qué serie o peli tienes a medias y jura que la vas a acabar",
];

// Temas para DOS VERDADES Y UNA MENTIRA
const DV_TEMAS: string[] = [
  "tu vida amorosa", "tu infancia", "cosas vergonzosas que has hecho borracho o borracha",
  "tu trabajo", "viajes o sitios donde has estado", "tus manías raras",
  "famosos que te has cruzado o conocido", "cosas que has robado alguna vez aunque sea un boli",
  "tu peor cita", "lesiones o visitas a urgencias", "tus gustos culpables de series, música o comida",
  "cosas que hacías en el instituto", "dinero: lo más caro que has comprado o deudas tontas",
  "tus ex", "habilidades ocultas que tienes", "miedos irracionales",
  "cosas que has buscado en Google", "tu familia", "planes de fiesta que se te fueron de las manos",
  "tus propósitos de año nuevo cumplidos o no", "cosas que le has ocultado a la mesa hasta hoy",
  "lo que hiciste el último finde", "trabajos raros de estudiante que has tenido",
  "récords personales absurdos", "lo que opinas de verdad de alguien de esta mesa",
];

// ══════════════════════════════════════════════════════════════════════
//  MULTIPLICACIÓN → cartas
// ══════════════════════════════════════════════════════════════════════
const pick = <T,>(a: T[], i: number) => a[i % a.length];

export const genYoNunca: string[] = uniq(
  YN_ACC.flatMap(acc => YN_TWIST.map(tw => `Yo nunca he ${acc}.${tw}`))
);

export const genCadena: string[] = uniq(
  COSAS.flatMap(c => [
    `🔗 CADENA: por turnos, decid ${c}. El que repita o tarde 3 segundos, bebe 2. 🍻`,
    `🔗 CADENA: por turnos, decid ${c}. Sin repetir, sin dudar. El que falle, bebe 3. 🍻`,
    `🔗 CADENA relámpago: ${c}, una por persona, ritmo rápido. El que rompa el ritmo, bebe 2.`,
  ])
);

export const genCategorias: string[] = uniq(
  COSAS.flatMap(c => [
    `🔤 CATEGORÍAS — "${c}": por turnos, cada jugador dice uno. El que repita o falle, bebe.`,
    `🔤 CATEGORÍAS — "${c}": empezando por el jugador con turno, en 5 segundos cada uno. Fallo = 2 tragos.`,
  ])
);

export const genCulturaChupistica: string[] = uniq(
  COSAS.flatMap(c => [
    `Cultura Chupística: ${c}. El primero que repita o falle, bebe.`,
    `Cultura Chupística: ${c}. Ronda a contrarreloj, el que se pare más de 3s bebe 2.`,
  ])
);

export const genDiezSegundos: string[] = uniq(
  COSAS.flatMap(c => [3, 4, 5, 6, 7].map(n => `⏳ 10 SEGUNDOS: {player}, di ${n} ${c} en 10 segundos. Si no llegas, bebes 2.`))
);

export const genVotacion: string[] = uniq(
  PRED.flatMap(p => [
    `🗳️ ¿Quién de la mesa es más probable que ${p}? El más votado bebe 2.`,
    `🗳️ ¿Quién de aquí es más probable que ${p}? Señalad a la de 3. El más señalado bebe 3.`,
    `🗳️ VOTACIÓN: el que ${p}. El más votado se defiende 15s o bebe 3.`,
  ])
);

export const genManosArriba: string[] = uniq(
  PRED.flatMap(p => [
    `✋ MANOS ARRIBA: que levante la mano quien crea que va a ser el que ${p}. Si es mayoría, bebe la minoría; si es minoría, bebéis vosotros.`,
    `✋ MANOS ARRIBA: mano arriba si os apostaríais dinero a que alguien de la mesa ${p}. Los que tengan la mano abajo, beben 1.`,
  ])
);

export const genTodosALaVez: string[] = uniq(
  PRED.flatMap(p => [
    `🙌 TODOS A LA VEZ: a la cuenta de 3, señalad al que ${p}. Ese bebe 2. Quien no señale a nadie, bebe 1.`,
    `🙌 TODOS A LA VEZ: a la de 3, señalad al que MENOS probable veis de que ${p}. Ese reparte 2 (rápido).`,
  ])
);

export const genRanking: string[] = uniq(
  PRED.map(p => `📊 EL RANKING: ordenad a toda la mesa de más a menos probable de que ${p}. Cuando estéis de acuerdo, el primero y el último beben 2.`)
);

export const genEnLaCama: string[] = uniq([
  ...CTX.map(c => `🛌 Cosas que puedes decir en la cama y... ${c}. Por turnos, frases de doble sentido. Quien falle o repita, bebe 2.`),
  ...CTX.slice(0, 40).map(c => `🛌 Cosas que puedes decir ${c} y... en la cama. Por turnos, frases de doble sentido. Quien falle, bebe 2.`),
]);

export const genRetos: string[] = uniq([
  ...RETO_ACC.map(a => `🎯 Reto: {player}, ${a}.`),
  ...RETO_ACC.slice(0, 20).map(a => `🎯 Reto: {player} y {player2}, ${a} (los dos). Quien se corte, bebe 2.`),
]);

export const genVerdadOBebe: string[] = uniq(
  VOB_Q.flatMap(q => [2, 3].map(n => `🎤 VERDAD O BEBE: {player} — ${q}? Si no respondes, bebe ${n}. 🍻`))
);

export const genEscena: string[] = uniq([
  ...ESCENA_SIT.map(s => `🎬 ESCENA (20s): ${s}. Repartíos papeles a la de 3. El que rompa personaje o se quede callado, bebe 2.`),
  ...ESCENA_SIT.slice(0, 20).map(s => `🎬 ESCENA (20s): ${s}. Al acabar, la mesa decide quién ha estado más flojo: bebe 3.`),
]);

export const genMovil: string[] = uniq(
  MOVIL_ACC.map(a => `📱 EL MÓVIL MANDA: {player}, ${a}. Si te niegas, bebes 3.`)
);

export const genDosVerdades: string[] = uniq(
  DV_TEMAS.flatMap((t, i) => [
    `🤥 DOS VERDADES Y UNA MENTIRA: {player}, sobre ${t}. La mesa vota cuál es la mentira. Si te pillan, bebes 2; si cuela, bebe la mesa.`,
    `🤥 DOS VERDADES Y UNA MENTIRA: {player}, sobre ${t}. Si te descubren, bebes 3; si cuela, eliges quién bebe 2.`,
  ])
);

// Todo junto, por si se quiere un único pool
export const generatedAll: string[] = [
  ...genYoNunca, ...genCadena, ...genCategorias, ...genCulturaChupistica, ...genDiezSegundos,
  ...genVotacion, ...genManosArriba, ...genTodosALaVez, ...genRanking, ...genEnLaCama,
  ...genRetos, ...genVerdadOBebe, ...genEscena, ...genMovil, ...genDosVerdades,
];

// Conteo en consola solo en dev
if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
  // eslint-disable-next-line no-console
  console.log('[generatedParty] cartas generadas:', generatedAll.length);
}
