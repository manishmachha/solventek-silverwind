import uuid
import random
from datetime import datetime, timedelta

def get_uuid():
    return str(uuid.uuid4())

def quote(s):
    if s is None: return "NULL"
    val = str(s).replace("'", "''")
    return f"'{val}'"

def date_str(d):
    return f"'{d.strftime('%Y-%m-%d')}'"

def timestamp_str(dt):
    return f"'{dt.strftime('%Y-%m-%d %H:%M:%S')}'"

# --- Constants & Generators ---

FIRST_NAMES = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Muhammad", "Avni", "Diya", "Saanvi", "Ananya", "Aadhya", "Kiara", "Myra", "Ira", "Ishaan"]
LAST_NAMES = ["Sharma", "Verma", "Reddy", "Nair", "Patel", "Mehta", "Iyer", "Rao", "Gupta", "Singh", "Kumar", "Chopra", "Desai", "Joshi", "Malhotra", "Jain"]
DEPARTMENTS = ["Engineering", "HR", "Sales", "Marketing", "Finance"]
DESIGNATIONS = ["Software Engineer", "HR Manager", "Sales Executive", "Marketing Lead", "Accountant", "Senior Developer"]
LOCATIONS = ["Hyderabad", "Bangalore", "Pune", "Mumbai", "Delhi"]

# Hardcoded Employee IDs to ensure consistency
EMPLOYEE_IDS = [
    "cd9506ae-650b-441e-9f16-33b20fb3a467",
    "185128ba-f728-4047-97ec-e2fed091d58a",
    "146b9400-44fb-4fb4-94fd-65a0ab477724",
    "bb9933ae-ef1a-4192-bc83-6de54c7e82a2",
    "727a1134-ec1a-405a-9045-70506a1e0d99",
    "bfed2e13-7ddc-4222-a1a5-b46ae863182a",
    "38c63bbc-05a2-4dfc-8d2e-74189a680719",
    "e627a524-6253-425c-898c-6fbbe598092a",
    "fb4345f3-744c-4aa1-94a2-686524791abb",
    "126f45b4-692f-4959-bb0c-86f30fb4a6cf",
    "20e0e794-db50-46bb-89ed-bc94a1f6739b",
    "639d1a9e-1c7a-4f67-b0e9-85216db06f70",
    "0f53943d-823e-4bcf-848c-bfafe5c8d3e7",
    "086c45bf-8aa2-451c-95af-eb4dbd7ca1b6",
    "06f849b2-687c-48cb-9927-8344cd208f49",
    "d7f7600b-30e6-47bb-9cb6-c2539a2db222"
]

ASSET_TYPES = [
    ("Laptop", "Dell", "Latitude 7420"),
    ("Laptop", "Apple", "MacBook Pro 16"),
    ("Monitor", "Dell", "UltraSharp U2720Q"),
    ("Monitor", "Samsung", "Odyssey G7"),
    ("Smartphone", "Apple", "iPhone 15"),
    ("Smartphone", "Samsung", "Galaxy S24"),
    ("Keyboard", "Logitech", "MX Keys"),
    ("Mouse", "Logitech", "MX Master 3S"),
    ("Headphones", "Sony", "WH-1000XM5"),
    ("Chair", "Herman Miller", "Aeron")
]

ORG_ID = 'ce9c7bad-8732-407a-b77c-97d8b2bd0a8d'
ROLE_IDS = [get_uuid() for _ in range(3)] # Admin, Manager, Employee
LEAVE_TYPE_IDS = [get_uuid() for _ in range(3)] # SL, CL, PL

now = datetime.now()

# 1. Organization
print(f"INSERT INTO organizations (id, created_at, updated_at, name, type, status, email) VALUES ({quote(ORG_ID)}, {timestamp_str(now)}, {timestamp_str(now)}, 'Solventek Demo', 'SOLVENTEK', 'APPROVED', 'info@solventek.com') ON CONFLICT DO NOTHING;")

# 2. Roles
role_names = ["ADMIN", "TA", "EMPLOYEE"]
for i, rid in enumerate(ROLE_IDS):
    print(f"INSERT INTO roles (id, created_at, updated_at, name, org_id) VALUES ({quote(rid)}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(role_names[i])}, {quote(ORG_ID)}) ON CONFLICT DO NOTHING;")

# 3. Leave Types
lt_names = ["Sick Leave", "Casual Leave", "Privilege Leave"]
for i, ltid in enumerate(LEAVE_TYPE_IDS):
     print(f"INSERT INTO leave_types (id, organization_id, name, default_days_per_year, carry_forward_allowed, is_active, accrual_frequency, requires_approval) VALUES ({quote(ltid)}, {quote(ORG_ID)}, {quote(lt_names[i])}, 12, true, true, 'MONTHLY', true) ON CONFLICT DO NOTHING;")

# 4. Generate Assets
global_assets = []
print("-- Generating 10 Grouped Assets (10 types, quantity 50 each)")
for t_idx, (atype, brand, model) in enumerate(ASSET_TYPES):
    asset_id = get_uuid()
    tag_prefix = atype[:2].upper()
    asset_tag = f"{tag_prefix}-{t_idx}-GROUP"
    serial = f"SN-{t_idx}-GROUP-{random.randint(1000,9999)}"
    
    print(f"INSERT INTO assets (id, created_at, updated_at, asset_tag, asset_type, brand, model, serial_number, active, total_quantity, org_id) VALUES ({quote(asset_id)}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(asset_tag)}, {quote(atype)}, {quote(brand)}, {quote(model)}, {quote(serial)}, true, 50, {quote(ORG_ID)}) ON CONFLICT DO NOTHING;")
    
    global_assets.append({'id': asset_id, 'type': atype})

# 5. Employees & Related Data
for i, emp_id in enumerate(EMPLOYEE_IDS):
    fn = FIRST_NAMES[i % len(FIRST_NAMES)]
    ln = LAST_NAMES[i % len(LAST_NAMES)]
    email = f"{fn.lower()}.{ln.lower()}{i}@solventek.com"
    dept = random.choice(DEPARTMENTS)
    desg = random.choice(DESIGNATIONS)
    loc = random.choice(LOCATIONS)
    
    # History logic
    range_start = 365 * 16
    range_end = 365 * 20
    doj = now - timedelta(days=random.randint(range_start, range_end))
    dob = doj - timedelta(days=random.randint(7000, 10000))
    
    manager_id = EMPLOYEE_IDS[0] if i > 0 else "NULL" 
    if manager_id != "NULL": manager_id = quote(manager_id)
    
    role_id = ROLE_IDS[2] 
    if i == 0: role_id = ROLE_IDS[1] 
    
    # Employee
    print(f"INSERT INTO employees (id, created_at, updated_at, email, password_hash, first_name, last_name, employee_code, date_of_birth, date_of_joining, employment_status, department, designation, employment_type, work_location, org_id, role_id, manager_id, enabled, account_locked, failed_login_attempts) VALUES ({quote(emp_id)}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(email)}, 'hash123', {quote(fn)}, {quote(ln)}, 'SOLV{1000+i}', {date_str(dob)}, {date_str(doj)}, 'ACTIVE', {quote(dept)}, {quote(desg)}, 'FTE', {quote(loc)}, {quote(ORG_ID)}, {quote(role_id)}, {manager_id}, true, false, 0) ON CONFLICT DO NOTHING;")
    
    # Salary Structure
    basic = random.randint(15000, 50000)
    hra = basic * 0.4
    da = basic * 0.2
    
    def calc_salary(base):
        h = base * 0.4
        d = base * 0.2
        sp = 5000
        med = 2000
        lt = 2000
        cm = 1500
        oth = 1000
        pf = base * 0.12
        return (h, d, sp, med, lt, cm, oth, pf)

    (hra, da, special, medical, lta, comm, other, epf) = calc_salary(basic)
    
    print(f"INSERT INTO salary_structures (id, created_at, updated_at, user_id, org_id, basic, hra, da, special_allowance, medical_allowance, lta, communication_allowance, other_earnings, epf_deduction) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(ORG_ID)}, {basic}, {hra}, {da}, {special}, {medical}, {lta}, {comm}, {other}, {epf}) ON CONFLICT DO NOTHING;")
    
    # Salary Revisions (Last 15 years)
    current_ctc = 600000
    for year_idx in range(15):
         rev_date = now - timedelta(days=365 * (year_idx + 1))
         old_ctc = current_ctc - 50000
         print(f"INSERT INTO salary_revisions (id, created_at, updated_at, user_id, revision_date, old_ctc, new_ctc, change_reason) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {date_str(rev_date)}, {old_ctc}, {current_ctc}, 'Annual Appraisal') ON CONFLICT DO NOTHING;")
         current_ctc = old_ctc 

    # Payrolls (Last 15 months)
    for m_idx in range(15):
        p_date = now.replace(day=1) - timedelta(days=30 * (m_idx + 1))
        p_month = p_date.month
        p_year = p_date.year
        
        gross = basic + hra + da + special + medical + lta + comm + other
        deductions = epf
        net = gross - deductions
        print(f"INSERT INTO payrolls (id, created_at, updated_at, user_id, org_id, month, year, basic, hra, da, special_allowance, medical_allowance, lta, communication_allowance, other_earnings, epf_deduction, total_earnings, total_deductions, net_pay, status) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(ORG_ID)}, {p_month}, {p_year}, {basic}, {hra}, {da}, {special}, {medical}, {lta}, {comm}, {other}, {epf}, {gross}, {deductions}, {net}, 'PAID') ON CONFLICT DO NOTHING;")

    # Leave Balances (15 entries: 3 types * 5 years)
    for y_idx in range(5):
        lb_year = 2026 - y_idx
        for ltid in LEAVE_TYPE_IDS:
             print(f"INSERT INTO leave_balances (id, user_id, leave_type_id, year, allocated_days, used_days, remaining_days) VALUES ({quote(get_uuid())}, {quote(emp_id)}, {quote(ltid)}, {lb_year}, 12, 0, 12) ON CONFLICT DO NOTHING;")

    # Leave Requests (15 entries)
    for r_idx in range(15):
        req_start = now - timedelta(days=random.randint(10, 500))
        req_end = req_start + timedelta(days=random.randint(1, 3))
        lt_id = random.choice(LEAVE_TYPE_IDS)
        print(f"INSERT INTO leave_requests (id, created_at, updated_at, user_id, organization_id, leave_type_id, start_date, end_date, reason, status) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(ORG_ID)}, {quote(lt_id)}, {date_str(req_start)}, {date_str(req_end)}, 'Personal Work', 'APPROVED') ON CONFLICT DO NOTHING;")

    # Attendance (15 entries)
    for d_idx in range(15):
        att_date = now - timedelta(days=d_idx + 1)
        print(f"INSERT INTO attendances (id, created_at, updated_at, user_id, organization_id, date, status, check_in_time, check_out_time) VALUES ({quote(get_uuid())}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(ORG_ID)}, {date_str(att_date)}, 'PRESENT', '09:00:00', '18:00:00') ON CONFLICT DO NOTHING;")

# 6. Assign Assets
print("-- Assigning Assets")
laptops = [a for a in global_assets if a['type'] == 'Laptop']
phones = [a for a in global_assets if a['type'] == 'Smartphone']
headphones = [a for a in global_assets if a['type'] == 'Headphones']
others = [a for a in global_assets if a['type'] not in ['Laptop', 'Smartphone', 'Headphones']]

for emp_id in EMPLOYEE_IDS:
    kit = []
    if laptops: kit.append(random.choice(laptops))
    if phones: kit.append(random.choice(phones))
    if headphones: kit.append(random.choice(headphones))
    if others:
        for _ in range(random.randint(1, 2)):
            kit.append(random.choice(others))
            
    # Remove duplicates from kit if any (in case random.choice(others) picked the same asset twice)
    kit = list({a['id']: a for a in kit}.values())
            
    for asset in kit:
        assign_id = get_uuid()
        assign_date = now - timedelta(days=random.randint(10, 300))
        print(f"INSERT INTO employee_asset_assignments (id, created_at, updated_at, employee_id, asset_id, assigned_on, condition_on_assign, status) VALUES ({quote(assign_id)}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(asset['id'])}, {date_str(assign_date)}, 'NEW', 'ASSIGNED') ON CONFLICT DO NOTHING;")
