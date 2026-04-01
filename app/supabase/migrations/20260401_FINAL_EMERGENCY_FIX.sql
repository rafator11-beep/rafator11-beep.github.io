-- ELIMINACIÓN DE RESTRICCIONES DE MODO (Para permitir cualquier juego nuevo)
ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_mode_check;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_mode_check;

-- POLÍTICAS DE SEGURIDAD ROBUSTAS (Para evitar errores 400 por permisos)
-- Tabla PLAYERS
DROP POLICY IF EXISTS "Allow all on players" ON public.players;
CREATE POLICY "Allow all on players" ON public.players 
FOR ALL USING (true) WITH CHECK (true);

-- Tabla GAMES
DROP POLICY IF EXISTS "Allow all on games" ON public.games;
CREATE POLICY "Allow all on games" ON public.games 
FOR ALL USING (true) WITH CHECK (true);

-- Tabla TEAMS
DROP POLICY IF EXISTS "Allow all on teams" ON public.teams;
CREATE POLICY "Allow all on teams" ON public.teams 
FOR ALL USING (true) WITH CHECK (true);

-- Tabla QUESTIONS
DROP POLICY IF EXISTS "Allow all on questions" ON public.questions;
CREATE POLICY "Allow all on questions" ON public.questions 
FOR ALL USING (true) WITH CHECK (true);

-- Tabla PROFILES (Asegurar que cualquiera puede registrarse al entrar)
DROP POLICY IF EXISTS "Public profiles can be inserted by anyone" ON public.profiles;
CREATE POLICY "Public profiles can be inserted by anyone" ON public.profiles 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles 
FOR SELECT USING (true);

-- HABILITAR REALTIME (Para que los jugadores aparezcan al instante)
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
