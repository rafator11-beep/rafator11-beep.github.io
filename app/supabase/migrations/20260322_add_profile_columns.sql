ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS claim_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;

-- Crear o reemplazar el trigger para `updated_at` en `public.profiles`
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
