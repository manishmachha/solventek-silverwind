CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    legal_name VARCHAR(255),
    registration_number VARCHAR(255),
    tax_id VARCHAR(255),
    website VARCHAR(255),
    industry VARCHAR(255),
    description VARCHAR(2000),
    email VARCHAR(255),
    phone VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    postal_code VARCHAR(255),
    contact_person_name VARCHAR(255),
    contact_person_email VARCHAR(255),
    contact_person_phone VARCHAR(255),
    contact_person_designation VARCHAR(255),
    employee_count INTEGER,
    years_in_business INTEGER,
    service_offerings VARCHAR(1000),
    key_clients VARCHAR(1000),
    logo_url VARCHAR(2048),
    registration_doc_url VARCHAR(2048),
    tax_doc_url VARCHAR(2048),
    referral_source VARCHAR(255),
    notes VARCHAR(255),
    admin_password_hash VARCHAR(255)
);

CREATE TABLE roles (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    org_id UUID,
    CONSTRAINT fk_roles_organization FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE employees (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    employee_code VARCHAR(255) UNIQUE,
    phone VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(50),
    profile_photo_url VARCHAR(2048),
    date_of_joining DATE,
    date_of_exit DATE,
    employment_status VARCHAR(50),
    department VARCHAR(255),
    designation VARCHAR(255),
    employment_type VARCHAR(50),
    work_location VARCHAR(255),
    grade_level VARCHAR(255),
    manager_id UUID,
    username VARCHAR(255) UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    account_locked BOOLEAN DEFAULT FALSE,
    failed_login_attempts INTEGER DEFAULT 0,
    lock_until TIMESTAMP WITHOUT TIME ZONE,
    last_login_at TIMESTAMP WITHOUT TIME ZONE,
    password_updated_at TIMESTAMP WITHOUT TIME ZONE,
    
    -- Address Embeddable
    street VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    zip_code VARCHAR(255),

    -- EmergencyContact Embeddable (Overrides)
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(255),
    emergency_contact_phone VARCHAR(255),
    emergency_contact_email VARCHAR(255),

    -- BankDetails Embeddable
    bank_name VARCHAR(255),
    account_number VARCHAR(255),
    ifsc_code VARCHAR(255),
    branch_name VARCHAR(255),

    tax_id_pan VARCHAR(255),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    org_id UUID NOT NULL,
    role_id UUID,

    CONSTRAINT fk_employees_manager FOREIGN KEY (manager_id) REFERENCES employees(id),
    CONSTRAINT fk_employees_organization FOREIGN KEY (org_id) REFERENCES organizations(id),
    CONSTRAINT fk_employees_role FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Indexes
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_org_id ON employees(org_id);
