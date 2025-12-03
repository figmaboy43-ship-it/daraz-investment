-- 001_schema.sql
-- Create tables for Daraz Investment app

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- user_profiles (authenticated users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY, -- must match auth.users.id
  role text NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  phone text,
  balance numeric(12,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- packages
CREATE TABLE IF NOT EXISTS public.packages (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  price numeric(12,2) NOT NULL,
  percent_per_12h numeric(5,2) NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  package_id bigint NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  price_paid numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, active, completed, cancelled
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- payment_proofs (uploaded images stored in storage)
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id bigserial PRIMARY KEY,
  purchase_id bigint NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  tx_id text,
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- withdraw_requests
CREATE TABLE IF NOT EXISTS public.withdraw_requests (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  method text,
  status text NOT NULL DEFAULT 'pending', -- pending, paid, rejected
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_purchase_id ON public.payment_proofs(purchase_id);
CREATE INDEX IF NOT EXISTS idx_withdraws_user_id ON public.withdraw_requests(user_id);
