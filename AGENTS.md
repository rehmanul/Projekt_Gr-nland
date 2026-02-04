# AGENTS instructions - Projekt Gronland

This file captures the authoritative requirements from the user conversation. When implementing or documenting work in this repo, follow these instructions first. If something conflicts with code or other docs, surface the conflict and propose the lowest-risk resolution.

## Track A: DXF processing and PDF export (Test2.dxf)

Goal: Take the raw `Test2.dxf` drawing and produce a floor-plan PDF that looks identical to the reference image `Expected output MUST.jpg`. The behavior is defined by internal docs and code from the company DXF processing system (VISUAL_IMPROVEMENTS.md, SPECIFICATIONS_V1.md, `semanticInterpreter.js`, `costoExports.js`).

### 1) Semantic layer classification

Before drawing, classify DXF layers using regex patterns on original layer names and, where noted, colors. Categories:

- Envelope / walls (ENVELOPE / CLOISON)
  - Layer names containing MUR, WALL, CLOISON, etc. (case-insensitive).
  - Represents outer envelope and interior partitions.
- Obstacles
  - Layers with objects like Poteau, Column, Stair, Radiator, or other obstacles.
- Forbidden zones
  - Layers suggesting restricted areas (FORBIDDEN, ZONE_INTERDITE).
- Exits
  - Layers containing ISSUE, EXIT or emergency exit signs.
- Circulation / corridors
  - Layers representing circulation (COULOIR, CIRCULATION, CHEMIN, etc.).
- Gray zones
  - Catch-all for anything not matching the above or whose color indicates it is not walls or obstacles.

Each entity is assigned to one category so the exporter can apply the correct color, linetype, and drawing treatment.

Unit identification:
- Rectangles on BOXES_* layers are storage units.
- Auto-label each unit with number and area (example: `4.00 m^2`).
- Labels are drawn inside the unit outline.

### 2) Color palette and line styles

Legend defines four key styles:

- Tole Blanche (walls)
  - Color: black or very dark gray (approx RGB 0,0,0 or ACI 7)
  - Linetype: solid
  - Use: building envelope and internal partitions
- Tole Grise (boxes)
  - Color: light blue (approx RGB 117,170,219 or ACI 5)
  - Linetype: solid
  - Use: storage unit outlines and labels
- Ligne circulation (circulation route)
  - Color: red (RGB 255,0,0 or ACI 1)
  - Linetype: dashed (point-tiret)
  - Use: corridor outlines / movement paths
- Radiateur (radiator symbol)
  - Color: dark red / brown (approx RGB 136,0,21 or ACI 136)
  - Linetype: dashed / coiled
  - Use: radiator/heating locations

Additional colors:
- Green border: continuous green rectangle surrounding the drawing (frame)
- Area annotation (SP): purple/dark blue; AREAS layer uses ACI 181
- Unit label text: dark blue (approx RGB 33,64,109)

### 3) Output layout and scale

- Page size: A1, landscape
- Two plans side-by-side:
  - Left: PLAN ETAGE 01 1-200
  - Right: PLAN ETAGE 02 1-200
- Margin: ~10 mm around all sides, defined by a green border
- Scale: 1:200 (uniform) with label `1-200` near each plan title
- Titles: bold sans-serif, approx 6 mm high
- Legend box: above right plan, showing the four line types and labels
- North arrow: near top-left, arrow points up with label `N`
- Unit labels: two lines inside each unit (unit number + area). Text height ~2 mm
- Area annotation (SP): at bottom of each plan, e.g. `SP : 271.19 m^2`, text height ~3 mm
- Title block: lower right with company info
  - Company name: CADGENIE S.A.S (bold, larger)
  - Address line: RCS PONTOISE 512 715 147 - 23 bis rue de la Chapelle - 95700 Roissy
  - Drawing name: SURFACES DES BOX
  - Drawing number, scale, and metadata

Do not add extra gridlines or dimensions unless present in the DXF.

### 4) Processing pipeline

1. Import DXF with original coordinates/units preserved.
2. Apply semantic classification to all layers/entities.
3. Generate storage units from BOXES_* rectangles, compute area, assign numbers, draw blue outlines, and labels.
4. Draw walls/partitions in black with thin solid lines.
5. Draw obstacles with appropriate symbols; radiators use brown coiled symbol.
6. Draw circulation paths with red dashed outlines only.
7. Assemble sheet: left/right plans, titles, legend, north arrow, area summary, green frame, title block.
8. Export to PDF (primary), plus DWG/SVG with matching layers and styles.

### 5) Non-functional requirements

- Deterministic: same DXF must always produce identical output.
- Performance: complete in under 1 minute for typical plans.
- Compatibility: exported DWG/PDF/SVG open correctly in AutoCAD, PDF viewers, and browsers.

## Track B: Campaign approval POC (web app)

Goal: A working web application for campaign approvals with CS dashboard, customer portal, and agency portal.

### Technical requirements

- Authentication: magic link via email (passwordless) for CS, customers, agencies.
- Email automation:
  - Stage-based notifications to relevant parties
  - Deadline reminders and escalations
  - Emails include magic links to the exact portal page
- Campaign creation (CS form):
  - Customer name and email
  - Campaign type
  - Asset deadline
  - Agency assignment
  - Go-live target date
- Storage: simple file storage for assets and drafts
- Logging: activity logging and audit trail
- Real-time status: live updates across interfaces

### Key features

- Automated emails per stage
- Deadline tracking with visual countdown
- File upload for assets and drafts
- Structured approval/revision loop
- Activity log with timestamps and actors

### Not included in POC

- Salesforce integration
- Advanced storage (versioning, CDN)
- Complex user management/teams
- Mobile apps

### Deliverables

- Working web application (CS dashboard, customer portal, agency portal)
- Email notification system with magic links
- Basic file storage for assets and drafts
- Setup and testing documentation

### Success criteria

- One campaign runs end-to-end without manual coordination
- All stakeholders receive timely notifications
- CS, customers, agencies see real-time status
- Approval/revision loop works smoothly

### Timeline and stack

- Timeline: to be agreed with freelancer based on scope/milestones
- Tech stack: propose a stack prioritizing speed and simplicity for POC
