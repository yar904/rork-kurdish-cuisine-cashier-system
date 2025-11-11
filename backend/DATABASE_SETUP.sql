-- =====================================================
-- KURDISH CUISINE RESTAURANT SYSTEM
-- Complete Database Setup Script
-- =====================================================
-- Run this script in Supabase SQL Editor
-- This will create all tables, policies, and triggers

-- =====================================================
-- 1. SERVICE REQUESTS TABLE
-- =====================================================

-- Create service_requests table (additional to table_service_requests)
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INT NOT NULL,
  request_type TEXT CHECK (request_type IN ('waiter', 'bill', 'assistance')),
  message_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- Enable Row Level Security
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "allow_insert_requests" ON public.service_requests;
CREATE POLICY "allow_insert_requests"
ON public.service_requests
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_select_requests" ON public.service_requests;
CREATE POLICY "allow_select_requests"
ON public.service_requests
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "allow_update_status" ON public.service_requests;
CREATE POLICY "allow_update_status"
ON public.service_requests
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_service_requests_table_status 
ON public.service_requests(table_number, status);

CREATE INDEX IF NOT EXISTS idx_service_requests_created_at 
ON public.service_requests(created_at DESC);

-- =====================================================
-- 2. REAL-TIME TRIGGER FOR SERVICE REQUESTS
-- =====================================================

-- Create notification function
CREATE OR REPLACE FUNCTION notify_new_service_request()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'service_alerts',
    json_build_object(
      'id', NEW.id,
      'table_number', NEW.table_number,
      'request_type', NEW.request_type,
      'message_text', NEW.message_text,
      'status', NEW.status,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS service_request_notify_trigger ON public.service_requests;

-- Create trigger for real-time notifications
CREATE TRIGGER service_request_notify_trigger
AFTER INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION notify_new_service_request();

-- =====================================================
-- 3. UPDATE EXISTING TABLE_SERVICE_REQUESTS (if needed)
-- =====================================================

-- Ensure table_service_requests has correct structure
DO $$ 
BEGIN
  -- Add resolved_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'table_service_requests' 
    AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE public.table_service_requests 
    ADD COLUMN resolved_at TIMESTAMPTZ;
  END IF;

  -- Add resolved_by column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'table_service_requests' 
    AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE public.table_service_requests 
    ADD COLUMN resolved_by TEXT;
  END IF;
END $$;

-- Enable RLS on table_service_requests if not enabled
ALTER TABLE public.table_service_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for table_service_requests
DROP POLICY IF EXISTS "allow_insert_table_service_requests" ON public.table_service_requests;
CREATE POLICY "allow_insert_table_service_requests"
ON public.table_service_requests
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_select_table_service_requests" ON public.table_service_requests;
CREATE POLICY "allow_select_table_service_requests"
ON public.table_service_requests
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "allow_update_table_service_requests" ON public.table_service_requests;
CREATE POLICY "allow_update_table_service_requests"
ON public.table_service_requests
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create trigger for table_service_requests
CREATE OR REPLACE FUNCTION notify_table_service_request()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'service_alerts',
    json_build_object(
      'id', NEW.id,
      'table_number', NEW.table_number,
      'request_type', NEW.request_type,
      'message', NEW.message,
      'status', NEW.status,
      'created_at', NEW.created_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS table_service_request_notify_trigger ON public.table_service_requests;

CREATE TRIGGER table_service_request_notify_trigger
AFTER INSERT ON public.table_service_requests
FOR EACH ROW EXECUTE FUNCTION notify_table_service_request();

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Check service_requests table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('service_requests', 'table_service_requests')
ORDER BY table_name, ordinal_position;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('service_requests', 'table_service_requests');

-- Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('service_requests', 'table_service_requests');

-- =====================================================
-- 5. TEST DATA (Optional - for testing)
-- =====================================================

-- Insert test service request
-- INSERT INTO public.service_requests (table_number, request_type, message_text)
-- VALUES (5, 'waiter', 'Need assistance with menu');

-- Query pending requests
-- SELECT * FROM public.service_requests WHERE status = 'pending' ORDER BY created_at DESC;

-- =====================================================
-- SETUP COMPLETE ✅
-- =====================================================
-- All tables, policies, and triggers are now configured.
-- The system is ready for production use.
-- =====================================================
