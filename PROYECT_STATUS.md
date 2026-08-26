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
- [ ] Editar vehículo
- [ ] Eliminar vehículo

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
 Obtener vehículos
 Registrar vehículo
 Actualizar vehículo
 Eliminar vehículo
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
Sistema de Citas

Debe permitir:

Seleccionar taller.
Seleccionar vehículo.
Seleccionar fecha.
Seleccionar horario.
Crear cita.
Consultar citas.
Cancelar cita.
Permitir al taller consultar las citas.
Actualizar el estado de la cita.

Antes de implementar el sistema de citas se debe revisar la estructura actual de la base de datos.

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