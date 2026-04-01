-- AÑADIR COLUMNA updated_at QUE EL TRIGGER "on_update_timestamp" ESPERA
-- Esto soluciona el error: record "new" has no field "updated_at"

-- Tabla PLAYERS
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Tabla TEAMS
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Asegurar que el trigger para actualizar la fecha existe (habitual en Supabase)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger a las tablas si no lo tienen
DROP TRIGGER IF EXISTS set_updated_at ON public.players;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.players
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.teams;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- También para GAMES por si acaso (aunque los campos TS lo reflejen)
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at ON public.games;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
