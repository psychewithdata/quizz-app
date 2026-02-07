-- Tighten RLS for public.profiles
-- - SELECT: only self, or admins can view all
-- - UPDATE: only self
-- - Ensure service_role has full access (defense-in-depth; service_role typically bypasses RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove overly-permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- SELECT: self or admin
CREATE POLICY "Users can view own profile; admins can view all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'admin')
  );

-- UPDATE: self only (and ensure updated row still belongs to self)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Keep INSERT scoped to self (explicitly recreate for consistency)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- service_role full access (explicit policies)
DROP POLICY IF EXISTS "service_role can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "service_role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "service_role can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "service_role can delete profiles" ON public.profiles;

CREATE POLICY "service_role can read profiles"
  ON public.profiles
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_role can insert profiles"
  ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role can update profiles"
  ON public.profiles
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role can delete profiles"
  ON public.profiles
  FOR DELETE
  TO service_role
  USING (true);

