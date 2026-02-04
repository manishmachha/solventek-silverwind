const fs = require('fs');
const crypto = require('crypto');

// --- Configuration ---
const OUTPUT_FILE = 'seed_data1.sql';
const ORG_COUNT = 10;
const USERS_PER_ORG = 10;
const JOBS_PER_ORG = 10;
const APPS_PER_ORG = 10;
const PROJECTS_PER_ORG = 10;
const ALLOCATIONS_PER_ORG = 10;
const NOTIFICATIONS_PER_ORG = 10;
const TICKETS_PER_USER = 5;

// Fixed IDs & Passwords
const SOLVENTEK_ID = '11111111-1111-1111-1111-111111111111';
const PASSWORD_HASH = '$2a$12$Io/iunm1PNzAgQxr6rg/B.EOibiSQ9/3qo2ENzJ5UO/Bg5nZM2Upy';

// --- Helpers ---
const uuid = () => crypto.randomUUID();
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBoolean = () => Math.random() < 0.5;
const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString()
    .split('T')[0];
const escapeSql = (str) => (str ? `'${str.replace(/'/g, "''")}'` : 'NULL');

// --- Data Pools ---
const FIRST_NAMES = [
  'John',
  'Jane',
  'Michael',
  'Emily',
  'David',
  'Sarah',
  'Chris',
  'Anna',
  'James',
  'Laura',
  'Robert',
  'Emma',
  'William',
  'Olivia',
];
const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
];
const CITIES = [
  'New York',
  'London',
  'Bangalore',
  'San Francisco',
  'Berlin',
  'Tokyo',
  'Sydney',
  'Toronto',
  'Dubai',
  'Singapore',
];
const COUNTRIES = [
  'USA',
  'UK',
  'India',
  'Germany',
  'Japan',
  'Australia',
  'Canada',
  'UAE',
  'Singapore',
];
const SKILLS = [
  'Java',
  'Spring Boot',
  'React',
  'Angular',
  'Python',
  'AWS',
  'Docker',
  'Kubernetes',
  'SQL',
  'NoSQL',
  'Jira',
  'Confluence',
];
const JOB_TITLES = [
  'Software Engineer',
  'Senior Developer',
  'Product Manager',
  'HR Specialist',
  'QA Engineer',
  'DevOps Engineer',
  'Business Analyst',
];

// --- Permissions & Roles ---
const PERMISSIONS = [
  'ALL',
  'JOB_CREATE',
  'JOB_UPDATE',
  'JOB_DELETE',
  'JOB_VIEW',
  'JOB_VIEW_ALL',
  'JOB_VERIFY',
  'JOB_APPROVE',
  'JOB_PUBLISH',
  'JOB_ENRICH',
  'CANDIDATE_CREATE',
  'CANDIDATE_UPDATE',
  'CANDIDATE_DELETE',
  'CANDIDATE_VIEW',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DELETE',
  'USER_VIEW',
  'ROLE_CREATE',
  'ROLE_UPDATE',
  'ROLE_DELETE',
  'ROLE_VIEW',
  'ORG_CREATE',
  'ORG_UPDATE',
  'ORG_DELETE',
  'ORG_VIEW',
  'ORG_APPROVE',
  'ORG_REJECT',
  'APP_CREATE',
  'APP_UPDATE',
  'APP_DELETE',
  'APP_VIEW',
  'APP_APPROVE',
  'APP_REJECT',
  'VIEW_PROFILE',
  'VIEW_DASHBOARD',
];
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['ALL'],
  HR_ADMIN: PERMISSIONS.filter((p) => p !== 'ALL'),
  ADMIN: PERMISSIONS.filter((p) => p !== 'ALL'),
  TA: [
    'JOB_CREATE',
    'JOB_UPDATE',
    'JOB_VIEW',
    'CANDIDATE_CREATE',
    'CANDIDATE_UPDATE',
    'CANDIDATE_VIEW',
    'APP_CREATE',
    'APP_UPDATE',
    'APP_VIEW',
    'VIEW_DASHBOARD',
    'VIEW_PROFILE',
  ],
  EMPLOYEE: ['VIEW_PROFILE'],
};

// --- Generation Functions ---
const generateOrgs = () => {
  const orgs = [];
  // Solventek
  orgs.push({
    id: SOLVENTEK_ID,
    name: 'Solventek',
    type: 'SOLVENTEK',
    status: 'APPROVED',
    legalName: 'Solventek Private Limited',
    domain: 'solventek.com',
    email: 'contact@solventek.com',
    phone: '+1-555-1000',
    address_line1: '123 Main Street',
    address_line2: 'Suite 400',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    postal_code: '560001',
    employee_count: 200,
    industry: 'IT Services',
    key_clients: 'GlobalCorp, FinTech Inc, HealthSolutions',
    service_offerings: 'Software Development, Consulting, Cloud Services',
    years_in_business: 10,
  });
  // Clients
  for (let i = 1; i <= 3; i++) {
    orgs.push({
      id: uuid(),
      name: `Client Corp ${i}`,
      type: 'CLIENT',
      status: 'APPROVED',
      legalName: `Client Corp ${i} Ltd.`,
      domain: `client${i}.com`,
      email: `info@client${i}.com`,
      phone: `+1-555-10${i}`,
      address_line1: `${i} Market Street`,
      address_line2: 'Floor 5',
      city: randomItem(CITIES),
      state: 'N/A',
      country: randomItem(COUNTRIES),
      postal_code: `1000${i}`,
      employee_count: randomInt(50, 500),
      industry: 'Finance',
      key_clients: 'None',
      service_offerings: 'Consulting, Advisory',
      years_in_business: randomInt(5, 15),
    });
  }
  // Vendors
  for (let i = 1; i <= 6; i++) {
    orgs.push({
      id: uuid(),
      name: `Vendor Sol ${i}`,
      type: 'VENDOR',
      status: 'APPROVED',
      legalName: `Vendor Solutions ${i} LLC`,
      domain: `vendor${i}.com`,
      email: `support@vendor${i}.com`,
      phone: `+1-555-20${i}`,
      address_line1: `${i} Vendor Street`,
      address_line2: 'Suite 200',
      city: randomItem(CITIES),
      state: 'N/A',
      country: randomItem(COUNTRIES),
      postal_code: `2000${i}`,
      employee_count: randomInt(20, 300),
      industry: 'IT Services',
      key_clients: 'Client Corp 1, Client Corp 2',
      service_offerings: 'Staffing, Consulting',
      years_in_business: randomInt(3, 10),
    });
  }
  return orgs;
};

const generateRoles = (orgId) => {
  return ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN', 'TA', 'EMPLOYEE'].map((role) => ({
    id: uuid(),
    orgId,
    name: role,
    description: `${role} role`,
    permissions: ROLE_PERMISSIONS[role],
  }));
};

const generateUsers = (org, roles) => {
  const users = [];
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));
  users.push({
    id: uuid(),
    email: `superadmin@${org.domain}`,
    firstName: 'Super',
    lastName: 'Admin',
    roleId: roleMap.SUPER_ADMIN,
    orgId: org.id,
  });
  users.push({
    id: uuid(),
    email: `hr@${org.domain}`,
    firstName: 'HR',
    lastName: 'Manager',
    roleId: roleMap.HR_ADMIN,
    orgId: org.id,
  });
  users.push({
    id: uuid(),
    email: `admin@${org.domain}`,
    firstName: 'Org',
    lastName: 'Admin',
    roleId: roleMap.ADMIN,
    orgId: org.id,
  });
  users.push({
    id: uuid(),
    email: `ta@${org.domain}`,
    firstName: 'Talent',
    lastName: 'Acquisition',
    roleId: roleMap.TA,
    orgId: org.id,
  });
  for (let i = 1; i <= 6; i++) {
    users.push({
      id: uuid(),
      email: `employee${i}@${org.domain}`,
      firstName: randomItem(FIRST_NAMES),
      lastName: randomItem(LAST_NAMES),
      roleId: roleMap.EMPLOYEE,
      orgId: org.id,
      date_of_joining: randomDate(new Date(2020, 0, 1), new Date()),
      employment_type: 'FTE',
      employment_status: 'ACTIVE',
      gender: randomItem(['MALE', 'FEMALE']),
    });
  }
  return users;
};

// --- Main Script ---
const main = () => {
  const orgs = generateOrgs();
  let allRoles = [],
    allUsers = [],
    allJobs = [],
    allProjects = [],
    allAllocations = [],
    allApps = [],
    allTickets = [],
    allNotifications = [];

  for (const org of orgs) {
    const roles = generateRoles(org.id);
    allRoles.push(...roles);
    const users = generateUsers(org, roles);
    allUsers.push(...users);

    // Jobs
    for (let i = 0; i < JOBS_PER_ORG; i++) {
      allJobs.push({
        id: uuid(),
        orgId: org.id,
        title: `${randomItem(JOB_TITLES)} ${i + 1}`,
        status: randomItem([
          'DRAFT',
          'SUBMITTED',
          'ADMIN_VERIFIED',
          'TA_ENRICHED',
          'PUBLISHED',
          'CLOSED',
        ]),
        employment_type: randomItem(['FTE', 'CONTRACT', 'C2H', 'INTERN', 'PART_TIME']),
        description: 'Exciting role with growth opportunity',
        requirements: 'Java, Spring Boot, AWS, Docker',
        roles_and_responsibilities: 'Develop, Test, Deploy applications',
        skills: randomItem(SKILLS),
      });
    }

    // Projects
    for (let i = 0; i < PROJECTS_PER_ORG; i++) {
      allProjects.push({
        id: uuid(),
        internal_org_id: org.id,
        client_org_id: randomItem(orgs.filter((o) => o.type === 'CLIENT')).id,
        name: `Project ${randomItem(['Alpha', 'Beta', 'Gamma', 'Delta'])} ${i + 1}`,
        status: randomItem(['ACTIVE', 'COMPLETED', 'PLANNED', 'ON_HOLD']),
        start_date: randomDate(new Date(2025, 0, 1), new Date(2025, 5, 1)),
        end_date: randomDate(new Date(2025, 6, 1), new Date(2026, 0, 1)),
        description: 'Project description',
      });
    }

    // Allocations
    for (let proj of allProjects.filter((p) => p.internal_org_id === org.id)) {
      const user = randomItem(allUsers.filter((u) => u.orgId === org.id));
      allAllocations.push({
        id: uuid(),
        project_id: proj.id,
        user_id: user.id,
        status: 'ACTIVE',
        billing_role: 'Developer',
        allocation_percentage: 100,
      });
    }

    // --- Step 1: Generate all jobs ---
    for (const org of orgs) {
      for (let i = 0; i < JOBS_PER_ORG; i++) {
        allJobs.push({
          id: uuid(),
          orgId: org.id,
          title: `${randomItem(JOB_TITLES)} ${i + 1}`,
          status: randomItem([
            'DRAFT',
            'SUBMITTED',
            'ADMIN_VERIFIED',
            'TA_ENRICHED',
            'PUBLISHED',
            'CLOSED',
          ]),
          employment_type: randomItem(['FTE', 'CONTRACT', 'C2H', 'INTERN', 'PART_TIME']),
          description: 'Exciting role with growth opportunity',
          requirements: 'Java, Spring Boot, AWS, Docker',
          roles_and_responsibilities: 'Develop, Test, Deploy applications',
          skills: randomItem(SKILLS),
        });
      }
    }

    // --- Step 2: Generate applications ---
    for (const org of orgs) {
      const otherJobs = allJobs.filter((j) => j.orgId !== org.id); // safe now

      for (let i = 0; i < JOBS_PER_ORG; i++) {
        const job = allJobs.find((j) => j.orgId === org.id); // own job

        // Applied applications
        for (let a = 0; a < APPS_PER_ORG; a++) {
          if (otherJobs.length === 0) continue; // safety check
          allApps.push({
            id: uuid(),
            jobId: randomItem(otherJobs).id,
            firstName: randomItem(FIRST_NAMES),
            lastName: randomItem(LAST_NAMES),
            email: `applied_${uuid().substring(0, 5)}@test.com`,
            status: randomItem([
              'APPLIED',
              'SHORTLISTED',
              'INTERVIEW_SCHEDULED',
              'OFFERED',
              'REJECTED',
            ]),
            resumeText: 'Passionate developer with 5 years exp...',
            experience: randomInt(1, 10),
            vendorOrgId: org.id,
          });
        }

        // Received applications
        for (let r = 0; r < APPS_PER_ORG; r++) {
          allApps.push({
            id: uuid(),
            jobId: job.id,
            firstName: randomItem(FIRST_NAMES),
            lastName: randomItem(LAST_NAMES),
            email: `received_${uuid().substring(0, 5)}@test.com`,
            status: randomItem([
              'APPLIED',
              'SHORTLISTED',
              'INTERVIEW_SCHEDULED',
              'OFFERED',
              'REJECTED',
            ]),
            resumeText: 'Experienced candidate looking for new opportunity.',
            experience: randomInt(1, 15),
            vendorOrgId: null,
          });
        }
      }
    }

    // Notifications
    for (let user of allUsers.filter((u) => u.orgId === org.id)) {
      allNotifications.push({
        id: uuid(),
        recipientId: user.id,
        title: 'Welcome',
        body: `Hello ${user.firstName}`,
        refType: 'USER',
        refId: user.id,
      });
    }

    // Tickets
    for (let user of allUsers.filter((u) => u.orgId === org.id)) {
      for (let i = 0; i < TICKETS_PER_USER; i++) {
        allTickets.push({
          id: uuid(),
          ticket_number: `TKT-${uuid().slice(0, 8).toUpperCase()}`,
          subject: 'Sample Ticket',
          description: 'Please resolve this issue',
          type: 'OTHER',
          status: randomItem(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
          priority: randomItem(['LOW', 'MEDIUM', 'HIGH']),
          employee_id: user.id,
          target_org_id: org.id,
          is_escalated: false,
          unreadEmployee: 0,
          unreadAdmin: 0,
        });
      }
    }
  }

  // --- Write SQL ---
  let sql =
    '-- Auto-generated Seed Data\nTRUNCATE TABLE organizations, roles, users, jobs, projects, job_applications, project_allocations, tickets, notifications CASCADE;\n\n';

  // Permissions
  for (let p of PERMISSIONS)
    sql += `INSERT INTO permissions (code, description) VALUES ('${p}','Auto-generated') ON CONFLICT DO NOTHING;\n`;

  // Organizations
  for (let o of orgs) {
    sql += `INSERT INTO organizations (id,name,type,status,legal_name,website,email,phone,address_line1,address_line2,city,state,country,postal_code,employee_count,industry,key_clients,service_offerings,years_in_business,created_at,updated_at) VALUES ('${o.id}','${o.name}','${o.type}','${o.status}','${o.legalName}','${o.domain}','${o.email}','${o.phone}','${o.address_line1}','${o.address_line2}','${o.city}','${o.state}','${o.country}','${o.postal_code}',${o.employee_count},'${o.industry}','${o.key_clients}','${o.service_offerings}',${o.years_in_business},NOW(),NOW());\n`;
  }

  // Roles
  for (let r of allRoles) {
    sql += `INSERT INTO roles (id,org_id,name,description,created_at,updated_at) VALUES ('${r.id}','${r.orgId}','${r.name}','${r.description}',NOW(),NOW());\n`;
    for (let perm of r.permissions) {
      sql += `INSERT INTO role_permissions (role_id,permission_code) VALUES ('${r.id}','${perm}');\n`;
    }
  }

  // Users
  for (let u of allUsers) {
    sql += `INSERT INTO users (id,org_id,role_id,email,password_hash,first_name,last_name,employment_type,employment_status,gender,created_at,updated_at,enabled) VALUES ('${u.id}','${u.orgId}','${u.roleId}','${u.email}','${PASSWORD_HASH}','${u.firstName}','${u.lastName}','${u.employment_type || 'FTE'}','${u.employment_status || 'ACTIVE'}','${u.gender || 'MALE'}',NOW(),NOW(),true);\n`;
  }

  // Jobs
  for (let j of allJobs) {
    sql += `INSERT INTO jobs (id,org_id,title,status,employment_type,description,requirements,roles_and_responsibilities,skills,created_at,updated_at) VALUES ('${j.id}','${j.orgId}','${j.title}','${j.status}','${j.employment_type}','${j.description}','${j.requirements}','${j.roles_and_responsibilities}','${j.skills}',NOW(),NOW());\n`;
  }

  // Projects
  for (let p of allProjects) {
    sql += `INSERT INTO projects (id,internal_org_id,client_org_id,name,status,start_date,end_date,description) VALUES ('${p.id}','${p.internal_org_id}','${p.client_org_id}','${p.name}','${p.status}','${p.start_date}','${p.end_date}','${p.description}');\n`;
  }

  // Allocations
  for (let a of allAllocations) {
    sql += `INSERT INTO project_allocations (id,project_id,user_id,status,billing_role,allocation_percentage) VALUES ('${a.id}','${a.project_id}','${a.user_id}','${a.status}','${a.billing_role}',${a.allocation_percentage});\n`;
  }

  const escapeNumber = (val) => (val === undefined || val === null ? 'NULL' : val);

  // Applications
  for (let a of allApps) {
    sql += `INSERT INTO job_applications 
  (id, job_id, first_name, last_name, email, status, experience_years, resume_text, vendor_org_id, created_at, updated_at) 
  VALUES (
    '${a.id}',
    '${a.jobId || uuid()}',  -- fallback just in case
    ${escapeSql(a.firstName)},
    ${escapeSql(a.lastName)},
    ${escapeSql(a.email)},
    ${escapeSql(a.status)},
    ${escapeNumber(a.experience)},  -- numeric safe
    ${escapeSql(a.resumeText)},
    ${a.vendorOrgId ? `'${a.vendorOrgId}'` : 'NULL'},  -- nullable
    NOW(),
    NOW()
  );\n`;
  }

  // Notifications
  for (let n of allNotifications) {
    sql += `INSERT INTO notifications (id,recipient_user_id,title,body,ref_entity_type,ref_entity_id,created_at,updated_at) VALUES ('${n.id}','${n.recipientId}','${n.title}','${n.body}','${n.refType}','${n.refId}',NOW(),NOW());\n`;
  }

  // Tickets
  for (let t of allTickets) {
    sql += `INSERT INTO tickets (id,ticket_number,subject,description,type,status,priority,employee_id,target_org_id,is_escalated,unread_count_employee,unread_count_admin,created_at,updated_at) VALUES ('${t.id}','${t.ticket_number}','${t.subject}','${t.description}','${t.type}','${t.status}','${t.priority}','${t.employee_id}','${t.target_org_id}',${t.is_escalated},${t.unreadEmployee},${t.unreadAdmin},NOW(),NOW());\n`;
  }

  fs.writeFileSync(OUTPUT_FILE, sql);
  console.log(`Seed file generated: ${OUTPUT_FILE}`);
};

main();
