-- ============================================
-- MIGRACIÓN: Agregar autenticación a jugadores
-- ============================================
-- Esta migración permite que los jugadores tengan cuentas
-- de usuario para autenticarse y cargar resultados

-- Agregar columna para vincular con auth.users
ALTER TABLE players
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índice para búsquedas rápidas por usuario
CREATE INDEX idx_players_auth_user_id ON players(auth_user_id);

-- Comentario explicativo
COMMENT ON COLUMN players.auth_user_id IS 'ID del usuario en auth.users - permite al jugador autenticarse y cargar resultados';
