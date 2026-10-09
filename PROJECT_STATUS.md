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

- [x] Dashboard del taller
- [x] Registro de taller desde el frontend
- [x] Integración de `POST /api/talleres`
- [x] Propiedad del taller obtenida exclusivamente del JWT
- [x] Redirección del registro hacia la configuración de horarios
- [x] Estado sin talleres enlazado al flujo de registro
- [ ] Perfil del taller
- [ ] Editar información
- [x] Gestión de citas
- [x] Gestión backend del horario semanal general
- [x] Consulta y reemplazo completo de horarios propios
- [x] Interfaz de configuración del horario semanal
- [x] Selección segura de talleres propios mediante `GET /api/talleres/mios`
- [x] Agregar, editar y eliminar múltiples bloques por día
- [x] Días cerrados y semana completamente vacía
- [x] Persistencia y recarga mediante `PUT` y `GET /api/talleres/:id/horarios`
- [x] Persistencia confirmada directamente en `horarios_taller`
- [x] Disponibilidad confirmada después de configurar un horario
- [x] Política de esta versión definida: un mecánico pertenece a un solo taller
- [x] Migración 002 del modelo de mecánicos preparada y validada en QA
- [x] Migración 002 aplicada y validada en `taller_mecanico`
- [x] Integridad de asociaciones, horarios y confirmación preparada en el esquema real
- [x] Listado de mecánicos asociados a talleres propios
- [x] Búsqueda segura de mecánico por correo exacto
- [x] Asociación de mecánico existente con propiedad tomada del JWT
- [x] Manejo transaccional y por `UNIQUE` de asociaciones duplicadas
- [x] Frontend de gestión inicial en `/taller/mecanicos`
- [x] Registro de nuevo mecánico desde el taller con rol `mecanico` forzado
- [x] Creación transaccional de cuenta y asociación inmediata al taller propio
- [x] Contraseña temporal establecida por el taller y login del mecánico validado
- [x] Protección frente a manipulación de rol, propietario, taller y estado
- [x] Formulario de registro integrado en `/taller/mecanicos`
- [x] Horarios individuales de mecánicos asociados
- [x] Propiedad del taller y asociación del mecánico validadas por JWT
- [x] Múltiples bloques, días sin horario, adyacencia y no superposición
- [x] Horario individual contenido dentro del horario general del taller
- [x] Persistencia en `horarios` y frontend de configuración individual
- [x] Desvinculación segura de mecánicos sin eliminar su cuenta
- [x] Bloqueo de desvinculación ante citas `pendiente` o `aceptada`
- [x] Historial y confirmación de citas canceladas/finalizadas conservados
- [x] Limpieza transaccional de horarios individuales al desvincular
- [x] Reasociación posterior sin heredar horarios del taller anterior
- [x] Acción de desvinculación integrada en `/taller/mecanicos`
- [x] Listado aislado de citas recibidas por taller
- [x] Candidatos asociados disponibles por horario y sin solapamiento
- [x] Asignación y reasignación transaccional de mecánicos
- [x] Reinicio de confirmación al cambiar de mecánico
- [x] Asignación idempotente al mismo mecánico
- [x] Frontend de citas del taller en `/taller/citas`
- [x] Listado aislado de citas asignadas al mecánico autenticado
- [x] Panel funcional del mecánico en `/mecanico`
- [x] Confirmación adicional de cita por el mecánico asignado
- [x] Confirmación idempotente con fecha original conservada
- [x] Protección transaccional frente a reasignaciones simultáneas
- [x] Confirmación visible desde el panel del taller
- [x] Gestión del estado general de citas por el taller
- [x] Transiciones controladas pendiente -> aceptada/cancelada y aceptada -> cancelada/finalizada
- [x] Finalización condicionada a mecánico asignado y confirmación adicional
- [x] Estado visual del cliente derivado de estado y confirmación sin mezclarlos
- [x] Categoría principal controlada en el registro y edición de talleres
- [x] Migración 003 aplicada con valor seguro para talleres existentes
- [x] Gestión de mecánicos
- [ ] Historial de servicios

El propietario puede consultar y reemplazar el horario semanal de cada uno de
sus talleres mediante `GET /api/talleres/:id/horarios` y
`PUT /api/talleres/:id/horarios`. Se permiten múltiples bloques y bloques
adyacentes por día; se rechazan duplicados, intervalos inválidos y
superposiciones. El reemplazo es transaccional, bloquea el taller y no afecta
horarios ajenos. El frontend permite seleccionar únicamente talleres devueltos
por el endpoint autenticado de talleres propios, representar los siete días,
administrar múltiples bloques y guardar una semana vacía. Después del PUT vuelve
a consultar el horario para confirmar visualmente la persistencia.

Las pruebas QA confirmaron la fila guardada en `horarios_taller`, el aislamiento
entre propietarios y la generación posterior de 7 slots de diagnóstico y 5 de
reparación para un bloque de lunes de 09:00 a 13:00. La validación visual final,
incluida la recarga con F5, queda pendiente de ejecución manual en un navegador.
Los talleres reales no recibieron horarios automáticos ni inventados.

El flujo de taller sin registros ahora permite registrar uno mediante
`POST /api/talleres`, sin enviar identificadores de propietario desde el
frontend. La API toma la propiedad del JWT y el nuevo taller aparece en
`GET /api/talleres/mios`; a continuación, la interfaz redirige a la configuración
de horarios. El flujo taller -> registrar -> configurar horario -> disponibilidad
fue validado con datos QA temporales y generó slots coherentes de 60/120 minutos.
La navegación visual y la persistencia de sesión con F5 quedan pendientes de una
comprobación manual porque el entorno de automatización no expuso un navegador.

Siguientes pendientes del módulo:

1. Capacidad simultánea basada en mecánicos disponibles.
2. Cambio y recuperación de contraseña.
3. Invitaciones seguras para nuevos mecánicos.

`horarios_taller` representa el horario general de apertura del establecimiento;
`horarios` representa la disponibilidad laboral individual de cada mecánico, y
`mecanicos_taller` representa su pertenencia a un taller. La disponibilidad de
citas actual continúa usando solamente `horarios_taller`. En una fase posterior,
una cita deberá estar dentro del horario general, contar con un mecánico
disponible y no entrar en conflicto con otra cita asignada. Para esta versión se
adoptó formalmente la política de un solo taller por mecánico: evita horarios
ambiguos, simplifica la autorización y coincide con que `horarios` depende solo
de `mecanico_id`.

La migración `002_modelo_mecanicos_y_confirmacion.sql` fue validada primero en
QA y después aplicada correctamente a la base real `taller_mecanico`, con el
respaldo previo
`backups/fix_go_mysql_pre_migracion_002_20260929_135726_UTC.sql`. Protege
`mecanicos_taller` contra asociaciones duplicadas y contra múltiples talleres
por mecánico, normaliza los días e intervalos de `horarios`, incorpora los
campos de confirmación adicional en `citas` y activa el índice compuesto para
sus futuras consultas. `backend/base_de_datos.sql` fue sincronizado y su
creación desde cero produjo un esquema equivalente al real en tablas, columnas,
tipos, nullabilidad, defaults, claves, índices, `UNIQUE`, FK y `CHECK`.

La regresión autenticada posterior validó registro, login, consulta y registro
de talleres, talleres propios, GET/PUT de horarios generales, disponibilidad y
creación/listado de citas. La primera fase funcional de mecánicos permite listar
los asociados a un taller propio, buscar exclusivamente por correo exacto y
asociar cuentas activas con rol `mecanico`. La API valida propiedad mediante el
JWT, no expone cuentas de otros roles ni el taller de una asociación ajena y
convierte las colisiones de la restricción `UNIQUE` en HTTP 409. El frontend
permite seleccionar exclusivamente talleres devueltos por `GET /api/talleres/mios`.

La segunda fase funcional permite que el propietario registre una cuenta nueva
desde `/taller/mecanicos`. `POST /api/talleres/:id/mecanicos/nuevo` valida el
taller mediante el JWT, normaliza los datos permitidos, fuerza el rol
`mecanico`, cifra una única contraseña temporal y crea usuario y asociación en
una sola transacción. Los identificadores, el rol y el estado enviados de forma
adicional no controlan la operación. Se validaron login, duplicados, concurrencia
y rollback sin cuentas huérfanas con datos QA eliminados al finalizar. La
interacción visual y F5 quedan pendientes de comprobación manual porque el
entorno de automatización no expuso un navegador.

La tercera fase funcional incorpora `GET` y `PUT` de horarios individuales para
un mecánico asociado a un taller propio. El reemplazo completo es transaccional,
acepta un arreglo vacío, rechaza duplicados, solapamientos e intervalos inválidos
y exige que cada bloque quede completamente contenido en un bloque del horario
general del taller. La interfaz protegida
`/taller/:tallerId/mecanicos/:mecanicoId/horarios` muestra los siete días, el
horario general como referencia y permite agregar, editar y eliminar bloques.
La persistencia y el aislamiento se validaron en API y MySQL con datos QA
eliminados al finalizar; la interacción visual y F5 quedan pendientes porque el
entorno de automatización no expuso un navegador.

La cuarta fase funcional incorpora la desvinculación transaccional mediante
`DELETE /api/talleres/:tallerId/mecanicos/:mecanicoId`. La operación bloquea el
taller propio, la asociación y las citas activas en ese orden; rechaza con 409
si existen citas `pendiente` o `aceptada`, elimina los horarios individuales y
la asociación, y conserva la cuenta y todas las citas históricas. Las citas
`cancelada` y `finalizada` mantienen `mecanico_id`, confirmación y fecha de
confirmación. Se validaron login posterior, reasociación a otro taller y horario
vacío tras reasociar. La confirmación visual queda pendiente porque el entorno
de automatización no expuso un navegador.

El bloque de citas del taller incorpora listado por propiedad, candidatos
asociados cuya jornada cubre completamente la cita y que no tienen otra cita
activa solapada, y asignación o reasignación transaccional. El cambio de
mecánico reinicia la confirmación; repetir el mismo mecánico es idempotente y
conserva su confirmación. Los bloqueos siguen el orden taller, asociación y cita,
serializando asignaciones concurrentes al mismo mecánico. La prueba simultánea
produjo una asignación 200 y un conflicto 409, sin solapamientos persistidos; la
carrera con desvinculación también terminó en un estado consistente. La interfaz
protegida `/taller/citas` quedó integrada; su validación visual queda pendiente
porque el entorno no expuso un navegador.

El panel del mecánico consulta exclusivamente las citas cuyo `mecanico_id`
coincide con `req.usuario.id` y muestra próximas e históricas. La confirmación
es adicional al estado general, idempotente, conserva su fecha original y exige
que el usuario siga activo, asociado al taller y asignado a una cita activa. La
prueba concurrente entre confirmación y reasignación terminó con el nuevo
mecánico y confirmación reiniciada, sin atribuirle la confirmación anterior. El
listado del taller refleja la confirmación. La validación visual y F5 quedan
pendientes de ejecución manual en navegador.

El cierre del flujo principal incorpora `PATCH /api/citas/:id/estado`, protegido
para el rol `taller` y aislado por la propiedad obtenida del JWT. Sólo permite
`pendiente -> aceptada`, `pendiente -> cancelada`, `aceptada -> cancelada` y
`aceptada -> finalizada`. Los estados `cancelada` y `finalizada` son terminales;
para finalizar se exige estado aceptado, mecánico asignado y
`confirmada_mecanico = 1`. La confirmación continúa siendo un dato separado y
el mecánico sólo puede confirmarla cuando el estado general es `aceptada`.

La vista del cliente ahora recibe `confirmada_mecanico` y presenta: Pendiente,
Aceptada - pendiente de confirmación, Confirmada, Cancelada o Finalizada. Los
estados terminales tienen prioridad visual aunque exista una confirmación
previa. La reasignación conserva el estado general y reinicia únicamente la
confirmación y su fecha.

La regresión HTTP de cierre creó y eliminó datos QA identificables y completó
22 verificaciones: registro y login, talleres, horarios generales, registro y
login de mecánicos, horarios individuales, disponibilidad, citas de cliente y
taller, asignación, panel del mecánico, confirmación, reasignación A -> B,
finalización, cancelación desde pendiente y aceptada, transiciones inválidas,
aislamiento por propietario, desvinculación y reasociación. También pasaron
`node --check`, ESLint, `npm run lint`, `npm run build` y `git diff --check`.
Queda pendiente una comprobación visual manual en navegador (incluido F5 y
consola) de las etiquetas y botones del flujo.

El flujo implementado es: cliente crea la cita, taller la acepta y asigna un
mecánico, el mecánico visualiza y confirma, taller y cliente ven la confirmación
y finalmente el taller marca la cita como finalizada. La confirmación es
información adicional y no sustituye el estado general; al cambiar el mecánico
asignado se reinician la confirmación y su fecha.

Los talleres incorporan una categoría principal validada mediante una lista
cerrada en backend y un `ENUM` equivalente en MySQL. La migración
`003_categoria_taller.sql` conserva las filas existentes mediante el valor
predeterminado `mecanica_general`. El formulario de registro usa un selector con
nombres amigables y envía el identificador interno; `POST`, `PUT`, el listado
público, el detalle y el listado de talleres propios incluyen la categoría.
Antes de aplicar la migración se creó el respaldo
`backups/fix_go_mysql_pre_migracion_003_20261008.sql`. Los tres talleres
existentes permanecieron intactos y recibieron la categoría predeterminada. La
regresión autenticada validó persistencia, consulta, actualización, HTTP 400
para una categoría inválida y HTTP 403 para un cliente que intentó registrar un
taller; los datos QA fueron eliminados al terminar.

## Mecánico

- [x] Dashboard del mecánico
- [ ] Servicios asignados
- [x] Consultar citas
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

`backend/base_de_datos.sql` fue sincronizado con el esquema posterior a la
migración 001; las instalaciones nuevas ya crean directamente el modelo actualizado.

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

## Categorias dinamicas de talleres - migracion 004

Estado: implementado y validado localmente el 2026-10-08.

- La fuente oficial de categorias de un taller es la relacion N:M `categorias` + `taller_categoria`.
- `talleres.categoria` se conserva temporalmente como campo legado y recibe el slug de la primera categoria seleccionada.
- La migracion `004_categorias_dinamicas.sql` agrega slug unico, estado activo, orden y timestamps al catalogo; tambien agrega unicidad a `(taller_id, categoria_id)`.
- El catalogo inicial contiene 10 categorias activas, ordenadas e insertadas idempotentemente.
- Los talleres existentes 1, 2 y 27 quedaron asociados con `mecanica_general`; el taller 49 con `autoelectrico`.
- `GET /api/categorias` es publico; POST, PUT y PATCH de estado requieren JWT y rol `administrador`.
- POST y PUT de talleres validan categorias activas y actualizan taller y asociaciones dentro de una transaccion.
- Los GET de talleres devuelven el arreglo `categorias` y el listado admite filtro por slug mediante `?categoria=`.
- Registro de taller, filtros del cliente, tarjetas y perfil consumen nombres y categorias dinamicas desde la API.
- QA automatizado: 16 verificaciones aprobadas, incluida la categoria temporal `Motos`, su filtro, desactivacion, preservacion historica y limpieza final.
- Respaldo previo: `fix_go_mysql_pre_migracion_004_20261008_203147.sql`, 23,115 bytes, SHA-256 `E18361886FF51DAA917F757B878C81A674715564EEE1ADCC6B2777FCC5FC7C09`.

Pendiente de una fase posterior: retirar el campo legado `talleres.categoria` cuando todos los consumidores dependan exclusivamente de la relacion N:M.

## Panel de administrador y gestion de categorias

Estado: implementado y validado localmente el 2026-10-09.

- `/admin` ahora presenta un dashboard visual con acceso funcional a Categorias y tarjetas informativas de Talleres y Usuarios marcadas como proximamente.
- `/admin/categorias` permite listar categorias activas e inactivas, crear, editar, activar y desactivar sin borrado fisico.
- Se agrego `GET /api/categorias/admin`, protegido por JWT y rol `administrador`; el GET publico conserva su comportamiento.
- El formulario propone un slug desde el nombre, permite editarlo y muestra los errores devueltos por el backend.
- La desactivacion requiere confirmacion y explica que se conservan las asociaciones historicas.
- La navegacion y ambas rutas React estan protegidas para el rol `administrador`.
- QA de API aprobado para alta, edicion, desactivacion, visibilidad publica, persistencia interna, token invalido y rechazo de cliente, taller y mecanico.
- La categoria QA `Motos` fue eliminada al finalizar.
- Talleres y Usuarios no incorporan acciones porque no existe soporte administrativo backend para esos modulos.

Pendiente: inspeccion visual manual en navegador para 390x844, 768x1024, 1280x720 y 1600x900.
