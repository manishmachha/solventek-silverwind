-- Migration to add new columns to notifications table for rich notifications
-- Run this in psql or pgAdmin connected to the silverwind database

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'SYSTEM';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ref_entity_type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ref_entity_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url VARCHAR(500);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS icon_type VARCHAR(100);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata TEXT;

-- Update existing notifications to have a default category
UPDATE notifications SET category = 'SYSTEM' WHERE category IS NULL;
UPDATE notifications SET priority = 'NORMAL' WHERE priority IS NULL;
