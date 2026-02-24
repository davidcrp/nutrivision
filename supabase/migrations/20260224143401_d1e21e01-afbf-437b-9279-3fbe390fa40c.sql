
-- Create a function to delete the user's own account
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete profile (cascading will handle meal_items via meals)
  DELETE FROM public.profiles WHERE user_id = auth.uid();
  DELETE FROM public.meals WHERE user_id = auth.uid();
  -- Delete the auth user
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
