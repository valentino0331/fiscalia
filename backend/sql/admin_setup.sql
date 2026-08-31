-- Asegura la columna is_admin si no existe
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Marcar los dos usuarios administradores
UPDATE users
SET is_admin = TRUE
WHERE email IN ('marca0331@outlook.es', 'rafaelortega2016@outlook.es');

-- Verificar
SELECT id, email, is_admin, created_at
FROM users
WHERE email IN ('marca0331@outlook.es', 'rafaelortega2016@outlook.es');
