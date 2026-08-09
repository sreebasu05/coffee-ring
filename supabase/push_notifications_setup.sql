-- Enable required extensions for scheduled HTTP jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.cr_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_json JSONB NOT NULL,
    timezone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Prevent duplicate subscriptions per device
    UNIQUE(user_id, subscription_json)
);

-- Enable RLS
ALTER TABLE public.cr_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
    ON public.cr_push_subscriptions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Schedule the Edge Function (pg_cron)
-- This schedules the job to run every 4 hours.
SELECT cron.schedule(
  'send-daily-reminders',
  '0 */4 * * *',
  $$
    SELECT net.http_post(
        url:='https://xpgemlduowqbqkaetupu.supabase.co/functions/v1/send-reminders',
        headers:='{"Authorization": "Bearer sb_publishable_Jy1oZCwmmfSZ2Jd17NEEMA_K8JrN1cG"}'::jsonb,
        body:='{}'::jsonb
    );
  $$
);
