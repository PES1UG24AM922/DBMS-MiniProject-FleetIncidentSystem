# Data Dictionary

Generated from the live MySQL 8 schema (`information_schema`) after loading `db/schema.sql`. Descriptions are the project's own.

Key: **PK** primary key, **FK** foreign key, **UQ** unique.

## buses

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| bus_id | int | NO | PK | auto | Unique bus id |
| reg_number | varchar(15) | NO | UQ |  | Registration plate, unique |
| model | varchar(60) | NO |  |  | Manufacturer and model |
| capacity | smallint unsigned | NO |  |  | Passenger capacity (10-120) |
| status | enum('AVAILABLE','ON_TRIP','MAINTENANCE','RETIRED') | NO |  | AVAILABLE | Current availability; maintained by triggers and procedures |
| purchase_date | date | NO |  |  | Date the bus was bought |
| last_service_date | date | YES |  |  | Date of last completed maintenance (not before purchase) |
| fuel_type | enum('DIESEL','CNG','ELECTRIC') | NO |  | DIESEL | Fuel or power type (added with ALTER) |

## drivers

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| driver_id | int | NO | PK | auto | Unique driver id |
| full_name | varchar(100) | NO |  |  | Driver's full name |
| license_no | varchar(20) | NO | UQ |  | Driving licence number, unique per driver |
| phone | char(10) | NO |  |  | 10-digit Indian mobile number (starts 6-9) |
| experience_years | tinyint unsigned | NO |  | 0 | Years of driving experience (0-50) |
| status | enum('ACTIVE','ON_LEAVE','SUSPENDED') | NO |  | ACTIVE | Whether the driver can be rostered |

## incident_status_log

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| log_id | bigint | NO | PK | auto | Unique log row id |
| incident_id | int | NO | FK -> incidents.incident_id |  | Incident whose status changed |
| old_status | varchar(15) | YES |  |  | Previous status (empty for the first entry) |
| new_status | varchar(15) | NO |  |  | New status |
| changed_by | int | NO | FK -> users.user_id |  | User who made the change |
| changed_at | datetime | NO |  | CURRENT_TIMESTAMP | When the change happened |

## incidents

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| incident_id | int | NO | PK | auto | Unique incident id |
| trip_id | int | NO | FK -> trips.trip_id |  | Trip on which it happened |
| bus_id | int | NO | FK -> buses.bus_id |  | Bus involved; must match the trip (trigger) |
| driver_id | int | NO | FK -> drivers.driver_id |  | Driver involved; must match the trip (trigger) |
| reported_by | int | NO | FK -> users.user_id |  | User who reported it |
| parent_incident_id | int | YES | FK -> incidents.incident_id |  | Earlier incident this one follows up (recurring issues); used by the recursive query |
| incident_type | enum('BREAKDOWN','ACCIDENT','DELAY','OVERCROWDING','COMPLAINT') | NO |  |  | Category of incident |
| severity | enum('LOW','MEDIUM','HIGH','CRITICAL') | NO |  | LOW | Impact level |
| location_desc | varchar(150) | NO |  |  | Where it happened, in words |
| description | text | NO |  |  | What happened (at least 5 characters; 20 for CRITICAL) |
| status | enum('REPORTED','IN_PROGRESS','RESOLVED','CLOSED') | NO |  | REPORTED | Workflow state; CLOSED cannot be reopened |
| reported_at | datetime | NO |  | CURRENT_TIMESTAMP | When it was reported |
| resolved_at | datetime | YES |  |  | When it was resolved; stamped automatically, not before reported_at |

## maintenance_actions

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| action_id | int | NO | PK | auto | Unique action id |
| incident_id | int | NO | FK -> incidents.incident_id |  | Incident that triggered the work |
| bus_id | int | NO | FK -> buses.bus_id |  | Bus being repaired |
| assigned_to | int | NO | FK -> users.user_id |  | User responsible |
| action_desc | varchar(255) | NO |  |  | Work to be done |
| cost | decimal(10,2) | NO |  | 0.00 | Cost in INR (not negative) |
| status | enum('OPEN','COMPLETED') | NO |  | OPEN | OPEN or COMPLETED |
| created_at | datetime | NO |  | CURRENT_TIMESTAMP | When raised |
| completed_at | datetime | YES |  |  | When finished |

## route_stops

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| route_id | int | NO | PK, FK -> routes.route_id |  | Route that serves the stop |
| stop_id | int | NO | PK, FK -> stops.stop_id |  | Stop served |
| stop_sequence | smallint unsigned | NO |  |  | Position of the stop on the route; unique within a route |

## routes

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| route_id | int | NO | PK | auto | Unique route id |
| route_code | varchar(10) | NO | UQ |  | Short public code, unique |
| route_name | varchar(150) | NO |  |  | Display name |
| origin | varchar(80) | NO |  |  | Starting place |
| destination | varchar(80) | NO |  |  | End place (must differ from origin) |
| distance_km | decimal(6,2) | NO |  |  | Route length in km, greater than 0 |

## stops

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| stop_id | int | NO | PK | auto | Unique stop id |
| stop_name | varchar(100) | NO | UQ |  | Stop name, unique |
| latitude | decimal(9,6) | NO |  |  | Latitude in degrees (-90 to 90) |
| longitude | decimal(9,6) | NO |  |  | Longitude in degrees (-180 to 180) |

## trips

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| trip_id | int | NO | PK | auto | Unique trip id |
| route_id | int | NO | FK -> routes.route_id |  | Route being run |
| bus_id | int | NO | FK -> buses.bus_id |  | Bus assigned |
| driver_id | int | NO | FK -> drivers.driver_id |  | Driver assigned |
| scheduled_start | datetime | NO |  |  | Planned departure |
| scheduled_end | datetime | NO |  |  | Planned arrival (after start) |
| actual_start | datetime | YES |  |  | Real departure |
| actual_end | datetime | YES |  |  | Real arrival (not before actual start) |
| status | enum('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') | NO |  | SCHEDULED | Trip lifecycle state |

## users

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| user_id | int | NO | PK | auto | Unique login account id |
| username | varchar(50) | NO | UQ |  | Login name, unique |
| email | varchar(120) | NO | UQ |  | Email address, unique, basic format check |
| password_hash | varchar(255) | NO |  |  | bcrypt hash of the password (never the password) |
| role | enum('ADMIN','MANAGER','DRIVER') | NO |  |  | Application role: ADMIN, MANAGER or DRIVER |
| driver_id | int | YES | UQ, FK -> drivers.driver_id |  | Driver profile for DRIVER accounts; required when role is DRIVER, unique |
| is_active | tinyint(1) | NO |  | 1 | Inactive accounts cannot log in |
| created_at | timestamp | NO |  | CURRENT_TIMESTAMP | Account creation time |

## v_fleet_utilization

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| bus_id | int | YES |  | 0 |  |
| reg_number | varchar(15) | YES |  |  |  |
| status | enum('AVAILABLE','ON_TRIP','MAINTENANCE','RETIRED') | YES |  | AVAILABLE |  |
| completed_trips | bigint | YES |  |  |  |
| incident_count | bigint | YES |  |  |  |

## v_incident_details

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| incident_id | int | NO |  | 0 |  |
| incident_type | enum('BREAKDOWN','ACCIDENT','DELAY','OVERCROWDING','COMPLAINT') | NO |  |  |  |
| severity | enum('LOW','MEDIUM','HIGH','CRITICAL') | NO |  | LOW |  |
| status | enum('REPORTED','IN_PROGRESS','RESOLVED','CLOSED') | NO |  | REPORTED |  |
| reported_at | datetime | NO |  | CURRENT_TIMESTAMP |  |
| resolved_at | datetime | YES |  |  |  |
| resolution_minutes | bigint | YES |  |  |  |
| reg_number | varchar(15) | NO |  |  |  |
| route_code | varchar(10) | NO |  |  |  |
| driver_name | varchar(100) | NO |  |  |  |
| location_desc | varchar(150) | NO |  |  |  |

## v_route_performance

| Column | Type | Null | Key | Default | Description |
|---|---|---|---|---|---|
| route_id | int | NO |  | 0 |  |
| route_code | varchar(10) | NO |  |  |  |
| route_name | varchar(150) | NO |  |  |  |
| total_trips | bigint | NO |  | 0 |  |
| total_incidents | bigint | NO |  | 0 |  |
| incidents_per_trip | decimal(23,2) | YES |  |  |  |
| avg_resolution_hrs | decimal(23,2) | YES |  |  |  |

## CHECK constraints

| Table | Constraint | Rule |
|---|---|---|
| buses | chk_bus_capacity | `(`capacity` between 10 and 120)` |
| buses | chk_bus_dates | `((`last_service_date` is null) or (`last_service_date` >= `purchase_date`))` |
| drivers | chk_driver_exp | `(`experience_years` <= 50)` |
| drivers | chk_driver_phone | `regexp_like(`phone`,_utf8mb4\\'^[6-9][0-9]{9}$\\')` |
| incidents | chk_inc_desc | `(char_length(`description`) >= 5)` |
| incidents | chk_inc_resolved | `((`resolved_at` is null) or (`resolved_at` >= `reported_at`))` |
| maintenance_actions | chk_ma_cost | `(`cost` >= 0)` |
| routes | chk_route_distance | `(`distance_km` > 0)` |
| routes | chk_route_ends | `(`origin` <> `destination`)` |
| stops | chk_stop_lat | `(`latitude` between -(90) and 90)` |
| stops | chk_stop_lng | `(`longitude` between -(180) and 180)` |
| trips | chk_trip_actual | `((`actual_end` is null) or (`actual_start` is null) or (`actual_end` >= `actual_start`))` |
| trips | chk_trip_sched | `(`scheduled_end` > `scheduled_start`)` |
| users | chk_users_driver_role | `((`role` <> _latin1\\'DRIVER\\') or (`driver_id` is not null))` |
| users | chk_users_email | `(`email` like _latin1\\'%_@_%._%\\')` |

## Indexes (non-primary)

| Table | Index | Columns | Unique |
|---|---|---|---|
| buses | reg_number | reg_number | yes |
| drivers | license_no | license_no | yes |
| incident_status_log | fk_log_inc | incident_id | no |
| incident_status_log | fk_log_user | changed_by | no |
| incidents | fk_inc_driver | driver_id | no |
| incidents | fk_inc_parent | parent_incident_id | no |
| incidents | fk_inc_user | reported_by | no |
| incidents | ft_inc_description (fulltext) | description, location_desc | no |
| incidents | idx_inc_bus_time | bus_id, reported_at | no |
| incidents | idx_inc_status_sev | status, severity | no |
| incidents | idx_inc_trip | trip_id | no |
| maintenance_actions | fk_ma_bus | bus_id | no |
| maintenance_actions | fk_ma_incident | incident_id | no |
| maintenance_actions | fk_ma_user | assigned_to | no |
| route_stops | fk_rs_stop | stop_id | no |
| route_stops | uq_route_seq | route_id, stop_sequence | yes |
| routes | route_code | route_code | yes |
| stops | stop_name | stop_name | yes |
| trips | idx_trip_bus_time | bus_id, scheduled_start, scheduled_end | no |
| trips | idx_trip_driver_time | driver_id, scheduled_start, scheduled_end | no |
| trips | idx_trip_route_time | route_id, scheduled_start | no |
| users | driver_id | driver_id | yes |
| users | email | email | yes |
| users | username | username | yes |

## Views

| View | Purpose |
|---|---|
| v_incident_details | Incident register joined with bus, route and driver; used by the incident list |
| v_route_performance | Trips, incidents, incidents per trip and average resolution hours per route |
| v_fleet_utilization | Completed trips and incident count per bus |

## Triggers

| Trigger | Event | What it enforces |
|---|---|---|
| trg_incident_ai | AFTER INSERT on incidents | Writes the first status-log row; sets a bus to MAINTENANCE after a HIGH/CRITICAL breakdown or accident |
| trg_incident_au | AFTER UPDATE on incidents | Logs every status change with the user who made it |
| trg_incident_bi | BEFORE INSERT on incidents | Incident bus and driver must match its trip; CRITICAL incidents need a 20+ character description |
| trg_incident_bu | BEFORE UPDATE on incidents | Closed incidents cannot be reopened; stamps resolved_at when resolved or closed |
| trg_maint_au | AFTER UPDATE on maintenance_actions | Returns the bus to AVAILABLE and records the service date when its last open maintenance action completes |
| trg_trip_bi | BEFORE INSERT on trips | Blocks trips for buses in maintenance/retired, inactive drivers, and overlapping bookings of the same bus or driver |

## Stored procedures and functions

| Routine | Kind | Purpose |
|---|---|---|
| fn_avg_resolution_hours | function | Average hours to resolve incidents on a route |
| fn_bus_incident_count | function | Incidents for a bus in the last N days |
| sp_assign_maintenance | procedure | Transaction: adds a maintenance action, moves the incident to IN_PROGRESS, sets the bus to MAINTENANCE |
| sp_driver_incidents | procedure | A driver's own incidents (the only incident access the DRIVER role has) |
| sp_driver_trips | procedure | A driver's own trips |
| sp_report_incident | procedure | Transactional incident creation; looks up bus and driver from the trip; drivers limited to their own trips |
| sp_resolve_incident | procedure | Transaction: completes open maintenance actions and resolves the incident |

## MongoDB collections (`transport_nosql`)

### incident_reports

| Field | Type | Notes |
|---|---|---|
| incident_id | number | Required, unique index; equals `incidents.incident_id` in MySQL |
| reported_by | number | Required; MySQL user id |
| narrative | string | Required, at least 10 characters; text-indexed |
| tags | array of string | Multikey index and text index |
| witnesses | array of {name, phone} | Optional |
| location | GeoJSON Point | Optional; 2dsphere index |
| attachments | array | Optional file references |
| comments | array of {by, text, at} | Appended with `$push` |
| created_at | date | Required |

### bus_telemetry

| Field | Type | Notes |
|---|---|---|
| bus_id | number | Required; MySQL bus id |
| ts | date | Required; TTL index deletes documents after 90 days |
| speed_kmph | number | Required, 0-150 |
| engine_temp_c | number | Optional; above 110 raises an overheating alert |
| fuel_pct | number | Optional, 0-100 |

Indexes: `incident_reports` (incident_id unique, tags, text on narrative+tags, 2dsphere on location); `bus_telemetry` (bus_id+ts descending, TTL on ts).
