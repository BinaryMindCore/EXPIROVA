-- Supabase Schema & Migrations for Expirova

-- 1. Create Users Table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Pharmacist',
  hospital TEXT,
  branch TEXT,
  department TEXT
);

-- 2. Create Scans Table
CREATE TABLE public.scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  scan_date TIMESTAMPTZ DEFAULT now(),
  expiry_date DATE NOT NULL,
  resolution_status TEXT DEFAULT 'Pending'
);

-- 3. Create User Preferences Table
CREATE TABLE public.user_preferences (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  expiry_alerts_enabled BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT true,
  reminder_timing_days TEXT DEFAULT '30, 14, 7, 1 day'
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies
-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Scans: Users can perform all operations on their own scans
CREATE POLICY "Users can view own scans" 
  ON public.scans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" 
  ON public.scans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans" 
  ON public.scans FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans" 
  ON public.scans FOR DELETE 
  USING (auth.uid() = user_id);

-- User Preferences: Users can read and update their own preferences
CREATE POLICY "Users can view own preferences" 
  ON public.user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
  ON public.user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

-- 6. Trigger to automatically create user profile and preferences on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  
  -- Insert default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
