CREATE TYPE lead_source AS ENUM ('WEB_APP','WHATSAPP_DIRECT','FB_COMMENT','IG_DM','MANUAL');
CREATE TYPE lead_status AS ENUM ('NEW','QUALIFIED','REJECTED','CONTRACT_PENDING','CONTRACT_SIGNED','DISPERSED','PAID');

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  source lead_source DEFAULT 'WEB_APP',
  status lead_status DEFAULT 'NEW',
  chat_state TEXT DEFAULT 'START',
  full_name TEXT,
  nss VARCHAR(11) UNIQUE,
  curp VARCHAR(18) UNIQUE,
  phone VARCHAR(15) NOT NULL,
  email TEXT,
  fecha_baja DATE,
  monthly_salary NUMERIC(10,2),
  years_contributing NUMERIC(4,1),
  last_withdrawal_within_5y BOOLEAN,
  estimated_payout_min NUMERIC(10,2),
  estimated_payout_max NUMERIC(10,2),
  commission_amount NUMERIC(10,2) DEFAULT 5000.00,
  rejection_reason TEXT,
  privacy_consent_at TIMESTAMPTZ,
  source_ref TEXT,
  admin_notes TEXT,
  human_takeover BOOLEAN DEFAULT FALSE
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sign_token UUID UNIQUE DEFAULT gen_random_uuid(),
  sign_token_expires_at TIMESTAMPTZ NOT NULL,
  signed_at TIMESTAMPTZ,
  otp_phone VARCHAR(15),
  otp_code_hash TEXT,
  otp_expires_at TIMESTAMPTZ,
  otp_attempts INT DEFAULT 0,
  otp_verified_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  signature_path TEXT,
  pdf_path TEXT,
  sha256_hash TEXT,
  psc_certificate_id TEXT,
  commission_amount NUMERIC(10,2),
  folio TEXT UNIQUE
);

CREATE TABLE lead_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX lead_events_lead_id_idx ON lead_events (lead_id, created_at);
CREATE INDEX leads_status_idx ON leads (status);
CREATE INDEX leads_phone_idx ON leads (phone);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Deny-all: sin policies. Todo acceso pasa por el server con service role;
-- la autorización de staff se verifica en la capa de aplicación.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public) VALUES ('contracts','contracts', false)
  ON CONFLICT (id) DO NOTHING;
