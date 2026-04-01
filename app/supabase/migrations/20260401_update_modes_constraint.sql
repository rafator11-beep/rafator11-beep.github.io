-- 1. Eliminar restricciones antiguas de la tabla games
ALTER TABLE public.games DROP CONSTRAINT IF EXISTS games_mode_check;

-- 2. Añadir nueva restricción con todos los modos actuales a games
ALTER TABLE public.games ADD CONSTRAINT games_mode_check 
CHECK (mode IN (
  'futbol', 'megamix', 'clasico', 'yo_nunca', 'yo_nunca_equipos', 
  'picante', 'cultura', 'espana', 'votacion', 'pacovers', 
  'trivia_futbol', 'tictactoe', 'poker', 'parchis', 'megaboard',
  'mix', 'social' -- Legacy
));

-- 3. Eliminar restricciones antiguas de la tabla questions
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_mode_check;

-- 4. Añadir nueva restricción con todos los modos actuales a questions
ALTER TABLE public.questions ADD CONSTRAINT questions_mode_check 
CHECK (mode IN (
  'futbol', 'megamix', 'clasico', 'yo_nunca', 'yo_nunca_equipos', 
  'picante', 'cultura', 'espana', 'votacion', 'pacovers', 
  'trivia_futbol', 'tictactoe', 'poker', 'parchis', 'megaboard',
  'mix', 'social'
));

-- 5. Asegurar que los perfiles tengan una estructura robusta para evitar errores 400
-- Si la tabla profiles existe, nos aseguramos que RLS permita inserciones anónimas si es necesario
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        DROP POLICY IF EXISTS "Public profiles can be inserted by anyone" ON public.profiles;
        CREATE POLICY "Public profiles can be inserted by anyone" ON public.profiles FOR INSERT WITH CHECK (true);
    END IF;
END $$;
