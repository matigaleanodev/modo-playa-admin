# Roadmap

Estado general: in progress

Este archivo es local y operativo. Se usa para ordenar la evolucion real del admin sin mezclar deuda estructural con nuevas pantallas.

Regla de trabajo:

- Marcar cada tarea completada con `[x]`
- Marcar tareas activas con `[~]`
- Dejar pendientes con `[ ]`
- Actualizar este archivo cuando cambie una decision tecnica relevante o se cierre una fase real

## Baseline actual - 2026-03-08

Estado: completed

Hallazgos confirmados en el repositorio:

- La app actual usa Angular 21.1, Ionic 8 y bootstrap standalone
- El repo esta dividido en `auth`, `admin`, `lodgings`, `contacs`, `users`, `profile`, `core` y `shared`
- `npm run lint`, `npx ng test --watch=false --browsers=ChromeHeadless --configuration=ci` y `npm run build` pasan
- La suite de tests sigue emitiendo warnings de `ion-menu`
- `DEVELOPMENT.en.md` todavia describe salida `dist/`, pero el build real genera `www`
- El naming legacy `contacs` sigue existiendo en estructura fuente y rutas alias
- Hay trabajo activo alrededor de `contacts-form`, `confirm-modal`, `form-field-render` y `dialog`, lo que confirma que el repo esta en transicion operativa y no congelado

Decision operativa:

- El siguiente corte debe cerrar deuda de consistencia y de estructura antes de seguir expandiendo modulos nuevos.

## Fase 0 - Auditoria y alineacion

Estado: completed
Impact: small
Repositorio: modo-playa-admin

Objetivo:
Dejar documentado el estado real del admin y sus principales puntos de tension.

Tareas:

- [x] Auditar stack, modulos y rutas principales
- [x] Verificar lint, build y testing reales
- [x] Detectar brechas entre documentacion y codigo
- [x] Registrar deuda visible y contexto de transicion

Done when:

- Existe una baseline real del repo
- La siguiente iteracion puede priorizarse sin suposiciones

## Fase 1 - Base solida y deuda tecnica

Estado: in progress
Impact: medium
Repositorio: modo-playa-admin
Dependencias: Fase 0

Objetivo:
Normalizar naming, testing, shared infrastructure y contratos base con la API para que el admin siga creciendo sin ruido acumulado.

Tareas:

- [x] Definir un plan de renombre progresivo `contacs` -> `contacts` sin romper imports ni rutas canonicas
- [x] Eliminar warnings de `ion-menu` en tests y dejar una base reusable para componentes shell
- [x] Estabilizar `confirm-modal`, `dialog` y `form-field-render` antes de seguir multiplicando formularios
- [x] Alinear documentacion operativa con salida real `www` y comando de test confiable
- [x] Revisar si `lodgings`, `contacts` y `profile` comparten un contrato consistente de estado, validacion y feedback
- [x] Adaptar el roadmap y los flujos del admin al contrato canonico de media definido en `modo-playa-api`

Done when:

- La estructura del repo deja de arrastrar deuda de naming evidente
- Las piezas shared mas delicadas quedan estables
- La suite de tests deja de convivir con warnings evitables
- El admin deja documentado un unico patron de media alineado con la API

## Fase 2 - Evolucion funcional

Estado: in progress
Impact: medium
Repositorio: modo-playa-admin
Dependencias: Fase 1

Objetivo:
Consolidar los flujos administrativos que ya existen antes de abrir mas superficie.

Tareas:

- [x] Homogeneizar loading, error y success states entre dashboard, users, contacts y lodgings
- [x] Implementar en `lodgings` un flujo de alta con imagenes iniciales en una sola experiencia de formulario, pero con uploads tecnicamente desacoplados
- [x] Implementar en `lodgings` gestion posterior de imagenes sobre el subrecurso admin de media: upload pendiente, confirmacion, default y delete
- [x] Implementar en `profile` la gestion de imagen propia del usuario autenticado usando el mismo patron tecnico de upload pendiente + confirmacion
- [x] Eliminar del admin cualquier flujo de media que dependa de upload directo al backend si deja de existir como contrato canonico en la API
- [x] Asegurar que el admin no permita a un usuario owner modificar la imagen de perfil de otros usuarios del mismo owner
- [~] Resolver estados de UI para uploads pendientes, confirmaciones exitosas, expiracion TTL, limpieza y reintentos sin cambiar de pantalla
- [x] Cerrar diferencias entre rutas legacy y rutas canonicas
- [x] Validar flujos owner reales de punta a punta contra la API antes de sumar nuevas pantallas
- [x] Reemplazar la seleccion de disponibilidad basada en `ion-datetime` por un calendario propio reutilizable con validacion visual de solapamientos
- [ ] Validar flujos `SUPERADMIN` con `targetOwnerId` explicito cuando la operacion requiera crear recursos en nombre de un owner

Done when:

- El admin se comporta de forma mas uniforme
- Los flujos ya existentes quedan consolidados sin reescribir la app
- Lodgings y profile consumen el mismo patron de media sin excepciones locales

## Fase 3 - DX, testing, observabilidad y documentacion

Estado: pending
Impact: small
Repositorio: modo-playa-admin
Dependencias: Fase 2

Objetivo:
Dejar reglas y cobertura suficientes para mantener el admin sin depender de conocimiento tacito.

Tareas:

- [ ] Agregar cobertura puntual sobre forms complejos, modales de confirmacion y servicios de dialogo
- [x] Agregar una smoke suite owner sobre login, contactos, perfil y disponibilidad contra API local
- [ ] Documentar convenciones de `core`, `shared` y features para nuevos modulos
- [ ] Registrar decisiones de auth/session/storage y ownership con `modo-playa-api`
- [ ] Documentar el patron canonico de media del admin y sus estados de UI esperados para `lodgings` y `profile`
- [ ] Agregar cobertura sobre uploads pendientes, confirmacion final, expiracion y reintento en `lodgings` y `profile`

Done when:

- El repo tiene una base mas repetible para nuevos cambios
- Las decisiones tecnicas importantes dejan de quedar implicitas

## Decisiones abiertas

- [ ] Definir cuando se ejecuta el renombre total de `contacs`

## Plan vigente - Renombre progresivo `contacs` -> `contacts` 2026-03-13

Estado: accepted

Objetivo:

- cerrar la deuda de naming sin introducir un refactor transversal de alto riesgo en una sola sesion

Estrategia:

- mantener `contacts` como nombre canonico de rutas publicas y navegacion
- conservar `contacs` solo como alias de compatibilidad temporal mientras existan imports o paths legacy
- mover primero los puntos de entrada y barrel internos de menor impacto, y dejar los cambios fisicos de carpetas para una fase separada con validacion completa
- evitar mezclar el renombre con cambios de contrato API, media o ownership

Orden propuesto:

- fase A: documentacion, roadmap y confirmacion explicita de que `contacts` es la ruta canonica
- fase B: normalizar nombres de constantes, symbols exportados y alias internos donde no rompan lazy loading ni imports existentes
- fase C: introducir una carpeta puente `contacts/` con reexports o wrappers pequenos para empezar a migrar imports consumidores sin big bang
- fase D: renombrar estructura fisica `src/app/contacs` a `src/app/contacts` cuando los imports remanentes ya sean marginales y la suite este limpia
- fase E: retirar alias de ruta `contacs` y referencias residuales solo despues de validar navegacion y deep links legacy

Reglas de seguridad:

- no cambiar la ruta canonica `app/contacts`
- no romper bookmarks o links legacy mientras el alias `app/contacs` siga siendo necesario
- no tocar boundaries de modulo entre `contacts`, `lodgings`, `users`, `profile` y `dashboard`

Condicion de cierre:

- el repo no contiene imports ni nombres de modulo `contacs`
- la ruta alias `contacs` puede retirarse sin afectar navegacion real ni compatibilidad necesaria

## Avance operativo - Base local sin backend 2026-03-13

Estado: partial completion

Trabajo cerrado sin dependencia de API:

- `package.json` agrega `npm run test:ci` para usar el modo confiable ya soportado por Angular/Karma
- `DEVELOPMENT.md` y `DEVELOPMENT.en.md` quedan alineados con salida real `www`, comando estable de tests y estado legacy de `contacs`
- `DialogService` ya permite personalizar `cancelLabel` y mantiene defaults coherentes con `ConfirmModalComponent`
- `form-field-render` corrige el manejo de blur para campos `multiple` usando salida real de foco del grupo
- se amplian tests de `dialog` y `form-field-render` para cubrir estos comportamientos shared

Pendiente local que sigue sin backend:

- cerrar la estabilizacion restante de `confirm-modal` dentro del stack shared
- revisar estados finos de uploads y reintentos donde la UI todavia mezcla feedback inline y toast

## Decision tecnica vigente - Media admin 2026-03-12

Estado: accepted

Direccion acordada con `modo-playa-api`:

- El admin debe tratar las imagenes como subrecursos tecnicos, no como blobs embebidos en los endpoints generales de creacion o update
- La experiencia de usuario puede seguir siendo de un solo formulario o una sola pantalla, pero por debajo el flujo queda separado en upload pendiente y confirmacion final
- La API canonica para media pasa a ser `signed upload + confirmacion backend`
- El admin no debe depender de upload directo al backend como camino principal
- La normalizacion, validacion final y publicacion definitiva de imagenes siguen siendo responsabilidad del backend

Regla operativa para `lodgings`:

- El formulario de alta puede permitir seleccionar imagenes antes de guardar
- Cuando el usuario selecciona imagenes, el admin debe iniciar uploads en background contra el flujo canonico de media y mantener esos archivos en estado pendiente
- Al confirmar la creacion del lodging, el admin debe enviar junto con los datos del formulario las referencias de imagenes pendientes que la API necesite para asociarlas al lodging creado
- El usuario no debe ser obligado a entrar a una segunda pantalla solo para cargar las imagenes iniciales
- Una vez creado el lodging, toda gestion posterior debe seguir el mismo patron de subrecurso admin de imagenes: agregar, confirmar, marcar default y eliminar

Regla operativa para `profile`:

- La imagen de perfil debe usar el mismo patron tecnico de upload pendiente + confirmacion
- Un usuario owner solo puede modificar su propia imagen de perfil
- Usuarios del mismo owner no pueden editar la imagen de perfil de otros usuarios aunque compartan tenant
- Si existen pantallas admin de gestion de usuarios, la imagen de perfil no debe tratarse como un campo editable transversal salvo que la API exponga una excepcion explicita para soporte

Regla operativa para `SUPERADMIN`:

- `SUPERADMIN` no queda restringido por filtros de `ownerId`
- Cuando una operacion de creacion de recursos requiera actuar en nombre de un owner, el admin debe enviar `targetOwnerId` de forma explicita
- El admin no debe asumir que el tenant de soporte puede transformarse implicitamente en owner destino durante altas o asociaciones

## Validacion cruzada con backend - 2026-03-12

Estado: action required

Hallazgos confirmados contra `modo-playa-api`:

- El servicio de profile sigue consumiendo rutas legacy `admin/users/:id/profile-image/upload` y `admin/users/:id/profile-image`, pero el backend canonico ahora usa `auth/me/profile-image/upload-url`, `auth/me/profile-image/confirm` y `DELETE auth/me/profile-image`
- El flujo de profile ya no acepta upload directo al backend y, ademas, `SUPERADMIN` no puede operar profile image por ese endpoint
- El formulario de lodgings todavia depende de `createWithImages` y `updateWithImages`, pero esos caminos quedaron retirados del backend
- El alta de lodging debe migrar a draft uploads + `uploadSessionId` + `pendingImageIds`, manteniendo una sola experiencia de formulario
- La gestion posterior de imagenes de lodging ya tiene subrecurso canonico y puede mantenerse sobre `upload-url`, `confirm`, `default` y `delete`
- El dashboard del admin todavia tipa `recentActivity.source` como `derived`, pero el backend lo cerro como `timestamps`

Inconsistencias legacy que deben tratarse como deuda bloqueante:

- `ProfileImageAdminService` sigue modelado como upload directo multipart a endpoints administrativos retirados
- `LodgingsCrudService` conserva `createWithImages` y `updateWithImages`, que ya no existen como contrato backend
- `lodgings-form` sigue orquestando el alta de imagenes como parte del submit principal en vez de separar draft uploads previos + asociacion final
- Los tipos del dashboard todavia sugieren que `recentActivity` es una vista `derived` generica en vez de una vista heuristica de `timestamps`
- La UX de soporte todavia debe decidir explicitamente que `SUPERADMIN` no administra profile image y no debe ver ese control

Contratos canonicos que el admin debe adoptar desde ahora:

- Profile image propia:
  - `POST /api/auth/me/profile-image/upload-url`
  - `POST /api/auth/me/profile-image/confirm`
  - `DELETE /api/auth/me/profile-image`
- Draft uploads de alta de lodging:
  - `POST /api/admin/lodging-image-uploads/upload-url`
  - `POST /api/admin/lodging-image-uploads/confirm`
  - `POST /api/admin/lodgings` con `uploadSessionId` + `pendingImageIds`
- Imagenes de lodging existente:
  - `POST /api/admin/lodgings/:lodgingId/images/upload-url`
  - `POST /api/admin/lodgings/:lodgingId/images/confirm`
  - `PATCH /api/admin/lodgings/:lodgingId/images/:imageId/default`
  - `DELETE /api/admin/lodgings/:lodgingId/images/:imageId`
- Dashboard:
  - `recentActivity.source` debe tiparse como `'timestamps' | 'none'`

Modelos y contratos locales que deben ajustarse:

- `dashboard-summary.model.ts`
  - cambiar `recentActivity.source` de `'derived' | 'none'` a `'timestamps' | 'none'`
  - documentar internamente que `action` y `timestamp` son derivados y no una auditoria persistida
- `profile`
  - reemplazar cualquier contrato local de upload directo por `upload-url response`, `confirm response` y `delete response`
  - no modelar profile image como operacion sobre otro `userId`; el flujo es siempre "mi perfil"
- `lodgings`
  - separar payload de alta/edicion del flujo de archivos
  - incorporar un estado local de draft image con `imageId`, `uploadSessionId`, `uploadKey`, `status`, `previewUrl`
  - tratar `pendingImageIds` y `uploadSessionId` como parte del contrato de alta, no como detalle interno opcional

Modificaciones concretas necesarias para seguir el roadmap del admin de forma independiente:

- [x] Reemplazar `ProfileImageAdminService` por un servicio alineado a `auth/me/profile-image`
- [x] Eliminar del admin toda dependencia de `admin/users/:id/profile-image/upload`
- [x] Eliminar del admin toda dependencia de `admin/users/:id/profile-image`
- [x] Rediseñar `lodgings-form` para que al seleccionar archivos se pidan signed URLs de draft, se haga upload en background y se confirme cada draft antes del submit final
- [x] Hacer que el submit de alta de lodging envie `uploadSessionId` + `pendingImageIds` junto con el payload normalizado
- [x] Retirar `createWithImages` de `LodgingsCrudService`
- [x] Retirar `updateWithImages` de `LodgingsCrudService`
- [x] Mantener la edicion posterior de imagenes solo sobre el subrecurso admin vigente (`upload-url`, `confirm`, `default`, `delete`)
- [x] Ajustar tests de `lodgings-form`, `dashboard` y `profile` para dejar de mockear contratos legacy
- [x] Ocultar o deshabilitar controles de profile image cuando el usuario autenticado sea `SUPERADMIN`
- [ ] Validar owner flow y support flow por separado para no mezclar reglas de ownership con soporte
- [x] Alinear manejo de errores de UI con `code` explicitos del backend en vez de depender solo de `message`

Trabajo que debe continuar en este repo:

- [x] Reemplazar el flujo de profile por `auth/me/profile-image` con signed upload + confirmacion, restringido al owner autenticado
- [x] Retirar por completo cualquier dependencia de upload directo al backend para profile image
- [x] Rehacer el alta de lodging para usar draft uploads previos y enviar `pendingImageIds` + `uploadSessionId` en `POST /admin/lodgings`
- [x] Retirar `createWithImages` y `updateWithImages` del flujo canonico del admin
- [x] Actualizar tipos de dashboard para aceptar `recentActivity.source = 'timestamps'`
- [x] Revisar UX de soporte para que `SUPERADMIN` no exponga controles de profile image

## Avance operativo - 2026-03-12

Estado: partial completion

Contrato legacy retirado en esta sesion:

- `dashboard.recentActivity.source = 'derived'`
- profile image administrativa sobre `admin/users/:id/profile-image/upload` y `admin/users/:id/profile-image`
- alta y edicion de lodgings sobre `admin/lodgings/with-images` y `admin/lodgings/:id/with-images`

Contrato canonico adoptado en esta sesion:

- `dashboard.recentActivity.source = 'timestamps' | 'none'`
- profile image propia sobre `auth/me/profile-image/upload-url`, `auth/me/profile-image/confirm` y `DELETE auth/me/profile-image`
- alta de lodging con draft uploads confirmados y submit final con `uploadSessionId` + `pendingImageIds`
- edicion posterior de imagenes de lodging solo sobre el subrecurso admin vigente

Impacto local cerrado:

- modelos: `dashboard-summary.model.ts` alineado al backend
- servicios: profile image migrado a signed upload; `LodgingsCrudService` sin `createWithImages` ni `updateWithImages`; `LodgingImagesAdminService` extendido con draft uploads
- paginas: `profile-view` oculta gestion de imagen para `SUPERADMIN`; `lodgings-form` separa uploads draft previos del submit final y usa el subrecurso canonico en edicion
- tests: actualizados `dashboard.page.spec.ts`, `profile-view.page.spec.ts` y `lodgings-form.page.spec.ts`

Validacion local cerrada:

- `npx ng test --watch=false --browsers=ChromeHeadless --include="src/app/admin/pages/dashboard/dashboard.page.spec.ts" --include="src/app/profile/pages/profile-view/profile-view.page.spec.ts" --include="src/app/lodgings/pages/lodgings-form/lodgings-form.page.spec.ts"`
- `npm run build`

Pendiente inmediato:

- validar support flow real contra API

## Avance operativo - Error codes 2026-03-12

Estado: completed

Direccion cerrada:

- el admin mantiene un catalogo local completo de `error.code` alineado con `modo-playa-api`
- la resolucion de errores de dominio se centraliza en `core` para reutilizar mensajes compartidos y permitir overrides puntuales por pantalla
- las pantallas priorizan `error.code` conocido antes que `message`, y solo caen en `message` o fallback cuando el backend no expone un codigo catalogado

Impacto local cerrado:

- `core/constants/error-code.ts` y `core/constants/error-message.ts` cubren todos los codigos backend vigentes
- `core/utils/domain-error.util.ts` resuelve `code`, mensajes compartidos y overrides locales
- `error-interceptor`, `users`, `profile`, `lodgings-form` y `lodgings-availability` ya usan la resolucion centralizada
- se retiro la dependencia local del codigo legacy `INVALID_OBJECT_ID`

Validacion local cerrada:

- `npm run lint`
- `npx ng test --watch=false --browsers=ChromeHeadless --include="src/app/auth/interceptors/error-interceptor.spec.ts" --include="src/app/core/utils/domain-error.util.spec.ts" --include="src/app/users/users.page.spec.ts" --include="src/app/lodgings/pages/lodgings-availability/lodgings-availability.page.spec.ts" --include="src/app/profile/pages/profile-view/profile-view.page.spec.ts" --include="src/app/lodgings/pages/lodgings-form/lodgings-form.page.spec.ts"`

Condicion de cierre para el admin respecto de este backend:

- Ningun flujo principal debe depender de rutas legacy retiradas
- Lodgings y profile deben consumir el contrato canonico vigente de `modo-playa-api`
- Los modelos locales deben representar el contrato real de `dashboard`, `media` y `ownership`
- El repo debe poder continuar sus fases 2 y 3 sin volver a consultar decisiones pendientes del backend para estos frentes

## Validacion UI owner - 2026-03-13

Estado: completed

Recorrido validado contra `http://localhost:3000/api` con owner real:

- login real exitoso con `auth/login`
- carga correcta de `dashboard`, `contacts`, `lodgings`, `availability` y `profile`
- alta real de contacto desde UI completada sin errores visibles
- lectura real de profile y acciones de navegacion a editar perfil / cambiar contrasena sin errores de runtime
- alta y eliminacion real de rangos de disponibilidad desde la UI completadas con cleanup posterior
- validacion real de solapamiento desde el calendario de disponibilidad confirmada en UI
- sin `pageerror` ni errores de consola durante el recorrido automatizado

Decision validada:

- las cards de listados administrativos no necesitan ser clickeables mientras existan botones explicitos de accion y disponibilidad

Impacto operativo:

- el owner flow ya no esta bloqueado por contrato backend
- la disponibilidad ya no depende de `ion-datetime` y usa un calendario unico para visualizar ocupacion y seleccionar rangos

## Avance operativo - Disponibilidad y confirmacion 2026-03-13

Estado: completed

Trabajo cerrado:

- `confirm-modal` deja de comportarse como sheet modal en iOS y pasa a mostrarse como dialogo centrado con dimensiones acotadas
- los botones `Cancelar` y `Confirmar` quedan dentro del viewport en mobile real
- `lodgings-availability` reemplaza el calendario de Ionic por un calendario propio reutilizado desde `modo-playa-app`
- el calendario se usa tanto para visualizar rangos ocupados como para seleccionar nuevos rangos
- la seleccion de rango se confirma dentro del mismo formulario con acciones explicitas de guardar o cancelar
- la UI bloquea intentos de superposicion contra rangos existentes antes de llamar al backend

Validacion cerrada:

- tests unitarios de `confirm-modal`, `dialog`, `lodging-availability-calendar` y `lodgings-availability`
- `npm run build`
- prueba UI real contra `http://localhost:3000/api` con owner en mobile y desktop

## Avance operativo - Smoke suite owner 2026-03-13

Estado: completed

Trabajo cerrado:

- se agrega Playwright como base e2e del repo
- se define una smoke suite owner serial para `dashboard`, `contacts`, `profile` y `lodgings/availability`
- la suite usa variables de entorno para credenciales owner y URL de API
- cada flujo deja cleanup explicito para no contaminar la API local con datos de prueba

Validacion cerrada:

- `npm run e2e:owner`
- `npm run lint`
- `npm run build`
