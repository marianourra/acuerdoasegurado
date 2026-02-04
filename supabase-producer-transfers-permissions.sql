-- ============================================================
-- Permisos para la tabla producer_transfers (Supabase)
-- Ejecutá este script en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1) Dar permisos de tabla al rol que usa la app (logged-in = authenticated)
GRANT SELECT, INSERT ON public.producer_transfers TO authenticated;
-- Si también usás anon para algo relacionado:
-- GRANT SELECT, INSERT ON public.producer_transfers TO anon;

-- 2) Si tenés RLS (Row Level Security) activo en producer_transfers,
--    el GRANT solo no alcanza: necesitás políticas que permitan al admin.

-- Habilitar RLS en la tabla (solo si aún no está)
-- ALTER TABLE public.producer_transfers ENABLE ROW LEVEL SECURITY;

-- Política: usuarios que son productores admin pueden ver todas las transferencias
CREATE POLICY "Admin puede SELECT producer_transfers"
ON public.producer_transfers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.producers
    WHERE producers.user_id = auth.uid()
    AND producers.is_admin = true
  )
);

-- Política: usuarios que son productores admin pueden insertar transferencias
CREATE POLICY "Admin puede INSERT producer_transfers"
ON public.producer_transfers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.producers
    WHERE producers.user_id = auth.uid()
    AND producers.is_admin = true
  )
);

-- Política (opcional): productores no-admin solo ven sus propias transferencias
CREATE POLICY "Productor ve sus transferencias"
ON public.producer_transfers
FOR SELECT
TO authenticated
USING (
  producer_id IN (
    SELECT id FROM public.producers WHERE user_id = auth.uid()
  )
);

-- ============================================================
-- Si las políticas ya existen y solo querés los GRANT, ejecutá solo:
--   GRANT SELECT, INSERT ON public.producer_transfers TO authenticated;
-- ============================================================
