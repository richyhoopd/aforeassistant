-- Acompañamiento post-firma de inicio a fin (spec 2026-08-06).
-- Checklist de requisitos previos a la solicitud, respuesta del formulario
-- sobre procesos de contratación, carátula de AFORE y cierre del cobro.

alter table public.leads
  add column if not exists hiring_process boolean,
  add column if not exists caratula_path text,
  add column if not exists chk_datos_at timestamptz,
  add column if not exists chk_app_at timestamptz,
  add column if not exists chk_tarjeta_at timestamptz,
  add column if not exists chk_caratula_at timestamptz,
  add column if not exists solicitud_hecha_at timestamptz;

alter table public.contracts
  add column if not exists paid_at timestamptz,
  add column if not exists paid_amount numeric(12,2);

comment on column public.leads.hiring_process is
  'Respuesta del pre-calificador: ¿está en un proceso de contratación? Un alta en el IMSS antes del depósito tira el trámite.';
comment on column public.leads.caratula_path is
  'Carátula del estado de cuenta AFORE subida en el pre-calificador (bucket contracts).';
comment on column public.leads.solicitud_hecha_at is
  'El asesor marca cuando el cliente ya presentó su solicitud en su app, acompañado.';
