-- Revisión del caso antes de pedir la firma: el contrato deja de crearse al
-- calificar y se envía una hora después, tras el semáforo de revisión.
ALTER TABLE leads
  ADD COLUMN review_level TEXT,
  ADD COLUMN review_flags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN contract_due_at TIMESTAMPTZ,
  ADD COLUMN advisor_name TEXT,
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN reviewed_by TEXT,
  ADD COLUMN expediente_actualizado TEXT,
  ADD COLUMN cuenta_bancaria TEXT;

CREATE INDEX leads_contract_due_idx ON leads (contract_due_at)
  WHERE contract_due_at IS NOT NULL;

-- Honorarios por porcentaje del depósito real. commission_amount se conserva
-- para los contratos ya firmados con monto fijo.
ALTER TABLE contracts
  ADD COLUMN commission_pct NUMERIC(5,2) DEFAULT 10.00,
  ADD COLUMN dispersed_amount NUMERIC(10,2);

-- Backfill: los leads QUALIFIED que ya existen quedarían con review_level NULL,
-- y en ese estado nadie los toca — el cron exige GREEN, el panel no dibuja la
-- tarjeta de revisión sin nivel, y el recordatorio de NSS dejó de aplicarles
-- porque ya tienen NSS. Entran como AMBER para que aparezcan en el aviso de
-- revisión humana; nunca se autoenvían, que es lo prudente con leads viejos.
UPDATE leads
SET review_level = 'AMBER',
    review_flags = '[{"code":"lead_previo","label":"Lead anterior al flujo de revisión: confirma sus datos antes de enviar el contrato.","level":"AMBER"}]'::jsonb,
    contract_due_at = NOW()
WHERE status = 'QUALIFIED'
  AND nss IS NOT NULL
  AND review_level IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.lead_id = leads.id AND c.signed_at IS NULL
  );
