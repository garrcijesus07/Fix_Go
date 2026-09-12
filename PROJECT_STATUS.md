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

- [x] Crear cita mediante `POST /api/citas`
- [x] Consultar citas propias mediante `GET /api/citas/mias`
- [x] Diseño ampliado de citas definido
- [x] Migración `001_expandir_citas_y_horarios_taller.sql` preparada y probada en QA
- [x] Migración 001 aplicada y validada en `taller_mecanico`
- [x] Columnas de tipo, descripción y duración activas en la base real
- [x] `POST /api/citas` adaptado al modelo ampliado
- [x] Tipos `diagnostico` y `reparacion` validados por el backend
- [x] Duraciones de 60/120 minutos determinadas por el backend
- [x] Conflictos por intervalos de taller y vehículo validados
- [x] Creación transaccional con bloqueo de taller y vehículo
- [x] `GET /api/citas/disponibilidad` implementado y validado
- [x] Slots backend de 30 minutos según horario, tipo y citas activas
- [ ] Cancelar cita
- [ ] Modificar cita
- [ ] Validar horarios

La creación está restringida al rol `cliente`. `cliente_id` se obtiene del
JWT, el vehículo debe pertenecer al usuario autenticado, el taller debe existir
y la fecha debe ser válida y futura. Las citas se crean en estado `pendiente`
con `mecanico_id` en `NULL`. El backend acepta `diagnostico` y `reparacion`,
asigna respectivamente 60 y 120 minutos, y exige una descripción de hasta
2,000 caracteres para reparación. Los campos de identidad, estado, mecánico y
duración enviados por el cliente se ignoran.

Los conflictos activos se validan por solapamiento real de intervalos tanto
para el taller como para el vehículo. La creación usa una transacción y bloquea
primero el taller y después el vehículo para reducir condiciones de carrera.
Una prueba concurrente produjo una creación `201` y un conflicto `409`, con una
sola cita activa. La capacidad temporal es una cita simultánea por taller.

La disponibilidad backend consulta `horarios_taller`, genera candidatos cada
30 minutos y aplica las duraciones de 60/120 minutos según el tipo. Las citas
`pendiente` y `aceptada` eliminan slots mediante solapamiento real;
`cancelada` y `finalizada` no bloquean. Un día sin horario devuelve un arreglo
vacío y no se asume disponibilidad ilimitada. El cálculo informativo fue
validado junto con `POST /api/citas`: el POST revalida dentro de su transacción
y continúa siendo la autoridad final de la reserva. La integración de estos
slots en el frontend aún está pendiente.

El listado está restringido al rol `cliente` y filtra exclusivamente por el
ID obtenido del JWT. Devuelve datos de la cita, taller y vehículo ordenados por
fecha ascendente. El aislamiento entre dos clientes, los intentos de enviar un
`cliente_id` ajeno y la respuesta `200 []` para clientes sin citas fueron
validados con datos QA temporales, eliminados al terminar.

El diseño ampliado contempla `tipo_cita`, `descripcion_falla`,
`duracion_minutos` y la nueva tabla `horarios_taller`. La migración incremental
fue probada primero en QA y después aplicada correctamente a `taller_mecanico`,
con respaldo previo disponible en
`backups/fix_go_mysql_pre_migracion_001_20260912_221500_UTC.sql`. El backfill
asignó `diagnostico` y 60 minutos a las citas anteriores; `horarios_taller`
quedó creada y vacía, sin inventar disponibilidad para talleres existentes.

Los índices compuestos `idx_citas_taller_estado_fecha` e
`idx_citas_vehiculo_estado_fecha` están activos. InnoDB sustituyó los índices
simples redundantes de `taller_id` y `vehiculo_id`: las mismas columnas son el
prefijo izquierdo de los índices compuestos, las foreign keys permanecen
válidas y `EXPLAIN` confirma su uso. No es necesario recrear los índices
simples. El `POST /api/citas` anterior fue validado de forma autenticada y
continúa funcionando mediante los defaults. La lógica avanzada de tipo,
duración, horarios y disponibilidad aún está pendiente.

### Perfil

- [ ] Perfil del cliente
- [ ] Editar información
- [ ] Cambiar contraseña

## Taller

- [ ] Dashboard del taller
- [ ] Perfil del taller
- [ ] Editar información
- [ ] Gestión de citas
- [x] Gestión backend del horario semanal general
- [x] Consulta y reemplazo completo de horarios propios
- [ ] Gestión de mecánicos
- [ ] Historial de servicios

El propietario puede consultar y reemplazar el horario semanal de cada uno de
sus talleres mediante `GET /api/talleres/:id/horarios` y
`PUT /api/talleres/:id/horarios`. Se permiten múltiples bloques y bloques
adyacentes por día; se rechazan duplicados, intervalos inválidos y
superposiciones. El reemplazo es transaccional, bloquea el taller y no afecta
horarios ajenos. `horarios_taller` ya está preparada para el futuro cálculo de
disponibilidad, que todavía no está implementado.

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
 [x] Crear cita (probado)
 [x] Obtener citas propias del cliente (probado)
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
- [x] Preparar y validar en QA la primera migración incremental del módulo de citas.
- [x] Aplicar y validar la migración 001 de citas en la base real con respaldo previo.
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
