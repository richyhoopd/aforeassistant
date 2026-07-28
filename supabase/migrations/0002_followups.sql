-- supabase/migrations/0002_followups.sql
ALTER TABLE leads ADD COLUMN do_not_contact BOOLEAN DEFAULT FALSE;
