-- V4: Fix column charsets to utf8mb4 to support 4-byte Unicode characters
-- (emojis, special bullets, etc. from PDF extraction and notification titles)
--
-- Background: MariaDB's default 'utf8' charset is actually a 3-byte variant of
-- UTF-8. 4-byte characters (e.g., ● U+25CF, 📋 U+1F4CB) cause error 1366.
-- This migration converts the affected columns to utf8mb4.

-- job_applications.resume_text  (PDF-extracted text often contains bullets/checkboxes)
ALTER TABLE job_applications
    MODIFY COLUMN resume_text LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- notifications.title and notifications.body  (notification service uses emojis in titles)
ALTER TABLE notifications
    MODIFY COLUMN title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE notifications
    MODIFY COLUMN body VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- candidates.summary, experience/education/AI JSON columns
ALTER TABLE candidates
    MODIFY COLUMN summary LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE candidates
    MODIFY COLUMN experience_details_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE candidates
    MODIFY COLUMN education_details_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE candidates
    MODIFY COLUMN ai_analysis_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
