-- ==========================================
-- IT Work Log System - Database Schema
-- ==========================================
-- WARNING: Running this script will DELETE all existing data in 'profiles' and 'work_logs'.
-- It will NOT delete authentication users from 'auth.users'.

-- 1. Cleanup existing objects (Tables, Triggers, Functions, Types)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.work_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- ==========================================
-- 2. Custom Types
-- ==========================================
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- ==========================================
-- 3. Tables Definition
-- ==========================================

-- PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- WORK LOGS TABLE
CREATE TABLE public.work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  work_description TEXT NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  is_assigned BOOLEAN DEFAULT false NOT NULL,
  assigned_by TEXT,
  is_covering_for_someone BOOLEAN DEFAULT false NOT NULL,
  covering_for_who TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensures if 'is_assigned' is true, 'assigned_by' cannot be empty
  CONSTRAINT assigned_by_check CHECK (
    (is_assigned = true AND assigned_by IS NOT NULL AND assigned_by <> '') OR
    (is_assigned = false)
  ),
  
  -- Ensures if 'is_covering' is true, 'covering_for_who' cannot be empty
  CONSTRAINT covering_for_who_check CHECK (
    (is_covering_for_someone = true AND covering_for_who IS NOT NULL AND covering_for_who <> '') OR
    (is_covering_for_someone = false)
  ),
  
  -- Time logic check
  CONSTRAINT time_sequence_check CHECK (time_start < time_end)
);

-- ==========================================
-- 4. Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Anyone authenticated can view all profiles (Needed for Admin Dashboard user list)
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile (Needed for Admins changing user roles)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- WORK LOGS POLICIES
-- Users can insert their own work logs
CREATE POLICY "Users can insert own work logs" ON public.work_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own work logs
CREATE POLICY "Users can view own work logs" ON public.work_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own work logs
CREATE POLICY "Users can update own work logs" ON public.work_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own work logs
CREATE POLICY "Users can delete own work logs" ON public.work_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view ALL work logs (Needed for Real-time Dashboard)
CREATE POLICY "Admins can view all work logs" ON public.work_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- 5. Triggers & Functions
-- ==========================================

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, designation, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'), 
    COALESCE(new.raw_user_meta_data->>'designation', 'IT Member'),
    CASE 
      WHEN new.email = 'plmttit@gmail.com' THEN 'admin'::public.user_role 
      ELSE 'user'::public.user_role 
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    designation = EXCLUDED.designation,
    role = EXCLUDED.role;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 6. Realtime Setup
-- ==========================================
-- Drops existing publication if it exists to reset
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- Add work_logs to realtime publication so Admin Dashboard updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_logs;
