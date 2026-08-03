-- Tick de 15 minutos para /api/cron/pipeline.
--
-- Por qué aquí y no en vercel.json: el plan Hobby de Vercel permite un solo
-- cron diario, y ese ya lo ocupa /api/cron/followups. pg_cron + pg_net
-- disparan el endpoint desde la misma base de datos, sin costo extra.
--
-- Ejecutar UNA VEZ en el SQL Editor del proyecto de producción, sustituyendo
-- REEMPLAZA_CON_CRON_SECRET por el valor real de CRON_SECRET en Vercel.
-- Este archivo vive fuera de migrations/ justamente porque lleva ese secreto.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'pensionmas-pipeline',
  '*/15 * * * *',
  $$
  select net.http_get(
    url := 'https://www.pensionmas.com.mx/api/cron/pipeline',
    headers := '{"Authorization": "Bearer REEMPLAZA_CON_CRON_SECRET"}'::jsonb
  );
  $$
);

-- Verificar que quedó programado:
--   select jobid, schedule, jobname, active from cron.job;
-- Ver las últimas corridas:
--   select * from cron.job_run_details order by start_time desc limit 20;
-- Quitarlo:
--   select cron.unschedule('pensionmas-pipeline');
