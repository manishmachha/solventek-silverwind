-- V6: Fix UUID columns for Branded Resumes table so they map correctly in MariaDB 10.11+
ALTER TABLE branded_resumes DROP FOREIGN KEY fk_branded_resume_candidate;
ALTER TABLE branded_resumes DROP FOREIGN KEY fk_branded_resume_org;

ALTER TABLE branded_resumes MODIFY COLUMN id uuid NOT NULL;
ALTER TABLE branded_resumes MODIFY COLUMN candidate_id uuid NOT NULL;
ALTER TABLE branded_resumes MODIFY COLUMN organization_id uuid NOT NULL;

ALTER TABLE branded_resumes ADD CONSTRAINT fk_branded_resume_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE branded_resumes ADD CONSTRAINT fk_branded_resume_org FOREIGN KEY (organization_id) REFERENCES organizations(id);
