# Finance Dashboard Backend

Backend assessment project for a finance dashboard system using Node.js, PostgreSQL, and a simple MVC structure. The code is intentionally straightforward and practical: enough structure to show backend thinking clearly, without adding extra framework noise.

## Stack

- Node.js with the built-in `http` module
- PostgreSQL with the `pg` driver
- MVC-style folder structure: `models`, `services`, `controllers`, `routes`, `middleware`
- Built-in `node:test` for integration tests
- Token-based mock authentication for demo and assessment use

## Project Structure

- [src/app/create-app.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/app/create-app.js)
- [src/app/create-app-context.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/app/create-app-context.js)
- [src/config/database.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/config/database.js)
- [src/database/init.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/database/init.js)
- [src/models/user-model.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/models/user-model.js)
- [src/models/record-model.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/models/record-model.js)
- [src/services/user-service.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/services/user-service.js)
- [src/services/record-service.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/services/record-service.js)
- [src/services/dashboard-service.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/services/dashboard-service.js)
- [src/controllers/users-controller.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/controllers/users-controller.js)
- [src/controllers/records-controller.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/controllers/records-controller.js)
- [src/controllers/dashboard-controller.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/controllers/dashboard-controller.js)
- [src/routes/index.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/routes/index.js)
- [src/middleware/auth.js](/c:/Users/DELL/Downloads/finance-dashboard-backend/src/middleware/auth.js)

## Features

- User management with roles and active/inactive status
- Role-based access control at the middleware layer
- Financial record CRUD with filtering, search, and pagination
- Dashboard summary APIs for totals, category summaries, trends, and recent activity
- PostgreSQL schema initialization and seed data on startup
- Soft delete support for records
- Request validation with consistent `422` error responses

## Roles

- `viewer`: can read dashboard summary endpoints only
- `analyst`: can read records and dashboard analytics
- `admin`: can manage users and financial records

## Database Setup

1. Create a PostgreSQL database.
2. Copy [.env.example](/c:/Users/DELL/Downloads/finance-dashboard-backend/.env.example) values into your local environment.
3. Set either `DATABASE_URL` or the individual `DB_*` variables.

Example:

```bash
set DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/finance_dashboard
node src/server.js
```

On startup the app will:

- connect to PostgreSQL
- create the `users` and `financial_records` tables if they do not exist
- seed demo users and records if the database is empty

## Seeded Tokens

Use these in `Authorization: Bearer <token>`:

- `admin-token`
- `analyst-token`
- `viewer-token`

## Demo Login Credentials

- `admin@finance.local` / `Admin@123`
- `analyst@finance.local` / `Analyst@123`
- `viewer@finance.local` / `Viewer@123`

## Run

```bash
npm install
npm start
```

Server default:

- `http://localhost:3000`

Health check:

```bash
curl http://localhost:3000/health
```

Swagger docs:

```bash
http://localhost:3000/docs
```

OpenAPI JSON:

```bash
http://localhost:3000/swagger.json
```

## API Overview

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Users

- `GET /api/users`
- `POST /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`

Example payload:

```json
{
  "name": "Sam Support",
  "email": "sam@finance.local",
  "role": "viewer",
  "status": "active"
}
```

### Records

- `GET /api/records`
- `POST /api/records`
- `GET /api/records/:id`
- `PATCH /api/records/:id`
- `DELETE /api/records/:id`

Supported query params:

- `type=income|expense`
- `category=Marketing`
- `startDate=2026-03-01`
- `endDate=2026-03-31`
- `search=cloud`
- `page=1`
- `pageSize=10`

Example payload:

```json
{
  "amount": 1200,
  "type": "income",
  "category": "Services",
  "date": "2026-03-30",
  "notes": "Implementation project"
}
```

### Dashboard

- `GET /api/dashboard/summary`
- `GET /api/dashboard/trends?granularity=monthly|weekly`
- `GET /api/dashboard/recent-activity?limit=5`

## Response Format

Success:

```json
{
  "data": {}
}
```

Validation error:

```json
{
  "error": {
    "message": "Validation failed.",
    "details": [
      {
        "field": "email",
        "message": "Email must be valid."
      }
    ]
  }
}
```

## Notes

- Authentication is simplified with static bearer tokens because the assessment is focused on backend design, roles, validation, and data handling.
- SQL aggregation is used for dashboard analytics so the summary endpoints are not just looping over in-memory data.
- The code tries to stay at a realistic mid-level style: small files, explicit queries, readable service methods, and no heavy abstractions.

## Testing

Integration tests need a PostgreSQL database.

Example:

```bash
set TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/finance_dashboard_test
npm test
```

If `TEST_DATABASE_URL` is not provided, the tests are skipped.
