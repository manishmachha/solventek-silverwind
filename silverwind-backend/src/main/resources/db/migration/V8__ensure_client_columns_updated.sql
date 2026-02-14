-- Ensure column limits for clients table are updated (in case V7 failed or was empty)
ALTER TABLE clients ALTER COLUMN address TYPE VARCHAR(1000);
ALTER TABLE clients ALTER COLUMN description TYPE VARCHAR(9999);
ALTER TABLE clients ALTER COLUMN industry TYPE VARCHAR(1000);
ALTER TABLE clients ALTER COLUMN website TYPE VARCHAR(100);
ALTER TABLE clients ALTER COLUMN logo_url TYPE VARCHAR(200);
