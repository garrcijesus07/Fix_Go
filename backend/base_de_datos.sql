-- Fix_Go - esquema de inicialización
-- Refleja el esquema real inspeccionado en MySQL.
-- No sustituye a un sistema de migraciones ni debe usarse para sincronizar
-- automáticamente bases existentes. IF NOT EXISTS no altera tablas creadas.

CREATE DATABASE IF NOT EXISTS `taller_mecanico`
    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `taller_mecanico`;

CREATE TABLE IF NOT EXISTS `usuarios` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `correo` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `rol` ENUM('administrador','taller','mecanico','cliente') NOT NULL,
    `telefono` VARCHAR(20) DEFAULT NULL,
    `activo` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `talleres` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `usuario_id` INT NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` TEXT,
    `direccion` TEXT,
    `telefono` VARCHAR(20) DEFAULT NULL,
    `imagen` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `usuario_id` (`usuario_id`),
    CONSTRAINT `talleres_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `categorias` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `taller_categoria` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `taller_id` INT NOT NULL,
    `categoria_id` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `taller_id` (`taller_id`),
    KEY `categoria_id` (`categoria_id`),
    CONSTRAINT `taller_categoria_ibfk_1` FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `taller_categoria_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `mecanicos_taller` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `mecanico_id` INT NOT NULL,
    `taller_id` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `mecanico_id` (`mecanico_id`),
    KEY `taller_id` (`taller_id`),
    CONSTRAINT `mecanicos_taller_ibfk_1` FOREIGN KEY (`mecanico_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `mecanicos_taller_ibfk_2` FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `horarios` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `mecanico_id` INT NOT NULL,
    `dia_semana` VARCHAR(20) DEFAULT NULL,
    `hora_inicio` TIME DEFAULT NULL,
    `hora_fin` TIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `mecanico_id` (`mecanico_id`),
    CONSTRAINT `horarios_ibfk_1` FOREIGN KEY (`mecanico_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `afiliaciones` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `cliente_id` INT NOT NULL,
    `taller_id` INT NOT NULL,
    `fecha_afiliacion` DATE DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `cliente_id` (`cliente_id`),
    KEY `taller_id` (`taller_id`),
    CONSTRAINT `afiliaciones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `afiliaciones_ibfk_2` FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `vehiculos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `cliente_id` INT NOT NULL,
    `marca` VARCHAR(50) DEFAULT NULL,
    `modelo` VARCHAR(50) DEFAULT NULL,
    `anio` INT DEFAULT NULL,
    `placas` VARCHAR(20) DEFAULT NULL,
    `color` VARCHAR(30) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `cliente_id` (`cliente_id`),
    CONSTRAINT `vehiculos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `citas` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `cliente_id` INT NOT NULL,
    `vehiculo_id` INT NOT NULL,
    `taller_id` INT NOT NULL,
    `mecanico_id` INT DEFAULT NULL,
    `fecha` DATETIME NOT NULL,
    `estado` ENUM('pendiente','aceptada','cancelada','finalizada') DEFAULT 'pendiente',
    PRIMARY KEY (`id`),
    KEY `cliente_id` (`cliente_id`),
    KEY `vehiculo_id` (`vehiculo_id`),
    KEY `taller_id` (`taller_id`),
    KEY `mecanico_id` (`mecanico_id`),
    CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `citas_ibfk_3` FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `citas_ibfk_4` FOREIGN KEY (`mecanico_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `estados_vehiculo` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `historial_vehiculo` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `vehiculo_id` INT NOT NULL,
    `mecanico_id` INT NOT NULL,
    `estado_id` INT NOT NULL,
    `comentario` TEXT,
    `fecha` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `vehiculo_id` (`vehiculo_id`),
    KEY `mecanico_id` (`mecanico_id`),
    KEY `estado_id` (`estado_id`),
    CONSTRAINT `historial_vehiculo_ibfk_1` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `historial_vehiculo_ibfk_2` FOREIGN KEY (`mecanico_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `historial_vehiculo_ibfk_3` FOREIGN KEY (`estado_id`) REFERENCES `estados_vehiculo` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `evidencias` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `historial_id` INT NOT NULL,
    `imagen` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `historial_id` (`historial_id`),
    CONSTRAINT `evidencias_ibfk_1` FOREIGN KEY (`historial_id`) REFERENCES `historial_vehiculo` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `resenas` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `cliente_id` INT NOT NULL,
    `taller_id` INT NOT NULL,
    `calificacion` INT DEFAULT NULL,
    `comentario` TEXT,
    `fecha` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `cliente_id` (`cliente_id`),
    KEY `taller_id` (`taller_id`),
    CONSTRAINT `resenas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `resenas_ibfk_2` FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `resenas_chk_1` CHECK (`calificacion` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `foro_publicaciones` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `usuario_id` INT NOT NULL,
    `titulo` VARCHAR(255) DEFAULT NULL,
    `contenido` TEXT,
    `fecha` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `usuario_id` (`usuario_id`),
    CONSTRAINT `foro_publicaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `foro_comentarios` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `publicacion_id` INT NOT NULL,
    `usuario_id` INT NOT NULL,
    `comentario` TEXT,
    `fecha` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `publicacion_id` (`publicacion_id`),
    KEY `usuario_id` (`usuario_id`),
    CONSTRAINT `foro_comentarios_ibfk_1` FOREIGN KEY (`publicacion_id`) REFERENCES `foro_publicaciones` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `foro_comentarios_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- No se insertan datos iniciales automáticamente. categorias y
-- estados_vehiculo están vacías en la base real inspeccionada. Sus catálogos
-- deberán definirse mediante una migración o carga explícita posterior.
