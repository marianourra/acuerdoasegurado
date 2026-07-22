-- Novedades de gestión visibles al productor, ordenadas por fecha.
-- Cada elemento del array: { "date": "YYYY-MM-DD", "text": "..." }.
-- Complementa (no reemplaza) el texto libre de `description` ("Observaciones").
-- Ejecutar en Supabase → SQL Editor.

ALTER TABLE public.claims
  ADD COLUMN IF NOT EXISTS producer_updates jsonb NOT NULL DEFAULT '[]'::jsonb;
