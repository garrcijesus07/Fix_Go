-- Migracion 004: catalogo dinamico y relacion N:M de categorias de taller.
-- talleres.categoria se conserva como campo legado temporal, pero se convierte
-- a VARCHAR para poder reflejar slugs creados despues de esta migracion.

ALTER TABLE `categorias`
    ADD COLUMN `slug` VARCHAR(100) NULL AFTER `nombre`,
    ADD COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 AFTER `slug`,
    ADD COLUMN `orden` INT NOT NULL DEFAULT 0 AFTER `activo`,
    ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `orden`,
    ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Compatibilidad con posibles filas antiguas creadas antes de esta migracion.
UPDATE `categorias`
SET `slug` = CONCAT('categoria_', `id`)
WHERE `slug` IS NULL OR TRIM(`slug`) = '';

ALTER TABLE `categorias`
    MODIFY COLUMN `slug` VARCHAR(100) NOT NULL,
    ADD UNIQUE KEY `uq_categorias_slug` (`slug`),
    ADD CONSTRAINT `chk_categorias_activo` CHECK (`activo` IN (0, 1)),
    ADD CONSTRAINT `chk_categorias_orden` CHECK (`orden` BETWEEN 0 AND 100000);

ALTER TABLE `taller_categoria`
    ADD UNIQUE KEY `uq_taller_categoria` (`taller_id`, `categoria_id`);

ALTER TABLE `talleres`
    MODIFY COLUMN `categoria` VARCHAR(100) NOT NULL DEFAULT 'mecanica_general';

INSERT INTO `categorias` (`nombre`, `slug`, `activo`, `orden`) VALUES
    ('Mecánica general', 'mecanica_general', 1, 1),
    ('Autoeléctrico', 'autoelectrico', 1, 2),
    ('Frenos', 'frenos', 1, 3),
    ('Suspensión', 'suspension', 1, 4),
    ('Diagnóstico', 'diagnostico', 1, 5),
    ('Alineación y balanceo', 'alineacion_balanceo', 1, 6),
    ('Hojalatería y pintura', 'hojalateria_pintura', 1, 7),
    ('Llantas', 'llantas', 1, 8),
    ('Aire acondicionado', 'aire_acondicionado', 1, 9),
    ('Transmisiones', 'transmisiones', 1, 10)
ON DUPLICATE KEY UPDATE
    `nombre` = VALUES(`nombre`),
    `activo` = VALUES(`activo`),
    `orden` = VALUES(`orden`);

DELIMITER $$
CREATE PROCEDURE `verificar_categorias_talleres_004`()
BEGIN
    IF EXISTS (
        SELECT 1
        FROM `talleres` t
        LEFT JOIN `categorias` c ON c.slug = t.categoria
        WHERE c.id IS NULL
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Migracion 004 abortada: existe una categoria legado sin correspondencia';
    END IF;
END$$
DELIMITER ;

CALL `verificar_categorias_talleres_004`();
DROP PROCEDURE `verificar_categorias_talleres_004`;

INSERT INTO `taller_categoria` (`taller_id`, `categoria_id`)
SELECT t.id, c.id
FROM `talleres` t
INNER JOIN `categorias` c ON c.slug = t.categoria
ON DUPLICATE KEY UPDATE `categoria_id` = VALUES(`categoria_id`);
