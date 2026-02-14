-- Fix Notifications Category Constraint
-- Drop the old constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_category_check;

-- Add the new constraint with all current enum values including 'CLIENT'
ALTER TABLE notifications ADD CONSTRAINT notifications_category_check 
CHECK (category IN (
    'CANDIDATE', 
    'CLIENT', 
    'APPLICATION', 
    'JOB', 
    'TICKET', 
    'USER', 
    'ORGANIZATION', 
    'PROJECT', 
    'INTERVIEW', 
    'ONBOARDING', 
    'ANALYSIS', 
    'TRACKING', 
    'LEAVE', 
    'ATTENDANCE', 
    'PAYROLL', 
    'ASSET', 
    'HOLIDAY', 
    'SYSTEM'
));

-- Fix Project Allocations user_id constraint
-- The production DB has a 'user_id' column that is NOT NULL, but the code is not using it (using employee_id/candidate_id instead).
-- We need to make it nullable to allow inserts.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_allocations' AND column_name = 'user_id') THEN
        ALTER TABLE project_allocations ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END $$;
