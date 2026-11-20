# Public Transport Incident and Fleet Management System

DBMS Experiential Learning, Level 3 project. A web application where transport authorities manage buses, drivers, routes and trips, report and resolve incidents, and read dashboards built from the combined history.

**Stack:** Next.js 15 (App Router, TypeScript) - MySQL 8 (relational core) - MongoDB 6+ (incident detail reports and telemetry).

## What it demonstrates

| Requirement | Where |
|---|---|
| ER diagram, relational schema | `docs/ER_diagram.md`, `docs/relational_schema.md` |
| DDL, constraints, indexes, ALTER/DROP | `db/schema.sql` |
| DML and advanced queries (joins, nested, correlated, recursive, CTE, window, full-text) | `db/seed.sql`, `db/queries.sql`, `src/app/api/analytics/route.ts` |
| Views, functions, procedures, triggers, transactions | `db/views.sql`, `db/procedures.sql`, `db/triggers.sql` |
| NoSQL create and RUD, aggregation | `db/mongo/*.js`, `src/app/api/incidents/[id]/report`, `.../comments`, `dashboard/stats` |
| Roles and access control in the database | `db/rbac.sql` (admin, manager, driver MySQL roles) |
| Authentication (login, bcrypt, JWT cookie) | `src/app/api/auth/*`, `src/middleware.ts` |
| Documentation and testing | `docs/`, `tests/` |

## Prerequisites

Node.js 20 or newer, MySQL 8.0.16 or newer (CHECK constraints and roles), MongoDB 6 or newer with `mongosh`.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create the MySQL database, objects, roles and sample data (asks for the MySQL root password)
./db/setup.sh                       # or load schema, procedures, triggers, views, rbac, seed in that order

# 3. Configure the app
cp .env.example .env.local          # edit JWT_SECRET; passwords must match db/rbac.sql

# 4. Give the demo users a real password (Demo@1234)
npm run seed:users

# 5. Create MongoDB collections and sample documents
mongosh "mongodb://localhost:27017" db/mongo/init.js
mongosh "mongodb://localhost:27017" db/mongo/seed.js

# 6. Run
npm run dev                         # http://localhost:3000
```

Demo accounts (password `Demo@1234`): `admin`, `manager1`, `ravi` (driver, own trips only), `anita` (driver).

If MongoDB is not running, the app still works for everything that lives in MySQL; pages show a notice where MongoDB data would appear.

## Roles

| Role | Can do |
|---|---|
| ADMIN | Everything, including adding drivers, deleting buses and deleting detail reports |
| MANAGER | Fleet, routes, trips, incidents, maintenance, analytics; cannot manage users or delete records |
| DRIVER | See own trips and incidents, report incidents on own trips, view routes |

Each role connects to MySQL with its own account, so these limits are enforced by the database as well as by the API.

## Tests

```bash
npm run test:sql      # 30 database tests; resets the database first, so rerun `npm run seed:users` afterwards
npm run build && npm start        # in another terminal, after db setup and seed:users
npm run test:api      # API role and rule tests (needs a freshly seeded database)
```

Results and the manual checklist are in `docs/test_report.md`.

## Project layout

```
db/            SQL (schema, views, triggers, procedures, rbac, seed, queries) and db/mongo scripts
docs/          report, ER diagram, relational schema, data dictionary, architecture, test report
scripts/       seed-users.ts (sets demo passwords)
tests/         run_sql_tests.sh, api.test.ts
src/middleware.ts      page-level route guard
src/app/api/           route handlers (auth, buses, drivers, routes, trips, incidents, maintenance, analytics, telemetry, dashboard)
src/app/(dashboard)/   pages (overview, incidents, buses, drivers, routes, trips, maintenance, analytics, my-trips)
src/app/login/         login page
src/lib/               db/mysql.ts, db/mongo.ts, auth/session.ts, auth/rbac.ts, validators.ts, api.ts
src/components/        Sidebar, RoleProvider, shared UI helpers
```

## Security notes

- Credentials and the JWT secret live only in `.env.local` (git-ignored). Change the `CHANGE_ME_*` passwords in `db/rbac.sql` and `.env.local` together.
- Passwords are stored as bcrypt hashes. Sessions are HttpOnly cookies that expire after 8 hours.
- All SQL uses parameter placeholders; request bodies are validated with zod, and the database re-validates with constraints and triggers.
