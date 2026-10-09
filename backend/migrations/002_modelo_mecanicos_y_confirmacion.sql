-- Migracion 002: preparar el modelo de mecanicos y su confirmacion de citas.
-- Politica de esta version: un mecanico solo puede pertenecer a un taller.
--
-- Precondiciones verificadas antes de preparar esta migracion:
-- - mecanicos_taller no contiene asociaciones ni duplicados.
-- - horarios no contiene filas que requieran backfill de dia_semana u horas.
-- - las citas existentes no tienen mecanico asignado.
--
-- Diseñada para ejecutarse exactamente una vez sobre el esquema posterior a
-- la migracion 001. No crea asociaciones, horarios ni asignaciones de citas.

ALTER TABLE `mecanicos_taller`
    DROP INDEX `mecanico_id`,
    ADD CONSTRAINT `uq_mecanicos_taller_asociacion`
        UNIQUE (`mecanico_id`, `taller_id`),
    ADD CONSTRAINT `uq_mecanicos_taller_mecanico`
        UNIQUE (`mecanico_id`);

-- Convencion de dia_semana:
-- 0 = domingo, 1 = lunes, 2 = martes, 3 = miercoles,
-- 4 = jueves, 5 = viernes, 6 = sabado.
ALTER TABLE `horarios`
    DROP INDEX `mecanico_id`,
    MODIFY COLUMN `dia_semana` TINYINT UNSIGNED NOT NULL,
    MODIFY COLUMN `hora_inicio` TIME NOT NULL,
    MODIFY COLUMN `hora_fin` TIME NOT NULL,
    ADD CONSTRAINT `uq_horarios_mecanico_bloque`
        UNIQUE (`mecanico_id`, `dia_semana`, `hora_inicio`, `hora_fin`),
    ADD CONSTRAINT `chk_horarios_dia_semana`
        CHECK (`dia_semana` BETWEEN 0 AND 6),
    ADD CONSTRAINT `chk_horarios_intervalo`
        CHECK (`hora_inicio` < `hora_fin`);

ALTER TABLE `citas`
    DROP INDEX `mecanico_id`,
    ADD COLUMN `confirmada_mecanico`
        TINYINT(1) NOT NULL DEFAULT 0 AFTER `estado`,
    ADD COLUMN `fecha_confirmacion_mecanico`
        DATETIME NULL AFTER `confirmada_mecanico`,
    ADD CONSTRAINT `chk_citas_confirmada_mecanico`
        CHECK (`confirmada_mecanico` IN (0, 1)),
    ADD CONSTRAINT `chk_citas_fecha_confirmacion_mecanico`
        CHECK (
            `confirmada_mecanico` = 0
            OR `fecha_confirmacion_mecanico` IS NOT NULL
        ),
    ADD KEY `idx_citas_mecanico_estado_fecha`
        (`mecanico_id`, `estado`, `fecha`);
