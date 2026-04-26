-- Profiles table (1:1 com auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Areas
CREATE TABLE public.areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_areas_user ON public.areas(user_id);
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areas_select_own" ON public.areas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "areas_insert_own" ON public.areas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "areas_update_own" ON public.areas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "areas_delete_own" ON public.areas FOR DELETE USING (auth.uid() = user_id);

-- Types
CREATE TABLE public.types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_types_user ON public.types(user_id);
ALTER TABLE public.types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "types_select_own" ON public.types FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "types_insert_own" ON public.types FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "types_update_own" ON public.types FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "types_delete_own" ON public.types FOR DELETE USING (auth.uid() = user_id);

-- Items
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  type_id UUID REFERENCES public.types(id) ON DELETE SET NULL,
  recurrence JSONB,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done')),
  completed_dates TEXT[] NOT NULL DEFAULT '{}',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_items_user_start ON public.items(user_id, start_date);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_select_own" ON public.items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "items_insert_own" ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "items_update_own" ON public.items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "items_delete_own" ON public.items FOR DELETE USING (auth.uid() = user_id);

-- Trigger: ao criar usuário, criar profile + áreas/tipos default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.areas (user_id, name, color, position) VALUES
    (NEW.id, 'Pessoal', '217 91% 60%', 0),
    (NEW.id, 'Profissional', '37 92% 60%', 1),
    (NEW.id, 'Saúde', '142 71% 45%', 2),
    (NEW.id, 'Família', '340 82% 52%', 3);

  INSERT INTO public.types (user_id, name, position) VALUES
    (NEW.id, 'Evento', 0),
    (NEW.id, 'Tarefa', 1),
    (NEW.id, 'Hábito', 2),
    (NEW.id, 'Lembrete', 3);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();