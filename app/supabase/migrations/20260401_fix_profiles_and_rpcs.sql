-- 1. Crear tabla de perfiles (si no existe)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_guest BOOLEAN DEFAULT FALSE,
  claim_code TEXT UNIQUE,
  claim_expires_at TIMESTAMPTZ,
  coins INTEGER DEFAULT 0,
  gems INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb
);

-- 2. Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas públicas para profiles (necesario para rankings y comunidad)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles can be inserted by anyone" ON public.profiles FOR INSERT WITH CHECK (true);

-- 4. Crear tabla de estadísticas de usuario (si no existe)
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_name TEXT,
  avatar_url TEXT,
  total_wins INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Habilitar RLS en user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User stats are viewable by everyone" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "System can modify user stats" ON public.user_stats FOR ALL USING (true) WITH CHECK (true);

-- 6. RPC register_guest_event (Faltante para seguimiento)
CREATE OR REPLACE FUNCTION public.register_guest_event(
  p_game_id TEXT,
  p_event_type TEXT,
  p_actor_user_id UUID,
  p_tab_id TEXT,
  p_mode_id TEXT,
  p_play_mode TEXT,
  p_score INTEGER,
  p_is_winner BOOLEAN,
  p_player_name TEXT,
  p_avatar_url TEXT
) RETURNS VOID AS $$
BEGIN
  -- Lógica simple para registrar el evento y actualizar estadísticas si el actor_user_id existe
  INSERT INTO public.user_stats (user_id, player_name, avatar_url, total_wins, total_xp, games_played)
  VALUES (
    p_actor_user_id,
    p_player_name,
    p_avatar_url,
    CASE WHEN p_is_winner THEN 1 ELSE 0 END,
    p_score,
    1
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_wins = user_stats.total_wins + EXCLUDED.total_wins,
    total_xp = user_stats.total_xp + EXCLUDED.total_xp,
    games_played = user_stats.games_played + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Asegurar que las tablas de juegos sean compatibles con tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stats;
