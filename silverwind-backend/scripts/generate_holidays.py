import uuid
from datetime import date

ORG_ID = '4d3572a8-678e-4e60-bc92-4069165853d1'

def get_uuid():
    return str(uuid.uuid4())

def quote(s):
    if s is None: return "NULL"
    val = str(s).replace("'", "''")
    return f"'{val}'"

holidays = [
    ("New Year's Day", date(2026, 1, 1), "Start of the year"),
    ("Makar Sankranti", date(2026, 1, 14), "Harvest Festival"),
    ("Republic Day", date(2026, 1, 26), "National Holiday"),
    ("Maha Shivaratri", date(2026, 2, 15), "Hindu Festival"), # Approx
    ("Holi", date(2026, 3, 4), "Festival of Colors"), # Approx
    ("Good Friday", date(2026, 4, 3), "Christian Holiday"), # Approx
    ("Ambedkar Jayanti", date(2026, 4, 14), "Birth of B.R. Ambedkar"),
    ("Labor Day", date(2026, 5, 1), "International Workers' Day"),
    ("Eid al-Fitr", date(2026, 5, 20), "Islamic Holiday"), # Approx dates
    ("Independence Day", date(2026, 8, 15), "National Holiday"),
    ("Raksha Bandhan", date(2026, 8, 28), "Hindu Festival"), # Approx
    ("Gandhi Jayanti", date(2026, 10, 2), "National Holiday"),
    ("Dussehra", date(2026, 10, 20), "Hindu Festival"), # Approx
    ("Diwali", date(2026, 11, 8), "Festival of Lights"), # Approx
    ("Christmas", date(2026, 12, 25), "Christian Holiday")
]

for name, dt, desc in holidays:
    hid = get_uuid()
    print(f"INSERT INTO holidays (id, created_at, updated_at, org_id, date, name, description, is_mandatory) VALUES ({quote(hid)}, NOW(), NOW(), {quote(ORG_ID)}, {quote(dt)}, {quote(name)}, {quote(desc)}, true) ON CONFLICT DO NOTHING;")
