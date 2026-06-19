-- Vincular cuentas Auth ya creadas con la tabla asistentes.
-- Ejecutar en Supabase SQL Editor (como postgres / bypass RLS).

INSERT INTO asistentes (nombre, email, user_id)
VALUES
  ('Candela Martinez', 'martinezcandela60@gmail.com', '990bb3cc-3049-402f-81cc-aff553d5c34f'),
  ('Lautaro Catelli', 'lautarocatelli@gmail.com', '681eab55-b0f3-4703-802b-87019911c129')
ON CONFLICT (user_id) DO UPDATE
SET nombre = EXCLUDED.nombre,
    email = EXCLUDED.email;

-- Si ya existían filas por nombre (sin user_id), preferir actualizar en lugar de duplicar:
-- UPDATE asistentes SET user_id = '990bb3cc-3049-402f-81cc-aff553d5c34f', email = 'martinezcandela60@gmail.com'
-- WHERE nombre ILIKE 'Candela Martinez' AND user_id IS NULL;
-- UPDATE asistentes SET user_id = '681eab55-b0f3-4703-802b-87019911c129', email = 'lautarocatelli@gmail.com'
-- WHERE nombre ILIKE 'Lautaro Catelli' AND user_id IS NULL;
