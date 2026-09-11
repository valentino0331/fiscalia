-- Asegura la columna is_admin si no existe
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Marcar los usuarios administradores (Reemplaza con los correos reales de tus administradores)
UPDATE users
SET is_admin = TRUE
WHERE email IN (
  'admin@bufete.pe',
  'socio@bufete.pe'
);

-- Verificar
SELECT id, email, is_admin, created_at
FROM users
WHERE is_admin = TRUE;
