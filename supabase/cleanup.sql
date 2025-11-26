-- ============================================
-- SCRIPT DE LIMPIEZA DE BASE DE DATOS
-- ============================================
-- Este script elimina todos los datos de la base de datos
-- pero mantiene la estructura (tablas, funciones, políticas)
-- Útil para limpiar antes de correr tests o resetear la aplicación

-- IMPORTANTE: Ejecutar este script borrará TODOS los datos

-- Deshabilitar triggers temporalmente para evitar problemas
SET session_replication_role = replica;

-- Eliminar todos los datos (en orden correcto para evitar problemas de FK)
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE standings CASCADE;
TRUNCATE TABLE rounds CASCADE;
TRUNCATE TABLE players CASCADE;
TRUNCATE TABLE categories CASCADE;

-- Rehabilitar triggers
SET session_replication_role = DEFAULT;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Base de datos limpiada exitosamente. Todas las tablas están vacías.';
END $$;
