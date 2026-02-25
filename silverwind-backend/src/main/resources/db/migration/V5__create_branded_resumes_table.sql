-- V5: Branded resumes table for Solventek-branded, AI-revamped resume PDFs
CREATE TABLE branded_resumes (
    id BINARY(16) NOT NULL PRIMARY KEY,
    candidate_id BINARY(16) NOT NULL,
    organization_id BINARY(16) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    file_path VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(255),
    content_type VARCHAR(100) DEFAULT 'application/pdf',
    file_size_bytes BIGINT,
    status ENUM('GENERATING','COMPLETED','FAILED') NOT NULL DEFAULT 'GENERATING',
    revamped_content_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    generation_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6),
    CONSTRAINT fk_branded_resume_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    CONSTRAINT fk_branded_resume_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT uk_candidate_version UNIQUE (candidate_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
