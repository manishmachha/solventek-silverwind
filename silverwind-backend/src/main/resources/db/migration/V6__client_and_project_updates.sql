-- Create Clients table (with increased column lengths)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(1000),
    phone VARCHAR(1000),
    city VARCHAR(1000),
    country VARCHAR(1000),
    website VARCHAR(1000),
    logo_url VARCHAR(2048),
    description VARCHAR(2000),
    industry VARCHAR(1000),
    address VARCHAR(2000)
);

-- Create Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    city VARCHAR(255),
    current_designation VARCHAR(255),
    current_company VARCHAR(255),
    experience_years DOUBLE PRECISION,
    summary TEXT,
    linked_in_url VARCHAR(2048),
    portfolio_url VARCHAR(2048),
    resume_file_path VARCHAR(2048),
    resume_original_file_name VARCHAR(255),
    resume_content_type VARCHAR(255),
    experience_details_json TEXT,
    education_details_json TEXT,
    ai_analysis_json TEXT,
    organization_id UUID NOT NULL,
    CONSTRAINT fk_candidates_organization FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Create Candidate Skills (ElementCollection)
CREATE TABLE IF NOT EXISTS candidate_skills (
    candidate_id UUID NOT NULL,
    skills VARCHAR(255),
    CONSTRAINT fk_candidate_skills_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

-- Create Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID,
    internal_org_id UUID NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50),
    CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES clients(id),
    CONSTRAINT fk_projects_organization FOREIGN KEY (internal_org_id) REFERENCES organizations(id)
);

-- Create Project Allocations table
CREATE TABLE IF NOT EXISTS project_allocations (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    project_id UUID NOT NULL,
    employee_id UUID,
    candidate_id UUID,
    start_date DATE,
    end_date DATE,
    allocation_percentage INTEGER,
    billing_role VARCHAR(255),
    status VARCHAR(50),
    CONSTRAINT fk_project_allocations_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_project_allocations_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_project_allocations_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);
