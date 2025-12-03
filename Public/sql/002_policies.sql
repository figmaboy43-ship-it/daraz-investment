-- 002_policies.sql
-- Supabase Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- USER PROFILES POLICIES
-------------------------------------------------------------------------------

-- Users can SELECT their own profile
CREATE POLICY "profiles_select_own"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can INSERT their own profile (when signing up)
CREATE POLICY "profiles_insert_own"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can UPDATE only their own profile
CREATE POLICY "profiles_update_own"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admin override to SELECT all
CREATE POLICY "profiles_admin_select"
ON public.user_profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-------------------------------------------------------------------------------
-- PACKAGES (Admin only modifies; everyone can read)
-------------------------------------------------------------------------------

-- Public read access (disable RLS)
ALTER TABLE public.packages DISABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- PURCHASES
-------------------------------------------------------------------------------

-- User can insert purchase for themselves
CREATE POLICY "purchases_insert_auth"
ON public.purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User can view their own purchases
CREATE POLICY "purchases_select_owner"
ON public.purchases
FOR SELECT
USING (auth.uid() = user_id);

-- User can update their own purchase (rarely needed)
CREATE POLICY "purchases_update_owner"
ON public.purchases
FOR UPDATE
USING (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "purchases_admin_select"
ON public.purchases
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "purchases_admin_update"
ON public.purchases
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-------------------------------------------------------------------------------
-- PAYMENT PROOFS
-------------------------------------------------------------------------------

-- User inserts their own payment proof
CREATE POLICY "proofs_insert_auth"
ON public.payment_proofs
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

-- User can view own proofs or proofs linked to their purchase
CREATE POLICY "proofs_select_owner"
ON public.payment_proofs
FOR SELECT
USING (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.id = payment_proofs.purchase_id
    AND p.user_id = auth.uid()
  )
);

-- Admin can update/verify proofs
CREATE POLICY "proofs_admin"
ON public.payment_proofs
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-------------------------------------------------------------------------------
-- WITHDRAW REQUESTS
-------------------------------------------------------------------------------

-- User can insert own withdraw request
CREATE POLICY "withdraw_insert_auth"
ON public.withdraw_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User can view own withdraws
CREATE POLICY "withdraw_select_owner"
ON public.withdraw_requests
FOR SELECT
USING (auth.uid() = user_id);

-- User can update their own withdraw (optional)
CREATE POLICY "withdraw_update_owner"
ON public.withdraw_requests
FOR UPDATE
USING (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- ADMIN FUNCTION (Check admin)
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT role = 'admin' FROM public.user_profiles WHERE id = uid;
$$;
