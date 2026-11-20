# Relational Schema

Primary keys are marked **PK**, foreign keys **FK**, and unique keys **UK**. The design generally follows third normal form. The incidents table deliberately repeats the trip's bus and driver for history queries. The `trg_incident_bi` trigger validates that these values agree with the trip when an incident is inserted.

| Relation | Attributes |
|---|---|
| drivers | **driver_id PK**, full_name, license_no **UK**, phone, experience_years, status |
| users | **user_id PK**, username **UK**, email **UK**, password_hash, role, driver_id **FK** -> drivers (**UK**), is_active, created_at |
| buses | **bus_id PK**, reg_number **UK**, model, capacity, status, purchase_date, last_service_date, fuel_type |
| routes | **route_id PK**, route_code **UK**, route_name, origin, destination, distance_km |
| stops | **stop_id PK**, stop_name **UK**, latitude, longitude |
| route_stops | **(route_id FK -> routes, stop_id FK -> stops) PK**, stop_sequence, **UK (route_id, stop_sequence)** |
| trips | **trip_id PK**, route_id **FK**, bus_id **FK**, driver_id **FK**, scheduled_start, scheduled_end, actual_start, actual_end, status |
| incidents | **incident_id PK**, trip_id **FK**, bus_id **FK**, driver_id **FK**, reported_by **FK** -> users, parent_incident_id **FK** -> incidents, incident_type, severity, location_desc, description, status, reported_at, resolved_at |
| maintenance_actions | **action_id PK**, incident_id **FK**, bus_id **FK**, assigned_to **FK** -> users, action_desc, cost, status, created_at, completed_at |
| incident_status_log | **log_id PK**, incident_id **FK** (ON DELETE CASCADE), old_status, new_status, changed_by **FK** -> users, changed_at |

## Referential actions

| Foreign key | On delete |
|---|---|
| route_stops.route_id -> routes | CASCADE (stop list goes with its route) |
| incidents.parent_incident_id -> incidents | SET NULL |
| incident_status_log.incident_id -> incidents | CASCADE |
| all others | RESTRICT (default), so history cannot be orphaned |

## Constraint summary

NOT NULL on every mandatory attribute; ENUM domains for status, role, severity and type; CHECK constraints for phone format, experience range, bus capacity, date order, coordinates, distance, cost and description length; UNIQUE keys listed above. The full list with exact rules is in `data_dictionary.md`.

## Normalisation notes

- 1NF: all attributes atomic; repeating stop lists are in `route_stops`.
- 2NF: `route_stops` has one non-key attribute (`stop_sequence`) depending on the whole key.
- 3NF: master data for buses, routes and drivers lives in their own tables. Incidents are deliberately denormalized by storing the bus and driver in addition to the trip.
