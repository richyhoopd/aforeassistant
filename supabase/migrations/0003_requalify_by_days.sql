-- Señal estructurada del followup "ya califica": la evaluación quedó bloqueada
-- únicamente por días de desempleo. NULL = lead anterior a esta columna
-- (el cron cae al texto de rejection_reason como fallback).
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS requalify_by_days boolean;
