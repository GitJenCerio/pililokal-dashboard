# Pililokal Merchants Dashboard — Cursor Feature Prompt

## Context
We have a cleaned merchant leads database (`Pililokal_Merchants_Cleaned.xlsx`) with **5 sheets** representing different stages of the merchant pipeline. Use this file as the data source to build or extend a merchants dashboard.

---

## Data Source

**File:** `Pililokal_Merchants_Cleaned.xlsx`

Load all sheets using:
```python
import pandas as pd
xl = pd.read_excel("Pililokal_Merchants_Cleaned.xlsx", sheet_name=None)

ph_confirmed  = xl["PH Confirmed Merchants"]   # 44 rows  — confirmed, samples received
interested    = xl["Interested Merchants"]      # 40 rows  — expressed interest, not yet confirmed
ph_leads      = xl["PH New Leads"]             # 632 rows — PH-based prospects, outreach in progress
us_leads      = xl["US New Leads"]             # 984 rows — US-based prospects
prev_clients  = xl["Previous Clients"]         # 37 rows  — returning / previous event merchants
```

### Shared Columns (most sheets)
| Column | Description |
|---|---|
| `Merchant Name` | Business / brand name |
| `Category` | Product category (see categories below) |
| `Products` | Description of what they sell |
| `Email` | Primary contact email |
| `Contact` | Phone number |
| `Address` | Location (city/province/country) |
| `Status Notes` | Free-text status log with dates (e.g. "Email sent 1/22/2026 — awaiting reply") |
| `FB` / `IG` / `TikTok` / `Website` | Social media & web links |
| `Encoded By` | Staff member who encoded the record |

### Sheet-specific Columns
| Sheet | Extra Columns |
|---|---|
| `PH New Leads` | `Calls Update` — log of phone call attempts and outcomes |
| `US New Leads` | `Result` (Confirmed / Interested / No Response / Declined / Closed or not Qualified), `Calls Update`, `Followup Email`, `Reach Via Socmed` |
| `Previous Clients` | `Registered Name`, `Contact Person`, `Designation`, `Authorized Signatory` |
| `PH Confirmed` | `Encoded By` |

### Product Categories
```
Clothing & Wearables | Food & Gourmet Products | Home Décor & Handicrafts
Bags & Accessories | Candles & Home Fragrances | Stationery & Paper Products
Art & Figurines | Handwoven Textiles / Fabrics | Heritage / Multi-Product
Lifestyle | Liquor / Beverages | Miscellaneous / Specialty Products | Other
```

---

## Features to Build

### 1. Pipeline Overview (KPI Cards)
Display top-level metrics at a glance.

```
Total Merchants in Database         → count all rows across all sheets
PH Confirmed (Samples Received)     → rows in "PH Confirmed Merchants" where Status Notes contains "SAMPLE ITEMS RECEIVED"
Interested (Pending Confirmation)   → count of "Interested Merchants" sheet
US Leads                            → count of "US New Leads" sheet
PH New Leads                        → count of "PH New Leads" sheet
Returning / Previous Clients        → count of "Previous Clients" sheet
```

**Derivable sub-metrics:**
- `Sample Items Received` count — from PH Confirmed where `Status Notes == "SAMPLE ITEMS RECEIVED"`
- `Shipped / In Transit` — from PH Confirmed where Status Notes contains "shipped" or "LBC"
- `Awaiting Response` — status notes containing "awaiting response" (case-insensitive)
- `No Answer / Unreachable` — calls update or status notes containing "no answer", "cannot be reached", "not answering"


---

### 2. Merchant Pipeline / Funnel View
Show the conversion funnel from lead to confirmed.

```
Stage 1: New Lead (PH + US leads with no reply)
Stage 2: Contacted (email sent / called — logged in Status Notes)
Stage 3: Interested / Replied (status contains "interested", "replied", "zoom meeting")
Stage 4: Confirmed (Interested Merchants sheet)
Stage 5: Sample Received (PH Confirmed with "SAMPLE ITEMS RECEIVED")
```

Derive stage from `Status Notes` and `Result` (US Leads) using keyword parsing:
```python
def classify_stage(status, result=""):
    s = str(status).lower() + str(result).lower()
    if "sample" in s and "received" in s:        return "Sample Received"
    if "confirmed" in s or "will ship" in s:     return "Confirmed"
    if "interested" in s or "replied" in s:      return "Interested"
    if "email sent" in s or "called" in s:       return "Contacted"
    if "no response" in s or "no answer" in s:   return "No Response"
    if "declined" in s or "closed" in s:         return "Declined / Closed"
    return "New / Unknown"
```

---

### 3. Category Breakdown Chart
Bar or donut chart of merchant counts by `Category` across all sheets.

Top categories by total count:
- Clothing & Wearables
- Food & Gourmet Products
- Home Décor & Handicrafts
- Bags & Accessories
- Candles & Home Fragrances
- Stationery & Paper Products
- Art & Figurines
- Handwoven Textiles / Fabrics

> **Note:** Some rows have a blank / whitespace `Category` — filter these out (`df['Category'].str.strip() != ""`) before charting.

---

### 4. Geo / Location Breakdown
Extract city/region from `Address` field to show merchant density by location.

```python
# Simple city extraction — split on comma, take first part
df['City'] = df['Address'].str.split(',').str[0].str.strip()
```

Expected top PH locations: Quezon City, Makati, Manila, Cainta, Antipolo, Laguna, Cebu, Bacolod
Expected US locations: Los Angeles, New York, San Francisco, etc.

Show as:
- A count table or bar chart (PH vs US split)
- Optional: a map pin chart if using a mapping library

---

### 5. Social Media / Digital Presence Tracker
For each confirmed/interested merchant, show which digital channels they have.

```python
df['Has_FB']      = df['Fb'].notna() & (df['Fb'].str.strip() != "")
df['Has_IG']      = df['Ig'].notna() & (df['Ig'].str.strip() != "")
df['Has_TikTok']  = df['TikTok'].notna() & (df['TikTok'].str.strip() != "")
df['Has_Website'] = df['Website'].notna() & (df['Website'].str.strip() != "")
df['Social_Score'] = df[['Has_FB','Has_IG','Has_TikTok','Has_Website']].sum(axis=1)
```

Display:
- % of merchants with each channel
- "Digital completeness" score (0–4) per merchant
- Filter merchants with no online presence (Social_Score == 0) for follow-up

---

### 6. Outreach Activity Timeline
Parse dates from `Status Notes` and `Calls Update` to visualize outreach over time.

```python
import re

def extract_dates(text):
    # Matches patterns like: 1/22, 1/22/2026, Jan 13, Feb 20
    patterns = [
        r'\b(\d{1,2}/\d{1,2}(?:/\d{2,4})?)\b',
        r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b'
    ]
    dates = []
    for p in patterns:
        dates += re.findall(p, str(text), re.IGNORECASE)
    return dates
```

Use this to build a timeline/heatmap showing:
- Volume of outreach activity per week/day
- When each merchant was last contacted
- Merchants with no activity in the last 30 days (need follow-up)

---

### 7. Merchant Search & Detail View
A searchable table with filters:

**Filter controls:**
- Sheet / Pipeline Stage (dropdown)
- Category (multi-select)
- Country: PH / US (derived from Address)
- Has Email: Yes / No
- Has Social Media: Yes / No
- Status keyword search

**Table columns:** Merchant Name, Category, Email, Contact, Address, Status, Last Activity Date, Social (icons)

**Row click → Detail Panel showing:**
- Full status notes log
- All contact info
- Clickable social links (FB, IG, TikTok, Website)
- Call notes history

---

### 8. US Leads Result Breakdown
The US Leads sheet has an explicit `Result` column — use it for a dedicated US pipeline chart.

```
Result values:
- Confirmed           (7)   → 🟢
- Interested          (6)   → 🟡
- replied but not yet confirmed (13) → 🟡
- No Response        (234)  → 🔴
- Declined            (10)  → ⛔
- Closed or not Qualified (25) → ⛔
- (blank)            (689)  → ⬜ Not yet contacted
```

Show as a status donut + sortable table filtered by result.

---

### 9. Staff Workload / Encoded By Tracker
PH Confirmed, PH New Leads, and US New Leads have an `Encoded By` column.

```python
df['Encoded By'].value_counts()
# Expected: Shen, Jhen, Christin, etc.
```

Show:
- Count of merchants per staff member
- Breakdown by stage/status per staff member
- Useful for workload balancing

---

### 10. Re-engagement / Follow-up Queue
Auto-generate a list of merchants that need follow-up action.

```python
follow_up_keywords = ["no answer", "cannot be reached", "no response", "awaiting", 
                       "will call again", "not answering", "busy", "called back"]

df['Needs_Followup'] = df['Status Notes'].str.lower().str.contains(
    '|'.join(follow_up_keywords), na=False
)
```

Show as a prioritized queue table sorted by last activity date (oldest first).

---

## Implementation Notes for Cursor

1. **Data loading** — Load from the Excel file. Clean blank categories with:
   ```python
   df['Category'] = df['Category'].str.strip().replace('​', '').replace('', pd.NA)
   ```

2. **Sheet tagging** — Add a `source_sheet` column to each df before merging for the master view.

3. **Date parsing** — Most dates in `Status Notes` are informal (e.g. "Shen 1/22 - ..."). Parse with regex rather than `pd.to_datetime` directly. Assume year is 2025–2026.

4. **Null handling** — Many cells are genuinely empty. Use `.fillna("")` for display and `.notna()` for presence checks.

5. **Text truncation** — `Status Notes` can be very long (500+ chars). Truncate to 120 chars in table views, show full text in detail panel.

6. **Country split** — US Leads addresses contain US state codes (CA, NY, TX). PH addresses contain "Philippines". Use this for PH vs US segmentation.
   ```python
   df['Country'] = df['Address'].apply(
       lambda x: 'US' if any(s in str(x) for s in [', CA', ', NY', ', TX', 'United States']) else 'PH'
   )
   ```
