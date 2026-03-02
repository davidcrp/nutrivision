
CREATE TABLE public.favorite_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🍽️',
  calories integer NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  weight_grams integer NOT NULL DEFAULT 100,
  meal_type text NOT NULL DEFAULT 'snack',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.favorite_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.favorite_meals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.favorite_meals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorite_meals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
