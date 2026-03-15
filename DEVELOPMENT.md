# Development – Modo Playa Admin

Este documento describe cómo ejecutar y trabajar con el **frontend de administración de Modo Playa** en un entorno local.

---

## 📦 Requisitos

- Node.js (LTS recomendado)
- npm
- Angular CLI
- Ionic CLI (opcional pero recomendado)

---

## 🚀 Instalación

Instalar dependencias del proyecto:

```bash
npm install
```

---

## ▶️ Ejecución local

Iniciar el servidor de desarrollo:

```bash
npm run start
```

La aplicación estará disponible en:

```
http://localhost:4200
```

---

## 🧪 Testing

Ejecutar tests unitarios:

```bash
npm run test
```

Para una corrida estable de CI sin watch:

```bash
npm run test:ci
```

Smoke suite owner con Playwright:

```bash
npm run e2e:owner
```

Smoke suite soporte `SUPERADMIN` con Playwright:

```bash
npx playwright test e2e/superadmin-target-owner.spec.ts
```

Variables requeridas:

- `E2E_OWNER_IDENTIFIER`
- `E2E_OWNER_PASSWORD`

Variables opcionales:

- `E2E_API_URL` por defecto `http://localhost:3000/api`
- `E2E_PORT` por defecto `4301`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` si Playwright no encuentra Chromium instalado

---

## 🧹 Lint

Ejecutar validaciones de lint:

```bash
npm run lint
```

---

## 🏗️ Build

Generar build de producción:

```bash
npm run build
```

El resultado se genera en el directorio `www/`.

---

## 👀 Build en modo watch

Compilar en modo desarrollo con watch:

```bash
npm run watch
```

---

## 📁 Estructura del proyecto

El proyecto sigue una estructura orientada por features con:

- `admin/` para layout y pantallas administrativas principales
- `auth/` para autenticación y sesión
- `lodgings/`, `contacts/`, `users/` y `profile/` para módulos funcionales
- `shared/` para componentes, servicios y utilidades reutilizables
- `core/` para piezas base transversales
- `environments/` para configuración por entorno

---

## 📌 Notas

- La app usa Angular standalone components y lazy loading por rutas
- Capacitor está configurado para evolución a plataformas nativas
- Para features de API, validar estructura/modelos contra `modo-playa-api`
- El módulo de contactos ya usa `contacts` como nombre canónico en estructura, imports y rutas
- La gestion de media vigente es backend-only: el admin envia `multipart/form-data` a la API y no hace uploads directos al bucket
- El admin no usa signed URLs ni confirmaciones de media en frontend
- Los flujos de soporte deben enviar `targetOwnerId` explícito cuando el backend lo requiere para crear en nombre de otro owner

---
