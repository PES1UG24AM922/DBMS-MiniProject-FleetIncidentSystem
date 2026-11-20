# Test Report

This report separates what was actually executed while building the project from what you still need to run and screenshot yourself.

## 1. Environment used for the executed tests

| Item | Value |
|---|---|
| MySQL | 8.0.46 (Ubuntu 24.04) |
| Node.js | 22 with Next.js 15 production build (`next build`, `next start`) |
| MongoDB | **Not available in the build environment** (see section 5) |
| Data | `db/seed.sql` plus `npm run seed:users` (password `Demo@1234`) |

## 2. Database tests (executed): 30 of 30 passed

Command: `npm run test:sql` (resets the database from `db/*.sql`, runs each statement as the stated account, and checks the expected error or result). Output of the final run:

```text

--- Integrity constraints (CHECK / UNIQUE / FK)
PASS  T01 CHECK rejects invalid phone
PASS  T02 CHECK rejects bus capacity 5
PASS  T03 UNIQUE rejects duplicate reg_number
PASS  T04 FK rejects unknown route in trip
PASS  T05 CHECK rejects trip end before start
PASS  T06 CHECK: DRIVER user needs driver_id
--- Triggers
PASS  T07 Trigger blocks overlapping bus booking
PASS  T08 Trigger blocks overlapping driver booking
PASS  T09 Trigger blocks bus under maintenance
PASS  T10 Trigger rejects mismatched trip/bus/driver
PASS  T11 Trigger: CRITICAL needs 20+ char text
PASS  T12 Trigger: closed incident cannot reopen
PASS  T13 Trigger auto-flags bus on HIGH breakdown
PASS  T14 Trigger auto-stamps resolved_at
--- Procedures, functions, transactions
PASS  T15 Driver cannot report on another driver's trip
PASS  T16 Procedure rejects unknown trip
PASS  T17 Maintenance on resolved incident rolls back
PASS  T18 Rollback left no stray maintenance row
PASS  T19 fn_avg_resolution_hours returns a value
--- Advanced queries
PASS  T20 Recursive CTE finds chain 2 > 3
PASS  T21 Full-text search finds brake incidents
PASS  T22 Correlated subquery runs
--- Role-based access control inside MySQL
PASS  T23 DRIVER cannot SELECT incidents table
PASS  T24 DRIVER cannot DELETE routes
PASS  T25 DRIVER can read own trips via procedure
PASS  T26 MANAGER cannot read users table
PASS  T27 MANAGER cannot DELETE buses
PASS  T28 MANAGER can read dashboard view
PASS  T29 AUTH account cannot read email column
PASS  T30 AUTH account can read login columns

Result: 30 passed, 0 failed
```

| Rubric area | Covered by |
|---|---|
| DDL constraints | T01-T06 |
| Triggers | T07-T14 |
| Procedures, functions, transactions | T15-T19 |
| Recursive, correlated queries, full-text | T20-T22 |
| Role-based access in the database | T23-T30 |

Note: T17 and T18 show a transaction rolling back. `sp_assign_maintenance` raises an error on an already resolved incident, and no maintenance row is left behind.

## 3. API tests (executed): 4 test groups passed, 0 failed

Command: `npm run build && npm start`, then `npm run test:api`. These ran against MySQL with MongoDB switched off, so they cover the SQL side and the graceful fallback.

| Test group | Checks |
|---|---|
| authentication | Wrong password returns 401; unauthenticated call returns 401; valid login succeeds |
| driver role | Driver gets 403 on buses and drivers; `/api/my` returns only the driver's own 3 trips; reporting on another driver's trip returns 422 with "own trips"; reporting on an own trip returns 201 and a numeric `mongoDetailSaved` flag |
| manager role | Manager can list drivers; cannot add a driver (403) or delete a bus (403); double-booking a bus returns 422 "overlapping"; assigning maintenance to a resolved incident returns 422 |
| admin and analytics | Invalid driver body returns 400 with field details; duplicate registration returns 409; full-text search returns matches; analytics returns the recursive-CTE chain `2 > 3`; dashboard statistics load |

## 4. Page smoke test (executed)

Signed in as the manager and requested each page: `/login`, `/dashboard`, `/incidents`, `/incidents/new`, `/incidents/2`, `/buses`, `/routes`, `/trips`, `/maintenance`, `/analytics` all returned HTTP 200. `/drivers` and `/my-trips` redirected to `/dashboard` (not allowed for managers), and an unauthenticated request to `/dashboard` redirected to `/login`. This checks that pages render and route guards work; it is not a visual check.

## 5. Not executed here: please run and record these yourself

| ID | Test | Expected result | Result |
|---|---|---|---|
| M01 | `mongosh db/mongo/init.js` then `seed.js` | Collections, validators and indexes created; 3 reports and 5 telemetry documents inserted | |
| M02 | Insert a report with a 3-character narrative | Rejected by the JSON schema validator | |
| M03 | Insert a second report with an existing `incident_id` | Rejected by the unique index | |
| M04 | Open an incident page, edit the narrative and tags, save | Document updated (UPDATE) | |
| M05 | Add a comment on an incident | Comment appended (UPDATE with `$push`) | |
| M06 | Delete the detail report as admin; try as manager | Admin succeeds; manager gets 403 | |
| M07 | Dashboard: top tags and overheating alerts | Aggregation results appear; bus 1 shows alerts | |
| M08 | Report an incident from the form with MongoDB running | Response has `mongoDetailSaved: true` and the report appears on the incident page | |
| M09 | Stop MongoDB and report an incident | Incident still saved in MySQL; pages show a notice instead of failing | |
| M10 | Visual check in a browser at desktop and phone width, light and dark mode | Layout usable, focus outlines visible | |

Screenshots for the final submission go in `docs/screenshots/` (see the README there).

## 6. Known limitations

- The MongoDB scripts were syntax-checked but not run, and the MongoDB-backed endpoints (report edit, comments, telemetry, tag statistics) were not exercised against a real server.
- Telemetry has an API but no dedicated page; use the API or `mongosh` to add readings for the demo.
- The `npm run test:api` suite needs a freshly seeded database because it relies on the seeded ids.
- Cost and demo passwords in `rbac.sql` and `.env.example` are placeholders and must be changed outside a classroom demo.
