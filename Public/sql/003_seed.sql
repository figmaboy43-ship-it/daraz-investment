-- 003_seed.sql
-- Initial demo data for Daraz Investment

----------------------------------------------------------
-- Insert sample packages
----------------------------------------------------------

INSERT INTO public.packages (name, price, percent_per_12h, description, active)
VALUES
('Starter', 500.00, 1.0, 'Starter package — daily small returns', true),
('Growth', 2000.00, 1.6, 'Medium package — better returns', true),
('Pro', 10000.00, 2.2, 'High tier package for serious investors', true);

----------------------------------------------------------
-- Create an Admin User (IMPORTANT)
----------------------------------------------------------
-- NOTE: Replace <ADMIN_UUID> with the actual auth.users.id 
-- of your real admin user from Supabase Authentication.

-- Example:
-- INSERT INTO public.user_profiles (id, role, phone, balance)
-- VALUES ('<ADMIN_UUID>', 'admin', '017XXXXXXXX', 0);

-- After creating admin in Supabase Auth:
-- 1. Copy the admin user ID
-- 2. Replace <ADMIN_UUID> above
-- 3. Run this file

----------------------------------------------------------
-- Additional Notes
----------------------------------------------------------
-- • DO NOT put service role key in frontend.
-- • Make sure the Storage bucket 'proofs' exists.
-- • You may add more packages anytime.
