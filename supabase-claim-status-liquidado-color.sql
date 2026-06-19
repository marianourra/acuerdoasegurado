-- Colores de estados: En negociación y Liquidado (Liquidado único, distinto de Sin acuerdo).
-- Ejecutar en Supabase SQL Editor.

-- 1) Ver paleta actual (revisar antes y después)
SELECT name, color, order_index
FROM public.claim_statuses
ORDER BY order_index;

-- 2) En negociación → ámbar (solo si ningún otro estado lo usa ya)
UPDATE public.claim_statuses AS cs
SET color = '#f59e0b'
WHERE cs.name ILIKE 'en negociaci%'
  AND NOT EXISTS (
    SELECT 1
    FROM public.claim_statuses AS other
    WHERE other.id <> cs.id
      AND lower(trim(other.color)) = '#f59e0b'
  );

-- Si ámbar ya está tomado, fallback naranja para En negociación
UPDATE public.claim_statuses AS cs
SET color = '#ea580c'
WHERE cs.name ILIKE 'en negociaci%'
  AND lower(trim(cs.color)) NOT IN ('#f59e0b', '#ea580c')
  AND NOT EXISTS (
    SELECT 1
    FROM public.claim_statuses AS other
    WHERE other.id <> cs.id
      AND lower(trim(other.color)) = '#ea580c'
  );

-- 3) Liquidado → primer color libre de la paleta (no usado por ningún otro estado)
UPDATE public.claim_statuses AS cs
SET color = picked.color
FROM (
  SELECT c AS color
  FROM unnest(ARRAY[
    '#0891b2',  -- cyan (recomendado: distinto de grises/rojos/verdes habituales)
    '#7c3aed',  -- violeta
    '#c026d3',  -- fucsia
    '#0d9488',  -- teal
    '#4f46e5',  -- índigo
    '#be123c'   -- rosa oscuro
  ]::text[]) AS c
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.claim_statuses AS other
    WHERE lower(trim(other.color)) = lower(trim(c))
      AND other.name NOT ILIKE 'liquidado'
  )
  ORDER BY c
  LIMIT 1
) AS picked
WHERE cs.name ILIKE 'liquidado';

-- 4) Verificación: no debe haber colores duplicados
SELECT
  lower(trim(color)) AS color,
  array_agg(name ORDER BY order_index) AS estados,
  COUNT(*) AS cantidad
FROM public.claim_statuses
GROUP BY lower(trim(color))
HAVING COUNT(*) > 1;

-- Si la query anterior devuelve filas, hay duplicados que conviene corregir manualmente.

SELECT name, color, order_index
FROM public.claim_statuses
WHERE name ILIKE 'en negociaci%'
   OR name ILIKE 'liquidado'
   OR name ILIKE 'sin acuerdo'
ORDER BY order_index;
