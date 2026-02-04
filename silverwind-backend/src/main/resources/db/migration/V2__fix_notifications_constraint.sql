-- Fix notifications constraint for Enum changes
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_category_check;
    END IF;
END $$;
