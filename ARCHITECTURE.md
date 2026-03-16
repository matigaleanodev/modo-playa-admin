# Modo Playa Admin Technical Guide

This document defines the stable technical conventions for `modo-playa-admin`.

It complements `readme.md` and `DEVELOPMENT.md` with the rules that should stay true while the admin continues evolving.

## Module boundaries

The app is organized by feature and each boundary should remain explicit.

- `admin/`: shell, dashboard, legal/info pages, and authenticated layout concerns.
- `auth/`: login, recovery, activation, guards, token/session wiring, and auth interceptors.
- `contacts/`, `lodgings/`, `users/`, `profile/`: business features and route-level pages.
- `shared/`: reusable UI components and user-facing services that can be used by multiple features without owning backend rules.
- `core/`: low-level primitives, resource abstractions, error catalogs, cross-cutting utilities, and generic base classes.

Rules:

- Keep business flows inside their feature module.
- Do not move backend ownership or media rules into `shared/`.
- Use `core/` for app-wide primitives, not feature-specific helpers.
- Use `shared/` only when a piece is already reused or clearly reusable without coupling to one feature.

## `core` conventions

`core/` is the base layer for technical reuse.

It currently owns:

- API/resource building blocks such as `api`, `crud`, `resource`, and base components.
- canonical backend error codes and shared domain error resolution.
- generic models such as API responses and validation metadata.

Rules:

- `core/` must stay framework-light and feature-agnostic.
- New code in `core/` should be reusable by at least two features or represent a true app-wide contract.
- Feature-specific DTO mapping should remain in the owning feature, even when it consumes `core` helpers.

## `shared` conventions

`shared/` contains reusable interaction pieces close to the UI layer.

It currently includes:

- components such as `confirm-modal`, `feedback-panel`, `form-field-render`, and `list-shell`
- services such as `dialog`, `nav`, `storage`, `theme`, and `toastr`
- test helpers and local mocks

Rules:

- `shared/` can depend on `core/`, but not on feature modules.
- `shared/` should not know backend endpoint details.
- UI state and presentation helpers belong in `shared/`; domain decisions belong in the feature or in the API.

## Feature conventions

Each feature should prefer a small internal surface:

- `models/` for local contracts aligned with `modo-playa-api`
- `services/` for resource access and feature-side orchestration
- `pages/` for route-level containers
- `components/` only when a feature has reusable internal UI parts
- `resolvers/` when route data needs preloading

Rules:

- Validate API-related changes against `modo-playa-api` before changing DTOs or forms.
- Avoid duplicating backend validations that are already canonical in the API.
- Keep owner and support semantics explicit in the feature that owns the workflow.

## Auth, session, storage, and ownership

The admin treats authentication and ownership with a strict separation of concerns.

### Auth/session

- `AuthService` owns backend auth calls such as login and `auth/me`.
- `SessionService` is the local source of truth for the authenticated user during runtime.
- route guards and interceptors consume session/token state, not ad hoc feature logic.

### Storage

- persistent browser storage is an implementation detail behind `shared/services/storage`
- features should consume session/theme abstractions instead of writing directly to storage
- stored values are limited to client concerns such as session persistence and theme preference

### Ownership

- regular owner flows operate with the authenticated owner context from the session
- `SUPERADMIN` support flows must send `targetOwnerId` explicitly when the backend requires creation on behalf of another owner
- owner switching is never implicit in frontend state
- profile image management is self-service only through the authenticated user and is not a cross-user admin capability

## Canonical media contract

The admin uses a backend-only media contract.

- the frontend sends `multipart/form-data` only to `modo-playa-api`
- the frontend never requests signed URLs, never uploads directly to the bucket, and never confirms storage uploads
- media normalization, publication, cleanup, and TTL enforcement remain backend responsibilities

### Profile image

- upload: `POST /api/auth/me/profile-image`
- delete: `DELETE /api/auth/me/profile-image`
- the flow always represents "my profile"
- `SUPERADMIN` does not manage profile image through this endpoint

Expected UI behavior:

- keep upload feedback inline on the profile page
- if an upload fails, preserve the selected file locally so the user can retry or discard it without reopening the picker
- never expose profile image editing for another user as a generic admin field

### Lodging creation media

- draft upload: `POST /api/admin/lodging-image-uploads`
- final create: `POST /api/admin/lodgings` with `uploadSessionId` and `pendingImageIds`

Expected UI behavior:

- file selection starts the multipart upload in background
- the page stays single-screen even though uploads are technically decoupled from the final submit
- each draft image must expose an explicit local state before save

### Existing lodging media

- add image: `POST /api/admin/lodgings/:lodgingId/images`
- set default: `PATCH /api/admin/lodgings/:lodgingId/images/:imageId/default`
- delete image: `DELETE /api/admin/lodgings/:lodgingId/images/:imageId`

## Expected upload states

The admin should use explicit UI states instead of vague toast-only feedback.

### Lodgings

Draft image states:

- `uploading`: multipart request in progress
- `confirmed`: image is ready to be associated on final create
- `failed`: upload failed but can be retried or removed in place
- `expired`: pending session expired or became invalid; the user must retry or clean the affected drafts without leaving the form

Rules:

- do not allow final save while images are still uploading
- do not allow final save while draft images remain failed or expired
- keep retry and cleanup controls in the same screen
- reset ambiguous pending state when the draft session becomes invalid

### Profile

Profile image states:

- idle
- uploading
- failed with local retry/discard options

Rules:

- keep the last failed file available for retry until the user discards it or a later upload succeeds
- show the current pending preview locally without changing the backend contract

## Testing posture

The admin should keep three layers aligned:

- unit tests for feature logic and UI states
- targeted integration-like component tests for complex forms and shared interaction pieces
- Playwright smoke coverage for owner and `SUPERADMIN` flows against a real API

At minimum, changes that affect media, ownership, or session behavior should update the closest unit tests and keep the relevant smoke suite runnable.
