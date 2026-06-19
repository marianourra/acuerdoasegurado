-- Vincular asistentes con usuarios de auth para el rol exclusivo de asistente.
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE asistentes
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS email text;

CREATE INDEX IF NOT EXISTS idx_asistentes_user_id ON asistentes(user_id);

-- Políticas RLS completas (claims, tablas relacionadas, admin/asistente/productor):
--   supabase-asistentes-staff-rls.sql
--
-- Si reclamos quedaron en id legacy de asistente:
--   supabase-asistentes-claims-reassign.sql
