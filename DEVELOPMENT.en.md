# Development – Modo Playa Admin

This document describes how to run and work with the **Modo Playa admin frontend** in a local environment.

---

## 📦 Requirements

- Node.js (LTS recommended)
- npm
- Angular CLI
- Ionic CLI (optional but recommended)

---

## 🚀 Installation

Install project dependencies:

```bash
npm install
```

---

## ▶️ Run locally

Start the development server:

```bash
npm run start
```

The application will be available at:

```
http://localhost:4200
```

---

## 🧪 Testing

Run unit tests:

```bash
npm run test
```

---

## 🧹 Lint

Run lint checks:

```bash
npm run lint
```

---

## 🏗️ Build

Generate a production build:

```bash
npm run build
```

The output is generated in the `dist/` directory.

---

## 👀 Watch build

Compile in development mode with watch:

```bash
npm run watch
```

---

## 📁 Project structure

The project follows a feature-based structure with:

- `admin/` for layout and main admin screens
- `auth/` for authentication and session flows
- `lodgings/`, `contacs/`, `users/`, and `profile/` for functional modules
- `shared/` for reusable components, services, and utilities
- `core/` for cross-cutting base pieces
- `environments/` for environment configuration

---

## 📌 Notes

- The app uses Angular standalone components and route-based lazy loading
- Capacitor is configured for future native platform support
- For API-related features, validate models/endpoints against `modo-playa-api`

---
