const fs = require('fs');
const crypto = require('crypto');

// --- Configuration ---
const OUTPUT_FILE = 'seed_data.sql';
const ORG_COUNT = 10; // 1 Solventek, 3 Clients, 6 Vendors
const USERS_PER_ORG = 10;
const JOBS_PER_ORG = 10;
const APPS_PER_ORG = 10;
const PROJECTS_PER_ORG = 10;
const ALLOCATIONS_PER_ORG = 10; // 1 per project roughly
const NOTIFICATIONS_PER_ORG = 10;
const TICKETS_PER_USER_AVG = 5;

// Constants
const SOLVENTEK_ID = '11111111-1111-1111-1111-111111111111'; // Fixed ID for main org
const PASSWORD_HASH = '$2a$10$wW/iIqZ/vB5U6.q1.jB5U6.q1.jB5U6.q1.jB5U6.q1.jB5U6'; // Dummy 'password'

// --- Helpers ---
const uuid = () => crypto.randomUUID();
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBoolean = () => Math.random() < 0.5;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
const escapeSql = (str) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';

// --- Data Lists ---
const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Chris', 'Anna', 'James', 'Laura', 'Robert', 'Emma', 'William', 'Olivia'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const CITIES = ['New York', 'London', 'Bangalore', 'San Francisco', 'Berlin', 'Tokyo', 'Sydney', 'Toronto', 'Dubai', 'Singapore'];
const SKILLS_LIST = ['Java', 'Spring Boot', 'React', 'Angular', 'Python', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'NoSQL'];
const JOB_TITLES = ['Software Engineer', 'Senior Developer', 'Product Manager', 'HR Specialist', 'QA Engineer', 'DevOps Engineer', 'Business Analyst'];

// --- Generators ---

const generateOrgs = () => {
    const orgs = [];
    
    // 1. Solventek (Owner)
    orgs.push({
        id: SOLVENTEK_ID,
        name: 'Solventek',
        type: 'SOLVENTEK',
        status: 'APPROVED',
        legalName: 'Solventek Private Limited',
        domain: 'solventek.com'
    });

    // 2. Clients
    for (let i = 1; i <= 3; i++) {
        orgs.push({
            id: uuid(),
            name: `Client Corp ${i}`,
            type: 'CLIENT',
            status: 'APPROVED',
            legalName: `Client Corp ${i} Inc.`,
            domain: `client${i}.com`
        });
    }

    // 3. Vendors
    for (let i = 1; i <= 6; i++) {
        orgs.push({
            id: uuid(),
            name: `Vendor Sol ${i}`,
            type: 'VENDOR',
            status: 'APPROVED',
            legalName: `Vendor Solutions ${i} LLC`,
            domain: `vendor${i}.com`
        });
    }
    return orgs;
};

const PERMISSIONS_LIST = [
    // Job
    'JOB_CREATE', 'JOB_UPDATE', 'JOB_DELETE', 'JOB_VIEW', 'JOB_VIEW_ALL',
    // Job Workflow
    'JOB_VERIFY', 'JOB_APPROVE', 'JOB_PUBLISH', 'JOB_ENRICH',
    // Candidate
    'CANDIDATE_CREATE', 'CANDIDATE_UPDATE', 'CANDIDATE_DELETE', 'CANDIDATE_VIEW',
    // User
    'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_VIEW',
    // Role
    'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE', 'ROLE_VIEW',
    // Organization
    'ORG_CREATE', 'ORG_UPDATE', 'ORG_DELETE', 'ORG_VIEW', 'ORG_APPROVE', 'ORG_REJECT',
    // Job Application
    'APP_CREATE', 'APP_UPDATE', 'APP_DELETE', 'APP_VIEW', 'APP_APPROVE', 'APP_REJECT',
    // Misc
    'VIEW_PROFILE', 'VIEW_DASHBOARD', 'ALL'
];

const ROLE_PERMISSIONS = {
    'SUPER_ADMIN': ['ALL'],
    'HR_ADMIN': [
        'JOB_CREATE', 'JOB_UPDATE', 'JOB_DELETE', 'JOB_VIEW',
        'CANDIDATE_CREATE', 'CANDIDATE_UPDATE', 'CANDIDATE_DELETE', 'CANDIDATE_VIEW',
        'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_VIEW',
        'ORG_VIEW',
        'APP_CREATE', 'APP_UPDATE', 'APP_DELETE', 'APP_VIEW', 'APP_APPROVE', 'APP_REJECT',
        'VIEW_DASHBOARD', 'VIEW_PROFILE'
    ],
    'ADMIN': [
        'JOB_CREATE', 'JOB_UPDATE', 'JOB_DELETE', 'JOB_VIEW',
        'CANDIDATE_CREATE', 'CANDIDATE_UPDATE', 'CANDIDATE_DELETE', 'CANDIDATE_VIEW',
        'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_VIEW',
        'ORG_VIEW',
        'APP_CREATE', 'APP_UPDATE', 'APP_DELETE', 'APP_VIEW', 'APP_APPROVE', 'APP_REJECT',
        'VIEW_DASHBOARD', 'VIEW_PROFILE'
    ],
    'TA': [
        'JOB_CREATE', 'JOB_UPDATE', 'JOB_VIEW',
        'CANDIDATE_CREATE', 'CANDIDATE_UPDATE', 'CANDIDATE_VIEW',
        'APP_CREATE', 'APP_UPDATE', 'APP_VIEW',
        'VIEW_DASHBOARD', 'VIEW_PROFILE'
    ],
    'EMPLOYEE': ['VIEW_PROFILE']
};

const generateRoles = (orgId) => {
    // Standard roles for each Org
    const roles = [
        { name: 'SUPER_ADMIN', desc: 'Full Access' },
        { name: 'HR_ADMIN', desc: 'HR Operations' },
        { name: 'ADMIN', desc: 'Org Admin' },
        { name: 'TA', desc: 'Talent Acquisition' }, // Organization specific
        { name: 'EMPLOYEE', desc: 'Standard User' }
    ];
    
    return roles.map(r => ({
        id: uuid(),
        orgId: orgId,
        name: r.name,
        description: r.desc,
        permissions: ROLE_PERMISSIONS[r.name] || []
    }));
};

const generateUsers = (org, roles) => {
    const users = [];
    
    // Map roles for easy access
    const roleMap = {};
    roles.forEach(r => roleMap[r.name] = r.id);

    // 1. Super Admin (only for Solventek ideally, but giving one to each for simplicity of testing)
    users.push({
        id: uuid(),
        email: `superadmin@${org.domain}`,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: roleMap['SUPER_ADMIN'],
        orgId: org.id
    });
    
    users.push({
        id: uuid(),
        email: `hr@${org.domain}`,
        firstName: 'HR',
        lastName: 'Manager',
        roleId: roleMap['HR_ADMIN'],
        orgId: org.id
    });

    users.push({
        id: uuid(),
        email: `admin@${org.domain}`,
        firstName: 'Org',
        lastName: 'Admin',
        roleId: roleMap['ADMIN'],
        orgId: org.id
    });
    
    // Employees
    for (let i = 1; i <= 7; i++) {
        users.push({
            id: uuid(),
            email: `employee${i}@${org.domain}`,
            firstName: randomItem(FIRST_NAMES),
            lastName: randomItem(LAST_NAMES) + ` (${i})`,
            roleId: roleMap['EMPLOYEE'],
            orgId: org.id
        });
    }
    return users;
};

const main = () => {
    const orgs = generateOrgs();
    let allRoles = [];
    let allUsers = [];
    let allJobs = [];
    let allApps = [];
    let allProjects = [];
    let allAllocations = [];
    let allTickets = [];
    let allNotifications = [];

    // --- Entity Generation Loop ---
    for (const org of orgs) {
        // Roles
        const orgRoles = generateRoles(org.id);
        allRoles = allRoles.concat(orgRoles);

        // Users
        const orgUsers = generateUsers(org, orgRoles);
        allUsers = allUsers.concat(orgUsers);
        
        // Jobs
        for (let i = 0; i < JOBS_PER_ORG; i++) {
            allJobs.push({
                id: uuid(),
                orgId: org.id,
                title: `${randomItem(JOB_TITLES)} - ${randomInt(1, 100)}`,
                status: randomItem(['PUBLISHED', 'DRAFT', 'CLOSED', 'ADMIN_VERIFIED']),
                empType: randomItem(['FTE', 'CONTRACT']),
                description: 'Exciting opportunity to work on cutting edge tech.',
                requirements: 'Java, React, AWS'
            });
        }

        // Projects
        for (let i = 0; i < PROJECTS_PER_ORG; i++) {
            allProjects.push({
                id: uuid(),
                internalOrgId: org.id, // Owned by this org
                clientOrgId: org.type === 'SOLVENTEK' || org.type === 'VENDOR' ? (orgs.find(o => o.type === 'CLIENT')?.id || org.id) : org.id, 
                // Vendors/Solventek have external clients. Clients project for themselves? Or internal. default to internal if no match.
                name: `Project ${randomItem(['Alpha', 'Beta', 'Gamma', 'Delta'])} ${i}`,
                status: 'ACTIVE',
                startDate: randomDate(new Date(2025, 0, 1), new Date(2025, 2, 1)),
                endDate: randomDate(new Date(2025, 6, 1), new Date(2026, 0, 1))
            });
        }
    }

    // Second pass for relations that need cross-polination or full pools
    // Allocations (assign users to projects)
    for (const proj of allProjects) {
        // Find users in the same org as project
        const eligibleUsers = allUsers.filter(u => u.orgId === proj.internalOrgId);
        if (eligibleUsers.length > 0) {
            const assignee = randomItem(eligibleUsers);
            allAllocations.push({
                id: uuid(),
                projectId: proj.id,
                userId: assignee.id,
                status: 'ACTIVE',
                billingRole: 'Developer',
                percentage: 100
            });
        }
    }

    // Applications (Candidates applying to jobs)
    // We'll create "Candidate" users or just raw applications? 
    // JobApplication entity has: firstName, lastName, email (embedded candidate). It DOES NOT link to User entity directly usually, unless it's an internal movement.
    // Spec says: "each org should have... 10 applied job applications".
    // We act as if random candidates applied.
    for (const job of allJobs) {
        // 1-2 apps per job to average out
        allApps.push({
            id: uuid(),
            jobId: job.id,
            firstName: randomItem(FIRST_NAMES),
            lastName: randomItem(LAST_NAMES),
            email: `candidate_${uuid().substring(0,5)}@test.com`,
            status: randomItem(['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED']),
            resumeText: 'Passionate developer with 5 years exp...',
            experience: 5.0
        });
    }

    // Tickets (Users raising tickets)
    for (const user of allUsers) {
        for (let k = 0; k < 5; k++) {
            // Target Org? Usually their own or parent.
            allTickets.push({
                id: uuid(),
                ticketNumber: `TKT-${uuid().substring(0,8).toUpperCase()}`,
                subject: `Issue with ${randomItem(['Laptop', 'Access', 'Payroll', 'Timehseet'])}`,
                description: 'Please help me resolve this asap.',
                type: randomItem(['IT', 'HR', 'PAYROLL', 'OTHER']), // Mapped to ENUM usually
                status: randomItem(['OPEN', 'RESOLVED', 'IN_PROGRESS']),
                priority: randomItem(['LOW', 'MEDIUM', 'HIGH']),
                employeeId: user.id,
                targetOrgId: user.orgId, // Internal ticket
                isEscalated: false,
                unreadEmployee: 0,
                unreadAdmin: 0,
                createdAt: new Date().toISOString()
            });
        }
    }

    // Notifications
    for (const user of allUsers) {
        allNotifications.push({
             id: uuid(),
             recipientId: user.id,
             title: 'Welcome to Silverwind',
             body: 'Your account has been set up.',
             refType: 'USER', // Generic
             refId: user.id
        });
    }


    // --- writers ---
    let sql = `-- Auto-generated Seed Data\n`;
    sql += `TRUNCATE TABLE organizations, roles, users, jobs, projects, job_applications, project_allocations, tickets, notifications, permissions, role_permissions CASCADE;\n\n`;

    // Permissions
    for (const p of PERMISSIONS_LIST) {
        sql += `INSERT INTO permissions (code, description) VALUES ('${p}', 'Auto-seeded permission') ON CONFLICT DO NOTHING;\n`;
    }

    // Orgs
    for (const o of orgs) {
        sql += `INSERT INTO organizations (id, name, type, status, legal_name, website, created_at, updated_at) VALUES ('${o.id}', '${o.name}', '${o.type}', '${o.status}', '${o.legalName}', '${o.domain}', NOW(), NOW());\n`;
    }

    // Roles & RolePermissions
    for (const r of allRoles) {
        sql += `INSERT INTO roles (id, org_id, name, description, created_at, updated_at) VALUES ('${r.id}', '${r.orgId}', '${r.name}', '${r.description}', NOW(), NOW());\n`;
        // Map permissions
        for (const permCode of r.permissions) {
             sql += `INSERT INTO role_permissions (role_id, permission_code) VALUES ('${r.id}', '${permCode}');\n`;
        }
    }

    // Users
    for (const u of allUsers) {
        sql += `INSERT INTO users (id, org_id, role_id, email, password_hash, first_name, last_name, created_at, updated_at, enabled, account_locked, failed_login_attempts) VALUES ('${u.id}', '${u.orgId}', '${u.roleId}', '${u.email}', '${PASSWORD_HASH}', '${u.firstName}', '${u.lastName}', NOW(), NOW(), true, false, 0);\n`;
    }

    // Jobs
    for (const j of allJobs) {
        sql += `INSERT INTO jobs (id, org_id, title, status, employment_type, description, requirements, created_at, updated_at) VALUES ('${j.id}', '${j.orgId}', '${j.title}', '${j.status}', '${j.empType}', '${j.description}', '${j.requirements}', NOW(), NOW());\n`;
    }

    // Projects
    for (const p of allProjects) {
        sql += `INSERT INTO projects (id, internal_org_id, client_org_id, name, status, start_date, end_date) VALUES ('${p.id}', '${p.internalOrgId}', ${escapeSql(p.clientOrgId)}, '${p.name}', '${p.status}', '${p.startDate}', '${p.endDate}');\n`;
    }

    // Allocations
    for (const a of allAllocations) {
        sql += `INSERT INTO project_allocations (id, project_id, user_id, status, billing_role, allocation_percentage) VALUES ('${a.id}', '${a.projectId}', '${a.userId}', '${a.status}', '${a.billingRole}', ${a.percentage});\n`;
    }

    // Applications
    for (const a of allApps) {
        sql += `INSERT INTO job_applications (id, job_id, first_name, last_name, email, status, resume_text, experience_years, created_at, updated_at) VALUES ('${a.id}', '${a.jobId}', '${a.firstName}', '${a.lastName}', '${a.email}', '${a.status}', '${a.resumeText}', ${a.experience}, NOW(), NOW());\n`;
    }

    // Tickets
    for (const t of allTickets) {
        // ENUM mapping might differ in capitalization, assume uppercase is safe based on java files
        sql += `INSERT INTO tickets (id, ticket_number, subject, description, type, status, priority, employee_id, target_org_id, is_escalated, unread_count_employee, unread_count_admin, created_at, updated_at) VALUES ('${t.id}', '${t.ticketNumber}', '${t.subject}', '${t.description}', 'OTHER', '${t.status}', '${t.priority}', '${t.employeeId}', '${t.targetOrgId}', ${t.isEscalated}, ${t.unreadEmployee}, ${t.unreadAdmin}, NOW(), NOW());\n`;
    }

    // Notifications
    for (const n of allNotifications) {
        sql += `INSERT INTO notifications (id, recipient_user_id, title, body, ref_entity_type, ref_entity_id, created_at, updated_at) VALUES ('${n.id}', '${n.recipientId}', '${n.title}', '${n.body}', '${n.refType}', '${n.refId}', NOW(), NOW());\n`;
    }

    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`Generated ${OUTPUT_FILE} with:`);
    console.log(`- ${orgs.length} Orgs`);
    console.log(`- ${allUsers.length} Users`);
    console.log(`- ${allJobs.length} Jobs`);
    console.log(`- ${allApps.length} Applications`);
    console.log(`- ${allTickets.length} Tickets`);
};

main();
