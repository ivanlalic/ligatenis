-- Cambiar el default de status en rounds de 'pending' a 'active'
ALTER TABLE rounds
ALTER COLUMN status SET DEFAULT 'active';

-- Actualizar rondas existentes que están en 'pending' a 'active'
UPDATE rounds
SET status = 'active'
WHERE status = 'pending';

COMMENT ON COLUMN rounds.status IS 'Estado de la ronda: pending (pendiente), active (activa), completed (completada), expired (expirada por cron)';
