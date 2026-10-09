-- Migracion 003: categoria principal de cada taller.
-- Diseñada para ejecutarse exactamente una vez sobre el esquema posterior a
-- la migracion 002. El DEFAULT conserva compatibles los talleres existentes:
-- todas las filas actuales reciben mecanica_general sin perder otros datos.

ALTER TABLE `talleres`
    ADD COLUMN `categoria` ENUM(
        'mecanica_general',
        'autoelectrico',
        'frenos',
        'suspension',
        'diagnostico',
        'alineacion_balanceo',
        'hojalateria_pintura',
        'llantas',
        'aire_acondicionado',
        'transmisiones'
    ) NOT NULL DEFAULT 'mecanica_general' AFTER `nombre`;
