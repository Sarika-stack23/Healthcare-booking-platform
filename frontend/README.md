# 🏥 MedAILockr — Frontend

<div align="center">

![MedAILockr Frontend](https://img.shields.io/badge/MedAILockr-Frontend-blue?style=for-the-badge&logo=react&logoColor=white)

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**The frontend client for MedAILockr — a doctor-first healthcare booking platform.**

[🚀 Live API](#-connected-backend) • [⚙️ Setup](#️-local-setup) • [📁 Project Structure](#-project-structure)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Tech Stack](#-tech-stack)
- [Connected Backend](#-connected-backend)
- [Project Structure](#-project-structure)
- [Local Setup](#️-local-setup)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [ESLint Configuration](#-eslint-configuration)

---

## 🧠 About

This is the frontend for **MedAILockr**, a healthcare booking platform. It connects to the MedAILockr REST API backend deployed on Vercel.

The frontend is built with **React 19 + TypeScript + Vite** for a fast, type-safe development experience with Hot Module Replacement (HMR) in development.

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.x | UI framework |
| **TypeScript** | 5.x | Type safety across the entire frontend |
| **Vite** | 6.x | Build tool + dev server (HMR) |
| **ESLint** | 9.x | Code quality and linting |

---

## 🔗 Connected Backend

This frontend connects to the MedAILockr backend API:

| Resource | URL |
|---|---|
| 🌐 Live API | `https://healthcare-booking-platform-tl1j.vercel.app/api` |
| ❤️ Health Check | `https://healthcare-booking-platform-tl1j.vercel.app/health` |
| 📖 API Docs (Swagger) | `https://healthcare-booking-platform-tl1j.vercel.app/api/docs` |

> See the [backend README](../backend/README.md) for full API documentation.

---

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, icons, fonts
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page-level components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API call functions (axios/fetch)
│   ├── types/           # TypeScript interfaces & types
│   ├── utils/           # Helper functions
│   ├── App.tsx          # Root component + routing
│   └── main.tsx         # Entry point
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript config
├── tsconfig.app.json    # App-specific TypeScript config
├── tsconfig.node.json   # Node-specific TypeScript config
└── eslint.config.js     # ESLint configuration
```

---

## ⚙️ Local Setup

### Prerequisites

- Node.js v18+
- npm or yarn
- Backend API running (locally or use the live Vercel URL)

### 1. Navigate to Frontend

```bash
cd Healthcare-booking-platform/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

Or to use the live production backend:

```env
VITE_API_BASE_URL=https://healthcare-booking-platform-tl1j.vercel.app/api
```

### 4. Start Development Server

```bash
npm run dev
```

App starts at: `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

Output goes to `dist/`.

### 6. Preview Production Build

```bash
npm run preview
```

---

## 🔑 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5001/api` |

> All Vite environment variables must be prefixed with `VITE_` to be accessible in the browser.

---

## 📜 Available Scripts

```bash
npm run dev        # Start development server with HMR
npm run build      # Type-check + build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint checks
```

---

## 🔧 ESLint Configuration

This project uses ESLint 9 with TypeScript support. For production applications, type-aware lint rules are recommended.

Update `eslint.config.js` to enable stricter type-checked rules:

```js
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // Or use strictTypeChecked for even stricter rules
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

You can also add React-specific lint rules:

```bash
npm install --save-dev eslint-plugin-react-x eslint-plugin-react-dom
```

```js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

// Add to your config extends:
reactX.configs['recommended-typescript'],
reactDom.configs.recommended,
```

---

## 🔗 Related

- [Backend README](../backend/README.md) — API setup, endpoints, deployment
- [Live API Docs](https://healthcare-booking-platform-tl1j.vercel.app/api/docs) — Swagger UI

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/Sarika-stack23">Sarika</a>
  <br/>
  <sub>MedAILockr Healthcare Platform — React + TypeScript + Vite</sub>
</div>