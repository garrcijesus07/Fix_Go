Repositorio: 
https://github.com/garrcijesus07/Fix_Go.git


---

## `AGENTS.md`

```markdown
# AGENTS.md

# Instrucciones para Codex - Fix_Go

## Contexto

Fix_Go es una plataforma web para la gestión de talleres mecánicos.

Tecnologías principales:

- React
- Vite
- React Router
- Axios
- Node.js
- Express
- MySQL
- JWT
- Docker

El proyecto continúa en desarrollo.

## Regla principal

Antes de modificar cualquier archivo:

1. Analizar la estructura actual del proyecto.
2. Revisar los archivos relacionados con la tarea.
3. Revisar las rutas existentes.
4. Revisar los controladores existentes.
5. Revisar la base de datos cuando corresponda.
6. Revisar Docker cuando la tarea involucre MySQL.
7. Identificar dependencias entre archivos.

El código existente del repositorio es la fuente principal de verdad.

No asumir que una funcionalidad existe si no se encuentra en el código.

## No romper funcionalidades existentes

No eliminar funcionalidades que ya funcionan.

No realizar refactorizaciones generales si no son necesarias.

Realizar cambios pequeños y específicos.

Antes de realizar cambios importantes, identificar:

- archivos afectados;
- funcionalidad afectada;
- dependencias;
- posibles riesgos.

## Frontend

El frontend se encuentra en:

```text
frontend/

Páginas:

frontend/src/pages/

Componentes:

frontend/src/components/

Servicios:

frontend/src/services/

Estilos:

frontend/src/styles/
CSS

Los estilos deben mantenerse separados del JSX.

Preferir:

Login.jsx
Login.css

No colocar grandes bloques de CSS directamente dentro de los componentes.

Mantener consistencia visual entre las páginas.

React Router

Antes de crear o modificar rutas:

Revisar App.jsx.
Revisar las rutas existentes.
Verificar si la ruta ya existe.
Revisar los enlaces que utilizan dicha ruta.

No crear rutas duplicadas.

No eliminar enlaces existentes sin autorización.

Backend

El backend se encuentra en:

backend/

Rutas:

backend/routes/

Controladores:

backend/controllers/

Middleware:

backend/middleware/

Configuración:

backend/config/

Antes de crear un endpoint:

Revisar si ya existe.
Revisar la ruta.
Revisar el controlador.
Revisar la tabla correspondiente.

No crear endpoints duplicados.

Autenticación

La aplicación utiliza JWT.

Los endpoints protegidos utilizan el middleware de autenticación existente.

El token utiliza:

Authorization: Bearer <token>

El usuario autenticado se obtiene mediante:

req.usuario

Cuando corresponda, utilizar el ID del usuario autenticado en lugar de confiar en un ID enviado desde el frontend.

Roles

Los roles actuales son:

administrador
taller
mecanico
cliente

No crear nuevos roles sin autorización.

Las funcionalidades deben respetar el rol del usuario.

Base de datos

MySQL se ejecuta mediante Docker.

Antes de modificar la conexión revisar:

docker-compose.yml
backend/.env
backend/config/db.js

El script principal de la base de datos es:

backend/base_de_datos.sql

No eliminar tablas o columnas sin autorización.

No cambiar nombres de columnas sin revisar todas sus referencias.

Docker

No realizar acciones destructivas sin autorización.

No ejecutar:

docker compose down -v

sin confirmar primero que no se perderán datos.

No eliminar volúmenes ni bases de datos sin autorización.

Seguridad

Nunca:

subir archivos .env;
colocar contraseñas directamente en el código;
colocar JWT secrets directamente en el código;
subir credenciales a GitHub.

Utilizar variables de entorno.

Dependencias

No instalar librerías nuevas sin necesidad.

Antes de instalar una dependencia:

Revisar si ya existe una solución en el proyecto.
Explicar por qué es necesaria.
Utilizar la solución más sencilla cuando sea posible.
Manejo de errores

Cuando exista un error, identificar:

archivo;
función;
endpoint;
código HTTP;
mensaje;
causa probable.

No ocultar errores importantes.

Pruebas

Después de realizar cambios:

Ejecutar backend.
Ejecutar frontend.
Probar la funcionalidad.
Revisar consola del navegador.
Revisar consola del backend.
Revisar respuestas HTTP.
Revisar MySQL cuando corresponda.

La prueba debe validar:

Frontend
   ↓
API
   ↓
Backend
   ↓
Base de datos
Forma de trabajo

Cuando se solicite una nueva funcionalidad:

Analizar primero el proyecto.
Identificar archivos relacionados.
Revisar dependencias.
Realizar los cambios.
Probar la funcionalidad.
Informar los archivos modificados.
Informar las pruebas realizadas.
No inventar información

No inventar:

endpoints;
tablas;
columnas;
rutas;
relaciones;
credenciales;
archivos;
funcionalidades.

Si algo no está claro, revisar primero el repositorio.

Prioridad actual

La prioridad general de desarrollo es:

Infraestructura.
Base de datos.
Backend.
Autenticación.
Cliente.
Vehículos.
Talleres.
Citas.
Mecánicos.
Administrador.
Reseñas.
Foro.
Historial.
Pruebas.
Seguridad.
Preparación para producción.
Regla final

El objetivo es continuar el desarrollo del proyecto existente sin romper las funcionalidades actuales.

Comprender primero cómo funciona el código.

Realizar cambios pequeños, controlados y comprobables.