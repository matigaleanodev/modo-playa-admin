# Modo Playa Admin

🌐 Versión en español: [readme.md](./readme.md)

**Modo Playa Admin** is the administration panel for operational management of the Modo Playa platform.
It allows admins to manage **lodgings**, **contacts**, **users**, and the **admin account** from an Ionic/Angular interface.

This repository contains the **admin frontend** of the application, built with Ionic and Angular,
designed for web usage and ready to evolve to mobile with Capacitor.

---

## 🧩 General architecture

- **Framework**: Ionic + Angular (standalone)
- **Styling**: SCSS
- **Routing**: Angular Router with feature routes
- **Authentication**: session flow with `auth` module
- **API consumption**: custom backend (Modo Playa API)

---

## 🛠️ Tech stack

![Angular](https://img.shields.io/badge/Angular-DD0031?logo=angular&logoColor=white)
![Ionic](https://img.shields.io/badge/Ionic-3880FF?logo=ionic&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-CC6699?logo=sass&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?logo=capacitor&logoColor=white)

---

## 📱 Main features

- Admin dashboard
- Lodgings management
- Contacts management
- Users management
- User profile (view, edit, change password)
- Image management delegated to the API backend without direct bucket interaction
- App information screen
- Legal pages (Terms and Privacy Policy)
- Theme selector (light, dark, system)

---

## 🖼️ Active media contract

The canonical admin media contract is `backend-only`.

- The frontend sends `multipart/form-data` to `modo-playa-api`.
- The frontend does not request signed URLs, does not upload directly to the bucket, and does not confirm storage uploads itself.
- `profile` uses `POST/DELETE auth/me/profile-image`.
- `lodgings` uses draft uploads through `POST admin/lodging-image-uploads` during creation and the `POST/PATCH/DELETE admin/lodgings/:id/images` subresource for later management.
- Media normalization, final validation, publication, and cleanup belong to the backend.

## 👤 Ownership and support

- Regular admin flows operate under the authenticated user's `ownerId`.
- `SUPERADMIN` can create resources on behalf of another tenant only when it sends `targetOwnerId` explicitly and the backend exposes that capability.
- `SUPERADMIN` cannot manage profile images through `auth/me/profile-image`.

---

## 🧑‍💻 Development

For local setup and development instructions:

👉 [DEVELOPMENT.en.md](./DEVELOPMENT.en.md)
