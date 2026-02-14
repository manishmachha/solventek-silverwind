-- Increase column limits for clients table to prevent DataIntegrityViolationException
ALTER TABLE clients ALTER COLUMN address TYPE VARCHAR(2000);
ALTER TABLE clients ALTER COLUMN description TYPE VARCHAR(2000);
ALTER TABLE clients ALTER COLUMN industry TYPE VARCHAR(1000);
ALTER TABLE clients ALTER COLUMN website TYPE VARCHAR(1000);
ALTER TABLE clients ALTER COLUMN logo_url TYPE VARCHAR(2048);
