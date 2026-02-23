
-- Add new columns to existing profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal TEXT CHECK (goal IN ('lose_weight', 'maintain', 'gain_muscle')),
  ADD COLUMN IF NOT EXISTS daily_calorie_target INTEGER DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS daily_protein_target INTEGER DEFAULT 150,
  ADD COLUMN IF NOT EXISTS daily_carbs_target INTEGER DEFAULT 200,
  ADD COLUMN IF NOT EXISTS daily_fat_target INTEGER DEFAULT 65;

-- Create meals table
CREATE TABLE public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')) NOT NULL,
  image_url TEXT,
  total_calories INTEGER DEFAULT 0,
  total_protein NUMERIC DEFAULT 0,
  total_carbs NUMERIC DEFAULT 0,
  total_fat NUMERIC DEFAULT 0,
  ai_confidence_score INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create meal_items table
CREATE TABLE public.meal_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  weight_grams INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL
);

-- Enable RLS
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;

-- Meals policies
CREATE POLICY "Users can view own meals" ON public.meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON public.meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- Meal items policies
CREATE POLICY "Users can view own meal items" ON public.meal_items FOR SELECT USING (
  meal_id IN (SELECT id FROM public.meals WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own meal items" ON public.meal_items FOR INSERT WITH CHECK (
  meal_id IN (SELECT id FROM public.meals WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own meal items" ON public.meal_items FOR UPDATE USING (
  meal_id IN (SELECT id FROM public.meals WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own meal items" ON public.meal_items FOR DELETE USING (
  meal_id IN (SELECT id FROM public.meals WHERE user_id = auth.uid())
);

-- Storage bucket for meal photos
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-photos', 'meal-photos', true);

CREATE POLICY "Users can upload meal photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view meal photos" ON storage.objects FOR SELECT USING (bucket_id = 'meal-photos');
CREATE POLICY "Users can delete own meal photos" ON storage.objects FOR DELETE USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
