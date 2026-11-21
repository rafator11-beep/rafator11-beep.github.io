-- ════════════════════════════════════════════════════════════════════════
-- user_stats: columnas que usa el ranking en la nube (useRanking.ts)
-- ════════════════════════════════════════════════════════════════════════
-- La tabla real se creó con otra estructura (name, user_id, avatar_url,
-- games_played, games_won, updated_at) y la migración 20260401 no llegó a
-- aplicarse porque usaba CREATE TABLE IF NOT EXISTS. El código busca id,
-- player_name, total_wins y total_xp, así que toda consulta daba 400 y el
-- ranking nunca guardaba nada.
--
-- Se puede ejecutar varias veces: todo es IF NOT EXISTS o comprueba antes.
-- Cómo: panel de Supabase → SQL Editor → pegar esto → Run.

-- 1. Columnas que faltan
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS player_name TEXT;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS games_won INTEGER DEFAULT 0;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_stats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE public.user_stats SET id = gen_random_uuid() WHERE id IS NULL;
UPDATE public.user_stats SET player_name = name WHERE player_name IS NULL AND name IS NOT NULL;
UPDATE public.user_stats SET name = player_name WHERE name IS NULL AND player_name IS NOT NULL;
ALTER TABLE public.user_stats ALTER COLUMN id SET NOT NULL;

-- 2. Clave principal en id y user_id opcional (los invitados no tienen cuenta)
DO $$
DECLARE
  pk_name TEXT;
  pk_has_user_id BOOLEAN;
BEGIN
  SELECT c.conname INTO pk_name
  FROM pg_constraint c
  WHERE c.conrelid = 'public.user_stats'::regclass AND c.contype = 'p';

  SELECT EXISTS (
    SELECT 1
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
    WHERE i.indrelid = 'public.user_stats'::regclass AND i.indisprimary AND a.attname = 'user_id'
  ) INTO pk_has_user_id;

  -- Si la clave principal era user_id, no se pueden guardar invitados (user_id
  -- vacío): pasa a ser id, y user_id queda único solo cuando lo hay.
  IF pk_name IS NOT NULL AND pk_has_user_id THEN
    EXECUTE format('ALTER TABLE public.user_stats DROP CONSTRAINT %I', pk_name);
    pk_name := NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS user_stats_user_id_key
      ON public.user_stats (user_id) WHERE user_id IS NOT NULL;
  END IF;

  IF pk_name IS NULL THEN
    ALTER TABLE public.user_stats ADD PRIMARY KEY (id);
  END IF;

  ALTER TABLE public.user_stats ALTER COLUMN user_id DROP NOT NULL;
END $$;

-- 3. name y player_name siempre iguales (unas partes de la app leen una y
--    otras la otra). BEFORE: se rellena antes de comprobar los NOT NULL.
CREATE OR REPLACE FUNCTION public.user_stats_sync_names()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.player_name := COALESCE(NEW.player_name, NEW.name);
  NEW.name := COALESCE(NEW.name, NEW.player_name);
  NEW.games_won := GREATEST(COALESCE(NEW.games_won, 0), COALESCE(NEW.total_wins, 0));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_stats_sync_names ON public.user_stats;
CREATE TRIGGER user_stats_sync_names
  BEFORE INSERT OR UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.user_stats_sync_names();

-- 4. Búsqueda de invitados por nombre (la que hace useRanking)
CREATE INDEX IF NOT EXISTS user_stats_guest_name_idx
  ON public.user_stats (lower(player_name)) WHERE user_id IS NULL;

-- 5. Permisos: leer todo el mundo; escribir la app (igual que la 20260401)
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  has_cmd TEXT[];
BEGIN
  SELECT COALESCE(array_agg(cmd), '{}') INTO has_cmd
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_stats';

  IF NOT ('SELECT' = ANY (has_cmd) OR 'ALL' = ANY (has_cmd))
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
                     AND tablename = 'user_stats' AND policyname = 'User stats are viewable by everyone') THEN
    CREATE POLICY "User stats are viewable by everyone"
      ON public.user_stats FOR SELECT USING (true);
  END IF;

  -- El ranking inserta (invitado nuevo) y actualiza (siguientes partidas).
  IF NOT ('ALL' = ANY (has_cmd) OR ('INSERT' = ANY (has_cmd) AND 'UPDATE' = ANY (has_cmd)))
     AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
                     AND tablename = 'user_stats' AND policyname = 'System can modify user stats') THEN
    CREATE POLICY "System can modify user stats"
      ON public.user_stats FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Que la API vea las columnas nuevas sin esperar
NOTIFY pgrst, 'reload schema';
