-- Hacer que los campos de categoría sean opcionales en players
-- Esto permite crear jugadores sin asignarles una liga inicialmente

ALTER TABLE players
ALTER COLUMN initial_category_id DROP NOT NULL;

ALTER TABLE players
ALTER COLUMN current_category_id DROP NOT NULL;

COMMENT ON COLUMN players.initial_category_id IS 'Categoría donde el jugador se inscribió inicialmente (opcional hasta que se asigna a una liga)';
COMMENT ON COLUMN players.current_category_id IS 'Categoría actual del jugador (NULL si no está asignado a ninguna liga)';
