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

El resultado se genera en el directorio `dist/`.

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
- `lodgings/`, `contacs/`, `users/` y `profile/` para módulos funcionales
- `shared/` para componentes, servicios y utilidades reutilizables
- `core/` para piezas base transversales
- `environments/` para configuración por entorno

---

## 📌 Notas

- La app usa Angular standalone components y lazy loading por rutas
- Capacitor está configurado para evolución a plataformas nativas
- Para features de API, validar estructura/modelos contra `modo-playa-api`

---
