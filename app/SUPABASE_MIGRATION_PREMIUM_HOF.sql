-- Premium Hall of Fame support
-- Ejecuta esto en Supabase para guardar insignias/temporadas/rachas en la nube.

alter table if exists public.profiles
  add column if not exists badges jsonb default '{}'::jsonb;

-- Opcional: mantener realtime de perfiles para refresco instantáneo del Hall of Fame.
do $$
begin
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then
    null;
  end;
end $$;
