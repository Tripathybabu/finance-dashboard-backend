# Finance Dashboard Backend

A compact backend implementation for a finance dashboard assessment. It focuses on clean API design, clear role-based behavior, input validation, summary analytics, and lightweight persistence without requiring external packages.

## Tech Choices

- Runtime: Node.js 24+
- API style: REST over the built-in `http` module
- Persistence: JSON file storage in [data/store.json](/c:/Users/DELL/Downloads/finance-dashboard-backend/data/store.json)
- Authentication: Mock bearer token authentication for local/demo use
- Tests: Built-in `node:test`

This intentionally avoids third-party dependencies so the project stays easy to review and run in a fresh environment.

## Features

- User management with roles and active/inactive status
- Role-based authorization enforced at the backend layer
- Financial record CRUD with filtering, search, and pagination
- Dashboard summary APIs for totals, recent activity, and trends
- Input validation with useful `422` responses
- Soft delete behavior for records

## Roles

- `viewer`: can access dashboard analytics only
- `analyst`: can read records and dashboard analytics
- `admin`: full access to users and records

## Seeded Access Tokens

Use these tokens in the `Authorization: Bearer <token>` header:

- `admin-token`
- `analyst-token`
- `viewer-token`

Seeded users are written automatically the first time the app starts.

## Getting Started

1. Start the server:

```bash
node src/server.js
```

2. The server runs on `http://localhost:3000` by default.

3. Health check:

```bash
curl http://localhost:3000/health
```

## API Overview

### Auth

- `GET /api/auth/me`

### Users

- `GET /api/users` admin only
- `POST /api/users` admin only
- `GET /api/users/:id` admin only
- `PATCH /api/users/:id` admin only

Example create user payload:

```json
{
  "name": "Sam Support",
  "email": "sam@finance.local",
  "role": "viewer",
  "status": "active"
}
```

### Records

- `GET /api/records` admin and analyst
- `POST /api/records` admin only
- `GET /api/records/:id` admin and analyst
- `PATCH /api/records/:id` admin only
- `DELETE /api/records/:id` admin only

Supported record query parameters:

- `type=income|expense`
- `category=Marketing`
- `startDate=2026-03-01`
- `endDate=2026-03-31`
- `search=cloud`
- `page=1`
- `pageSize=10`

Example create record payload:

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

Optional dashboard range filters:

- `startDate=2026-03-01`
- `endDate=2026-03-31`

## Response Shape

Successful responses return:

```json
{
  "data": {}
}
```

Errors return:

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

## Design Notes

- The project uses a small service layer to separate business logic from HTTP routing.
- Records are soft deleted by setting `deletedAt`, which keeps analytics predictable and avoids hard removal.
- Mock token auth keeps the assignment focused on backend design rather than auth plumbing.
- JSON persistence is a deliberate simplification. In a production version, this would likely move to PostgreSQL or SQLite with migrations and indexes.

## Testing

Run:

```bash
node --test
```

The tests cover:

- role restrictions
- record creation and filtering
- validation errors
- user creation
