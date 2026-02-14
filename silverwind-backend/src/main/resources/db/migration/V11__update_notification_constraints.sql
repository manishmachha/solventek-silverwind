ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_category_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_category_check 
CHECK (category IN (
    'CANDIDATE', 
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
