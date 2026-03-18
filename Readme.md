# 🏥 MedAILockr — Healthcare Booking Platform

<div align="center">

![MedAILockr](https://img.shields.io/badge/MedAILockr-Healthcare%20Platform-blue?style=for-the-badge&logo=heart&logoColor=white)

[![TypeScript](https://img.shields.io/badge/TypeScript-98%25-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-v22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Railway](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)](https://railway.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**A full-stack, production-ready healthcare booking platform — book doctors, manage appointments, upload medical records, and more.**

[🚀 Live API](#-live-demo) • [📖 Docs](#-api-documentation) • [⚙️ Setup](#️-getting-started) • [📁 Structure](#-monorepo-structure)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Live Demo](#-live-demo)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Monorepo Structure](#-monorepo-structure)
- [Getting Started](#️-getting-started)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧠 About the Project

**MedAILockr** is a doctor-first healthcare booking platform that allows patients to find doctors, book appointments, and securely manage their medical records — all through a clean REST API with a React frontend.

This is a **monorepo** containing both the backend API and the frontend client:

| Package | Description |
|---|---|
| [`/backend`](./backend) | Production REST API — Node.js, Express, TypeScript, MongoDB |
| [`/frontend`](./frontend) | React client — React 19, TypeScript, Vite |

### Why this project?

Built to demonstrate real-world full-stack development practices including:

- JWT authentication with refresh token rotation
- Role-based access control (Patient / Doctor / Admin)
- Smart appointment booking with conflict detection
- Secure medical record file storage
- Notification queuing with retry logic
- Full audit logging on all sensitive operations
- Production deployment on Railway with MongoDB

---

## 🚀 Live Demo

| Resource | URL |
|---|---|
| 🌐 **Live API** | [`https://faithful-acceptance-production-410b.up.railway.app/api`](https://faithful-acceptance-production-410b.up.railway.app/api) |
| ❤️ **Health Check** | [`https://faithful-acceptance-production-410b.up.railway.app/health`](https://faithful-acceptance-production-410b.up.railway.app/health) |
| 📖 **Swagger UI Docs** | [`https://faithful-acceptance-production-410b.up.railway.app/api/docs`](https://faithful-acceptance-production-410b.up.railway.app/api/docs) |
| 🟢 **Readiness Check** | [`https://faithful-acceptance-production-410b.up.railway.app/ready`](https://faithful-acceptance-production-410b.up.railway.app/ready) |

> The backend is live and deployed on Railway (us-west2) with Node.js v22 and a connected MongoDB instance.

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.x | UI framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 6.x | Build tool + HMR dev server |
| **ESLint** | 9.x | Code quality |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | v22 LTS | Runtime |
| **Express.js** | 4.x | Web framework |
| **TypeScript** | 5.x | Type safety, strict mode |
| **MongoDB + Mongoose** | 8.x | Database + ODM |
| **JWT** | 9.x | Auth — access + refresh tokens |
| **Zod** | 3.x | Input validation & sanitization |
| **Multer** | 1.4.x | File uploads (max 10MB) |
| **Winston** | 3.x | Structured logging |
| **Helmet + CORS** | latest | Security headers |
| **Swagger UI** | 5.x | Auto-generated API docs |
| **Jest + ts-jest** | 29.x | Testing |

### Infrastructure

| Tool | Purpose |
|---|---|
| **Railway** | Cloud hosting — backend + MongoDB |
| **NIXPACKS** | Auto-build on Railway |
| **GitHub** | Version control + CI/CD via Railway auto-deploy |

---

## ✨ Features

### 🔐 Authentication
- JWT access tokens (15 min) + refresh tokens (7 days) with rotation
- bcrypt password hashing (12 rounds)
- Forgot / reset password with secure token hashing

### 👥 User Roles
| Role | Permissions |
|---|---|
| **Patient** | Book appointments, upload records, view own data |
| **Doctor** | Manage availability, complete appointments, view patient records |
| **Admin** | Full access, analytics, audit logs, user management |

### 📅 Appointments
- Real-time slot availability checking
- Conflict detection — prevents double booking
- Status lifecycle: `scheduled → confirmed → completed / cancelled / no_show`
- Reschedule and cancel with reason tracking

### 🗓 Doctor Availability
- Weekly schedule management (per-day slots)
- Date overrides for holidays/leaves
- Break time management
- Smart slot generation

### 🗂 Medical Records
- Secure file upload — PDF, images, Word docs (max 10MB)
- Soft delete by default, hard delete for admins
- Temporary signed download URLs
- Record types: lab reports, prescriptions, imaging, discharge summaries

### 🔔 Notifications
- Email / SMS / Push queuing system
- Template-based notification bodies
- Retry logic with configurable max retries
- Scheduled notifications

### 🏥 Admin Dashboard
- User management (list, activate/deactivate)
- Appointment analytics (by doctor, status, revenue)
- Audit log access with full filtering

### 📊 Observability
- Winston structured logging
- Request ID tracking
- Health check + readiness check endpoints
- Audit trail with 1-year TTL auto-expiry

---

## 📁 Monorepo Structure

```
Healthcare-booking-platform/
│
├── backend/                        # Node.js REST API
│   ├── src/
│   │   ├── config/                 # DB, env, Swagger
│   │   ├── controllers/            # Route handlers
│   │   ├── middleware/             # Auth, RBAC, validation, upload
│   │   ├── models/                 # Mongoose schemas
│   │   ├── routes/                 # Express routers
│   │   ├── services/               # Business logic
│   │   ├── types/                  # TypeScript interfaces
│   │   ├── utils/                  # Logger, JWT, ApiError, AuditLog
│   │   ├── validators/             # Zod schemas
│   │   └── app.ts                  # Entry point
│   ├── railway.json                # Railway deployment config
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                       # React client
│   ├── src/
│   │   ├── assets/                 # Images, icons
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── services/               # API call functions
│   │   ├── types/                  # TypeScript types
│   │   ├── utils/                  # Helper functions
│   │   ├── App.tsx                 # Root component
│   │   └── main.tsx                # Entry point
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── README.md                       # ← You are here
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local) or use the live Railway URL
- Git

---

### Backend Setup

```bash
# 1. Go to backend
cd Healthcare-booking-platform/backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env with your values (see backend/README.md)

# 4. Create required directories
mkdir -p uploads logs

# 5. Start dev server
npm run dev
# → http://localhost:5001
```

---

### Frontend Setup

```bash
# 1. Go to frontend
cd Healthcare-booking-platform/frontend

# 2. Install dependencies
npm install

# 3. Create .env file
echo "VITE_API_BASE_URL=http://localhost:5001/api" > .env

# 4. Start dev server
npm run dev
# → http://localhost:5173
```

> To use the **live production backend** instead of running locally, set:
> ```
> VITE_API_BASE_URL=https://faithful-acceptance-production-410b.up.railway.app/api
> ```

---

## 📖 API Documentation

Full interactive API docs are available via Swagger UI:

🔗 [`https://faithful-acceptance-production-410b.up.railway.app/api/docs`](https://faithful-acceptance-production-410b.up.railway.app/api/docs)

### Quick Endpoint Reference

| Domain | Endpoints |
|---|---|
| **Auth** | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password` |
| **Users** | `/users/profile`, `/users/doctors` |
| **Doctors** | `/doctors/:id/availability`, `/doctors/:id/available-slots` |
| **Appointments** | `/appointments` (CRUD + reschedule, cancel, complete) |
| **Records** | `/records/upload`, `/records` (CRUD + download) |
| **Notifications** | `/notifications/send`, `/notifications` (list + retry) |
| **Admin** | `/admin/users`, `/admin/analytics/appointments`, `/admin/audit-logs` |
| **Health** | `/health`, `/ready`, `/api` |

> See [`backend/README.md`](./backend/README.md) for the full API reference.

---

## 📸 Screenshots

### Railway Deployment

```
Service:    faithful-acceptance
Status:     ✅ Online
Region:     us-west2
Runtime:    node@22.22.1
Replicas:   1
Build:      NIXPACKS (TypeScript → dist/)
Health:     GET /health → 200 OK
```

### API Health Check

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-03-19T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### API Info Response

```json
{
  "success": true,
  "message": "MedAILockr Healthcare API",
  "version": "1.0.0",
  "documentation": "/api/docs",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "doctors": "/api/doctors",
    "appointments": "/api/appointments",
    "records": "/api/records",
    "notifications": "/api/notifications",
    "admin": "/api/admin"
  }
}
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 📚 More Documentation

| Document | Description |
|---|---|
| [`backend/README.md`](./backend/README.md) | Backend API — full setup, endpoints, security, DB schema |
| [`frontend/README.md`](./frontend/README.md) | Frontend — setup, structure, scripts |
| [Live Swagger Docs](https://faithful-acceptance-production-410b.up.railway.app/api/docs) | Interactive API explorer |

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/Sarika-stack23">Sarika</a>
  <br/>
  <sub>MedAILockr — Full Stack Healthcare Booking Platform</sub>
  <br/><br/>
  <a href="https://faithful-acceptance-production-410b.up.railway.app/health">🟢 API Status</a> •
  <a href="https://faithful-acceptance-production-410b.up.railway.app/api/docs">📖 API Docs</a> •
  <a href="https://github.com/Sarika-stack23/Healthcare-booking-platform">⭐ Star on GitHub</a>
</div>