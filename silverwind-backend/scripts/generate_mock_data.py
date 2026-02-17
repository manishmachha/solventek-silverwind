import uuid
import random
from datetime import datetime, timedelta

def get_uuid():
    return str(uuid.uuid4())

def quote(s):
    if s is None:
        return "NULL"
    val = str(s).replace("'", "''")
    return f"'{val}'"

def date_str(d):
    return f"'{d.strftime('%Y-%m-%d')}'"

def timestamp_str(dt):
    return f"'{dt.strftime('%Y-%m-%d %H:%M:%S')}'"

# --- Constants & Generators ---

FIRST_NAMES = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Muhammad", "Avni", "Diya", "Saanvi", "Ananya", "Aadhya", "Kiara", "Myra", "Ira"]
LAST_NAMES = ["Sharma", "Verma", "Reddy", "Nair", "Patel", "Mehta", "Iyer", "Rao", "Gupta", "Singh", "Kumar", "Chopra", "Desai", "Joshi", "Malhotra"]
DEPARTMENTS = ["Engineering", "HR", "Sales", "Marketing", "Finance"]
DESIGNATIONS = ["Software Engineer", "HR Manager", "Sales Executive", "Marketing Lead", "Accountant", "Senior Developer"]
LOCATIONS = ["Hyderabad", "Bangalore", "Pune", "Mumbai", "Delhi"]

# Generate IDs
ORG_ID = get_uuid()
ROLE_IDS = [get_uuid() for _ in range(3)] # Admin, Manager, Employee
EMPLOYEE_IDS = [get_uuid() for _ in range(15)]
LEAVE_TYPE_IDS = [get_uuid() for _ in range(3)] # SL, CL, PL

# Data
employees = []
salary_structures = []
salary_revisions = []
payrolls = []
leave_requests = []
leave_balances = []
attendances = []
assets = []
asset_assignments = []

now = datetime.now()

# 1. Organization
print(f"INSERT INTO organizations (id, created_at, updated_at, name, type, status, email) VALUES ({quote(ORG_ID)}, {timestamp_str(now)}, {timestamp_str(now)}, 'Solventek Demo', 'SOLVENTEK', 'APPROVED', 'info@solventek.com');")

# 2. Roles
role_names = ["Admin", "Manager", "Employee"]
for i, rid in enumerate(ROLE_IDS):
    print(f"INSERT INTO roles (id, created_at, updated_at, name, org_id) VALUES ({quote(rid)}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(role_names[i])}, {quote(ORG_ID)});")

# 3. Leave Types (Needed for Balances/Requests)
lt_names = ["Sick Leave", "Casual Leave", "Privilege Leave"]
for i, ltid in enumerate(LEAVE_TYPE_IDS):
     print(f"INSERT INTO leave_types (id, organization_id, name, default_days_per_year, carry_forward_allowed, is_active, accrual_frequency, requires_approval) VALUES ({quote(ltid)}, {quote(ORG_ID)}, {quote(lt_names[i])}, 12, true, true, 'MONTHLY', true);")

# 4. Employees & Related Data
for i, emp_id in enumerate(EMPLOYEE_IDS):
    fn = FIRST_NAMES[i % len(FIRST_NAMES)]
    ln = LAST_NAMES[i % len(LAST_NAMES)]
    email = f"{fn.lower()}.{ln.lower()}{i}@solventek.com"
    dept = random.choice(DEPARTMENTS)
    desg = random.choice(DESIGNATIONS)
    loc = random.choice(LOCATIONS)
    
    doj = now - timedelta(days=random.randint(100, 1000))
    dob = doj - timedelta(days=random.randint(7000, 10000)) # 20-30 years old at joining
    
    manager_id = EMPLOYEE_IDS[0] if i > 0 else "NULL" # First employee is top boss
    if manager_id != "NULL": manager_id = quote(manager_id)
    
    role_id = ROLE_IDS[2] # Default Employee
    if i == 0: role_id = ROLE_IDS[1] # Manager
    
    # Employee
    print(f"INSERT INTO employees (id, created_at, updated_at, email, password_hash, first_name, last_name, employee_code, date_of_birth, date_of_joining, employment_status, department, designation, employment_type, work_location, org_id, role_id, manager_id, enabled, account_locked, failed_login_attempts) VALUES ({quote(emp_id)}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(email)}, 'hash123', {quote(fn)}, {quote(ln)}, 'SOLV{1000+i}', {date_str(dob)}, {date_str(doj)}, 'ACTIVE', {quote(dept)}, {quote(desg)}, 'FTE', {quote(loc)}, {quote(ORG_ID)}, {quote(role_id)}, {manager_id}, true, false, 0);")
    
    # Salary Structure
    basic = random.randint(15000, 50000)
    hra = basic * 0.4
    da = basic * 0.2
    special = 5000
    medical = 2000
    lta = 2000
    comm = 1500
    other = 1000
    epf = basic * 0.12
    
    print(f"INSERT INTO salary_structures (id, created_at, updated_at, user_id, org_id, basic, hra, da, special_allowance, medical_allowance, lta, communication_allowance, other_earnings, epf_deduction) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(ORG_ID)}, {basic}, {hra}, {da}, {special}, {medical}, {lta}, {comm}, {other}, {epf});")
    
    # Salary Revision (One per employee)
    rev_date = doj + timedelta(days=365)
    if rev_date < now:
        print(f"INSERT INTO salary_revisions (id, created_at, updated_at, user_id, revision_date, old_ctc, new_ctc, change_reason) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {date_str(rev_date)}, 500000, 600000, 'Annual Appraisal');")
        
    # Payroll (Last Month)
    pay_month = 1
    pay_year = 2026
    gross = basic + hra + da + special + medical + lta + comm + other
    deductions = epf
    net = gross - deductions
    
    print(f"INSERT INTO payrolls (id, created_at, updated_at, user_id, org_id, month, year, basic, hra, da, special_allowance, medical_allowance, lta, communication_allowance, other_earnings, epf_deduction, total_earnings, total_deductions, net_pay, status) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(ORG_ID)}, {pay_month}, {pay_year}, {basic}, {hra}, {da}, {special}, {medical}, {lta}, {comm}, {other}, {epf}, {gross}, {deductions}, {net}, 'PAID');")

    # Leave Balance (One per type per employee -> 3 * 15 = 45 entries)
    for ltid in LEAVE_TYPE_IDS:
         print(f"INSERT INTO leave_balances (id, user_id, leave_type_id, year, allocated_days, used_days, remaining_days) VALUES ({quote(get_uuid())}, {quote(emp_id)}, {quote(ltid)}, 2026, 12, 0, 12);")

    # Leave Request (One per employee)
    req_start = now - timedelta(days=random.randint(1, 30))
    req_end = req_start + timedelta(days=random.randint(1, 2))
    print(f"INSERT INTO leave_requests (id, created_at, updated_at, user_id, organization_id, leave_type_id, start_date, end_date, reason, status) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(ORG_ID)}, {quote(LEAVE_TYPE_IDS[0])}, {date_str(req_start)}, {date_str(req_end)}, 'Personal Work', 'APPROVED');")

    # Attendance (One per employee)
    att_date = now - timedelta(days=1)
    print(f"INSERT INTO attendances (id, created_at, updated_at, user_id, organization_id, date, status, check_in_time, check_out_time) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(ORG_ID)}, {date_str(att_date)}, 'PRESENT', '09:00:00', '18:00:00');")
    
    # Asset & Assignment (One per employee)
    asset_id = get_uuid()
    asset_tag = f"AST-{1000+i}"
    print(f"INSERT INTO assets (id, created_at, updated_at, asset_tag, asset_type, brand, model, serial_number, active, total_quantity, org_id) VALUES ({quote(asset_id)}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(asset_tag)}, 'Laptop', 'Dell', 'Latitude', {quote(f'SN-{1000+i}')}, true, 1, {quote(ORG_ID)});")
    
    print(f"INSERT INTO employee_asset_assignments (id, created_at, updated_at, employee_id, asset_id, assigned_on, condition_on_assign, status) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(asset_id)}, {date_str(doj)}, 'NEW', 'ASSIGNED');")

