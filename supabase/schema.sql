-- Supabase Schema DDL for Coffee Ring Habit Tracker (Namespaced for sharing projects)

-- 1. Profiles Table (extending auth.users)
CREATE TABLE IF NOT EXISTS public.cr_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category_colors JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for cr_profiles
ALTER TABLE public.cr_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.cr_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.cr_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.cr_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);


-- 2. Habits Table
CREATE TABLE IF NOT EXISTS public.cr_habits (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    weekly_target INTEGER NOT NULL,
    weekly_target_history JSONB,
    days JSONB,
    min_goal NUMERIC,
    max_goal NUMERIC,
    unit TEXT,
    icon TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for cr_habits
ALTER TABLE public.cr_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habits"
    ON public.cr_habits FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 3. Check-ins Table
CREATE TABLE IF NOT EXISTS public.cr_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id TEXT NOT NULL REFERENCES public.cr_habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value NUMERIC,
    notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, habit_id, date)
);

-- Enable RLS for cr_check_ins
ALTER TABLE public.cr_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own check_ins"
    ON public.cr_check_ins FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Auto-Profile Creation Trigger on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.cr_profiles (id, name, category_colors)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    '{}'::jsonb
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
