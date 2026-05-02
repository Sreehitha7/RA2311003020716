# Notification System Design

## Overview

This backend evaluation project consists of three independent components that work together to form a production-grade backend system: a reusable Logging Middleware, a Vehicle Maintenance Scheduler, and a Notification REST API.

---

## Architecture

```
backend-evaluation/
├── logging_middleware/          # Reusable log shipping package
├── vehicle_maintence_scheduler/ # In-memory job lifecycle manager
├── notification_app_be/         # Express REST API
│   ├── config/                  # Environment config
│   ├── routes/                  # Route definitions
│   ├── services/                # Business logic
│   ├── utils/                   # Validation helpers
│   └── middleware/              # Error handler
├── .env                         # Environment variables (not committed)
├── .gitignore
└── package.json
```

---

## Component 1: Logging Middleware

**Purpose:** Reusable function that ships structured log events to the AffordMed evaluation log API.

**Signature:**
```js
Log(stack, level, package, message)
```

**Design decisions:**
- Validates all three enum fields before making any network call
- Retries up to 3 times with linear backoff on 5xx / network errors
- Reads `TOKEN` from environment — never hardcoded
- Exported as a pure function, no side-effects on `require`

**Valid values:**
- Stack: `backend`, `frontend`
- Level: `debug`, `info`, `warn`, `error`, `fatal`
- Package (backend): `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service`
- Package (shared): `auth`, `config`, `middleware`, `utils`

---

## Component 2: Vehicle Maintenance Scheduler

**Purpose:** In-memory scheduler for vehicle maintenance jobs with a strict lifecycle.

**Job lifecycle:**
```
scheduled → in_progress → completed
scheduled → cancelled
in_progress → cancelled
scheduled ←→ (reschedule)
```

**Key features:**
- State guards on every transition — illegal moves throw immediately
- Returns copies of job objects — internal state cannot be mutated from outside
- `getOverdue()` surfaces jobs past their scheduled date
- Rich `summary()` with counts per status + overdue count

---

## Component 3: Notification Service (REST API)

**Base URL:** `http://localhost:3001`

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/notify` | Send a notification |
| GET | `/notify/:userId` | Get all notifications for a user |

### POST /notify

**Request Body:**
```json
{
  "userId": "user123",
  "message": "Your appointment is confirmed",
  "channel": "email"
}
```

**Response (201):**
```json
{
  "id": "uuid-here",
  "userId": "user123",
  "message": "Your appointment is confirmed",
  "channel": "email",
  "status": "sent",
  "createdAt": "2026-05-02T10:00:00.000Z"
}
```

**Valid channels:** `email`, `sms`, `push`, `in_app`

---

## Request Flow

```
Client → POST /notify
  → express.json()         [parse body]
  → validateNotification() [throw ValidationError if invalid]
  → NotificationService.send()
  → 201 response
  → errorHandler           [catches ValidationError → 400, others → 500]
```

---

## Design Principles Applied

- **Separation of concerns** — config, routes, services, utils, middleware are all isolated
- **Typed errors** — `ValidationError` with `statusCode` drives consistent HTTP responses
- **No side-effects on import** — logging middleware does nothing until `Log()` is called
- **Resilience** — retry with backoff on the log API
- **Immutable returns** — scheduler returns object copies, not references
