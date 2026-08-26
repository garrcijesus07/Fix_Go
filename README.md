# Fix_Go

## Plataforma Web para la Gestión de Talleres Mecánicos

Fix_Go es una plataforma web desarrollada para facilitar la interacción entre clientes y talleres mecánicos, permitiendo gestionar información de talleres, vehículos, usuarios y, posteriormente, servicios relacionados con citas y mantenimiento automotriz.

El proyecto se encuentra actualmente en desarrollo y cuenta con una Proof of Concept funcional que demuestra la integración entre frontend, backend y base de datos.

---

# 1. Objetivo del proyecto

El objetivo de Fix_Go es desarrollar una plataforma que permita centralizar la gestión de servicios relacionados con talleres mecánicos.

La plataforma contempla diferentes tipos de usuarios:

- Administrador
- Taller
- Mecánico
- Cliente

Cada usuario tendrá diferentes funcionalidades y permisos dependiendo de su rol.

---

# 2. Arquitectura

El proyecto utiliza una arquitectura cliente-servidor:

```text
                    FIX_GO

              ┌─────────────────┐
              │    FRONTEND     │
              │ React + Vite    │
              └────────┬────────┘
                       │
                    Axios
                       │
                       ▼
              ┌─────────────────┐
              │     BACKEND     │
              │ Node + Express  │
              └────────┬────────┘
                       │
                    mysql2
                       │
                       ▼
              ┌─────────────────┐
              │    MySQL        │
              │    Docker       │
              └─────────────────┘
Roles

El sistema contempla los siguientes roles:

Administrador
Taller
Mecánico
Cliente

Funcionalidades actuales:

Registro de usuarios.
Inicio de sesión.
Autenticación mediante JWT.
Manejo de roles.
Dashboard del cliente.
Consulta de talleres.
Perfil de taller.
Consulta de vehículos.
Registro de vehículos.
API REST.
Persistencia de información en MySQL.
Base de datos ejecutándose mediante Docker.
Interfaz web desarrollada con React.
Proof of Concept

La Proof of Concept demuestra el siguiente flujo:

Registro
   ↓
Login
   ↓
Autenticación JWT
   ↓
Dashboard Cliente
   ↓
Consulta de Talleres
   ↓
Perfil del Taller
   ↓
Mis Vehículos
   ↓
Registrar Vehículo
   ↓
Persistencia en MySQL
Estructura general
Fix_Go/
│
├── README.md
├── AGENTS.md
├── PROJECT_STATUS.md
│
├── backend/
│
├── frontend/
│
└── docker-compose.yml

Ejecución
Backend
cd backend
npm install
npm run dev
Frontend
cd frontend
npm install
npm run dev
Docker
docker compose up -d

Comprobar contenedores:

docker ps

Detener contenedores:

docker compose down

No utilizar docker compose down -v sin confirmar previamente que no se perderán datos.

Base de datos

El script de la base de datos se encuentra en:

backend/base_de_datos.sql

La conexión depende de la configuración de Docker y de las variables de entorno utilizadas por el backend.

Variables de entorno

Las credenciales y secretos deben mantenerse en archivos .env.

Ejemplo:

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=

No subir archivos .env al repositorio.

Funcionalidades pendientes
Sistema de citas.
Gestión de horarios.
Panel de administrador.
Panel de taller.
Panel de mecánico.
Gestión de mecánicos.
Reseñas y calificaciones.
Foro.
Historial de mantenimiento.
Evidencias de reparaciones.
Pruebas integrales.
Mejoras de seguridad.
Preparación para producción.