-- Supabase Setup Script for HDFC Netcore Campaign Management
-- Run this in your Supabase SQL Editor

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'SCHEDULED', 'SUSPENDED', 'RUNNING', 'FAILED')),
    channel TEXT NOT NULL CHECK (channel IN ('WhatsApp', 'Email', 'SMS', 'Push')),
    sent_on TIMESTAMPTZ,
    published INTEGER DEFAULT 0,
    sent INTEGER DEFAULT 0,
    opened INTEGER DEFAULT 0,
    clicked INTEGER DEFAULT 0,
    bounce TEXT DEFAULT 'NA',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Unified Retry TTL field (used for both retry engine and Meta API)
    retry_ttl TIMESTAMPTZ, -- Unified TTL - when retry attempts should stop
    scheduled_at TIMESTAMPTZ -- When the campaign was originally scheduled
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_channel ON public.campaigns(channel);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at);
-- Indexes for retry TTL functionality
CREATE INDEX IF NOT EXISTS idx_campaigns_retry_ttl ON public.campaigns(retry_ttl) WHERE retry_ttl IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON public.campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own campaigns
CREATE POLICY "Users can view own campaigns" ON public.campaigns
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own campaigns
CREATE POLICY "Users can insert own campaigns" ON public.campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own campaigns
CREATE POLICY "Users can update own campaigns" ON public.campaigns
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own campaigns
CREATE POLICY "Users can delete own campaigns" ON public.campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Migration: Add retry_ttl column if it doesn't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'retry_ttl'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.campaigns ADD COLUMN retry_ttl TIMESTAMPTZ;
        CREATE INDEX IF NOT EXISTS idx_campaigns_retry_ttl ON public.campaigns(retry_ttl) WHERE retry_ttl IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'scheduled_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.campaigns ADD COLUMN scheduled_at TIMESTAMPTZ;
        CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON public.campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;
    END IF;
END $$;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert some sample data (optional)
INSERT INTO public.campaigns (name, status, channel, sent_on, published, sent, opened, clicked, bounce, user_id)
VALUES 
    ('Welcome Campaign', 'SENT', 'WhatsApp', NOW() - INTERVAL '2 days', 150, 150, 45, 12, 'NA', auth.uid()),
    ('Product Launch', 'DRAFT', 'Email', NULL, 0, 0, 0, 0, 'NA', auth.uid()),
    ('Holiday Promotion', 'SENT', 'SMS', NOW() - INTERVAL '1 day', 200, 195, 78, 23, '2.5%', auth.uid()),
    ('Newsletter #1', 'SCHEDULED', 'Email', NULL, 0, 0, 0, 0, 'NA', auth.uid()),
    ('Flash Sale Alert', 'RUNNING', 'Push', NOW() - INTERVAL '2 hours', 500, 480, 120, 45, '4%', auth.uid())
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;

-- Create a view for campaign statistics (optional)
CREATE OR REPLACE VIEW public.campaign_stats AS
SELECT 
    user_id,
    COUNT(*) as total_campaigns,
    COUNT(*) FILTER (WHERE status = 'DRAFT') as draft_count,
    COUNT(*) FILTER (WHERE status = 'SENT') as sent_count,
    COUNT(*) FILTER (WHERE status = 'SCHEDULED') as scheduled_count,
    COUNT(*) FILTER (WHERE status = 'SUSPENDED') as suspended_count,
    COUNT(*) FILTER (WHERE status = 'RUNNING') as running_count,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed_count,
    SUM(published) as total_published,
    SUM(sent) as total_sent,
    SUM(opened) as total_opened,
    SUM(clicked) as total_clicked
FROM public.campaigns
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON public.campaign_stats TO authenticated;

-- Success message
SELECT 'Supabase setup completed successfully! You can now use the campaigns table.' as message;
