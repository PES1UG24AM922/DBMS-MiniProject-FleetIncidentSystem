# Public Transport Incident and Fleet Management System: Project Report

Team: 
- Rohini Vishu- PES1UG24AM922
- Batchu Hari Nainika- PES1UG24AM461
 
 Course: DBMS Experiential Learning, Level 3 
 - Instructor: Pooja Shastry, Dr. Nagasundari S

## 1. Objectives

- Keep fleet records (buses, drivers, routes, stops, trips) and incident records in one connected database.
- Track each incident from report to resolution, with a full history and linked maintenance work.
- Identify buses with repeated breakdowns, routes with repeated delays and slow resolutions, using SQL over the history.
- Show that the right database is used for each kind of data (relational and document).
- Enforce rules and access control in the database itself, not only in application code.

## 2. Functional requirements

1. Sign in with a username and password; three roles (admin, manager, driver).
2. Admin and manager register buses, routes and trips; admin registers drivers.
3. Scheduling refuses double booking and unavailable buses or drivers.
4. Any role reports an incident on a trip; drivers only on their own trips.
5. Managers assign maintenance, resolve incidents, and view the status history.
6. Detail reports (narrative, tags, comments) are stored and editable in MongoDB; admin can delete them.
7. Search past incidents by text (MySQL full-text and MongoDB text index).
8. Dashboard and analytics: fleet utilisation, incidents per route, severity mix, average resolution time, repeat breakdowns, follow-up chains, bus risk ranking, overheating alerts.

## 3. Database design

ER diagram: `ER_diagram.md`. Relational schema with keys and referential actions: `relational_schema.md`. Attribute-level detail, CHECK constraints, indexes, views, triggers, routines and the MongoDB collections: `data_dictionary.md`.

## 4. Database choice and justification

MySQL holds the structured, strongly related data that needs foreign keys, constraints, transactions and joins for reporting. MongoDB holds incident narratives (variable structure, nested comments, tags, geo points) and bus telemetry (append-only, high volume, no joins, auto-expiring). The two are linked by `incident_id` and `bus_id`. Details in `architecture.md`.

## 5. Implementation summary

| Concept | Implementation |
|---|---|
| DDL | 10 tables, ENUM domains, CHECK, UNIQUE, FK with chosen referential actions, 6 B-tree indexes and one FULLTEXT index, ALTER and DROP examples (`db/schema.sql`) |
| DML | Seed inserts, UPDATE and DELETE examples, and every application write (`db/seed.sql`, `db/queries.sql`, API routes) |
| Views | `v_incident_details`, `v_route_performance`, `v_fleet_utilization` |
| Procedures and functions | `sp_report_incident`, `sp_assign_maintenance`, `sp_resolve_incident`, `sp_driver_trips`, `sp_driver_incidents`, `fn_avg_resolution_hours`, `fn_bus_incident_count` |
| Transactions | Start, commit and rollback inside the three write procedures, with `SELECT ... FOR UPDATE` |
| Triggers | Six triggers: booking rules, trip/bus/driver consistency, audit log, automatic bus status, no reopening closed incidents |
| CTE and recursive CTE | Follow-up chains and bus risk ranking (`db/queries.sql`, analytics API) |
| Nested and correlated queries | Routes above average incidents; incidents slower than their own route's average |
| NoSQL CRUD and aggregation | Insert, find, update (`$set`, `$push`, `$addToSet`), delete, `$unwind`/`$group` pipelines, text and geo indexes (`db/mongo/`) |
| Database roles | `role_admin`, `role_manager`, `role_driver` and a column-limited login account |

## 6. Important queries

See `db/queries.sql` (Q1-Q9) and `db/mongo/queries.js`. Highlights:

- Repeat breakdowns: `GROUP BY bus ... HAVING COUNT(*) >= 2`
- Follow-up chains: `WITH RECURSIVE chain AS (...)`
- Slow incidents: correlated subquery comparing each incident with the average of its own route
- Full text: `MATCH(description, location_desc) AGAINST ('brake failure' IN NATURAL LANGUAGE MODE)`

## 7. System architecture

See `architecture.md`.

## 8. Application screenshots

Add to `docs/screenshots/` (checklist in that folder's README).

## 9. Testing results

See `test_report.md`: 30 database tests and 4 API test groups executed and passed; MongoDB checks are listed as manual tests to run.

## 10. Individual contributions

| Member | Responsibilities |
|---|---|
| _(name 1)_ | _(for example: MySQL schema, triggers, procedures, RBAC, authentication)_ |
| _(name 2)_ | _(for example: MongoDB design and endpoints, Next.js pages, analytics)_ |

Both members should commit to both the database and application code so that the GitHub history shows it.

## 11. Conclusion

The system goes beyond CRUD by connecting fleet operations with incident tracking: rules are enforced by constraints, triggers and transactions, access is limited by database roles, and dashboards come from joins, aggregates, CTEs and window functions over the incident history. Using MongoDB for narratives and telemetry keeps the relational schema focused while the flexible data stays queryable.
