-- ============================================
-- LIGA DE TENIS - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: categories (Categorías de la liga)
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(name, season_year)
);

-- Índices
CREATE INDEX idx_categories_season ON categories(season_year);

-- ============================================
-- TABLA: players (Jugadores)
-- ============================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,

  -- Autenticación (v2.0)
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Categorías (opcionales hasta que se asigna el jugador a una liga)
  initial_category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  current_category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,

  -- Estado
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  -- Metadata
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deactivated_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_players_current_category ON players(current_category_id);
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_auth_user_id ON players(auth_user_id);

-- ============================================
-- TABLA: rounds (Fechas/Rondas)
-- ============================================
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,

  -- Fechas calendario
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Estado
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'completed', 'expired')),

  -- Metadata
  closed_by_admin_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(category_id, round_number),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

-- Índices
CREATE INDEX idx_rounds_category ON rounds(category_id);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_rounds_period ON rounds(period_start, period_end);

-- ============================================
-- TABLA: matches (Partidos)
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relaciones
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  player2_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,

  -- Resultado
  winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
  is_walkover BOOLEAN DEFAULT FALSE,
  walkover_reason TEXT,
  is_bye BOOLEAN DEFAULT FALSE,
  is_not_reported BOOLEAN DEFAULT FALSE,

  -- Sets
  set1_player1_games INTEGER CHECK (set1_player1_games >= 0),
  set1_player2_games INTEGER CHECK (set1_player2_games >= 0),
  set2_player1_games INTEGER CHECK (set2_player1_games >= 0),
  set2_player2_games INTEGER CHECK (set2_player2_games >= 0),
  set3_player1_games INTEGER CHECK (set3_player1_games >= 0),
  set3_player2_games INTEGER CHECK (set3_player2_games >= 0),

  -- Metadata
  result_loaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT different_players CHECK (player1_id != player2_id),
  CONSTRAINT winner_is_player CHECK (
    winner_id IS NULL OR winner_id IN (player1_id, player2_id)
  )
);

-- Índices
CREATE INDEX idx_matches_round ON matches(round_id);
CREATE INDEX idx_matches_category ON matches(category_id);
CREATE INDEX idx_matches_players ON matches(player1_id, player2_id);
CREATE INDEX idx_matches_winner ON matches(winner_id);

-- ============================================
-- TABLA: standings (Tabla de Posiciones)
-- ============================================
CREATE TABLE standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relaciones
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,

  -- Estadísticas
  matches_played INTEGER NOT NULL DEFAULT 0,
  matches_won INTEGER NOT NULL DEFAULT 0,
  matches_lost INTEGER NOT NULL DEFAULT 0,
  matches_won_by_wo INTEGER NOT NULL DEFAULT 0,
  matches_lost_by_wo INTEGER NOT NULL DEFAULT 0,

  points INTEGER NOT NULL DEFAULT 0,

  sets_won INTEGER NOT NULL DEFAULT 0,
  sets_lost INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  games_lost INTEGER NOT NULL DEFAULT 0,

  -- Posición calculada
  position INTEGER,

  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(category_id, player_id)
);

-- Índices
CREATE INDEX idx_standings_category ON standings(category_id);
CREATE INDEX idx_standings_position ON standings(category_id, position);
CREATE INDEX idx_standings_points ON standings(category_id, points DESC);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rounds_updated_at BEFORE UPDATE ON rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

-- Políticas para Público (solo lectura)
CREATE POLICY "Público puede ver categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Público puede ver players activos" ON players
  FOR SELECT USING (status = 'active');

CREATE POLICY "Público puede ver rounds activas y completadas" ON rounds
  FOR SELECT USING (status IN ('active', 'completed'));

CREATE POLICY "Público puede ver matches de rounds públicas" ON matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rounds
      WHERE rounds.id = matches.round_id
      AND rounds.status IN ('active', 'completed')
    )
  );

CREATE POLICY "Público puede ver standings" ON standings
  FOR SELECT USING (true);

-- Políticas para usuarios autenticados (Admin tiene acceso completo)
-- Estas políticas permiten INSERT, UPDATE, DELETE solo a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden hacer todo en categories" ON categories
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden hacer todo en players" ON players
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden hacer todo en rounds" ON rounds
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden hacer todo en matches" ON matches
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden hacer todo en standings" ON standings
  FOR ALL USING (auth.uid() IS NOT NULL);
