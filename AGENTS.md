# modo-playa-admin

## Contexto de trabajo

Si existe un workspace con AGENTS.md en los directorios padre, leerlo explícitamente antes de editar y seguir sus referencias. Una raíz Git anidada puede impedir la herencia automática. Fuera de ese entorno, este archivo y el README deben ser suficientes para trabajar.

## Aplicación y límites

- Angular standalone, Ionic y Capacitor; panel administrativo de alojamientos.
- Mantener módulos de lodgings, contacts, users, profile y dashboard.
- Conservar aliases legacy contacs mientras los contratos los requieran.
- Formularios y modelos deben corresponder con DTOs de la API compatible.
- Respetar ownership y los flujos diferenciados de propietario y SUPERADMIN.
- Seguir uploads backend, confirmación, defaults, selección y eliminación de media.

## Desarrollo y verificación

- npm ci instala; npm start inicia; npm run build compila.
- npm run test:ci ejecuta la configuración de navegador de CI.
- npm run e2e:owner y npm run e2e:superadmin verifican flujos específicos.
- Revisar requisitos de fixtures/cuentas antes de ejecutar e2e; no usar producción por defecto.
- Consultar ARCHITECTURE y DEVELOPMENT para integración y estructura.

## Restricciones

- No duplicar reglas críticas de negocio ni autorización del backend en el cliente.
- La validación de formulario complementa la validación del servidor.
- No inventar un segundo flujo de media ni transferir credenciales de almacenamiento al navegador.
- Validar cambios de API contra modo-playa-api-cloud o la implementación compatible seleccionada.
- Diferenciar verificación web y comportamiento Android en cambios nativos.
