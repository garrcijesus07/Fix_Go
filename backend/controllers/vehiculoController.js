const db = require('../config/db');

// Obtener todos los vehículos del usuario autenticado
exports.obtenerVehiculos = (req, res) => {

    const cliente_id = req.usuario.id;

    db.query(
        `
        SELECT *
        FROM vehiculos
        WHERE cliente_id = ?
        `,
        [cliente_id],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(result);

        }
    );

};

// Obtener vehículo por ID
exports.obtenerVehiculo = (req, res) => {

    const { id } = req.params;

    db.query(
        'SELECT * FROM vehiculos WHERE id = ?',
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.length === 0) {

                return res.status(404).json({
                    mensaje: 'Vehículo no encontrado'
                });

            }

            res.json(result[0]);

        }
    );

};

// Crear vehículo
exports.crearVehiculo = (req, res) => {

    const {
        marca,
        modelo,
        anio,
        placas,
        color
    } = req.body;

    const cliente_id = req.usuario.id;

    const sql = `
        INSERT INTO vehiculos
        (
            cliente_id,
            marca,
            modelo,
            anio,
            placas,
            color
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            cliente_id,
            marca,
            modelo,
            anio,
            placas,
            color
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.status(201).json({
                mensaje: 'Vehículo registrado correctamente'
            });

        }
    );

};

// Actualizar vehículo
exports.actualizarVehiculo = (req, res) => {

    const { id } = req.params;

    const {
        marca,
        modelo,
        anio,
        placas,
        color
    } = req.body;

    const sql = `
        UPDATE vehiculos
        SET
            marca = ?,
            modelo = ?,
            anio = ?,
            placas = ?,
            color = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            marca,
            modelo,
            anio,
            placas,
            color,
            id
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                mensaje: 'Vehículo actualizado correctamente'
            });

        }
    );

};

// Eliminar vehículo
exports.eliminarVehiculo = (req, res) => {

    const { id } = req.params;

    db.query(
        'DELETE FROM vehiculos WHERE id = ?',
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                mensaje: 'Vehículo eliminado correctamente'
            });

        }
    );

};