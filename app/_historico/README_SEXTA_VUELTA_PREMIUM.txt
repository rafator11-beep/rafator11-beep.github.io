SEXTA VUELTA PREMIUM

Qué se ha añadido:
- Sistema de logros/insignias premium persistentes.
- Temporadas premium en Hall of Fame.
- Ranking nuevo por rachas.
- Premios especiales: Season Royalty, Hot Streak, Hall Collector y Clutch Master.
- Persistencia local automática de insignias, rachas y progreso de temporada.
- Sincronización en la nube para usuarios registrados cuando Supabase admite el campo profiles.badges.
- Modal de logros premium actualizado en Perfiles.

Archivos clave:
- src/lib/premiumProgression.ts
- src/pages/HallOfFame.tsx
- src/pages/Profiles.tsx
- src/hooks/useRanking.ts
- SUPABASE_MIGRATION_PREMIUM_HOF.sql

Notas:
- Si no aplicas la migración SQL, el sistema premium sigue funcionando en local.
- Si aplicas la migración, los usuarios registrados podrán conservar mejor sus insignias y progreso premium entre dispositivos.
