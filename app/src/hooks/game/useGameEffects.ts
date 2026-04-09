import { useState, useRef, MutableRefObject, useCallback } from 'react';
import { GameMode, PlayerVirus, Player } from '@/types/game';
import { virusEffects, normasRonda } from '@/data/gameContent';
import { impostorRounds } from '@/data/impostorContent';
import { duelos } from '@/data/duelosContent';
import { footballQuestions } from '@/data/footballQuestionsNew';
import { cultureQuestions } from '@/data/cultureQuestions';
import { getRandomMimica } from '@/data/mimicaContent';

export const useGameEffects = (mode: GameMode, players: Player[]) => {
    const [playerViruses, setPlayerViruses] = useState<PlayerVirus[]>([]);
    const [virusReceivedByPlayer, setVirusReceivedByPlayer] = useState<Record<string, number>>({});
    const [brutalCounts, setBrutalCounts] = useState<Record<string, { legendaryDrops: number; chaosEvents: number; cursedEvents: number; virusesReceived: number }>>({});

    const getPlayerVirus = (playerId: string) => {
        return playerViruses.find(v => v.playerId === playerId);
    };

    // State for tracking periodic events
    const lastVirusRoundRef = useRef<number>(-1);
    const lastNormaRoundRef = useRef<number>(-1);
    const lastImpostorIndexRef = useRef<number>(0);

    const applyRandomVirus = useCallback((force: boolean = false, specificPlayerId?: string) => {
        // If not forced, apply random chance
        if (!force && ((mode !== 'megamix' && mode !== 'clasico') || Math.random() > 0.20)) return null;

        const targetPlayer = specificPlayerId
            ? players.find(p => p.id === specificPlayerId)
            : players[Math.floor(Math.random() * players.length)];

        if (!targetPlayer) return null;

        const randomVirus = virusEffects[Math.floor(Math.random() * virusEffects.length)];

        setVirusReceivedByPlayer(prev => ({
            ...prev,
            [targetPlayer.id]: (prev[targetPlayer.id] || 0) + 1,
        }));

        setBrutalCounts(prev => ({
            ...prev,
            [targetPlayer.id]: {
                ...prev[targetPlayer.id],
                virusesReceived: (prev[targetPlayer.id]?.virusesReceived || 0) + 1,
                legendaryDrops: prev[targetPlayer.id]?.legendaryDrops || 0,
                chaosEvents: prev[targetPlayer.id]?.chaosEvents || 0,
                cursedEvents: prev[targetPlayer.id]?.cursedEvents || 0
            }
        }));

        setPlayerViruses(prev => {
            // Remove existing virus for this player to avoid clutter/conflicts, or stack? 
            // Replacing is cleaner for UI bubbles.
            const filtered = prev.filter(p => p.playerId !== targetPlayer.id);
            return [
                ...filtered,
                {
                    playerId: targetPlayer.id,
                    virusName: randomVirus.name,
                    virusDescription: randomVirus.description,
                    turnsRemaining: randomVirus.duration
                },
            ];
        });
        const fullVirus = {
            playerId: targetPlayer.id,
            virusName: randomVirus.name,
            virusDescription: randomVirus.description,
            turnsRemaining: randomVirus.duration
        };
        return { player: targetPlayer, virus: fullVirus };
    }, [mode, players]);

    const updateViruses = () => {
        setPlayerViruses(prev =>
            prev
                .map(v => ({ ...v, turnsRemaining: v.turnsRemaining - 1 }))
                .filter(v => v.turnsRemaining > 0)
        );
    };

    // Manage Periodic Viruses (Every 7 Rounds -> Infection or Rest)
    const manageMegamixViruses = (currentRound: number) => {
        if (mode !== 'megamix') return null;

        const icebreakerChallenges = [
            // — PREGUNTAS PERSONALES —
            'El infectado elige a alguien y le hace la pregunta más incómoda que se atreva.',
            'El infectado le pregunta a otro jugador cuál es su mayor vergüenza de la infancia. Si no responde, bebe.',
            'El infectado elige a alguien y le pregunta: ¿qué opinas realmente de mí? Honestidad obligatoria.',
            'El infectado pregunta al grupo: ¿quién creen que mentiría más en una relación? Todos señalan a alguien.',
            'El infectado le pregunta a la persona de su derecha qué cambiaría de sí misma si pudiera.',
            'El infectado elige a alguien y le pregunta cuál es la cosa más estúpida que ha hecho por amor.',
            'El infectado pregunta a todos: ¿cuál fue vuestra peor cita? Gana la historia más desastrosa.',
            'El infectado le pregunta a alguien: ¿cuál es tu secreto más ridículo que nunca has contado?',
            'El infectado elige a alguien y le pregunta cuál es el mayor malentendido que ha tenido con alguien del grupo.',
            'El infectado pregunta al grupo: ¿quién creen que tiene el ego más grande? Votación por señas.',
            // — RETOS FÍSICOS —
            'El infectado y el jugador a su derecha hacen un duelo de caras raras. El grupo vota quién gana.',
            'El infectado tiene que hacer una pose épica y mantenerla 10 segundos. El grupo la puntúa del 1 al 10.',
            'El infectado hace el mejor baile de 5 segundos que pueda. El grupo aplaude proporcionalmente.',
            'El infectado y el jugador de enfrente hacen un concurso de quién aguanta más sin parpadear.',
            'El infectado intenta tocar la nariz con la lengua. Si no puede, todos los que puedan beben.',
            'El infectado elige a alguien para hacer un duelo de pulso. El que pierda bebe.',
            'El infectado tiene 15 segundos para hacer reír a alguien del grupo usando solo gestos, sin palabras.',
            'El infectado y el jugador a su izquierda hacen piedra-papel-tijera. El que pierda cumple una penitencia del grupo.',
            'El infectado intenta imitar el caminar de otro jugador. El grupo adivina a quién imita.',
            'El infectado tiene que hacer un gesto que describa a cada jugador del grupo en 3 segundos por persona.',
            // — IMITACIONES Y ACTUACIONES —
            'El infectado imita a otro jugador del grupo. Los demás adivinan a quién.',
            'El infectado tiene que actuar como si fuera el jugador más serio del grupo durante 30 segundos.',
            'El infectado elige a alguien e imita su forma de reírse. Esa persona confirma si es correcta o bebe.',
            'El infectado actúa una escena dramática de telenovela donde el villano es otro jugador (a su elección).',
            'El infectado imita a un famoso sin decir su nombre. El primero en adivinar elige quién bebe.',
            'El infectado actúa como si fuera la mascota del grupo durante 2 turnos completos.',
            'El infectado imita al jugador que lleva más tiempo sin hablar. Ese jugador decide si la imitación es buena.',
            'El infectado tiene que hablar durante 20 segundos con el acento de otro país. El grupo elige el país.',
            'El infectado actúa como presentador de noticias y narra lo que ha pasado en la partida hasta ahora.',
            'El infectado elige a alguien y ambos actúan una discusión de pareja de 30 segundos. El grupo juzga quién gana.',
            // — CONFESSIONS & VERDAD —
            'El infectado hace una confesión que nadie del grupo sabe. El grupo adivina si es verdad o mentira.',
            'El infectado cuenta algo que nunca ha hecho pero cree que todos los demás sí han hecho.',
            'El infectado revela cuál es su opinión real sobre el juego o la noche de hoy.',
            'El infectado confiesa cuál fue su primera impresión de uno de los jugadores del grupo (a su elección).',
            'El infectado cuenta la cosa más ridícula que ha buscado en Google en el último mes.',
            'El infectado revela qué jugador del grupo le caía mal al principio pero ahora le cae bien.',
            'El infectado cuenta su peor mentira del último mes. El grupo decide si merece beber.',
            'El infectado dice cuál es el hábito más raro que tiene en privado.',
            'El infectado confiesa cuál es la canción más vergonzosa que tiene en su lista de reproducción.',
            'El infectado revela cuál es la compra más innecesaria que ha hecho en el último año.',
            // — DEBATES Y VOTACIONES —
            'Todos votan: ¿quién del grupo sobreviviría más tiempo en una película de terror? El infectado decide el orden.',
            'El grupo debate: ¿el infectado es más cabeza o más corazón? Votación rápida, el infectado no puede hablar.',
            'El infectado propone un tema polémico y el grupo tiene 60 segundos para debatirlo. El infectado elige al ganador.',
            'Votación: ¿quién del grupo sería el peor en una entrevista de trabajo? El que más votos tenga bebe.',
            'El infectado elige dos jugadores y el grupo vota cuál sería mejor pareja de supervivencia en la jungla.',
            'Votación silenciosa: ¿quién del grupo habla más sin decir nada? El infectado lee los resultados.',
            'El grupo vota: ¿quién del grupo tiene más probabilidades de hacerse famoso? El infectado desempata si hay empate.',
            'El infectado plantea: ¿quién del grupo creen que es el más misterioso? Todos señalan a alguien al mismo tiempo.',
            'Votación: ¿quién del grupo sería el primero en rendirse si hay un reto difícil? El infectado da su veredicto final.',
            'El infectado elige dos jugadores y el grupo debate cuál sería mejor jefe. El infectado vota último.',
            // — CONEXIÓN ENTRE JUGADORES —
            'El infectado y el jugador de enfrente tienen 20 segundos para encontrar 3 cosas que tengan en común.',
            'El infectado elige a alguien. Tienen 30 segundos para recordar juntos un momento compartido de la noche.',
            'El infectado le da un apodo al grupo completo basado en lo que ha visto esta noche.',
            'El infectado elige a alguien y le dice sinceramente una cosa que haría diferente si fuera esa persona.',
            'El infectado y el jugador a su izquierda se dan un apretón de manos especial que inventan en 10 segundos.',
            'El infectado le da un consejo de vida al jugador con menos puntos.',
            'El infectado elige a alguien y le dice cuál cree que es su superpoder oculto.',
            'El infectado elige a quien cree que más le falta por conocer del grupo y le hace una pregunta.',
            'El infectado le dice al grupo quién cree que es la persona más diferente a él/ella y por qué.',
            'El infectado y el jugador que lleva más turnos sin beber se dan la mano y el infectado le pide un favor pequeño.',
            // — RETOS DE MEMORIA Y HABILIDAD —
            'El infectado tiene 15 segundos para nombrar 5 cosas que todos los presentes tengan en común.',
            'El infectado nombra a todos los jugadores del grupo sin mirar. Si falla uno, bebe.',
            'El infectado recita los nombres de todos los jugadores al revés (del último al primero en el turno).',
            'El infectado tiene que decir de memoria cuántos tragos ha bebido el jugador a su derecha esta noche.',
            'El infectado adivina qué canción tiene otro jugador (a su elección) más escuchada en su teléfono.',
            'El infectado intenta recordar la última cosa que dijo cada jugador en la partida. Falla = bebe.',
            'El infectado adivina qué comida pediría el jugador a su izquierda si pudiera pedir ya mismo.',
            'El infectado nombra 3 cualidades de cada jugador del grupo en menos de 30 segundos.',
            'El infectado adivina cuál es el mayor miedo del jugador a su derecha. Ese jugador confirma.',
            'El infectado dice qué película elegiría cada jugador del grupo para ver esta noche.',
            // — RETOS SOCIALES CREATIVOS —
            'El infectado tiene que vender al grupo la idea de que él/ella debería ser el líder del grupo esta noche.',
            'El infectado inventa un superpoder ridículo para cada jugador del grupo basado en su personalidad.',
            'El infectado elige a alguien y describe cómo sería su perfil de Tinder. Esa persona decide si es preciso.',
            'El infectado le asigna a cada jugador un personaje de película o serie. El grupo vota si los personajes son acertados.',
            'El infectado inventa un titular de periódico sobre algo que podría pasarle a otro jugador esta semana.',
            'El infectado diseña el equipo perfecto con los jugadores del grupo para robar un banco. Explica los roles.',
            'El infectado elige un jugador y le escribe (imaginariamente) una referencia de trabajo. La lee en voz alta.',
            'El infectado elige a alguien y le dice cómo cree que será su vida dentro de 10 años.',
            'El infectado inventa un nombre de grupo para los presentes basado en lo que ha pasado esta noche.',
            'El infectado elige a dos jugadores y los casa en una boda imaginaria. Describe cómo sería la ceremonia.',
            // — RETOS DE RAPIDEZ —
            'El infectado y el jugador a su derecha: el primero en decir el nombre del otro bebe. ¡Pero a cámara lenta!',
            'El infectado dice 5 palabras relacionadas con cada jugador del grupo en 20 segundos o bebe.',
            'El infectado y otro jugador compiten: el primero en hacer reír al grupo gana. El que pierde bebe.',
            'El infectado nombra 10 palabras sin repetir ninguna en 10 segundos. Si repite, bebe.',
            'El infectado tiene 5 segundos para decir algo gracioso. Si nadie se ríe, bebe.',
            'El infectado y el jugador de enfrente: ambos dicen a la vez una palabra. Si coinciden, todos beben.',
            'El infectado dice una frase y el jugador a su izquierda tiene 3 segundos para responder con rima. Si falla, bebe.',
            'El infectado elige a alguien. Ambos deben decir el mismo número del 1 al 10 al mismo tiempo. Tienen 3 intentos.',
            'El infectado nombra una cualidad positiva de cada jugador en orden, sin pausa. Si titubea, bebe.',
            'El infectado y el jugador que más ha bebido hoy hacen un duelo de jerigonza durante 10 segundos.',
            // — PREGUNTAS DE GRUPO SOBRE EL INFECTADO —
            'Todos dicen en qué animal convertiría al infectado si pudiera. El infectado elige la más acertada.',
            'Todos los jugadores describen al infectado en una sola palabra. El infectado dice cuál le ha molestado más.',
            'Todos eligen qué profesión tendría el infectado si no pudiera hacer lo que hace ahora.',
            'El grupo decide: ¿el infectado es más día o más noche? Votación y debate de 30 segundos.',
            'El grupo inventa el eslogan publicitario del infectado. El infectado puntúa del 1 al 10 cada propuesta.',
            'Todos dicen sinceramente: ¿el infectado sería buen amigo en una crisis? Cada uno justifica brevemente.',
            'El grupo elige qué canción sería el himno del infectado. El infectado la acepta o la rechaza y propone otra.',
            'Todos dicen qué red social define mejor al infectado y por qué. El infectado elige la respuesta más acertada.',
            'El grupo vota: ¿el infectado sería líder o seguidor en una expedición? El infectado tiene derecho a réplica.',
            'Todos eligen qué superpoder daría el infectado a alguien del grupo. El infectado decide si los han conocido bien.',
            // — RETOS DE EMPATÍA —
            'El infectado tiene que defender públicamente al jugador que cree que ha tenido el peor turno de la noche.',
            'El infectado elige a alguien y le dice qué admira genuinamente de esa persona.',
            'El infectado elige al jugador que cree que necesita más ánimo y le dice algo positivo en serio.',
            'El infectado le cuenta al grupo qué jugador le ha sorprendido más esta noche y por qué.',
            'El infectado le dice a alguien del grupo algo que siempre ha querido decirle pero nunca ha dicho.',
            'El infectado elige a quien cree que ha sido más valiente esta noche y lo hace levantarse para un aplauso.',
            'El infectado le dice a cada jugador qué rol tendría en su vida real fuera del juego.',
            'El infectado elige al jugador que más le ha hecho reír y le pide que repita lo que hizo.',
            'El infectado le dice a alguien qué canción le dedicaría si tuviera que elegir una ahora mismo.',
            'El infectado elige al jugador que menos ha hablado y le hace una pregunta que no pueda responder con sí o no.',
            // — RETOS ABSURDOS —
            'El infectado y el jugador a su izquierda tienen que mantener contacto visual durante 30 segundos sin reírse.',
            'El infectado tiene que convencer al grupo de que un objeto de la habitación es la cosa más valiosa del mundo.',
            'El infectado inventa una teoría conspirativa sobre por qué tiene el virus.',
            'El infectado tiene que hacer una presentación de 20 segundos como si vendiera su propio ADN.',
            'El infectado elige a alguien y ambos deben terminar las frases del otro durante 30 segundos.',
            'El infectado elige a alguien y se disculpa solemnemente por algo que nunca ocurrió.',
            'El infectado tiene que explicar el argumento de una película inexistente con título ridículo que invente ahora.',
            'El infectado elige a alguien y le da las gracias con un discurso de 20 segundos por algo trivial.',
            'El infectado tiene que defender que él/ella es en realidad un robot que ha pasado desapercibido hasta ahora.',
            'El infectado elige a alguien y le entrega imaginariamente un premio absurdo con su nombre inventado.',
            // — RETOS DE GRUPO COMPLETO —
            'Todos forman un círculo imaginario de confianza: cada uno dice una cosa que no haría sin el grupo.',
            'El grupo tiene 45 segundos para inventar una historia colectiva donde el infectado es el héroe.',
            'Todos los jugadores se ponen de acuerdo en cuál sería el peor nombre posible para el grupo como equipo.',
            'El grupo vota: ¿qué jugador desaparecería primero en un escape room? El infectado es el árbitro.',
            'Todos dicen qué instrumento musical tocaría el infectado si estuviera en una banda. El infectado elige el mejor.',
            'El grupo inventa el nombre de un cóctel que represente al infectado. El infectado elige el ganador.',
            'Todos proponen un reto para el próximo turno del infectado. El infectado elige cuál cumplir.',
            'El grupo decide qué película rodarían con el infectado como protagonista. Título y género incluidos.',
            'Todos eligen un emoji que defina al infectado esta noche. El infectado elige el más acertado.',
            'El grupo diseña el traje de superhéroe del infectado: color, poderes, nombre y punto débil.',
            // — RETOS DE TRIVIA PERSONAL —
            'El infectado dice su opinión más impopular y el grupo debate si tiene razón.',
            'El infectado cuenta cuál ha sido el momento más incómodo de su vida en una reunión social.',
            'El infectado revela cuánto tiempo aguanta sin mirar el teléfono. El grupo decide si miente.',
            'El infectado cuenta la última vez que lloró y por qué. Si no quiere, bebe.',
            'El infectado dice cuál es la norma social que menos entiende y por qué.',
            'El infectado revela cuál es su mayor manía que le pone nervioso en los demás.',
            'El infectado cuenta qué haría con un millón de euros en 48 horas. El grupo puntúa la respuesta.',
            'El infectado dice cuál es la pregunta que más miedo le da que le hagan. No tiene que responderla.',
            'El infectado cuenta cuál es el plan de fin de semana más aburrido que ha tenido en el último año.',
            'El infectado revela cuál es la app que más le avergüenza tener instalada en el móvil.',
            // — RETOS DE CONEXIÓN RÁPIDA —
            'El infectado y el jugador a su derecha tienen 10 segundos para hacer el apretón de manos más épico posible.',
            'El infectado elige a alguien y ambos tienen 15 segundos para inventar una historia de cómo se conocieron.',
            'El infectado le da al jugador de su izquierda un mote basado únicamente en lo que ha visto esta noche.',
            'El infectado y otro jugador (a su elección) tienen 20 segundos para ponerse de acuerdo en su comida favorita.',
            'El infectado elige a alguien y deben terminar la frase juntos: "Si fuéramos socios, nuestro negocio sería..."',
            'El infectado y el jugador de enfrente intercambian sus roles durante el próximo turno completo.',
            'El infectado le susurra al oído a alguien algo positivo. Esa persona decide si compartirlo o guardarlo.',
            'El infectado y el jugador que más ha participado hoy hacen un pacto absurdo que dure hasta el final del juego.',
            'El infectado elige a alguien y juntos tienen 15 segundos para encontrar algo en lo que son completamente opuestos.',
            'El infectado le da a cada jugador una "misión secreta" de 10 palabras que deben cumplir en los próximos 3 turnos.',
            // — RETOS FINALES ÉPICOS —
            'El infectado hace un brindis dedicado a alguien del grupo con al menos 3 razones específicas.',
            'El infectado elige al jugador que cree que ha evolucionado más durante la partida y explica por qué.',
            'El infectado tiene 30 segundos para convencer al grupo de que merece perder el virus ahora mismo.',
            'El infectado elige a alguien y ambos prometen hacer algo juntos antes de que acabe el mes.',
            'El infectado hace una predicción para cada jugador sobre lo que pasará antes de que acabe la semana.',
            'El infectado elige al jugador que cree que tiene la historia más interesante sin contar y le pide que la cuente.',
            'El infectado declara quién ha sido el MVP de la noche y por qué. El grupo vota si está de acuerdo.',
            'El infectado elige a alguien y juntos proponen el siguiente plan de grupo fuera del juego.',
            'El infectado hace una valoración de cada jugador del grupo en una sola frase. Todas deben ser sinceras.',
            'El infectado elige a quien cree que se merece el próximo virus y justifica su elección ante el grupo.',
        ];

        // Start Virus on Round 1
        if (currentRound === 1 && lastVirusRoundRef.current === -1) {
            lastVirusRoundRef.current = 1;
            const randomVirus = virusEffects[Math.floor(Math.random() * virusEffects.length)];
            const targetPlayer = players[Math.floor(Math.random() * players.length)];
            const challenge = icebreakerChallenges[Math.floor(Math.random() * icebreakerChallenges.length)];
            const newVirus: PlayerVirus = {
                playerId: targetPlayer.id,
                virusName: randomVirus.name,
                virusDescription: randomVirus.description,
                turnsRemaining: 7,
            };
            setPlayerViruses([newVirus]);
            return {
                type: 'INFECTION',
                title: '¡VIRUS DETECTADO!',
                message: `${targetPlayer.name} ha sido infectado.`,
                virusName: randomVirus.name,
                virusDescription: randomVirus.description,
                challenge,
            };
        }

        // Check if round is multiple of 5 (As requested: Virus change every 5 rounds)
        if (currentRound > 1 && currentRound % 5 === 0 && currentRound !== lastVirusRoundRef.current) {
            lastVirusRoundRef.current = currentRound;

            // Logic: Rotate Virus to next player
            setPlayerViruses([]);

            const randomVirus = virusEffects[Math.floor(Math.random() * virusEffects.length)];
            const nextIndex = Math.floor(currentRound / 5) % players.length;
            const targetPlayer = players[nextIndex];
            const challenge = icebreakerChallenges[Math.floor(Math.random() * icebreakerChallenges.length)];

            const newVirus: PlayerVirus = {
                playerId: targetPlayer.id,
                virusName: randomVirus.name,
                virusDescription: randomVirus.description,
                turnsRemaining: 7, // Lasts until next cycle
            };

            setPlayerViruses([newVirus]);
            return {
                type: 'INFECTION',
                title: '¡EL VIRUS HA MUTADO!',
                message: `El virus se ha propagado a ${targetPlayer.name}.`,
                virusName: randomVirus.name,
                virusDescription: randomVirus.description,
                challenge,
            };
        }

        return null;
    };

    // Manage Periodic Normas (Every 5 Rounds)
    const manageMegamixNormas = (currentRound: number) => {
        if (mode !== 'megamix') return null;

        // Initial Norma Round 1
        if (currentRound === 1 && lastNormaRoundRef.current === -1) {
            lastNormaRoundRef.current = 1;
            const randomNorma = normasRonda[Math.floor(Math.random() * normasRonda.length)];
            return {
                type: 'NORMA',
                title: '¡NORMA INICIAL!',
                message: randomNorma,
                duration: players.length * 2
            };
        }

        // Manage Periodic Normas (Every 6 Rounds)
        if (currentRound > 1 && currentRound % 6 === 0 && currentRound !== lastNormaRoundRef.current) {
            lastNormaRoundRef.current = currentRound;
            const randomNorma = normasRonda[Math.floor(Math.random() * normasRonda.length)];
            return {
                type: 'NORMA',
                title: '¡NUEVA NORMA!',
                message: randomNorma,
                duration: players.length * 2 // Lasts 2 full rounds
            };
        }
        return null;
    };

    // Megamix Special Events (Impostor, Duelo, forced Trivia, Random Norma)
    const checkMegamixSpecialEvents = (
        currentIndex: number,
        currentRound: number, // Added usage
        currentPlayer: Player,
        usedQuestionIds: Set<string>,
        setCurrentQuestion: (q: any) => void,
        setUsedQuestionIds: (ids: Set<string>) => void,
        setGameState: (updater: (prev: any) => any) => void,
        lastMiniTurnRef: MutableRefObject<Record<string, number>>
    ) => {
        if (mode !== 'megamix') return false;

        // Force Impostor every 40 cards
        if (currentIndex - lastImpostorIndexRef.current >= 40 && players.length >= 3) {
            lastImpostorIndexRef.current = currentIndex;
            const randomImpostor = impostorRounds[Math.floor(Math.random() * impostorRounds.length)];
            const impostorPlayer = players[Math.floor(Math.random() * players.length)];
            setGameState((prev: any) => ({
                ...prev,
                showImpostorWarning: true,
                impostorData: {
                    currentImpostorReal: randomImpostor.normalQuestion || randomImpostor.category || '',
                    currentImpostorFake: randomImpostor.impostorQuestion || randomImpostor.hint || '',
                    impostorPlayerId: impostorPlayer.id,
                }
            }));
            return true;
        }

        const roll = Math.random();

        // Random Norma removed - now strict every 3 rounds via manageMegamixNormas


        // Special Megamix events: Impostor every 6 rounds (at start of round), Mimica also at alternate cycles
        const isSpecialRoundTurn = currentRound > 0 && currentRound % 6 === 0 && (currentIndex % players.length === 0);

        if (players.length >= 3 && isSpecialRoundTurn && mode === 'megamix') {
            const specialCycle = Math.floor(currentRound / 6) % 3; // 3 types now: Impostor, Mimica, Impostor

            if (specialCycle === 0 || specialCycle === 2) {
                // Impostor
                if (impostorRounds.length === 0) return false;
                lastImpostorIndexRef.current = currentIndex; // Reset manual counter when cycle hits
                const randomImpostor = impostorRounds[Math.floor(Math.random() * impostorRounds.length)];
                const impostorPlayer = players[Math.floor(Math.random() * players.length)];
                setGameState((prev: any) => ({
                    ...prev,
                    showImpostorWarning: true, // Use warning screen for privacy
                    impostorData: {
                        currentImpostorReal: randomImpostor.normalQuestion || randomImpostor.category || '',
                        currentImpostorFake: randomImpostor.impostorQuestion || randomImpostor.hint || '',
                        impostorPlayerId: impostorPlayer.id,
                    }
                }));
            } else {
                // Mimica
                const randomMimica = getRandomMimica();
                setGameState(prev => ({
                    ...prev,
                    showMimica: true,
                    showMimicaReveal: true,
                    currentMimicaText: randomMimica.text
                }));
            }

            lastMiniTurnRef.current['impostor_round'] = currentIndex;
            return true;
        }

        // Duelo
        if (players.length >= 2 && roll >= 0.10 && roll < 0.22) {
            const randomDuelo = duelos[Math.floor(Math.random() * duelos.length)];
            const opponents = players.filter(p => p.id !== currentPlayer.id);
            const opponent = opponents[Math.floor(Math.random() * opponents.length)];
            setGameState((prev: any) => ({
                ...prev,
                showDuel: true,
                currentDuelo: `${randomDuelo.name}: ${randomDuelo.description}`,
                duelPlayers: [currentPlayer, opponent],
            }));
            return true;
        }

        // Forced Trivia
        const playerTurnCount = Math.floor(currentIndex / Math.max(players.length, 1));
        const forceTrivia = playerTurnCount > 0 && playerTurnCount % 6 === 0;

        if (forceTrivia || (roll >= 0.88)) {
            const isFootball = Math.random() > 0.5;
            const shuffled = [...(isFootball ? footballQuestions : cultureQuestions)].sort(() => Math.random() - 0.5);
            const availableQuestions = shuffled.filter(q => !usedQuestionIds.has(q.question));

            if (availableQuestions.length > 0) {
                const randomQ = availableQuestions[0];
                setCurrentQuestion(randomQ);
                setUsedQuestionIds(new Set([...usedQuestionIds, randomQ.question]));
                setGameState((prev: any) => ({ ...prev, showTrivia: true }));
                return true;
            }
        }

        return false;
    };

    return {
        playerViruses,
        setPlayerViruses,
        virusReceivedByPlayer,
        brutalCounts,
        setBrutalCounts,
        applyRandomVirus,
        updateViruses,
        checkMegamixSpecialEvents,
        manageMegamixViruses,
        manageMegamixNormas,
        getPlayerVirus
    };
};
