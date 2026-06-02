ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS certifications jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Enable realtime on connect_messages for inbox badge notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.connect_messages;
ALTER TABLE public.connect_messages REPLICA IDENTITY FULL;