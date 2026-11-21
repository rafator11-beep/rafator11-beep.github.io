import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@/types/game';
import {
  nextMatch,
  roundName,
  type LiveTournament,
  type TBracket,
  type TournamentEvent,
} from '@/utils/liveTournament';

interface Props {
  tournament: LiveTournament;
  players: Player[];
  /** Duelos que quedan por jugar en esta parada del torneo. */
  matchesLeft: number;
  /** El padre apunta el ganador y devuelve qué ha pasado (campeones…). */
  onResult: (matchId: string, winnerId: string) => TournamentEvent[];
  onDone: () => void;
  /** Invitados del multijugador: ven el duelo y el cuadro, decide el anfitrión. */
  readOnly?: boolean;
}

const TONE: Record<TBracket['kind'], string> = {
  main: 'border-amber-400/50 text-amber-300',
  repesca: 'border-violet-400/50 text-violet-300',
  final: 'border-yellow-300/70 text-yellow-200',
};

export function LiveTournamentOverlay({
  tournament,
  players,
  matchesLeft,
  onResult,
  onDone,
  readOnly = false,
}: Props) {
  const [result, setResult] = useState<{
    winner: string;
    loser: string;
    events: TournamentEvent[];
  } | null>(null);
  const [showBracket, setShowBracket] = useState(false);
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '¿?';
  const current = nextMatch(tournament);
  const canPlayMore = matchesLeft > 0 && !!current;

  const pickWinner = (winnerId: string) => {
    if (!current) return;
    const loserId = winnerId === current.match.p1 ? current.match.p2 : current.match.p1;
    const events = onResult(current.match.id, winnerId);
    setResult({ winner: name(winnerId), loser: name(loserId), events });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[165] flex flex-col items-center justify-center overflow-y-auto bg-slate-950/95 p-4 text-center backdrop-blur-md"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
        🏆 Torneo nº{tournament.number}
      </p>

      {showBracket ? (
        <BracketView tournament={tournament} name={name} />
      ) : result ? (
        <ResultView result={result} name={name} />
      ) : current ? (
        <div className="mt-3 w-full max-w-md">
          <span
            className={`inline-block rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${TONE[current.bracket.kind]}`}
          >
            {current.bracket.name} · {roundName(current.bracket, current.match.level)}
          </span>
          <p className="mt-4 text-2xl font-black text-white">
            {name(current.match.p1)} <span className="text-amber-400">vs</span> {name(current.match.p2)}
          </p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-base font-bold leading-snug text-white/90">
              {current.match.reto
                .replace(/\{player\}/g, name(current.match.p1))
                .replace(/\{player2\}/g, name(current.match.p2))}
            </p>
          </div>
          <p className="mt-4 text-xs font-semibold text-white/50">
            {readOnly
              ? 'El anfitrión marca quién gana. Quien pierda bebe 2.'
              : 'La mesa decide quién gana. Quien pierda bebe 2.'}
          </p>
          {!readOnly && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[current.match.p1, current.match.p2].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => pickWinner(id)}
                  className="rounded-2xl border-2 border-amber-400/50 bg-amber-500/15 px-3 py-4 text-base font-black text-white active:scale-95"
                >
                  🏅 Gana {name(id)}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-lg font-bold text-white">¡Torneo terminado!</p>
      )}

      <div className="mt-6 flex w-full max-w-md flex-col gap-2">
        {(result || !current) && !showBracket && !readOnly && (
          <button
            type="button"
            onClick={() => (canPlayMore && result ? setResult(null) : onDone())}
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 py-3.5 text-sm font-black uppercase tracking-widest text-black active:scale-95"
          >
            {canPlayMore && result ? '⚔️ Siguiente duelo' : 'Volver a las cartas'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowBracket((v) => !v)}
          className="rounded-2xl border border-white/15 bg-white/5 py-3 text-xs font-black uppercase tracking-widest text-white/70 active:scale-95"
        >
          {showBracket ? 'Volver al duelo' : '📋 Ver cuadro'}
        </button>
      </div>
    </motion.div>
  );
}

function ResultView({
  result,
  name,
}: {
  result: { winner: string; loser: string; events: TournamentEvent[] };
  name: (id: string) => string;
}) {
  return (
    <div className="mt-4 w-full max-w-md">
      <p className="text-3xl font-black text-white">🏅 {result.winner}</p>
      <p className="mt-1 text-sm font-bold text-amber-300">pasa de ronda y reparte 1</p>
      <p className="mt-3 text-base font-bold text-red-300">{result.loser} bebe 2</p>
      {result.events.map((e, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-4 rounded-2xl border border-yellow-300/50 bg-yellow-400/10 p-4"
        >
          {e.type === 'tournament_champion' ? (
            <p className="text-xl font-black text-yellow-200">
              👑 ¡{name(e.playerId)} gana el torneo! Reparte 5.
            </p>
          ) : e.kind === 'repesca' ? (
            <p className="text-lg font-black text-violet-200">
              🥈 {name(e.playerId)} es el rey de la repesca. Reparte 3.
            </p>
          ) : e.kind === 'main' ? (
            <p className="text-lg font-black text-amber-200">
              🏆 {name(e.playerId)} gana la {e.bracketName}
            </p>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}

function BracketView({ tournament, name }: { tournament: LiveTournament; name: (id: string) => string }) {
  return (
    <div className="mt-3 w-full max-w-md space-y-3 text-left">
      {tournament.brackets.map((b) => {
        const levels = [...new Set(b.matches.map((m) => m.level))].sort((x, y) => x - y);
        const waitingIds = b.queues.flat();
        return (
          <div key={b.id} className={`rounded-2xl border bg-white/5 p-3 ${TONE[b.kind]}`}>
            <p className="text-xs font-black uppercase tracking-wider">
              {b.name}
              {b.champion && <span className="ml-2 text-white">· 👑 {name(b.champion)}</span>}
            </p>
            {levels.map((level) => (
              <div key={level} className="mt-2">
                <p className="text-[10px] font-bold uppercase text-white/40">{roundName(b, level)}</p>
                {b.matches
                  .filter((m) => m.level === level)
                  .map((m) => (
                    <p key={m.id} className="text-sm text-white/80">
                      <span className={m.winner === m.p1 ? 'font-black text-white' : ''}>{name(m.p1)}</span>
                      {' vs '}
                      <span className={m.winner === m.p2 ? 'font-black text-white' : ''}>{name(m.p2)}</span>
                      {!m.winner && <span className="text-amber-300"> · pendiente</span>}
                    </p>
                  ))}
              </div>
            ))}
            {waitingIds.length > 0 && !b.done && (
              <p className="mt-2 text-[11px] text-white/50">Esperando rival: {waitingIds.map(name).join(', ')}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
