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
    -- Campo legado temporal; la fuente oficial es taller_categoria.
    `categoria` VARCHAR(100) NOT NULL DEFAULT 'mecanica_general',
    `descripcion` TEXT,
    `direccion` TEXT,
    `telefono` VARCHAR(20) DEFAULT NULL,
    `imagen` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `usuario_id` (`usuario_id`),
    CONSTRAINT `talleres_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Convencion de dia_semana:
-- 0 = domingo, 1 = lunes, 2 = martes, 3 = miercoles,
-- 4 = jueves, 5 = viernes, 6 = sabado.
-- Un taller puede tener varios bloques diferentes en el mismo dia.
CREATE TABLE IF NOT EXISTS `horarios_taller` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `taller_id` INT NOT NULL,
    `dia_semana` TINYINT UNSIGNED NOT NULL,
    `hora_inicio` TIME NOT NULL,
    `hora_fin` TIME NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_horarios_taller_bloque`
        (`taller_id`, `dia_semana`, `hora_inicio`, `hora_fin`),
    CONSTRAINT `horarios_taller_ibfk_1`
        FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `chk_horarios_taller_dia_semana`
        CHECK (`dia_semana` BETWEEN 0 AND 6),
    CONSTRAINT `chk_horarios_taller_intervalo`
        CHECK (`hora_inicio` < `hora_fin`)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `categorias` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `activo` TINYINT(1) NOT NULL DEFAULT 1,
    `orden` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
    ,UNIQUE KEY `uq_categorias_slug` (`slug`)
    ,CONSTRAINT `chk_categorias_activo` CHECK (`activo` IN (0, 1))
    ,CONSTRAINT `chk_categorias_orden` CHECK (`orden` BETWEEN 0 AND 100000)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `taller_categoria` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `taller_id` INT NOT NULL,
    `categoria_id` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `taller_id` (`taller_id`),
    KEY `categoria_id` (`categoria_id`),
    UNIQUE KEY `uq_taller_categoria` (`taller_id`, `categoria_id`),
    CONSTRAINT `taller_categoria_ibfk_1` FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `taller_categoria_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Politica de esta version: un mecanico solo puede pertenecer a un taller.
-- La clave compuesta tambien impide repetir exactamente una asociacion.
CREATE TABLE IF NOT EXISTS `mecanicos_taller` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `mecanico_id` INT NOT NULL,
    `taller_id` INT NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_mecanicos_taller_asociacion` (`mecanico_id`, `taller_id`),
    UNIQUE KEY `uq_mecanicos_taller_mecanico` (`mecanico_id`),
    KEY `taller_id` (`taller_id`),
    CONSTRAINT `mecanicos_taller_ibfk_1` FOREIGN KEY (`mecanico_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `mecanicos_taller_ibfk_2` FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Horario laboral individual del mecanico. Usa la misma convencion numerica
-- de dia_semana que horarios_taller.
CREATE TABLE IF NOT EXISTS `horarios` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `mecanico_id` INT NOT NULL,
    `dia_semana` TINYINT UNSIGNED NOT NULL,
    `hora_inicio` TIME NOT NULL,
    `hora_fin` TIME NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_horarios_mecanico_bloque`
        (`mecanico_id`, `dia_semana`, `hora_inicio`, `hora_fin`),
    CONSTRAINT `horarios_ibfk_1` FOREIGN KEY (`mecanico_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `chk_horarios_dia_semana`
        CHECK (`dia_semana` BETWEEN 0 AND 6),
    CONSTRAINT `chk_horarios_intervalo`
        CHECK (`hora_inicio` < `hora_fin`)
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
    `tipo_cita` ENUM('diagnostico','reparacion') NOT NULL DEFAULT 'diagnostico',
    `descripcion_falla` TEXT NULL,
    `duracion_minutos` INT NOT NULL DEFAULT 60,
    `estado` ENUM('pendiente','aceptada','cancelada','finalizada') DEFAULT 'pendiente',
    `confirmada_mecanico` TINYINT(1) NOT NULL DEFAULT 0,
    `fecha_confirmacion_mecanico` DATETIME NULL,
    PRIMARY KEY (`id`),
    KEY `cliente_id` (`cliente_id`),
    KEY `idx_citas_mecanico_estado_fecha` (`mecanico_id`, `estado`, `fecha`),
    KEY `idx_citas_taller_estado_fecha` (`taller_id`, `estado`, `fecha`),
    KEY `idx_citas_vehiculo_estado_fecha` (`vehiculo_id`, `estado`, `fecha`),
    CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `citas_ibfk_3` FOREIGN KEY (`taller_id`) REFERENCES `talleres` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `citas_ibfk_4` FOREIGN KEY (`mecanico_id`) REFERENCES `usuarios` (`id`)
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT `chk_citas_duracion_minutos`
        CHECK (`duracion_minutos` BETWEEN 1 AND 1440),
    CONSTRAINT `chk_citas_confirmada_mecanico`
        CHECK (`confirmada_mecanico` IN (0, 1)),
    CONSTRAINT `chk_citas_fecha_confirmacion_mecanico`
        CHECK (
            `confirmada_mecanico` = 0
            OR `fecha_confirmacion_mecanico` IS NOT NULL
        )
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
