-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    org_id UUID REFERENCES organizations(id)
);

-- Permissions
CREATE TABLE permissions (
    code VARCHAR(255) PRIMARY KEY,
    description TEXT
);

-- Role_Permissions Join Table
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id),
    permission_code VARCHAR(255) REFERENCES permissions(code),
    PRIMARY KEY (role_id, permission_code)
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    org_id UUID REFERENCES organizations(id) NOT NULL
);

-- User_Roles Join Table
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- Jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    org_id UUID REFERENCES organizations(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    employment_type VARCHAR(50),
    bill_rate DECIMAL,
    pay_rate DECIMAL,
    ai_insights JSONB
);

-- Candidates
CREATE TABLE candidates (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    org_id UUID REFERENCES organizations(id) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    resume_url TEXT,
    ai_analysis JSONB
);

-- Job Applications
CREATE TABLE job_applications (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    job_id UUID REFERENCES jobs(id) NOT NULL,
    candidate_id UUID REFERENCES candidates(id) NOT NULL,
    vendor_org_id UUID REFERENCES organizations(id),
    status VARCHAR(50) NOT NULL
);

-- Timeline Events
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    org_id UUID REFERENCES organizations(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_user_id UUID REFERENCES users(id),
    message TEXT,
    metadata JSONB
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    recipient_user_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    read_at TIMESTAMP,
    ref_entity_type VARCHAR(100),
    ref_entity_id UUID
);

-- Indexes for performance
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_jobs_org_id ON jobs(org_id);
CREATE INDEX idx_candidates_org_id ON candidates(org_id);
CREATE INDEX idx_timeline_entity ON timeline_events(entity_type, entity_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id);
