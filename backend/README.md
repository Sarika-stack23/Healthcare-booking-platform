# 🏥 MedAILockr — Healthcare Booking Platform

<div align="center">

![MedAILockr Banner](https://img.shields.io/badge/MedAILockr-Healthcare%20Platform-blue?style=for-the-badge&logo=heart&logoColor=white)

[![Node.js](https://img.shields.io/badge/Node.js-v22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://healthcare-booking-platform-tl1j.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**A production-ready, doctor-first healthcare booking API platform built with Node.js, TypeScript, and MongoDB — fully deployed on Vercel.**

[🚀 Live API](#-live-demo) • [📚 API Docs](#-api-overview) • [⚙️ Setup](#️-local-setup) • [🔐 Security](#-security-features)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Live Demo](#-live-demo)
- [Tech Stack](#-tech-stack--languages)
- [Features](#-features)
- [Architecture](#-architecture)
- [API Overview](#-api-overview)
- [Local Setup](#️-local-setup)
- [Environment Variables](#-environment-variables)
- [Security Features](#-security-features)
- [Database Schema](#-database-schema)
- [Testing](#-testing)
- [Scripts](#-scripts)

---

## 🧠 About the Project

**MedAILockr** is a full-stack healthcare booking platform backend designed to handle real-world complexity — from patient registration and doctor availability management to secure medical record storage and notification queuing.

The goal was to build a production-grade REST API with proper RBAC (Role-Based Access Control), JWT authentication with token rotation, smart slot-booking with conflict detection, audit logging, and a fully integrated Swagger UI.

**Who is this for?**
- Patients who want to book appointments with doctors online
- Doctors who need to manage their weekly availability and patient records
- Admins who need oversight, analytics, and audit trails

---

## 🚀 Live Demo

| Resource | URL |
|---|---|
| 🌐 Live API Base | `https://healthcare-booking-platform-tl1j.vercel.app/api` |
| ❤️ Health Check | `https://healthcare-booking-platform-tl1j.vercel.app/health` |
| 📖 Swagger UI Docs | `https://healthcare-booking-platform-tl1j.vercel.app/api/docs` |
| 🟢 Readiness Check | `https://healthcare-booking-platform-tl1j.vercel.app/ready` |

> The API is live and connected to a MongoDB Atlas instance. Test all endpoints via Swagger UI or Postman using the base URL above.

---

## 🛠 Tech Stack & Languages

### Languages

| Language | Usage | % |
|---|---|---|
| **TypeScript** | Entire backend codebase — strict mode, full type safety | ~98% |
| **JavaScript** | Config files | ~2% |

### Backend Stack

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Node.js | v22 LTS |
| **Framework** | Express.js | v4.x |
| **Language** | TypeScript | v5.x |
| **Database** | MongoDB + Mongoose | v8.x |
| **Auth** | JSON Web Tokens (JWT) | access + refresh |
| **Validation** | Zod | v3.x |
| **File Upload** | Multer | v1.4.x |
| **Logging** | Winston | v3.x |
| **Security** | Helmet, CORS, express-rate-limit | latest |
| **API Docs** | Swagger (swagger-jsdoc + swagger-ui-express) | v6/v5 |
| **Testing** | Jest + ts-jest | v29.x |
| **Dev Server** | ts-node-dev | v2.x |

### Infrastructure & Deployment

| Tool | Purpose |
|---|---|
| **Vercel** | Serverless hosting for backend API |
| **MongoDB Atlas** | Managed cloud database (M0 Free Tier) |
| **GitHub** | Version control + CI via Vercel auto-deploy |

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT access tokens (15 min) + refresh tokens (7 days) with **token rotation**
- bcrypt password hashing (12 rounds)
- Role-Based Access Control: **Patient / Doctor / Admin**
- Forgot/reset password with secure token hashing

### 👤 User Management
- Patient and Doctor registration with role-specific profiles
- Patient profile: blood group, allergies, emergency contact
- Doctor profile: specialization, consultation fee, qualifications, experience

### 📅 Appointment Booking
- Real-time slot availability checking
- **Conflict detection** — prevents double booking
- Appointment lifecycle: `scheduled → confirmed → completed / cancelled / no_show`
- Reschedule and cancel with reason tracking
- Full audit trail per appointment

### 🗓 Doctor Availability
- Weekly schedule management (per-day time slots)
- Date overrides (holidays, leaves)
- Break time management
- Smart slot generation with break filtering

### 🗂 Medical Records
- Secure file upload (PDF, images, Word docs — max 10MB)
- Soft delete with hard-delete option for admins
- Temporary signed download URLs
- Record types: lab reports, prescriptions, imaging, discharge summaries

### 🔔 Notifications
- Email / SMS / Push notification queuing system
- Template-based notification body generation
- Retry logic with configurable max retries
- Scheduled notifications support

### 🏥 Admin Panel
- Full user management (list, activate/deactivate)
- Appointment analytics (by doctor, status, revenue, date range)
- Audit log access with full filtering

### 📊 Observability
- Winston structured logging (JSON in production)
- Request ID tracking across all logs
- Response time logging
- Health check (`/health`) + readiness check (`/ready`)
- TTL-based audit log expiry (1 year auto-delete)

---

## 🏗 Architecture

```
src/
├── config/          # DB connection, env config, Swagger spec
├── models/          # Mongoose schemas (User, Appointment, Availability, etc.)
├── controllers/     # Thin req/res handlers — delegate to services
├── services/        # All business logic (auth, booking, records, etc.)
├── routes/          # Express routers per domain
├── middleware/      # Auth, RBAC, validation, upload, rate limit, error handler
├── validators/      # Zod schemas per domain
├── utils/           # Logger, JWT helpers, ApiError, AuditLog
├── types/           # Shared TypeScript interfaces
└── app.ts           # Express app + server bootstrap
```

### Request Flow

```
Request
  → Route
  → Middleware (authenticate → authorize → validate)
  → Controller
  → Service (business logic)
  → Model (MongoDB via Mongoose)
  → Response
```

---

## 📡 API Overview

### Base URL
```
https://healthcare-booking-platform-tl1j.vercel.app/api
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

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

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/doctors/:doctorId/availability` | Any | Get full availability |
| POST | `/doctors/:doctorId/availability/weekly` | Doctor/Admin | Set weekly schedule |
| POST | `/doctors/:doctorId/availability/overrides` | Doctor/Admin | Set date overrides |
| GET | `/doctors/:doctorId/available-slots` | Any | Get slots for a date |
| PUT | `/doctors/:doctorId/availability/breaks` | Doctor/Admin | Set break times |

### Appointments

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/appointments` | Any | List user's appointments |
| POST | `/appointments` | Patient | Book appointment |
| GET | `/appointments/:id` | Any | Get appointment details |
| PUT | `/appointments/:id/reschedule` | Any | Reschedule appointment |
| PUT | `/appointments/:id/cancel` | Any | Cancel with reason |
| PUT | `/appointments/:id/complete` | Doctor | Mark as completed |

### Medical Records

| Method | Endpoint | Description |
|---|---|---|
| POST | `/records/upload` | Upload medical document |
| GET | `/records` | List records |
| GET | `/records/:id` | Get record metadata |
| GET | `/records/:id/download` | Get temporary download URL |
| DELETE | `/records/:id` | Soft delete record |

### Health Checks

```bash
GET /health     # Liveness check
GET /ready      # Readiness check (DB connected?)
GET /api        # API info + endpoint map
GET /api/docs   # Swagger UI
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally or MongoDB Atlas URI
- Git

### 1. Clone & Install

```bash
git clone https://github.com/Sarika-stack23/Healthcare-booking-platform.git
cd Healthcare-booking-platform/backend
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medailockr
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

### 3. Create Required Directories

```bash
mkdir -p uploads logs
```

### 4. Run Development Server

```bash
npm run dev
```

Server starts at: `http://localhost:5001`

### 5. Build for Production

```bash
npm run build
npm start
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5001) |
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

## 🔐 Security Features

- ✅ **JWT tokens** — access (15 min) + refresh (7 days) with rotation on every refresh
- ✅ **bcrypt** — password hashing with 12 salt rounds
- ✅ **RBAC** — Patient / Doctor / Admin role enforcement on every protected route
- ✅ **Helmet.js** — secure HTTP headers
- ✅ **CORS** — origin allowlist
- ✅ **Rate limiting** — global: 100/15min, auth: 10/15min, uploads: 20/hr
- ✅ **Zod validation** — all inputs validated and sanitized before hitting services
- ✅ **Soft delete** — sensitive records never hard-deleted by default
- ✅ **Audit trail** — every sensitive operation logged with TTL auto-expiry (1 year)
- ✅ **Path traversal prevention** on file downloads

---

## 🗄 Database Schema

### Users
Base fields: firstName, lastName, email, password (hashed), role, phone, isActive, tokenVersion

Patient profile: dateOfBirth, bloodGroup, allergies, emergencyContact

Doctor profile: specialization, qualifications, consultationFee, experienceYears, bio, licenseNumber

### Availability
doctorId (ref: User), weeklySchedule[], dateOverrides[], breakTimes[], slotDurationMinutes

### Appointments
patientId, doctorId, scheduledDate, scheduledTime, status, reasonForVisit, consultationFee, auditLog[]

Status lifecycle: `scheduled → confirmed → completed / cancelled / no_show`

### MedicalRecords
patientId, uploadedBy, title, recordType, file (metadata), tags, isDeleted (soft delete)

### AuditLogs
userId, action, resource, resourceId, details, ipAddress, timestamp

Auto-expire after 1 year via TTL index.

### Notifications
userId, type (email/sms/push), template, body, recipient, status, retryCount, scheduledAt

Auto-expire after 90 days via TTL index.

---

## 🧪 Testing

```bash
npm test
```

Test coverage includes:
- ApiError class with all static methods
- JWT token generation and verification
- bcrypt password hashing and comparison
- Zod schema validation (register, login, appointment, notification, record)
- User model mock integration

---

## 📜 Scripts

```bash
npm run dev       # Start dev server with hot reload (ts-node-dev)
npm run build     # Compile TypeScript → dist/
npm start         # Run compiled production build
npm test          # Run Jest tests with coverage
npm run lint      # ESLint check
```

---

## 🗺 Postman Collection

A complete Postman collection (`Medailockr.postman_collection.json`) is included in the `backend/` directory.

**To use it:**
1. Import the collection into Postman
2. Set the `baseUrl` variable to:
   - **Local:** `http://localhost:5001/api`
   - **Production:** `https://healthcare-booking-platform-tl1j.vercel.app/api`
3. Run `Register Patient` → tokens auto-save to collection variables
4. All subsequent requests use `{{accessToken}}` automatically

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/Sarika-stack23">Sarika</a>
  <br/>
  <sub>MedAILockr Healthcare Platform — Production API on Vercel</sub>
</div>