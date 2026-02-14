-- Create Client Submissions table
CREATE TABLE IF NOT EXISTS client_submissions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    candidate_id UUID NOT NULL,
    client_id UUID NOT NULL,
    job_id UUID,
    status VARCHAR(50) NOT NULL,
    external_reference_id VARCHAR(255),
    remarks TEXT,
    submitted_by_id UUID,
    submitted_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_client_submissions_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    CONSTRAINT fk_client_submissions_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_client_submissions_job FOREIGN KEY (job_id) REFERENCES jobs(id),
    CONSTRAINT fk_client_submissions_submitter FOREIGN KEY (submitted_by_id) REFERENCES employees(id)
);

-- Index for performance
CREATE INDEX idx_client_submissions_candidate ON client_submissions(candidate_id);
CREATE INDEX idx_client_submissions_client ON client_submissions(client_id);
