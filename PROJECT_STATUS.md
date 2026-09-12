## `PROJECT_STATUS.md`

```markdown
# PROJECT STATUS - Fix_Go

## Estado general

🟡 PROYECTO EN DESARROLLO

El proyecto cuenta actualmente con una Proof of Concept funcional que demuestra la integración entre frontend, backend y base de datos.

## Infraestructura

- [x] Git
- [x] GitHub
- [x] Node.js
- [x] React
- [x] Vite
- [x] Express
- [x] MySQL
- [x] Docker
- [x] Axios
- [x] JWT

## Autenticación

- [x] Registro de usuarios
- [x] Inicio de sesión
- [x] JWT
- [x] Middleware de autenticación
- [x] Identificación del usuario
- [x] Identificación del rol
- [x] Redirección según rol
- [x] `AuthContext` centraliza token, rol, autenticación, login y logout
- [x] Reconstrucción y limpieza de sesión desde `localStorage`
- [x] Persistencia de sesión validada después de recargar con F5
- [x] `ProtectedRoute` exige autenticación y restringe uno o varios roles
- [x] Rutas React protegidas para cliente, taller, mecánico y administrador
- [x] Logout funcional con limpieza de sesión y redirección al login
- [x] Rutas privadas bloqueadas sin sesión
- [x] Rutas privadas bloqueadas después de logout y botón Atrás
- [x] Detección y rechazo de rol manipulado en `localStorage`
- [x] Manejo de token inválido con limpieza de sesión
- [x] Interceptor Axios agrega automáticamente `Authorization: Bearer <token>`
- [x] Respuestas 401 limpian la sesión sin cerrar sesión ante 403
- [x] Navegación por rol validada manualmente con cliente, taller y mecánico
- [x] Lint global del frontend aprobado
- [x] Build de Vite aprobado

La respuesta 403 no cierra la sesión. La protección React mejora la
navegación y la experiencia de usuario; la autorización real permanece en el
backend. La fase fue validada manualmente con los roles cliente, taller y
mecánico, incluyendo acceso directo, F5, logout, botón Atrás, sesión ausente,
rol local manipulado y token inválido. La ruta de administrador permanece
protegida; no se habilitó ningún flujo público para crear administradores.

## Roles

- [x] Cliente
- [x] Taller
- [x] Mecánico
- [x] Administrador

Las interfaces específicas de todos los roles todavía están en desarrollo.

## Cliente

### Dashboard

- [x] Dashboard del cliente
- [x] Consulta de talleres
- [x] Tarjetas de talleres
- [x] Navegación inferior

### Talleres

- [x] Lista de talleres
- [x] Perfil del taller
- [x] Información del taller
- [ ] Agendar cita

### Vehículos

- [x] Mis vehículos
- [x] Consultar vehículos
- [x] Registrar vehículo
- [x] Guardar vehículo en MySQL
- [x] Editar vehículo
- [x] Eliminar vehículo
- [x] Control de propiedad de vehículos por usuario autenticado
- [x] Validación CRUD con dos usuarios diferentes

La propiedad se obtiene mediante `req.usuario.id`. GET por ID, PUT y DELETE
restringen las operaciones por `cliente_id`; el frontend no controla la
propiedad del vehículo. El aislamiento entre dos usuarios fue validado y la
persistencia se comprobó directamente en MySQL.

### Citas

- [ ] Crear cita
- [ ] Consultar citas
- [ ] Cancelar cita
- [ ] Modificar cita
- [ ] Validar horarios

### Perfil

- [ ] Perfil del cliente
- [ ] Editar información
- [ ] Cambiar contraseña

## Taller

- [ ] Dashboard del taller
- [ ] Perfil del taller
- [ ] Editar información
- [ ] Gestión de citas
- [ ] Gestión de horarios
- [ ] Gestión de mecánicos
- [ ] Historial de servicios

## Mecánico

- [ ] Dashboard del mecánico
- [ ] Servicios asignados
- [ ] Consultar citas
- [ ] Actualizar estado del servicio
- [ ] Registrar trabajo realizado
- [ ] Registrar evidencias
- [ ] Historial de reparaciones

## Administrador

- [ ] Dashboard administrador
- [ ] Gestión de usuarios
- [ ] Gestión de clientes
- [ ] Gestión de talleres
- [ ] Gestión de mecánicos
- [ ] Gestión de categorías
- [ ] Administración general

## Base de datos

Estado:

🟢 FUNCIONAL

Script:

```text
backend/base_de_datos.sql

El script fue corregido para reflejar el esquema real inspeccionado en MySQL.
Se eliminó `DROP DATABASE` y no se ejecutó el archivo corregido sobre la base
actual. El respaldo previo permanece disponible. Queda pendiente definir un
sistema de migraciones para futuros cambios de esquema.

La estructura real de las tablas debe verificarse directamente en el archivo SQL.

Backend
Autenticación
 Registro
 Login
 JWT
 Middleware
 Roles
Talleres
 Obtener talleres
 Obtener taller por ID
Vehículos
 [x] Obtener vehículos (probado)
 [x] Obtener vehículo por ID (probado)
 [x] Registrar vehículo (probado)
 [x] Actualizar vehículo (probado)
 [x] Eliminar vehículo (probado)
Citas
 Crear cita
 Obtener citas
 Actualizar cita
 Cancelar cita
 Validar disponibilidad
Frontend
Páginas implementadas
 Login
 Registro
 Dashboard Cliente
 Mis Vehículos
 Nuevo Vehículo
 Perfil del Taller
Páginas pendientes
 Citas
 Perfil Cliente
 Dashboard Taller
 Dashboard Mecánico
 Dashboard Administrador
Diseño
 CSS separado de JSX
 Diseño responsive inicial
 Diseño del login
 Diseño del registro
 Diseño del dashboard cliente
 Diseño de tarjetas de talleres
 Diseño de vehículos
 Diseño del perfil de taller
 Barra de navegación inferior

Pendiente:

 Homogeneizar estilos
 Mejorar responsive
 Estados de carga
 Mensajes de error
 Mensajes de éxito
 Diseño final
Proof of Concept

Estado:

🟢 FUNCIONAL

Flujo demostrado:

Usuario
   ↓
Registro
   ↓
Login
   ↓
JWT
   ↓
Dashboard
   ↓
Talleres
   ↓
Perfil del taller
   ↓
Vehículos
   ↓
Registrar vehículo
   ↓
MySQL

Integración:

React
   ↓
Axios
   ↓
Express
   ↓
JWT
   ↓
MySQL
Próxima prioridad
Estabilización de seguridad e infraestructura antes del módulo de citas.

Pendientes principales:

- [x] `backend/.env` dejó de estar rastreado por Git y permanece disponible localmente.
- [x] Crear `.gitignore` adecuado.
- [x] Crear `backend/.env.example` sin secretos.
- [x] Retirar `backend/node_modules` del seguimiento de Git sin eliminarlo localmente.
- [x] Rotar `JWT_SECRET` y la contraseña del usuario MySQL utilizado por el backend.
- [x] Validar el backend, login y consultas autenticadas después de la rotación.
- [x] Ejecutar el backend con mínimo privilegio MySQL: `SELECT`, `INSERT`, `UPDATE` y `DELETE`.
- [x] Validar operaciones CRUD con `taller_user` bajo los permisos mínimos.
- [x] Rotar la contraseña root de MySQL y asegurar su configuración en Docker Compose.
- [x] Usar `MYSQL_ROOT_PASSWORD` desde un `.env` raíz local no versionado.
- [x] Validar MySQL, el volumen persistente y el backend después de la rotación root.
- [x] Corregir `backend/base_de_datos.sql` sin ejecutar operaciones destructivas.
- [x] Verificar el esquema real de MySQL antes de aplicar cambios.
- [ ] Definir un sistema de migraciones para futuros cambios de esquema.
- [x] Implementar middleware de autorización por roles en el backend.
- [x] Restringir las operaciones de vehículos al rol `cliente`.
- [x] Proteger la escritura y la propiedad de talleres para el rol `taller`.
- [x] Bloquear el escalamiento a `administrador` desde el registro público.
- [x] Validar la autorización backend con cuentas QA de cliente y taller.
- [x] Implementar protección de rutas React por autenticación y rol.
- [x] Validar manualmente la navegación con cuentas de cliente, taller y mecánico.

El sistema de citas permanece pendiente y no forma parte de la siguiente fase inmediata.

Criterio de funcionalidad terminada

Una funcionalidad solamente debe marcarse como terminada cuando:

El código está implementado.
Frontend y backend están conectados.
La base de datos funciona correctamente.
La funcionalidad fue probada.
No existen errores críticos conocidos.

No marcar una funcionalidad como terminada solamente porque exista el archivo o el código.

Actualización

Este documento debe actualizarse cada vez que una funcionalidad importante sea terminada y probada.
