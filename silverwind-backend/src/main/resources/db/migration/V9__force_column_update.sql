-- Force update column limits for clients table
-- This is V9 to ensure it runs after any checksum confusions with V8
ALTER TABLE clients ALTER COLUMN address TYPE VARCHAR(2000);
ALTER TABLE clients ALTER COLUMN "description" TYPE VARCHAR(9999);
ALTER TABLE clients ALTER COLUMN industry TYPE VARCHAR(1000);
ALTER TABLE clients ALTER COLUMN website TYPE VARCHAR(1000);
ALTER TABLE clients ALTER COLUMN logo_url TYPE VARCHAR(2048);
ALTER TABLE projects ALTER COLUMN "description" TYPE VARCHAR(9999);
