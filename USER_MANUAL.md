# FleetOS Pro — User Manual

**Version 1.0** · Fleet Intelligence Platform  
*Real-time visibility · AI-powered dispatch · Zero surprises, at any scale.*

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Navigation & Interface](#3-navigation--interface)
4. [Dashboard & Real-Time Operations](#4-dashboard--real-time-operations)
5. [Live Map](#5-live-map)
6. [Fleet Management — Vehicles](#6-fleet-management--vehicles)
7. [Fleet Management — Drivers](#7-fleet-management--drivers)
8. [Fleet Management — Maintenance](#8-fleet-management--maintenance)
9. [Fleet Management — Routes & Geofences](#9-fleet-management--routes--geofences)
10. [Alerts & Incident Response](#10-alerts--incident-response)
11. [Analytics](#11-analytics)
12. [Reports](#12-reports)
13. [Security & Authentication](#13-security--authentication)
14. [Organization Administration](#14-organization-administration)
15. [Enterprise Features](#15-enterprise-features)
16. [SaaS & Billing](#16-saas--billing)
17. [Platform Operations](#17-platform-operations)
18. [Role Reference](#18-role-reference)
19. [Glossary](#19-glossary)

---

## 1. Introduction

### What is FleetOS Pro?

FleetOS Pro is an enterprise fleet management platform designed to give you complete visibility and control over every vehicle in your fleet — from a single truck to thousands of vehicles across multiple locations and organizations.

FleetOS Pro provides:

- **Real-time GPS tracking** with live maps, speed monitoring, and fuel telemetry
- **AI-powered route optimization** and predictive maintenance scheduling
- **Driver management** with Hours of Service (HOS) compliance tracking
- **Automated alerting** for geofence breaches, speeding, and critical vehicle events
- **Rich reporting** — nine pre-built report types with PDF and Excel export
- **Multi-tenant architecture** supporting fleets of any size, from single-company fleets to white-label reseller platforms

### Who This Manual Is For

This manual covers all user roles on the FleetOS Pro platform:

| If you are a… | Start with… |
|---|---|
| Fleet Admin or Manager | Sections 4–12 |
| Dispatcher | Sections 4–5, 9–10 |
| Driver / Vehicle Owner | Section 4 (My Vehicle) |
| Organization Administrator | Sections 13–14 |
| Platform / Super Admin | All sections, especially 17 |
| Billing Admin | Section 16 |

### System Requirements

FleetOS Pro runs entirely in a modern web browser. No installation is required.

- **Supported browsers:** Chrome 110+, Edge 110+, Firefox 110+, Safari 16+
- **Recommended screen resolution:** 1280 × 800 or higher
- **Internet connection:** Required for real-time map data and live telemetry

---

## 2. Getting Started

### 2.1 Logging In

Navigate to your FleetOS Pro portal URL (e.g., `https://app.fleetosteam.io`) and you will see the login page.

**To sign in:**

1. Enter your **Work email** address
2. Enter your **Password**
3. Click **Sign in** (or press Enter)

If your organization uses **Single Sign-On (SSO)**, click your SSO provider button instead.

> **Forgot your password?** Click the *Forgot password?* link below the password field. A reset email will be sent to your registered address.

### 2.2 Demo Access

The login page provides a **Quick Access** panel on the right side for evaluation and demonstration. Click any role card to sign in instantly with a pre-configured demo account.

| Demo Role | Access Scope | Demo Email |
|---|---|---|
| Super Admin | Platform-wide (all tenants) | super@fleetosteam.io |
| Fleet Admin | Full control of one tenant | admin@acme.io |
| Dispatcher | Routes & map only | dispatch@acme.io |
| Vehicle Owner | Own vehicles only | owner@acmelogistics.co.ke |
| Viewer | Read-only | viewer@acme.io |
| Tenant Admin | Star Technologies tenant | admin@starttech.io |

> **Demo password:** `Demo1234!` — all demo accounts share the same password.

The **Tenant Admins** tab shows quick access for seven pre-loaded tenants (ACME Logistics, SwiftCargo Ltd, NairobiExpress, and more).

### 2.3 Your First Login

After signing in for the first time, you should:

1. Review your **profile and role** (visible in the sidebar footer)
2. Confirm your **tenant or organization** is correctly shown in the top bar
3. If prompted, complete **MFA enrollment** (see Section 13.2)
4. Familiarize yourself with the sidebar navigation

---

## 3. Navigation & Interface

### 3.1 The Sidebar

The left sidebar is your primary navigation. It collapses to an icon rail by clicking the toggle button at the top.

The sidebar is organized into **sections**. Each section can be expanded or collapsed by clicking its header.

| Section | Key Modules |
|---|---|
| Real-time Ops | Dashboard, My Vehicle, Live Map |
| Fleet Management | Vehicles, Drivers, Routes, Geofences, Maintenance, Customers, Devices |
| Analytics | Analytics, Reports, Cost Savings |
| Security & Auth | RBAC, MFA, Sessions, Password Policy, Devices, SSO |
| Org Admin | Users, Custom Roles, Branches, Nav Config, System Config, Module Config |
| Enterprise | Integrations, Tenants, Branding, Unauthorized Usage |
| SaaS & Billing | Subscriptions, Resellers |
| Platform Ops | Global Monitor, Health, Sys Config, Tenant Mgmt, Global Alerts, Isolation |

> **Note:** You only see the sections and items your role has access to. Items shown in a blue/teal accent with a subtle background belong to the Platform Ops section (Super Admin / Platform Admin only).

**Sidebar footer** shows:
- Your avatar, name, and role
- Your fleet's health bar (percentage of active vehicles)

### 3.2 The Top Bar

The top bar appears on every page and contains:

- **FleetOS Pro logo** (left) — click to return to the dashboard
- **Tenant switcher** (Super Admin / Platform Admin only) — switch context between organizations
- **Live indicator** — a pulsing dot confirms the platform is receiving live telemetry data
- **User menu** (top right) — access profile settings, preferences, and sign out

### 3.3 Common UI Patterns

Throughout FleetOS Pro you will encounter these consistent interface elements:

**KPI cards** — Display a headline number, a label, and an optional trend or sub-value. A colored left stripe indicates the category (gold = operations, red = critical, amber = warning, green = healthy).

**Tab bars** — Switch between views within a page. Active tab has a solid underline. Badge counts on tabs (e.g., `Alerts (3)`) update in real time.

**Status badges** — Colored pill labels used consistently across the platform:
- 🟢 **Active / Good / Completed** — green
- 🟡 **Idle / Warning / Upcoming** — amber
- 🔴 **Offline / Critical / Overdue** — red
- ⚫ **Disposed / Inactive / N/A** — grey

**Tables** — All tables support:
- Column sorting (click header)
- Search (top-left search bar)
- Column visibility toggle (eye icon)
- Pagination controls (bottom)
- Export to CSV

---

## 4. Dashboard & Real-Time Operations

**Who can use this:** All roles (scope varies by role)

### 4.1 Overview

The Dashboard is your command centre. It opens automatically after login and provides a live summary of your entire fleet.

Navigate to **Dashboard** in the sidebar.

The dashboard header shows:
- Auto-refresh countdown (default: 30 seconds)
- Live clock
- Quick-access filter for tenants (Super Admin only)

### 4.2 Dashboard Tabs

#### Overview Tab

The Overview tab gives you an at-a-glance snapshot of fleet health.

**KPI Grid** (top row):

| KPI | What it shows |
|---|---|
| Active | Vehicles currently moving |
| Idle | Vehicles running but stationary |
| Offline | Vehicles with no GPS signal |
| Maintenance | Vehicles in service |
| GPS Coverage | Percentage of fleet with live GPS |
| Avg Fuel | Fleet average fuel level (%) |
| Avg Speed | Average speed of all moving vehicles |
| Open Alerts | Unacknowledged alerts requiring attention |
| Fleet Utilization | Active + Idle as % of total fleet |

Below the KPI grid:
- **Live fleet map** showing all vehicle positions (click any pin for details)
- **Fleet status sidebar** — utilization bar and breakdown by status
- **Alert summary** — list of the most recent unacknowledged alerts
- **Tenant breakdown** (Super Admin) — vehicle counts per organization

#### Live Map Tab

A full-screen interactive map with your entire fleet overlaid.

- **Left sidebar:** Searchable list of vehicles with real-time status
- **Status filter pills:** Filter by Active, Idle, Offline, Maintenance
- **Vehicle pin click:** Opens an info card showing plate, driver, speed, fuel, and last location
- **Track button:** Opens the full vehicle tracking modal with live telemetry and trail history
- **Playback button:** Switches to route replay mode for the selected vehicle

#### Playback Tab

Replay a vehicle's historical journey step by step.

**How to use Playback:**

1. Select a vehicle from the dropdown
2. Adjust **route density** (20–100 GPS points)
3. Click **Play** or use the step controls
4. Adjust **playback speed**: 1× / 2× / 5× / 10×

**Controls:**

| Button | Action |
|---|---|
| ▶ / ⏸ | Play / Pause |
| ⏮ | Jump to start |
| ⏭ | Jump to end |
| ⏪10 | Step back 10 pings |
| ⏪1 | Step back 1 ping |
| ⏩1 | Step forward 1 ping |
| ⏩10 | Step forward 10 pings |

The **event log** on the right shows flagged events (speeding, hard braking, geofence breach) for quick navigation. Click any event to jump to that point in the replay.

#### Vehicles Tab

A tabular view of all fleet vehicles with live telemetry data. Fully searchable and sortable.

Available columns: Plate · Driver · Status · Speed · Fuel · Category · Make/Model · Odometer · Customer · Tenant

Use the **Export CSV** button to download the current view for offline use.

#### Alerts Tab

A real-time feed of all fleet alerts.

- **Filter by severity:** Critical, Warning, Info
- **Search** by alert title or plate number
- **Bulk acknowledge** — select multiple alerts and dismiss at once
- **Export CSV** — download the full alert log

#### Analytics Tab

Fleet-wide performance metrics for a selected time period.

- **Period selector:** Today / This Week / This Month
- **8 KPI cards:** Trips completed, Total distance, Average speed, Utilization %, Average fuel level, Low-fuel count, Top speed recorded, Drivers on duty
- **Fleet Utilization chart** — horizontal bar breakdown (Active / Idle / Offline / Maintenance)
- **Fuel Distribution chart** — shows how many vehicles fall in each fuel band (Critical / Low / Mid / Good / Full)
- **Top active vehicles** — ranked by speed
- **Low fuel vehicles** — vehicles below 25% fuel, with estimated refill cost

### 4.3 My Vehicle (Vehicle Owner)

If your role is **Vehicle Owner**, the sidebar shows a **My Vehicle** section instead of the full fleet view. This page shows:

- Live position on a map
- Current speed, fuel level, odometer, and last known location
- Trip summary for today
- Alerts related to your vehicle(s)

---

## 5. Live Map

**Who can use this:** All roles except Viewer and Billing Admin

Navigate to **Live Map** in the sidebar.

### 5.1 Map Overview

The Live Map page provides a dedicated full-screen map view with more detail than the Dashboard map.

**Left sidebar** (collapsible) has three tabs:

#### Vehicles Tab

- Full list of all vehicles in your fleet
- Real-time status badges (Active / Idle / Offline)
- Search vehicles by plate or driver name
- Status filter pills (All, Active, Idle, Offline)
- Click any vehicle to center the map on it and open its info panel
- **Tenant filter** (Super Admin) — filter vehicles by organization

#### Geofences Tab

Displays all defined geographic zones:
- Zone name and type (Circle / Polygon / Rectangle)
- Current status (Active / Breached / Inactive)
- Trigger type (Entry / Exit / Both)
- Click a zone to highlight it on the map

#### Events Tab

Real-time event log showing the latest incidents:
- Geofence breach alerts
- Speed alerts
- Low fuel warnings
- Engine off/on events
- Filter by severity (Critical / Warning / Info)
- Times displayed relative to now (e.g., "2 minutes ago")

### 5.2 Map Controls

- **Scroll / pinch** — zoom in and out
- **Click and drag** — pan the map
- **Click a vehicle pin** — open vehicle info panel
- **Status filter pills** — hide/show vehicles by status
- **Header badges** — red badge shows count of critical events; orange badge shows breached geofences

---

## 6. Fleet Management — Vehicles

**Who can use this:** Fleet Admin, Fleet Manager, Super Admin (full access); Partner (tenant-scoped view); Vehicle Owner (own vehicles)

Navigate to **Fleet → Vehicles** in the sidebar.

### 6.1 Vehicle List

The Vehicles page displays your entire fleet inventory.

**KPI strip** (top row):

| KPI | Description |
|---|---|
| Total | All registered vehicles |
| Active | Currently tracked and moving |
| In Maintenance | Vehicles marked for service |
| Docs Expiring | Vehicles with documents expiring in 60 days |
| Overdue Maintenance | Vehicles with overdue service |
| Subs Expired | Vehicles with lapsed GPS subscriptions |
| Subs Expiring | Subscriptions expiring within 30 days |
| Tenants | Number of organizations (Super Admin only) |

### 6.2 Searching and Filtering

- **Search bar** — search by plate number, make, model, customer name, or department
- **Status filter** — All · Active · Idle · Maintenance
- **Category filter** — Truck · Van · Pickup · Car · Bus · Motorcycle · Trailer
- **Tenant filter** (Super Admin) — view one tenant or all tenants
- **Group by tenant** toggle (Super Admin) — visually groups vehicles under their organization

### 6.3 Table vs Card View

Toggle between **Table view** and **Card view** using the icon buttons in the top toolbar.

**Table columns:**

| Column | Description |
|---|---|
| Plate | Registration plate number |
| Category | Vehicle type (Truck, Van, etc.) |
| Tenant | Organization (Super Admin view) |
| Customer / Dept | Assigned customer or department |
| Odometer | Current mileage |
| Fuel % | Fuel level with progress bar |
| Documents | Alert count (expired / expiring) |
| Status | Current status badge |
| — | Detail link |

Click the **column visibility toggle** (eye icon) to show or hide columns.

**Card view** shows a compact grid of vehicles with plate, status badge, driver name, make/model, fuel bar, and speed.

### 6.4 Registering a New Vehicle

Click the **Register Vehicle** button (top right). A 3-step wizard appears:

**Step 1 — Vehicle Information:**
- Registration plate (required)
- Color
- Make, Model, Year
- Vehicle category
- Engine number and VIN

**Step 2 — Ownership:**
- Select owner (from customer list or enter new owner)
- Ownership type: Company / Individual / Government / Leased / Finance
- Owner ID number

**Step 3 — Plan & Payment:**
- Select a GPS tracking plan (Basic, Professional, Enterprise, or Custom)
- Review billing summary (monthly cost)
- Payment method: M-Pesa / Bank Transfer / Invoice

Click **Register Vehicle** to complete. The vehicle appears immediately in the fleet list.

### 6.5 Tracking a Vehicle

Click the **Track** button on any vehicle row to open the Vehicle Tracking modal:

- **Live location** on the map with 30-second refresh
- **Real-time telemetry:** Speed, fuel level, heading, engine status
- **Trail** showing the last hour of movement
- **Last seen timestamp** and GPS coordinates

---

## 7. Fleet Management — Drivers

**Who can use this:** Fleet Admin, Fleet Manager, Super Admin (full); Vehicle Owner (own drivers)

Navigate to **Fleet → Drivers** in the sidebar.

### 7.1 Driver List

**KPI strip:**

| KPI | Description |
|---|---|
| Total | All registered drivers |
| Driving | Currently active and moving |
| On Duty | Working but not currently driving |
| Off Duty | Logged off (rest period) |
| Resting | On HOS rest break |

**Table columns:**

| Column | Description |
|---|---|
| Name & License Class | Driver name and license grade (A/B/C/CE) |
| License # | License registration number |
| Status | Current duty status badge |
| Safety Score | Score from 0–100 (bar + percentage) |
| HOS Driven | Hours driven in current cycle |
| HOS Remaining | Hours left before mandatory rest (red if < 2 hours) |
| Assigned Vehicle | Plate number of assigned vehicle (or "Unassigned") |
| Actions | Assign Vehicle · Delete |

**Search:** Type a driver name or license number to filter the list.

**Status filter:** All · Driving · On Duty · Off Duty · Resting

### 7.2 Understanding HOS (Hours of Service)

FleetOS Pro tracks driver compliance with HOS regulations:

- **HOS Driven** — total hours behind the wheel in the current regulatory cycle
- **HOS Remaining** — how many hours remain before a mandatory rest break is required
- **Warning threshold:** Displayed in amber when < 4 hours remain
- **Critical threshold:** Displayed in red when < 2 hours remain
- A driver showing 0 hours remaining must not operate a vehicle until a compliant rest period has elapsed

### 7.3 Understanding Safety Scores

Each driver has a **Safety Score** from 0 to 100, calculated from:

| Score Band | Rating | Colour |
|---|---|---|
| 90 – 100 | Excellent | Green |
| 75 – 89 | Good | Blue |
| 60 – 74 | Fair | Amber |
| 0 – 59 | Poor | Red |

Factors affecting safety scores include speeding events, hard braking, geofence violations, and HOS compliance.

### 7.4 Adding a Driver

Click **Add Driver** (top right):

- Full name (required)
- License number (required)
- License class: A / B / C / CE
- Phone number

Click **Save** to register the driver. They are immediately available for vehicle assignment.

### 7.5 Assigning a Vehicle to a Driver

1. Locate the driver in the list
2. Click **Assign Vehicle** in the Actions column
3. Select the vehicle from the dropdown (shows current status and any existing assigned driver)
4. Click **Assign**

To unassign a driver from a vehicle, click **Assign Vehicle** again and select **Unassign**.

---

## 8. Fleet Management — Maintenance

**Who can use this:** Fleet Admin, Fleet Manager

Navigate to **Fleet → Maintenance** in the sidebar.

### 8.1 Maintenance Overview

The Maintenance page tracks service schedules for every vehicle in your fleet, helping you prevent breakdowns and stay compliant with manufacturer service intervals.

**KPI strip** (clickable to filter):

| KPI | Meaning |
|---|---|
| Overdue | Past due date — immediate action required |
| Due Soon | Due within 14 days |
| Scheduled | Upcoming (more than 14 days away) |
| Done | Completed services |

Clicking any KPI card instantly filters the table to show only that status.

### 8.2 Maintenance Table

| Column | Description |
|---|---|
| Vehicle | Plate and Make/Model |
| Service Type | Type of service (Oil change, Brakes, etc.) |
| Last Done | Date of most recent service |
| Due Date | Scheduled next service (red = overdue) |
| Mileage | Current or target odometer reading |
| Priority | Critical / High / Medium / Low |
| Status | Overdue / Due Soon / Scheduled / Done |
| Actions | Mark as Done |

**Overdue rows** are highlighted with a light red background so they stand out immediately.

### 8.3 Scheduling Maintenance

Click **Schedule Maintenance** (top right):

1. **Vehicle** — select from the dropdown
2. **Service Type** — Oil change, Brake inspection, Tyre rotation, Transmission service, AC service, Electrical inspection, or other
3. **Last Done Date** — when the previous service occurred
4. **Due Date** — when this service is next required
5. **Mileage** — current or target mileage (km)
6. **Priority** — Critical / High / Medium / Low
7. **Notes** — any additional information for the technician

Click **Schedule** to save. The record immediately appears in the table.

### 8.4 Marking a Service as Done

When a service is completed, click **Mark Done** in the table row. The status changes to **Done** (green) and the record is archived. A new upcoming service record can then be scheduled.

---

## 9. Fleet Management — Routes & Geofences

### 9.1 Routes

**Who can use this:** Fleet Admin, Fleet Manager, Dispatcher

Navigate to **Fleet → Routes** in the sidebar.

Routes allows you to plan, assign, and track delivery or transport routes.

**Key capabilities:**
- Create routes with start, end, and waypoints
- Assign routes to specific drivers and vehicles
- AI-powered route optimization (shortest time, lowest fuel consumption)
- Delivery sequencing for multi-stop routes
- Real-time progress monitoring on the Live Map
- Historical route comparison (planned vs. actual)

### 9.2 Geofences

**Who can use this:** Fleet Admin, Fleet Manager

Navigate to **Fleet → Geofences** in the sidebar.

Geofences are virtual geographic boundaries. When a vehicle enters or exits a defined zone, FleetOS Pro generates an alert.

**Supported zone shapes:**
- **Circle** — defined by a center point and radius
- **Polygon** — custom multi-point boundary (draw on map)
- **Rectangle** — axis-aligned bounding box

**Trigger types:**
- **Entry** — alert when a vehicle enters the zone
- **Exit** — alert when a vehicle leaves the zone
- **Both** — alert on entry and exit

**Creating a geofence:**

1. Click **Add Zone**
2. Enter a zone name
3. Select the shape type
4. Draw the zone on the map
5. Set trigger type and which vehicles/groups are monitored
6. Optionally set a time window (e.g., only active after hours)
7. Click **Save Zone**

**Zone statuses shown on the Live Map:**
- **Active** — zone is being monitored
- **Breached** — a vehicle is currently inside/outside in violation
- **Inactive** — zone monitoring is paused

---

## 10. Alerts & Incident Response

**Who can use this:** All roles except Viewer and Billing Admin (scope varies)

Navigate to **Alerts** in the sidebar.

### 10.1 Alert Overview

The Alerts module is your fleet's incident inbox. All automated alerts — from speed violations to geofence breaches — appear here in real time.

**KPI strip:**

| KPI | Meaning |
|---|---|
| Total Active | All unresolved alerts |
| Critical Active | High-priority alerts requiring immediate action |
| Warning Active | Non-critical alerts to monitor |
| Acknowledged | Alerts seen and noted by an operator |

### 10.2 Alert Filters

| Filter | Shows |
|---|---|
| All | Every alert regardless of status |
| Active | Unacknowledged, open alerts |
| Acknowledged | Reviewed but not yet resolved |
| Closed | Resolved/dismissed alerts |
| Critical | Severity = Critical only |
| Warning | Severity = Warning only |
| Info | Severity = Informational only |

**Search** by alert type, vehicle plate, driver name, or location.

### 10.3 Alert Card

Each alert card shows:
- **Severity stripe** (left border): Red = Critical, Amber = Warning, Blue = Info
- **Alert type** with icon (Geofence breach, Speeding, Low fuel, Engine off, etc.)
- **Description** of the event
- **Vehicle plate** and **Driver name**
- **Location** (address or GPS coordinates)
- **Timestamp** (relative time + absolute date/time)
- **Status badge** (Active / Acknowledged / Closed)

### 10.4 Alert Detail & Command Center

Click any alert card to open the **Alert Detail modal**.

**Tabs inside the Alert Detail modal:**

**Detail tab:**
- Full alert metadata (type, vehicle, driver, severity, location, time)
- Live map showing the vehicle's current position and recent trail

**Response tab:**
- Operator notes field — type your response or observation
- Send response to log the action

**Commands tab:**

Send direct commands to the vehicle's GPS/telematics device:

| Command | Action |
|---|---|
| Request Location | Force a fresh GPS ping |
| Sound Horn | Trigger vehicle horn |
| Message Driver | Send in-cab text message |
| Restart Device | Reboot the GPS unit |
| Lock Doors | Remote door lock |
| Cut Engine | Remote engine immobilisation |

> **Warning:** The **Cut Engine** command requires a secondary confirmation dialog. Only use this if you have verified the vehicle is safely stationary. Cutting engine of a moving vehicle is dangerous and must be authorised by a supervisor.

Each command is logged with a timestamp and delivery status (Sending → Acknowledged / Failed).

### 10.5 Acknowledging and Closing Alerts

- **Acknowledge** — marks the alert as seen. The alert remains active but moves to the Acknowledged filter.
- **Close** — marks the alert as resolved. Closed alerts are archived but remain searchable.

**Bulk actions:** Select multiple alerts using the checkboxes (top-left of each card) and click **Acknowledge Selected** or **Close Selected**.

---

## 11. Analytics

**Who can use this:** Fleet Admin, Fleet Manager, Partner, Super Admin

Navigate to **Analytics** in the sidebar (or use the Analytics tab on the Dashboard).

### 11.1 Period Selection

All analytics metrics respect the selected period:

- **Today** — current calendar day
- **This Week** — Monday to today
- **This Month** — 1st of the month to today

### 11.2 KPI Cards

| KPI | Description |
|---|---|
| Trips Completed | Number of completed journeys in the period |
| Total Distance | Combined kilometres driven by all vehicles |
| Average Speed | Mean speed across all active vehicles |
| Fleet Utilization | Active vehicles as percentage of total |
| Average Fuel Level | Fleet-wide mean fuel percentage |
| Low Fuel Vehicles | Count of vehicles below 25% fuel |
| Top Speed Recorded | Single highest speed event in the period |
| Drivers on Duty | Number of drivers in Active or On-Duty status |

### 11.3 Charts

**Fleet Utilization Breakdown** — Horizontal progress bars showing:
- Active (moving vehicles)
- Idle (engine on, not moving)
- Offline (no signal)
- Maintenance (in service)

**Fuel Distribution** — Shows how many vehicles fall into each fuel band:
- Critical (< 15%)
- Low (15–25%)
- Mid (25–60%)
- Good (60–85%)
- Full (≥ 85%)

### 11.4 Vehicle Rankings

**Top Active Vehicles** — Ranked by activity level (speed × trips). Useful for identifying your most-used assets.

**Low Fuel Vehicles** — Ranked by fuel percentage (lowest first). Includes the estimated refuel cost per vehicle.

> **Tip:** Export either table to CSV for fuel budget planning.

---

## 12. Reports

**Who can use this:** Fleet Admin, Fleet Manager (full); Partner (view only)

Navigate to **Analytics → Reports** in the sidebar.

### 12.1 Report Library

FleetOS Pro includes nine pre-built report types organized by category:

#### Operations Reports

| Report | Schedule | Formats | Description |
|---|---|---|---|
| Fleet Summary | Daily | PDF, XLS | Fleet status, documents, compliance overview |
| Maintenance Schedule | Weekly | PDF | Overdue, upcoming, and completed service records |
| Trip Summary | On Demand | XLS | Trip log, distances, work hours, fuel, and driver activity |
| Tracking History | On Demand | PDF, XLS | Fleet-wide GPS tracking history and position timeline |
| Vehicle Track Report | On Demand | PDF, XLS | Complete timestamped GPS track for a single vehicle |

#### HR Reports

| Report | Schedule | Formats | Description |
|---|---|---|---|
| Driver Performance | Weekly | PDF | Safety scores, HOS utilisation, driver status breakdown |

#### Finance Reports

| Report | Schedule | Formats | Description |
|---|---|---|---|
| Fuel Consumption | Monthly | XLS | Fuel levels, refuel requirements, cost estimates |
| Cost Analysis | Monthly | XLS, PDF | Subscription revenue, MRR/ARR, operational costs |

#### Security Reports

| Report | Schedule | Formats | Description |
|---|---|---|---|
| Geofence Violations | On Demand | PDF | Zone violations, speeding, and after-hours events |

### 12.2 Finding Reports

Use the **category filter tabs** at the top of the Reports page to filter by:
- All · Operations · HR · Finance · Security

Use the **search bar** to find a specific report by name or description.

### 12.3 Generating a Report

Click **Generate Report** on any report card. You are taken to the report detail page.

Each report detail page shows:
- **Category-coloured header** — the header colour reflects the report category (navy/gold for Operations, indigo/purple for HR, brown/amber for Finance, dark red/crimson for Security)
- **KPI summary strip** at the top — key metrics for the report
- **Data sections** — tables, charts, and breakdowns
- **Export buttons** — PDF and/or XLS depending on the report

### 12.4 Vehicle Track Report — Map View

The **Vehicle Track Report** (Report #9) is the most detailed individual vehicle report. It includes:

**Filter panel** — select vehicle, date range, and time window, then click **Run Report**.

**Journey Map** — a full interactive map drawing the complete GPS track from start to end:

| Colour | Speed Range |
|---|---|
| Accent (gold/purple/amber/red based on category) | Normal speed (≤ 60 km/h) |
| Amber | Brisk (61–90 km/h) |
| Red | Speeding (> 90 km/h) |
| Grey | Stopped / engine off |

- **Green circle** = Journey start (with timestamp and street address tooltip)
- **Red circle** = Journey end (with timestamp and street address tooltip)
- **Coloured event dots** = Speeding, hard brake, geofence events (hover for detail)
- **Small grey dots** = Engine-off stops

**Detail tabs** (below the map):

| Tab | Content |
|---|---|
| Track Log | Complete timestamped ping table (GPS, speed, fuel, engine, events) |
| Stops | Engine-off periods with duration and location |
| Speed Events | All speeding violations with over-limit calculation |
| Idle Periods | Engine-on, zero-speed pings (wasted fuel estimate) |

### 12.5 Report Cards

Each report card in the library shows:
- **Category badge** (Operations, HR, Finance, Security)
- **Schedule** (Daily, Weekly, Monthly, On Demand)
- **Format badges** (PDF, XLS)
- **Trend insight** — e.g., *"184 trips completed this month"*
- **Last generated** timestamp
- **Generate button** and **Schedule button** (calendar icon)

### 12.6 Custom Reports

Click **Custom Report** in the top toolbar to configure a bespoke report with your own filters, date ranges, and metric selections.

---

## 13. Security & Authentication

### 13.1 Role-Based Access Control (RBAC)

**Who can use this:** Super Admin, Platform Admin

Navigate to **Security → RBAC** in the sidebar.

RBAC lets you control which modules and features each role can access. The RBAC page shows a permission matrix:

- **Rows** = Roles (Super Admin, Fleet Admin, Dispatcher, etc.)
- **Columns** = Modules (Vehicles, Drivers, Map, Reports, etc.)
- **Cells** = Permission toggle (enabled / disabled)

Changes take effect immediately for all users with that role.

> **Caution:** Removing access to core modules (like Dashboard or Vehicles) for Fleet Admin roles will significantly limit those users' ability to manage the fleet. Review changes carefully before saving.

### 13.2 Multi-Factor Authentication (MFA)

**Who can use this:** Super Admin, Platform Admin, Fleet Admin (for tenant users)

Navigate to **Security → MFA** in the sidebar.

MFA adds a second verification step to the login process. Supported methods:

| Method | How it works |
|---|---|
| SMS | One-time code sent to your registered mobile number |
| Email | One-time code sent to your registered email address |
| Authenticator App | TOTP code from an app like Google Authenticator |
| FIDO2 / Passkey | Hardware key or device biometrics (most secure) |

**Enabling MFA for your account:**

1. Navigate to Security → MFA
2. Click **Enroll MFA**
3. Select your preferred method
4. Follow the on-screen instructions to verify enrollment
5. Save your **recovery codes** — these allow access if your primary MFA device is lost

**Enforcing MFA for all users:** Fleet Admins and Super Admins can make MFA mandatory for all users in their organization from this page.

### 13.3 Session Management

**Who can use this:** Super Admin, Platform Admin, Fleet Admin

Navigate to **Security → Sessions** in the sidebar.

View and manage all active user sessions:

| Column | Description |
|---|---|
| User | Name and email |
| Device | Browser and OS |
| IP Address | Network location |
| Login Time | When the session started |
| Last Active | Most recent activity |
| Status | Active / Idle |

**Actions:**
- **Force logout** — immediately terminate a session (useful if a device is lost or an account is compromised)
- **Mark device as trusted** — skip MFA on this device for a defined period
- **Revoke device trust** — require MFA again on next login

### 13.4 Password Policy

**Who can use this:** Super Admin, Platform Admin, Fleet Admin

Navigate to **Security → Password Policy** in the sidebar.

Configure organization-wide password requirements:

- **Minimum / Maximum length**
- **Complexity rules** — require uppercase, lowercase, numbers, and/or symbols
- **Expiry** — force password reset every N days
- **History** — prevent reuse of the last N passwords
- **Lockout** — lock account after N failed attempts for a duration

### 13.5 Devices & FIDO2

Navigate to **Security → Auth Devices** in the sidebar.

Manage hardware security keys and passkeys (FIDO2/WebAuthn) for passwordless login.

### 13.6 Single Sign-On (SSO)

Navigate to **Security → SSO** in the sidebar.

Connect FleetOS Pro to your corporate identity provider using:
- **OIDC** (OpenID Connect) — compatible with Microsoft Entra, Google Workspace, Okta, Auth0
- **SAML 2.0** — compatible with enterprise IdPs

---

## 14. Organization Administration

### 14.1 User Management

**Who can use this:** Super Admin, Platform Admin, Fleet Admin, Tenant Admin

Navigate to **Org Admin → Users** in the sidebar.

**User table columns:**

| Column | Description |
|---|---|
| Name | Display name |
| Email | Login email |
| Role | Assigned role |
| Status | Active / Suspended |
| Last Login | Most recent sign-in time |
| Actions | Edit · Suspend · Delete |

**Adding a user:**

1. Click **Add User**
2. Enter email address, full name, and assigned role
3. Click **Send Invitation** — the user receives an email with a sign-in link

**Editing a user:** Click the edit icon to change the user's role or suspend/unsuspend their account.

**Suspending a user** immediately blocks access without deleting their account or data. This is recommended over deletion when off-boarding staff who may rejoin.

### 14.2 Custom Roles

**Who can use this:** Super Admin, Platform Admin, Tenant Admin

Navigate to **Org Admin → Custom Roles** in the sidebar.

Built-in roles (Fleet Admin, Dispatcher, etc.) cannot be modified, but you can create custom roles with a specific combination of permissions.

**Creating a custom role:**

1. Click **New Role**
2. Enter a name and description
3. Use the module/permission checkboxes to define what this role can access
4. Optionally clone an existing role as a starting point
5. Click **Save Role**

> **Tip:** Cloning the **Dispatcher** role and adding limited analytics access is a quick way to create a *Senior Dispatcher* role with more visibility.

### 14.3 Branch Management

**Who can use this:** Fleet Admin, Tenant Admin, Super Admin

Navigate to **Org Admin → Branches** in the sidebar.

Branches represent physical locations (depots, hubs, regional offices) within your organization.

**Branch fields:**
- Name, Address, City, Country
- GPS coordinates (auto-filled when you type the address)
- Branch manager (select from existing users)

Vehicles can be assigned to branches to enable branch-level reporting and filtering.

### 14.4 Navigation Visibility

**Who can use this:** Fleet Admin, Tenant Admin, Super Admin

Navigate to **Org Admin → Nav Config** in the sidebar.

Customize which sidebar modules are visible for each role. Use this to simplify the interface for roles that don't need certain features.

- Toggle module visibility per role
- Reorder sidebar sections by dragging
- Preview the sidebar as it will appear to the selected role
- Click **Reset to Defaults** to restore factory settings

### 14.5 System Configuration

Navigate to **Org Admin → System Config** in the sidebar.

Configure organization-wide settings:

- **Company name** and logo upload
- **Timezone** and locale (affects all timestamps)
- **Currency** (affects cost displays and reports)
- **Email domain** (restricts user invitations to verified domains)
- **API key management** — generate and revoke API keys for integrations
- **Data retention policy** — how long historical telemetry data is stored
- **Audit log access** — view a complete log of administrative actions

### 14.6 Module Configuration

Navigate to **Org Admin → Module Config** in the sidebar.

Enable or disable platform features for your organization:

- Toggle entire modules on or off (e.g., disable Routes if not used)
- Enable AI-powered features (route optimization, predictive maintenance)
- Opt into beta features ahead of general release
- Configure module-specific settings (e.g., HOS regulation region for Drivers module)

### 14.7 Portal Branding

**Who can use this:** Fleet Admin, Tenant Admin, Super Admin (for own tenant); Super Admin for any tenant

Navigate to **Enterprise → Branding** in the sidebar.

White-label the FleetOS Pro interface with your organization's identity:

| Setting | Description |
|---|---|
| Company Name | Displayed in the login page header |
| Tagline | Headline text on the login page left panel |
| Logo | Upload your company logo (replaces FleetOS Pro mark) |
| Favicon | Browser tab icon |
| Primary Color | Main brand colour (affects sidebar, buttons, links) |
| Accent Color | Secondary highlight colour (affects badges, icons) |
| Font Family | Select a typeface from the available options |

Changes are previewed immediately in the editor and apply to the login page and interface for users of your tenant.

Click **Reset to Defaults** to restore FleetOS Pro default branding.

---

## 15. Enterprise Features

### 15.1 Integrations

**Who can use this:** Fleet Admin, Super Admin, Platform Admin

Navigate to **Enterprise → Integrations** in the sidebar.

Connect FleetOS Pro to your existing business systems:

**Available integration categories:**
- ERP systems (SAP, Oracle, Microsoft Dynamics)
- CRM platforms (Salesforce, HubSpot)
- Accounting software (QuickBooks, Xero)
- Mapping providers (Google Maps, HERE, Mapbox)
- Fuel card providers
- Payroll systems

**Connecting an integration:**

1. Browse the integration marketplace
2. Click the integration you want to connect
3. Enter your API key or complete the OAuth authorization flow
4. Configure event subscriptions (which FleetOS events trigger data sync)
5. Test the connection and enable it

**Integration health panel** shows last sync time, sync status, and any recent errors.

### 15.2 Tenants (Platform Admin / Super Admin)

Navigate to **Enterprise → Tenants** in the sidebar.

Manage all organizations on the FleetOS Pro platform.

**Tenant list columns:**

| Column | Description |
|---|---|
| Company | Organization name |
| Plan | Current subscription tier |
| Users | Active user count |
| Vehicles | Active vehicle count |
| Status | Active / Trial / Suspended / Archived |
| Last Active | Most recent user activity |

**Tenant detail page** (click any tenant):

- Company profile (name, logo, admin contact, country, industry)
- Plan and billing details (current plan, MRR, ARR, renewal date)
- User count, vehicle count, and API status
- **Suspend / Unsuspend** action with reason field
- **Switch context** — view the platform as this tenant's admin

### 15.3 Customers

**Who can use this:** Fleet Admin, Fleet Manager, Partner

Navigate to **Fleet → Customers** in the sidebar.

The Customers module tracks vehicle owners or lessees — companies or individuals to whom your fleet vehicles are assigned.

**Customer fields:**
- Name, Industry, Type (Corporate / Individual / Government)
- Contact person, Phone, Email
- City, Country
- Assigned vehicles (linked automatically when a vehicle is registered to this customer)

---

## 16. SaaS & Billing

**Who can use this:** Fleet Admin, Billing Admin, Super Admin, Tenant Admin

Navigate to **SaaS → Subscription** in the sidebar.

### 16.1 Subscription Overview

The Subscription page shows the billing status for your organization.

**Subscription plans:**

| Plan | Description |
|---|---|
| Basic / Starter | Core GPS tracking, limited reporting |
| Professional | Full reporting, route optimization, API access |
| Enterprise | All features, custom SLAs, dedicated support |
| Custom | Bespoke pricing for large fleets |

**Key metrics:**
- **MRR** (Monthly Recurring Revenue) — total monthly subscription value
- **ARR** (Annual Recurring Revenue) — annualised subscription value
- **Next invoice date** and **auto-renewal status**
- **Usage** — vehicles used vs. total quota

### 16.2 Per-Vehicle Subscriptions

Each vehicle in your fleet has its own GPS tracking subscription. From the Vehicles page, you can see subscription status on each vehicle row:

| Status Badge | Meaning |
|---|---|
| Active | GPS subscription is current |
| Expiring Soon | Expires within 30 days |
| Expired | GPS tracking disabled |

Click the subscription badge on a vehicle to open its subscription detail and manage renewal.

### 16.3 Invoices

A list of all invoices is available in the Subscription page. Click any invoice to download the PDF.

### 16.4 Upgrading or Downgrading

Click **Upgrade Plan** on the Subscription page to view available plan tiers. Changes take effect from the next billing cycle unless you opt for immediate upgrade (which prorates the billing period).

### 16.5 Resellers & Partners

**Who can use this:** Super Admin, Platform Admin

Navigate to **SaaS → Resellers** in the sidebar.

Manage your channel partner and reseller program:

- **Reseller list** — company, country, tier (Silver/Gold/Platinum), tenants managed, MRR
- **Reseller detail** — contact information, API key, commission percentage
- **Commission tracking** — monthly payout summaries
- **Invite reseller** — send onboarding invitation
- **Co-branding configuration** — allow resellers to apply their own branding

---

## 17. Platform Operations

> **This section is for Super Admin and Platform Admin roles only.** These modules are highlighted in the sidebar with a teal/blue accent background.

### 17.1 Global Monitor

Navigate to **Platform Ops → Global Monitor** in the sidebar.

A cross-tenant platform health dashboard:

- **System metrics** — API uptime %, requests per second, database latency
- **Tenant health grid** — all organizations with vehicle count, user count, plan, status, and last activity
- **Alert aggregator** — critical platform-level alerts (database issues, quota breaches, service degradation)
- **Maintenance window scheduler** — schedule and communicate planned downtime

### 17.2 Health Dashboard

Navigate to **Platform Ops → Health** in the sidebar.

Infrastructure-level monitoring:

| Panel | What it shows |
|---|---|
| Service Status | API, Database, Cache, Message Queue — Green/Amber/Red |
| Performance | Response times, error rate, DB connections |
| Resource Usage | CPU, Memory, Storage, Bandwidth |
| Dependencies | Maps API, Email provider, SMS gateway status |

### 17.3 Platform Configuration

Navigate to **Platform Ops → Sys Config** in the sidebar.

Global platform settings that apply to all tenants:

- **API configuration** — rate limits, CORS allowed domains, API key rotation policy
- **Email settings** — SMTP server, from address, email template management
- **SMS gateway** — provider configuration (Twilio or alternative)
- **Maps provider** — API key for mapping service
- **Feature flags** — enable/disable features globally across all tenants
- **Backup & retention** — data backup schedule, audit log retention period

### 17.4 Tenant Management

Navigate to **Platform Ops → Tenant Mgmt** in the sidebar.

Lifecycle operations for tenant organizations:

| Action | Description |
|---|---|
| Suspend Tenant | Immediately blocks all user access. Data preserved. |
| Unsuspend Tenant | Restores user access. |
| Archive Tenant | Moves to archived state. Read-only historical access. |
| Purge Tenant Data | **Irreversible.** Permanently deletes all tenant data. Requires two-factor confirmation. |

> **Warning:** Tenant data purge is permanent and cannot be undone. This action is reserved for GDPR deletion requests and contract termination. Always obtain written authorization before proceeding.

### 17.5 Global Alerting

Navigate to **Platform Ops → Global Alerts** in the sidebar.

Configure platform-wide alert rules and escalation policies:

- **Alert rules** — define triggers (e.g., service error rate > 5%, tenant quota exceeded)
- **Actions** — send email, SMS, or webhook notification
- **Escalation policy** — define on-call schedules and escalation timelines
- **Integrations** — connect to PagerDuty, Slack, Opsgenie, or custom webhooks

### 17.6 Data Isolation Center

Navigate to **Platform Ops → Isolation** in the sidebar.

Verify and audit multi-tenant data isolation:

- **Isolation test runs** — automated checks that Tenant A cannot access Tenant B's data
- **Audit trail** — row-level security check logs
- **Compliance reports** — GDPR/CCPA data access audit reports
- **Emergency tools** — quick anonymize or purge commands for breach response

---

## 18. Role Reference

### 18.1 Built-in Roles

| Role | Primary Purpose | Key Access |
|---|---|---|
| **Super Admin** | Platform owner | Everything — all tenants, all features |
| **Platform Admin** | Platform operations | Global monitor, tenants, sys config, resellers; no fleet ops |
| **Fleet Admin** | Full fleet management | All fleet modules for own tenant; can manage users and settings |
| **Fleet Manager** | Day-to-day fleet ops | Vehicles, drivers, maintenance, routes, alerts, analytics, reports |
| **Dispatcher** | Route and dispatch operations | Dashboard (limited), map, routes, alerts; no vehicle management |
| **Billing Admin** | Financial management | Subscriptions, invoices, cost reports; no fleet operations |
| **Partner** | Reseller fleet management | Fleet ops scoped to assigned tenant(s); read-only reporting |
| **Tenant Admin** | Organization configuration | Users, roles, branches, nav config, branding; no fleet ops |
| **Viewer** | Read-only monitoring | Dashboard, map (read-only); cannot take any action |
| **Vehicle Owner** | Personal fleet monitoring | Own vehicles and assigned drivers only |

### 18.2 Access Matrix (Key Modules)

| Module | Super Admin | Fleet Admin | Fleet Manager | Dispatcher | Vehicle Owner | Viewer |
|---|---|---|---|---|---|---|
| Dashboard | ✓ Full | ✓ Full | ✓ Full | ✓ Limited | ✓ Own | ✓ Read |
| Live Map | ✓ | ✓ | ✓ | ✓ | ✓ Own | — |
| Vehicles | ✓ | ✓ | ✓ | — | ✓ Own | — |
| Drivers | ✓ | ✓ | ✓ | — | ✓ Own | — |
| Maintenance | ✓ | ✓ | ✓ | — | — | — |
| Routes | ✓ | ✓ | ✓ | ✓ | — | — |
| Geofences | ✓ | ✓ | ✓ | — | — | — |
| Alerts | ✓ | ✓ | ✓ | ✓ | ✓ Own | — |
| Analytics | ✓ | ✓ | ✓ | — | — | — |
| Reports | ✓ | ✓ | ✓ | — | — | — |
| Users | ✓ | ✓ | — | — | — | — |
| Subscriptions | ✓ | ✓ | — | — | — | — |
| Tenants | ✓ | — | — | — | — | — |
| Platform Ops | ✓ | — | — | — | — | — |

---

## 19. Glossary

| Term | Definition |
|---|---|
| **Active** | A vehicle that is moving with a live GPS signal |
| **ARR** | Annual Recurring Revenue — annualised subscription value |
| **FIDO2** | A modern passwordless authentication standard using hardware keys or device biometrics |
| **Geofence** | A virtual geographic boundary that triggers alerts when a vehicle crosses it |
| **GPS Ping** | A single GPS data point recorded at a moment in time (includes position, speed, heading) |
| **HOS** | Hours of Service — regulatory limits on how long a driver can operate a vehicle without rest |
| **Idle** | A vehicle with the engine running but not moving |
| **KPI** | Key Performance Indicator — a headline metric |
| **MFA** | Multi-Factor Authentication — requiring a second proof of identity at login |
| **MRR** | Monthly Recurring Revenue — total monthly subscription value across all active vehicles |
| **OIDC** | OpenID Connect — a modern identity protocol used for SSO |
| **Odometer** | Cumulative distance the vehicle has travelled (in km) |
| **RBAC** | Role-Based Access Control — controlling feature access by assigning roles to users |
| **SAML** | Security Assertion Markup Language — an enterprise SSO protocol |
| **SSO** | Single Sign-On — log in to FleetOS Pro using your corporate identity provider |
| **Tenant** | An organization or company that uses FleetOS Pro (in a multi-tenant deployment) |
| **Telemetry** | Live vehicle data transmitted to the platform (GPS position, speed, fuel, engine status) |
| **Track Report** | A detailed report of a single vehicle's complete journey with speed coloring and events |
| **Utilization** | Percentage of the fleet that is Active or Idle (not Offline or in Maintenance) |
| **White-label** | Customizing FleetOS Pro's branding (logo, colours, name) to match a reseller's identity |

---

## Support

For assistance with FleetOS Pro:

- **In-app help:** Click the **?** icon in the top bar
- **Email support:** support@fleetosteam.io
- **Feedback & bug reports:** [github.com/fleetosteam/fleetos/issues](https://github.com)

---

*FleetOS Pro User Manual · Version 1.0*  
*© 2026 FleetOS Team. All rights reserved.*  
*Track every mile. Command every route. Deliver every promise.*
