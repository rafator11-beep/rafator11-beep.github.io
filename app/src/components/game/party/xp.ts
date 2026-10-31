// ─── XP Rewards (fuente única de verdad) ─────────────────────────────────────
export const XP = {
  RETO_DONE: 30, // completar un reto individual
  RETO_FAIL: 0, // fallar reto (penalización es beber, no perder XP)
  VERDAD_TOLD: 20, // contar la verdad en "verdad o bebe"
  VERDAD_DRINK: 5, // pasar y beber (valentía al menos)
  YO_NUNCA_YES: 12, // haber hecho el yo nunca (honestidad)
  YO_NUNCA_NO: 3, // no haberlo hecho
  VOTED_MOST: 15, // ser señalado en votación (popularidad)
  DUELO_WIN: 45, // ganar un duelo
  DUELO_LOSE: 8, // perder duelo (consolación)
  TORNEO_WIN: 80, // ganar torneo
  TORNEO_LOSE: 10, // participar en torneo
  IMPOSTOR_CAUGHT: 25, // grupo detecta al impostor
  IMPOSTOR_WIN: 60, // impostor sobrevive sin ser detectado
  NORMA_CUMPLIDA: 10, // respetar norma activa hasta el final
  CAPITAN_ACTION: 15, // el capitán ejerce un comando
  DRINK_BRAVE: 5, // beber voluntariamente (valentía)
} as const;
