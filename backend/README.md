# MedAILockr Healthcare API Platform

Production-ready backend API for a doctor-first healthcare platform built with Node.js, Express.js, TypeScript, and MongoDB.

---

## Architecture

```
medailockr-api/
├── src/
│   ├── config/          # DB connection, env variables
│   ├── models/          # Mongoose schemas (User, Appointment, etc.)
│   ├── controllers/     # Thin req/res handlers
│   ├── services/        # All business logic
│   ├── routes/          # Express routers
│   ├── middleware/      # Auth, RBAC, validation, upload, error handler
│   ├── validators/      # Zod schemas per domain
│   ├── utils/           # Logger, JWT helpers, ApiError, AuditLog
│   ├── types/           # Shared TypeScript interfaces
│   └── app.ts           # Express app + server bootstrap
```

### Request Flow

```
Request → Route → Middleware (auth + rbac + validate) → Controller → Service → Model → Response
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v20+ LTS |
| Framework | Express.js v4 |
| Language | TypeScript v5 |
| Database | MongoDB + Mongoose v8 |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| File Upload | Multer (local) |
| Logging | Winston |
| Security | Helmet, CORS, express-rate-limit |

---

## Setup Instructions

### 1. Prerequisites

- Node.js v20+
- MongoDB running locally or MongoDB Atlas URI
- Git

### 2. Clone & Install

```bash
git clone https://github.com/your-username/medailockr-api.git
cd medailockr-api
npm install
```

### 3. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medailockr
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 4. Create Required Directories

```bash
mkdir -p uploads logs
```

### 5. Run Development Server

```bash
npm run dev
```

Server starts at: `http://localhost:5000`

### 6. Build for Production

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | Environment (development/production) |
| `MONGODB_URI` | ✅ Yes | MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ Yes | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | Access token expiry (default: 15m) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token expiry (default: 7d) |
| `MAX_FILE_SIZE` | No | Max upload size in bytes (default: 10MB) |
| `UPLOAD_PATH` | No | Local upload directory (default: uploads/) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: 15min) |
| `RATE_LIMIT_MAX` | No | Max requests per window (default: 100) |
| `AUTH_RATE_LIMIT_MAX` | No | Max auth requests per window (default: 10) |

---

## API Overview

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

---

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register patient or doctor |
| POST | `/auth/login` | ❌ | Login and receive tokens |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ✅ | Invalidate refresh token |
| POST | `/auth/forgot-password` | ❌ | Request password reset |
| POST | `/auth/reset-password/:token` | ❌ | Reset password with token |

### User Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/profile` | ✅ | Get current user profile |
| PUT | `/users/profile` | ✅ | Update profile |
| GET | `/users/doctors` | ✅ | List all doctors (filterable) |
| GET | `/users/doctors/:id` | ✅ | Get doctor details |

### Doctor Availability

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/doctors/:doctorId/availability` | ✅ | Any | Get full availability |
| POST | `/doctors/:doctorId/availability/weekly` | ✅ | Doctor/Admin | Set weekly schedule |
| POST | `/doctors/:doctorId/availability/overrides` | ✅ | Doctor/Admin | Set date overrides |
| GET | `/doctors/:doctorId/available-slots` | ✅ | Any | Get slots for a date |
| PUT | `/doctors/:doctorId/availability/breaks` | ✅ | Doctor/Admin | Set break times |

### Appointments

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/appointments` | ✅ | Any | List user's appointments |
| POST | `/appointments` | ✅ | Patient | Book appointment |
| GET | `/appointments/:id` | ✅ | Any | Get appointment details |
| PUT | `/appointments/:id/reschedule` | ✅ | Any | Reschedule appointment |
| PUT | `/appointments/:id/cancel` | ✅ | Any | Cancel with reason |
| PUT | `/appointments/:id/complete` | ✅ | Doctor | Mark as completed |

### Medical Records

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/records/upload` | ✅ | Upload medical document |
| GET | `/records` | ✅ | List records |
| GET | `/records/:id` | ✅ | Get record metadata |
| GET | `/records/:id/download` | ✅ | Get temporary download URL |
| DELETE | `/records/:id` | ✅ | Soft delete record |

---

## Database Schema Summary

### Users
- Base: firstName, lastName, email, password, role, phone, isActive, tokenVersion
- Patient profile: dateOfBirth, bloodGroup, allergies, emergencyContact
- Doctor profile: specialization, qualifications, consultationFee, experienceYears

### Availability
- doctorId (ref: User), weeklySchedule[], dateOverrides[], breakTimes[], slotDurationMinutes

### Appointments
- patientId, doctorId, scheduledDate, scheduledTime, status, reasonForVisit, consultationFee, auditLog[]
- Status lifecycle: `scheduled → confirmed → completed / cancelled / no_show`

### MedicalRecords
- patientId, uploadedBy, title, recordType, file (metadata), tags, isDeleted (soft delete)

### AuditLogs
- userId, action, resource, resourceId, details, ipAddress, timestamp
- Auto-expire after 1 year via TTL index

---

## Security Features

- JWT access tokens (15min) + refresh tokens (7d) with rotation
- bcrypt password hashing (12 rounds)
- Role-Based Access Control (Patient / Doctor / Admin)
- Helmet.js security headers
- CORS with allowlist
- Rate limiting (global: 100/15min, auth: 10/15min, uploads: 20/hr)
- Input validation and sanitization via Zod
- Soft delete for sensitive data
- Audit trail for all sensitive operations
- Path traversal prevention on file downloads

---

## Health Checks

```bash
GET /health   # Liveness — is the server running?
GET /ready    # Readiness — is DB connected?
```

---

## Sample Register Request

```json
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "role": "patient",
  "phone": "+91 9876543210"
}
```

## Sample Book Appointment Request

```json
POST /api/appointments
Authorization: Bearer <token>
{
  "doctorId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "scheduledDate": "2026-03-15",
  "scheduledTime": "10:00",
  "reasonForVisit": "Routine checkup",
  "symptoms": ["fever", "headache"]
}
```

---

## Scripts

```bash
npm run dev       # Start dev server with hot reload
npm run build     # Compile TypeScript
npm start         # Run compiled production build
npm test          # Run Jest tests
npm run lint      # ESLint check
```