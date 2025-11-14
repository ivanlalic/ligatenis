-- ============================================
-- DATOS DE EJEMPLO PARA TESTING
-- ============================================

-- Insertar temporada 2026
INSERT INTO categories (name, season_year, display_order) VALUES
  ('Super A', 2026, 1),
  ('A', 2026, 2),
  ('B', 2026, 3),
  ('C', 2026, 4);

-- Insertar jugadores de ejemplo para Categoría B (20 jugadores)
INSERT INTO players (first_name, last_name, email, initial_category_id, current_category_id)
SELECT
  'Jugador' || i,
  'Apellido' || i,
  'jugador' || i || '@example.com',
  c.id,
  c.id
FROM generate_series(1, 20) i, categories c
WHERE c.name = 'B' AND c.season_year = 2026;

-- Insertar algunos jugadores en Categoría A
INSERT INTO players (first_name, last_name, email, initial_category_id, current_category_id)
SELECT
  'PlayerA' || i,
  'LastNameA' || i,
  'playera' || i || '@example.com',
  c.id,
  c.id
FROM generate_series(1, 18) i, categories c
WHERE c.name = 'A' AND c.season_year = 2026;

-- Insertar algunos jugadores conocidos en Categoría B
DO $$
DECLARE
  cat_id UUID;
BEGIN
  SELECT id INTO cat_id FROM categories WHERE name = 'B' AND season_year = 2026;

  INSERT INTO players (first_name, last_name, email, initial_category_id, current_category_id) VALUES
    ('Ivan', 'Benegas', 'ivan.benegas@example.com', cat_id, cat_id),
    ('Carlos', 'Gómez', 'carlos.gomez@example.com', cat_id, cat_id),
    ('Ana', 'López', 'ana.lopez@example.com', cat_id, cat_id),
    ('Pedro', 'Ruiz', 'pedro.ruiz@example.com', cat_id, cat_id),
    ('María', 'García', 'maria.garcia@example.com', cat_id, cat_id);
END $$;
