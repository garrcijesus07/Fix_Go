DROP DATABASE IF EXISTS taller_mecanico;
CREATE DATABASE taller_mecanico;
USE taller_mecanico;

-- =========================
-- USUARIOS
-- =========================

CREATE TABLE usuarios (
id INT AUTO_INCREMENT PRIMARY KEY,
nombre VARCHAR(100) NOT NULL,
correo VARCHAR(100) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
rol ENUM(
'administrador',
'cliente',
'taller',
'mecanico'
) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TALLERES
-- =========================

CREATE TABLE talleres (
id INT AUTO_INCREMENT PRIMARY KEY,
usuario_id INT NOT NULL,
nombre VARCHAR(100) NOT NULL,
descripcion TEXT,
direccion VARCHAR(255),
telefono VARCHAR(20),
imagen VARCHAR(255),

```
FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
```

);

-- =========================
-- CATEGORIAS
-- =========================

CREATE TABLE categorias (
id INT AUTO_INCREMENT PRIMARY KEY,
nombre VARCHAR(100) NOT NULL
);

CREATE TABLE taller_categoria (
taller_id INT,
categoria_id INT,

```
PRIMARY KEY (
    taller_id,
    categoria_id
),

FOREIGN KEY (taller_id)
    REFERENCES talleres(id)
    ON DELETE CASCADE,

FOREIGN KEY (categoria_id)
    REFERENCES categorias(id)
    ON DELETE CASCADE
```

);

-- =========================
-- MECANICOS
-- =========================

CREATE TABLE mecanicos_taller (
id INT AUTO_INCREMENT PRIMARY KEY,

```
mecanico_id INT NOT NULL,

taller_id INT NOT NULL,

FOREIGN KEY (mecanico_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE,

FOREIGN KEY (taller_id)
    REFERENCES talleres(id)
    ON DELETE CASCADE
```

);

-- =========================
-- HORARIOS
-- =========================

CREATE TABLE horarios (
id INT AUTO_INCREMENT PRIMARY KEY,

```
mecanico_id INT NOT NULL,

dia_semana VARCHAR(20),

hora_inicio TIME,

hora_fin TIME,

FOREIGN KEY (mecanico_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
```

);

-- =========================
-- CLIENTES AFILIADOS
-- =========================

CREATE TABLE afiliaciones (
id INT AUTO_INCREMENT PRIMARY KEY,

```
cliente_id INT NOT NULL,

taller_id INT NOT NULL,

FOREIGN KEY (cliente_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE,

FOREIGN KEY (taller_id)
    REFERENCES talleres(id)
    ON DELETE CASCADE
```

);

-- =========================
-- VEHICULOS
-- =========================

CREATE TABLE vehiculos (
id INT AUTO_INCREMENT PRIMARY KEY,

```
cliente_id INT NOT NULL,

marca VARCHAR(50),

modelo VARCHAR(50),

anio INT,

placas VARCHAR(20),

color VARCHAR(30),

FOREIGN KEY (cliente_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
```

);

-- =========================
-- CITAS
-- =========================

CREATE TABLE citas (
id INT AUTO_INCREMENT PRIMARY KEY,

```
vehiculo_id INT NOT NULL,

taller_id INT NOT NULL,

mecanico_id INT,

fecha DATE,

hora TIME,

estado ENUM(
    'pendiente',
    'aceptada',
    'en_proceso',
    'terminada',
    'cancelada'
) DEFAULT 'pendiente',

FOREIGN KEY (vehiculo_id)
    REFERENCES vehiculos(id)
    ON DELETE CASCADE,

FOREIGN KEY (taller_id)
    REFERENCES talleres(id)
    ON DELETE CASCADE,

FOREIGN KEY (mecanico_id)
    REFERENCES usuarios(id)
    ON DELETE SET NULL
```

);

-- =========================
-- ESTADOS VEHICULO
-- =========================

CREATE TABLE estados_vehiculo (
id INT AUTO_INCREMENT PRIMARY KEY,

```
nombre VARCHAR(100)
```

);

-- =========================
-- HISTORIAL
-- =========================

CREATE TABLE historial_vehiculo (
id INT AUTO_INCREMENT PRIMARY KEY,

```
vehiculo_id INT NOT NULL,

estado_id INT NOT NULL,

comentario TEXT,

fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (vehiculo_id)
    REFERENCES vehiculos(id)
    ON DELETE CASCADE,

FOREIGN KEY (estado_id)
    REFERENCES estados_vehiculo(id)
```

);

-- =========================
-- EVIDENCIAS
-- =========================

CREATE TABLE evidencias (
id INT AUTO_INCREMENT PRIMARY KEY,

```
historial_id INT NOT NULL,

imagen VARCHAR(255),

descripcion TEXT,

FOREIGN KEY (historial_id)
    REFERENCES historial_vehiculo(id)
    ON DELETE CASCADE
```

);

-- =========================
-- RESEÑAS
-- =========================

CREATE TABLE resenas (
id INT AUTO_INCREMENT PRIMARY KEY,

```
cliente_id INT NOT NULL,

taller_id INT NOT NULL,

calificacion INT CHECK (
    calificacion >= 1
    AND calificacion <= 5
),

comentario TEXT,

fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (cliente_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE,

FOREIGN KEY (taller_id)
    REFERENCES talleres(id)
    ON DELETE CASCADE
```

);

-- =========================
-- FORO
-- =========================

CREATE TABLE foro_publicaciones (
id INT AUTO_INCREMENT PRIMARY KEY,

```
usuario_id INT NOT NULL,

titulo VARCHAR(255),

contenido TEXT,

fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
```

);

CREATE TABLE foro_comentarios (
id INT AUTO_INCREMENT PRIMARY KEY,

```
publicacion_id INT NOT NULL,

usuario_id INT NOT NULL,

comentario TEXT,

fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (publicacion_id)
    REFERENCES foro_publicaciones(id)
    ON DELETE CASCADE,

FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
```

);

-- =========================
-- DATOS INICIALES
-- =========================

INSERT INTO categorias(nombre)
VALUES
('Mecánica General'),
('Frenos'),
('Suspensión'),
('Alineación y Balanceo'),
('Autoeléctrico');

INSERT INTO estados_vehiculo(nombre)
VALUES
('Recibido'),
('Diagnóstico'),
('En reparación'),
('Esperando refacciones'),
('Listo para entrega'),
('Entregado');
