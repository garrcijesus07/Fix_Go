-- Migracion 001: ampliar citas y agregar horarios generales de taller.
-- Diseñada para ejecutarse exactamente una vez sobre el esquema actual.
-- No carga horarios automaticamente: los talleres existentes quedan sin
-- disponibilidad configurada hasta que se registren sus bloques de atención.

ALTER TABLE `citas`
    ADD COLUMN `tipo_cita` ENUM('diagnostico','reparacion') NULL AFTER `fecha`,
    ADD COLUMN `descripcion_falla` TEXT NULL AFTER `tipo_cita`,
    ADD COLUMN `duracion_minutos` INT NULL AFTER `descripcion_falla`;

UPDATE `citas`
SET `tipo_cita` = 'diagnostico'
WHERE `tipo_cita` IS NULL;

UPDATE `citas`
SET `duracion_minutos` = 60
WHERE `duracion_minutos` IS NULL;

ALTER TABLE `citas`
    MODIFY COLUMN `tipo_cita`
        ENUM('diagnostico','reparacion') NOT NULL DEFAULT 'diagnostico',
    MODIFY COLUMN `duracion_minutos`
        INT NOT NULL DEFAULT 60,
    ADD CONSTRAINT `chk_citas_duracion_minutos`
        CHECK (`duracion_minutos` BETWEEN 1 AND 1440),
    ADD KEY `idx_citas_taller_estado_fecha`
        (`taller_id`, `estado`, `fecha`),
    ADD KEY `idx_citas_vehiculo_estado_fecha`
        (`vehiculo_id`, `estado`, `fecha`);

-- Convencion de dia_semana:
-- 0 = domingo, 1 = lunes, 2 = martes, 3 = miercoles,
-- 4 = jueves, 5 = viernes, 6 = sabado.
-- Un taller puede tener varios bloques diferentes en el mismo dia.
CREATE TABLE `horarios_taller` (
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
) ENGINE=InnoDB
  DEFAULT CHARACTER SET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
