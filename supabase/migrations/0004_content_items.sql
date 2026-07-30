-- supabase/migrations/0003_content_items.sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tema TEXT NOT NULL,
  formato TEXT NOT NULL,
  plantilla TEXT NOT NULL DEFAULT 'tarjeta',
  copy_base TEXT,
  captions JSONB NOT NULL DEFAULT '{}'::jsonb,   -- {"fb": "...", "ig": "...", "grupo": "...", "tiktok": "..."}
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- lista de URLs públicas (1..5 láminas)
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,   -- ["fb_page","ig","grupo","tiktok"]
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','published')),
  scheduled_at TIMESTAMPTZ,
  source TEXT,                                   -- ?source= para atribución
  publish_ids JSONB NOT NULL DEFAULT '{}'::jsonb,-- {"fb_page": "id", "ig": "id", "handoff": "sent"}
  last_error TEXT
);

-- Solo el service role toca esta tabla (RLS sin políticas).
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public) VALUES ('content-media','content-media', true)
ON CONFLICT (id) DO NOTHING;
