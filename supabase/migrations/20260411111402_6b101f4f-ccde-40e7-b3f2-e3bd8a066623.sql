
-- Remove duplicate parent role for the user who should only be principal
DELETE FROM public.user_roles 
WHERE user_id = '4b603a1f-f535-4958-82fa-ca837de31d65' 
AND role = 'parent';

-- Add unique constraint on user_id to prevent duplicate role assignments
-- First remove any other duplicates (keep the most recent role per user)
DELETE FROM public.user_roles a
USING public.user_roles b
WHERE a.user_id = b.user_id
  AND a.created_at < b.created_at;

-- Now add the unique constraint
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
