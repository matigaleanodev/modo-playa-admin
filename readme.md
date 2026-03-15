# Modo Playa Admin

🌐 English version: [README.en.md](./README.en.md)

**Modo Playa Admin** es el panel de administración para la gestión operativa de la plataforma Modo Playa.
Permite administrar **alojamientos**, **contactos**, **usuarios** y la **cuenta del administrador** desde una interfaz Ionic/Angular.

Este repositorio contiene el **frontend administrativo** de la aplicación, desarrollado con Ionic y Angular,
pensado para uso web y preparado para evolución mobile con Capacitor.

---

## 🧩 Arquitectura general

- **Framework**: Ionic + Angular (standalone)
- **Estilos**: SCSS
- **Routing**: Angular Router con feature routes
- **Autenticación**: flujo de sesión con módulo `auth`
- **Consumo de API**: backend propio (Modo Playa API)

---

## 🛠️ Stack tecnológico

![Angular](https://img.shields.io/badge/Angular-DD0031?logo=angular&logoColor=white)
![Ionic](https://img.shields.io/badge/Ionic-3880FF?logo=ionic&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-CC6699?logo=sass&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?logo=capacitor&logoColor=white)

---

## 📱 Funcionalidades principales

- Dashboard administrativo
- Gestión de alojamientos
- Gestión de contactos
- Gestión de usuarios
- Perfil de usuario (ver, editar, cambio de contraseña)
- Gestión de imágenes delegada al backend de la API sin interacción directa con el bucket
- Pantalla de información de la app
- Páginas legales (Términos y Política de Privacidad)
- Selector de tema (claro, oscuro, sistema)

---

## 🖼️ Contrato de media vigente

El contrato canónico de media del admin es `backend-only`.

- El frontend envía `multipart/form-data` a `modo-playa-api`.
- El frontend no pide signed URLs, no sube archivos directo al bucket y no confirma uploads contra storage.
- `profile` usa `POST/DELETE auth/me/profile-image`.
- `lodgings` usa draft uploads por `POST admin/lodging-image-uploads` durante el alta y el subrecurso `POST/PATCH/DELETE admin/lodgings/:id/images` para la gestión posterior.
- La normalización, validación final, publicación y cleanup de media pertenecen al backend.

## 👤 Ownership y soporte

- Los flujos normales del admin operan con el `ownerId` del usuario autenticado.
- `SUPERADMIN` puede crear recursos en nombre de otro tenant sólo cuando envía `targetOwnerId` de forma explícita y el backend expone esa capacidad.
- `SUPERADMIN` no administra profile image mediante `auth/me/profile-image`.

---

## 🧑‍💻 Desarrollo

Para instrucciones de instalación y ejecución en entorno local:

👉 [DEVELOPMENT.md](./DEVELOPMENT.md)
