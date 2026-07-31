CREATE TABLE content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (item_id, channel, snapshot_date)
);

CREATE TABLE ads_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  snapshot_date DATE NOT NULL,
  spend NUMERIC(12,2),
  impressions BIGINT,
  clicks BIGINT,
  leads_reported BIGINT,
  UNIQUE (campaign_id, snapshot_date)
);

-- Solo service role (RLS sin políticas), igual que content_items.
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_metrics ENABLE ROW LEVEL SECURITY;
