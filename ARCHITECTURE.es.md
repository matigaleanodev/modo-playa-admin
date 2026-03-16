# Guia tecnica de Modo Playa Admin

Este documento define las convenciones tecnicas estables de `modo-playa-admin`.

Complementa `readme.md` y `DEVELOPMENT.md` con reglas que deben mantenerse vigentes mientras el admin siga evolucionando.

## Limites de modulos

La app esta organizada por feature y cada boundary debe seguir siendo explicito.

- `admin/`: shell, dashboard, paginas legales/info y preocupaciones del layout autenticado.
- `auth/`: login, recuperacion, activacion, guards, cableado de token/sesion e interceptores de auth.
- `contacts/`, `lodgings/`, `users/`, `profile/`: features de negocio y paginas a nivel de ruta.
- `shared/`: componentes de UI reutilizables y servicios orientados a interaccion que pueden usar varias features sin adueñarse de reglas backend.
- `core/`: primitivas de bajo nivel, abstracciones de recursos, catalogos de errores, utilidades transversales y clases base genericas.

Reglas:

- Mantener los flujos de negocio dentro de su feature.
- No mover reglas de ownership o media del backend a `shared/`.
- Usar `core/` para primitivas globales de la app, no para helpers especificos de una feature.
- Usar `shared/` solo cuando una pieza ya es reutilizada o claramente reutilizable sin acoplarse a una feature.

## Convenciones de `core`

`core/` es la capa base de reutilizacion tecnica.

Hoy contiene:

- bloques de construccion API/recurso como `api`, `crud`, `resource` y componentes base
- codigos canonicos de error backend y resolucion compartida de errores de dominio
- modelos genericos como respuestas API y metadata de validaciones

Reglas:

- `core/` debe seguir siendo liviano respecto del framework y agnostico de features.
- El codigo nuevo en `core/` debe servir al menos a dos features o representar un contrato realmente global.
- El mapeo de DTOs especificos de una feature debe quedarse en la feature dueña, aunque consuma helpers de `core`.

## Convenciones de `shared`

`shared/` contiene piezas reutilizables cercanas a la capa de UI.

Hoy incluye:

- componentes como `confirm-modal`, `feedback-panel`, `form-field-render` y `list-shell`
- servicios como `dialog`, `nav`, `storage`, `theme` y `toastr`
- helpers de testing y mocks locales

Reglas:

- `shared/` puede depender de `core/`, pero no de features.
- `shared/` no debe conocer detalles de endpoints backend.
- Los helpers de estado visual y presentacion pertenecen a `shared/`; las decisiones de dominio pertenecen a la feature o a la API.

## Convenciones de features

Cada feature debe preferir una superficie interna chica:

- `models/` para contratos locales alineados con `modo-playa-api`
- `services/` para acceso a recursos y orquestacion del lado de la feature
- `pages/` para contenedores a nivel de ruta
- `components/` solo cuando una feature tenga UI interna reutilizable
- `resolvers/` cuando la ruta necesite precarga de datos

Reglas:

- Validar cambios relacionados con la API contra `modo-playa-api` antes de tocar DTOs o formularios.
- Evitar duplicar validaciones backend que ya sean canonicas en la API.
- Mantener explicitas las semanticas owner y soporte en la feature que adueña el flujo.

## Auth, session, storage y ownership

El admin trata autenticacion y ownership con una separacion estricta de responsabilidades.

### Auth/session

- `AuthService` adueña las llamadas backend de auth como login y `auth/me`.
- `SessionService` es la fuente local de verdad del usuario autenticado durante el runtime.
- guards e interceptores consumen estado de sesion/token, no logica ad hoc de features.

### Storage

- el storage persistente del browser queda como detalle de implementacion detras de `shared/services/storage`
- las features deben consumir abstracciones de sesion/theme en lugar de escribir directo en storage
- los valores persistidos se limitan a preocupaciones cliente como persistencia de sesion y preferencia de tema

### Ownership

- los flujos normales owner operan con el contexto del owner autenticado tomado de la sesion
- los flujos de soporte `SUPERADMIN` deben enviar `targetOwnerId` de forma explicita cuando el backend requiera crear en nombre de otro owner
- el cambio de owner nunca es implicito en el estado frontend
- la gestion de profile image es solo self-service del usuario autenticado y no una capacidad administrativa transversal

## Contrato canonico de media

El admin usa un contrato de media backend-only.

- el frontend envia `multipart/form-data` solo a `modo-playa-api`
- el frontend nunca pide signed URLs, nunca sube directo al bucket y nunca confirma uploads de storage
- la normalizacion, publicacion, limpieza y enforcement de TTL de media siguen siendo responsabilidad del backend

### Imagen de perfil

- upload: `POST /api/auth/me/profile-image`
- delete: `DELETE /api/auth/me/profile-image`
- el flujo siempre representa "mi perfil"
- `SUPERADMIN` no administra profile image por este endpoint

Comportamiento esperado de UI:

- mantener el feedback de upload inline dentro de la pagina de perfil
- si falla un upload, conservar localmente el archivo seleccionado para reintentar o descartarlo sin reabrir el selector
- no exponer la edicion de profile image de otro usuario como un campo admin generico

### Media en alta de lodging

- draft upload: `POST /api/admin/lodging-image-uploads`
- alta final: `POST /api/admin/lodgings` con `uploadSessionId` y `pendingImageIds`

Comportamiento esperado de UI:

- la seleccion de archivos dispara el upload multipart en background
- la pagina sigue siendo de una sola pantalla aunque los uploads esten desacoplados tecnicamente del submit final
- cada imagen draft debe exponer un estado local explicito antes del guardado

### Media en lodging existente

- agregar imagen: `POST /api/admin/lodgings/:lodgingId/images`
- marcar default: `PATCH /api/admin/lodgings/:lodgingId/images/:imageId/default`
- eliminar imagen: `DELETE /api/admin/lodgings/:lodgingId/images/:imageId`

## Estados esperados de upload

El admin debe usar estados de UI explicitos en lugar de feedback ambiguo o solo por toast.

### Lodgings

Estados de una draft image:

- `uploading`: request multipart en progreso
- `confirmed`: la imagen esta lista para asociarse en el alta final
- `failed`: el upload fallo pero puede reintentarse o eliminarse en la misma pantalla
- `expired`: la sesion pendiente vencio o quedo invalida; el usuario debe reintentar o limpiar esos drafts sin salir del formulario

Reglas:

- no permitir el guardado final mientras sigan uploads en progreso
- no permitir el guardado final mientras existan draft images fallidas o expiradas
- mantener controles de reintento y limpieza en la misma pantalla
- resetear el estado pendiente ambiguo cuando la draft session quede invalida

### Profile

Estados de profile image:

- idle
- uploading
- failed con opciones locales de retry/discard

Reglas:

- mantener disponible el ultimo archivo fallido para reintento hasta que el usuario lo descarte o un upload posterior termine bien
- mostrar la preview pendiente en local sin cambiar el contrato backend

## Postura de testing

El admin debe mantener alineadas tres capas:

- tests unitarios para logica de feature y estados de UI
- tests puntuales tipo integracion de componentes para forms complejos y piezas shared de interaccion
- smoke coverage con Playwright para flujos owner y `SUPERADMIN` contra una API real

Como minimo, los cambios que afecten media, ownership o session deben actualizar los unit tests mas cercanos y mantener ejecutable la smoke suite relevante.
