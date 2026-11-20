# Test Report

The checks below ran on 20 November 2026 against disposable instances of MySQL 8.0.46 and MongoDB 8.0.38. This Windows evidence run used the locally available Next.js 15.5.29 development server and the sample data. The GitHub baseline pins Next.js 16.4.6. The team's separate verification reported a passing production build, TypeScript check and four original API test groups on that version. The five-group rerun below includes the new MongoDB API test. The earlier demo databases were separate from these fixtures.

## SQL checks

The Windows run executed all 30 statements and expected-result checks from `tests/run_sql_tests.sh` with the native MySQL client. The result was 30 passed and 0 failed. The database was reset within the disposable fixture. The checks cover constraints, overlaps, transaction rollback, recursive and correlated SQL, full-text search and role grants.

```text
PASS  T01 CHECK rejects invalid phone
PASS  T02 CHECK rejects bus capacity 5
PASS  T03 UNIQUE rejects duplicate reg_number
PASS  T04 FK rejects unknown route in trip
PASS  T05 CHECK rejects trip end before start
PASS  T06 CHECK: DRIVER user needs driver_id
PASS  T07 Trigger blocks overlapping bus booking
PASS  T08 Trigger blocks overlapping driver booking
PASS  T09 Trigger blocks bus under maintenance
PASS  T10 Trigger rejects mismatched trip/bus/driver
PASS  T11 Trigger: CRITICAL needs 20+ char text
PASS  T12 Trigger: closed incident cannot reopen
PASS  T13 Trigger auto-flags bus on HIGH breakdown
PASS  T14 Trigger auto-stamps resolved_at
PASS  T15 Driver cannot report on another driver's trip
PASS  T16 Procedure rejects unknown trip
PASS  T17 Maintenance on resolved incident rolls back
PASS  T18 Rollback left no stray maintenance row
PASS  T19 fn_avg_resolution_hours returns a value
PASS  T20 Recursive CTE finds chain 2 > 3
PASS  T21 Full-text search finds brake incidents
PASS  T22 Correlated subquery runs
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

## API checks

The seeded Next.js app ran the suite with `TEST_MONGO=1`. All five test groups passed.

| Test group | Checks |
|---|---|
| Authentication | Bad password and unauthenticated access return 401. Valid login succeeds. |
| Driver | Role restrictions return 403. Driver sees their own trips. Reporting on another driver's trip returns 422. |
| Manager | Manager can list drivers. Driver creation and bus deletion return 403. Overlap and resolved incident assignments return 422. |
| Admin and analytics | Input validation, duplicate registrations, full-text search, the recursive follow-up chain and dashboard. |
| MongoDB reports | Create, read, edit, append comment, aggregate overheating, deny manager deletion and allow admin deletion while retaining the SQL incident. |

MongoDB initialization and sample inserts yielded three incident reports and five telemetry readings. The database rejected a three-character narrative (document validation) and a duplicate incident ID (unique index). The API returned MongoDB as available and bus 1 with two alerts and a 121°C peak.

## Visual evidence

The login, administrator dashboard, search, incident detail, incident form, rejected report, driver view and analytics were captured in a desktop browser. See `screenshots/` for the PNGs, a MySQL query result and the MongoDB-backed fields from the dashboard API.

## Repeat the checks

Use a disposable, freshly seeded database. The SQL test harness resets the database. The API tests create sample incidents. For the MongoDB test, seed both collections, start the app and set `TEST_MONGO=1` before running `npm run test:api`. Set `BASE_URL` if the app uses a port other than 3000.

The latest run focused on the seeded path and desktop screenshots. The app also handles MongoDB unavailability explicitly. Its live outage and phone layouts were outside this run.
