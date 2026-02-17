import uuid
import random
from datetime import datetime, timedelta

ORG_ID = '4d3572a8-678e-4e60-bc92-4069165853d1'

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

now = datetime.now()

print("-- New Assets Generation (10 Types * 50 Qty = 500 Assets)")

all_assets = []


for t_idx, (atype, brand, model) in enumerate(ASSET_TYPES):
    # Create 1 Bulk Asset entry with quantity 50
    asset_id = get_uuid()
    # Tag: TYPE-IDX-BASE
    tag_prefix = atype[:2].upper()
    asset_tag = f"{tag_prefix}-{t_idx}-BASE"
    serial = f"SN-{t_idx}-BATCH-{random.randint(1000,9999)}"
    
    # Insert Asset with total_quantity=50
    print(f"INSERT INTO assets (id, created_at, updated_at, asset_tag, asset_type, brand, model, serial_number, active, total_quantity, org_id) VALUES ({quote(asset_id)}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(asset_tag)}, {quote(atype)}, {quote(brand)}, {quote(model)}, {quote(serial)}, true, 50, {quote(ORG_ID)}) ON CONFLICT DO NOTHING;")
    
    all_assets.append({
        'id': asset_id,
        'type': atype
    })

print("\n-- Assigning Assets to Employees")
# Strategy:
# 1. Give every employee 1 Laptop, 1 Phone, 1 Headphone from the available types (randomly selected if multiple options exist for a type)
# 2. Distribute remaining randomly

laptops = [a for a in all_assets if a['type'] == 'Laptop']
phones = [a for a in all_assets if a['type'] == 'Smartphone']
headphones = [a for a in all_assets if a['type'] == 'Headphones']
# Monitors are 'others' for this logic, or we can explicitly assign them if needed. 
others = [a for a in all_assets if a['type'] not in ['Laptop', 'Smartphone', 'Headphones']]

for emp_id in EMPLOYEE_IDS:
    # Assign core kit
    kit = []
    
    # Pick one of each core type if available
    if laptops: kit.append(random.choice(laptops))
    if phones: kit.append(random.choice(phones))
    if headphones: kit.append(random.choice(headphones))
    
    # Assign 1-2 random extras (Monitors, Keyboards, etc)
    if others:
        for _ in range(random.randint(1, 2)):
            kit.append(random.choice(others))
            
    for asset in kit:
        assign_id = get_uuid()
        assign_date = now - timedelta(days=random.randint(10, 300))
        # Status: ASSIGNED
        # Note: In a real system we would decrement quantity or check availability, but this is mock data generation
        print(f"INSERT INTO employee_asset_assignments (id, created_at, updated_at, employee_id, asset_id, assigned_on, condition_on_assign, status) VALUES ({quote(assign_id)}, {timestamp_str(now)}, {timestamp_str(now)}, {quote(emp_id)}, {quote(asset['id'])}, {date_str(assign_date)}, 'NEW', 'ASSIGNED') ON CONFLICT DO NOTHING;")

