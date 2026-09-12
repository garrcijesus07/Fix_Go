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
                console.error('Error al obtener vehiculos:', err);
                return res.status(500).json({
                    mensaje: 'Error al obtener los vehiculos'
                });
            }

            res.json(result);

        }
    );

};

// Obtener vehículo por ID
exports.obtenerVehiculo = (req, res) => {

    const { id } = req.params;
    const cliente_id = req.usuario.id;

    db.query(
        'SELECT * FROM vehiculos WHERE id = ? AND cliente_id = ?',
        [id, cliente_id],
        (err, result) => {

            if (err) {
                console.error('Error al obtener el vehiculo:', err);
                return res.status(500).json({
                    mensaje: 'Error al obtener el vehiculo'
                });
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
                console.error('Error al crear el vehiculo:', err);
                return res.status(500).json({
                    mensaje: 'Error al registrar el vehiculo'
                });
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
    const cliente_id = req.usuario.id;

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
        WHERE id = ? AND cliente_id = ?
    `;

    db.query(
        sql,
        [
            marca,
            modelo,
            anio,
            placas,
            color,
            id,
            cliente_id
        ],
        (err, result) => {

            if (err) {
                console.error('Error al actualizar el vehiculo:', err);
                return res.status(500).json({
                    mensaje: 'Error al actualizar el vehiculo'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Vehiculo no encontrado'
                });
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
    const cliente_id = req.usuario.id;

    db.query(
        'DELETE FROM vehiculos WHERE id = ? AND cliente_id = ?',
        [id, cliente_id],
        (err, result) => {

            if (err) {
                console.error('Error al eliminar el vehiculo:', err);
                return res.status(500).json({
                    mensaje: 'Error al eliminar el vehiculo'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Vehiculo no encontrado'
                });
            }

            res.json({
                mensaje: 'Vehículo eliminado correctamente'
            });

        }
    );

};
