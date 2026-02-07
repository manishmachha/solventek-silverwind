CREATE TABLE profile_documents (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    employee_id UUID NOT NULL,
    document_type VARCHAR(255) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(2048),
    storage_key VARCHAR(255),
    CONSTRAINT fk_profile_documents_employee FOREIGN KEY (employee_id) REFERENCES employees (id)
);

CREATE TABLE profile_education (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    employee_id UUID NOT NULL,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_date DATE,
    end_date DATE,
    grade VARCHAR(50),
    description TEXT,
    CONSTRAINT fk_profile_education_employee FOREIGN KEY (employee_id) REFERENCES employees (id)
);

CREATE TABLE profile_certifications (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    employee_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE,
    expiration_date DATE,
    credential_id VARCHAR(255),
    credential_url VARCHAR(2048),
    CONSTRAINT fk_profile_certifications_employee FOREIGN KEY (employee_id) REFERENCES employees (id)
);

CREATE TABLE profile_work_experience (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    employee_id UUID NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    current_job BOOLEAN DEFAULT FALSE,
    description TEXT,
    CONSTRAINT fk_profile_work_experience_employee FOREIGN KEY (employee_id) REFERENCES employees (id)
);

CREATE TABLE profile_skills (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    employee_id UUID NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(50),
    years_of_experience INTEGER,
    CONSTRAINT fk_profile_skills_employee FOREIGN KEY (employee_id) REFERENCES employees (id)
);

-- Indexes for performance
CREATE INDEX idx_profile_documents_employee ON profile_documents(employee_id);
CREATE INDEX idx_profile_education_employee ON profile_education(employee_id);
CREATE INDEX idx_profile_certifications_employee ON profile_certifications(employee_id);
CREATE INDEX idx_profile_work_experience_employee ON profile_work_experience(employee_id);
CREATE INDEX idx_profile_skills_employee ON profile_skills(employee_id);
