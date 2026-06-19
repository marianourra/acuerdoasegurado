-- Reasigna reclamos del registro legacy de asistente (sin login) al registro con cuenta Auth.
-- Ejecutar DESPUÉS de supabase-asistentes-link-candela-lautaro.sql y supabase-asistentes-staff-rls.sql
-- si los reclamos quedaron vinculados al id antiguo de la tabla asistentes.

-- Candela Martinez
UPDATE public.claims c
SET asistente_id = a_login.id
FROM public.asistentes a_legacy
JOIN public.asistentes a_login
  ON a_login.email = 'martinezcandela60@gmail.com'
WHERE c.asistente_id = a_legacy.id
  AND a_legacy.id <> a_login.id
  AND (
    a_legacy.nombre ILIKE '%Candela%Martinez%'
    OR a_legacy.nombre ILIKE '%Candela Martinez%'
  );

-- Lautaro Catelli
UPDATE public.claims c
SET asistente_id = a_login.id
FROM public.asistentes a_legacy
JOIN public.asistentes a_login
  ON a_login.email = 'lautarocatelli@gmail.com'
WHERE c.asistente_id = a_legacy.id
  AND a_legacy.id <> a_login.id
  AND (
    a_legacy.nombre ILIKE '%Lautaro%Catelli%'
    OR a_legacy.nombre ILIKE '%Lautaro Catelli%'
  );

-- Verificación
SELECT a.email, a.nombre, a.user_id, COUNT(c.id) AS reclamos
FROM public.asistentes a
LEFT JOIN public.claims c ON c.asistente_id = a.id
WHERE a.email IN ('martinezcandela60@gmail.com', 'lautarocatelli@gmail.com')
GROUP BY a.id, a.email, a.nombre, a.user_id
ORDER BY a.email;
