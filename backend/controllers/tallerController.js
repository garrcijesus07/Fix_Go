const db = require('../config/db');

// Obtener todos los talleres
exports.obtenerTalleres = (req, res) => {

    const sql = `
        SELECT *
        FROM talleres
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        res.json(result);

    });

};

// Obtener un taller por ID
exports.obtenerTaller = (req, res) => {

    const { id } = req.params;

    db.query(
        'SELECT * FROM talleres WHERE id = ?',
        [id],
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (result.length === 0) {
                return res.status(404).json({
                    mensaje: 'Taller no encontrado'
                });
            }

            res.json(result[0]);

        }
    );

};

// Crear taller
exports.crearTaller = (req, res) => {

    const {
        nombre,
        descripcion,
        direccion,
        telefono,
        imagen
    } = req.body;

    const usuario_id = req.usuario.id;

    const sql = `
        INSERT INTO talleres
        (
            usuario_id,
            nombre,
            descripcion,
            direccion,
            telefono,
            imagen
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            usuario_id,
            nombre,
            descripcion,
            direccion,
            telefono,
            imagen
        ],
        (err, result) => {

            if (err) {
                console.error('Error al crear el taller:', err);
                return res.status(500).json({
                    mensaje: 'Error al crear el taller'
                });
            }

            res.status(201).json({
                mensaje: 'Taller creado correctamente'
            });

        }
    );

};

// Actualizar taller
exports.actualizarTaller = (req, res) => {

    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const {
        nombre,
        descripcion,
        direccion,
        telefono,
        imagen
    } = req.body;

    const sql = `
        UPDATE talleres
        SET
            nombre = ?,
            descripcion = ?,
            direccion = ?,
            telefono = ?,
            imagen = ?
        WHERE id = ? AND usuario_id = ?
    `;

    db.query(
        sql,
        [
            nombre,
            descripcion,
            direccion,
            telefono,
            imagen,
            id,
            usuario_id
        ],
        (err, result) => {

            if (err) {
                console.error('Error al actualizar el taller:', err);
                return res.status(500).json({
                    mensaje: 'Error al actualizar el taller'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Taller no encontrado'
                });
            }

            res.json({
                mensaje: 'Taller actualizado correctamente'
            });

        }
    );

};
