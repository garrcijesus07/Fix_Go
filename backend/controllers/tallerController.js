const db = require('../config/db');

const normalizarHora = (valor) => {
    if (typeof valor !== 'string') {
        return null;
    }

    const coincidencia = valor.trim().match(
        /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/
    );

    if (!coincidencia) {
        return null;
    }

    return valor.trim().length === 5
        ? `${valor.trim()}:00`
        : valor.trim();
};

const validarHorarios = (horarios) => {
    if (!Array.isArray(horarios)) {
        return { error: 'Horarios debe ser un arreglo' };
    }

    const bloques = [];
    const bloquesUnicos = new Set();

    for (const horario of horarios) {
        if (!horario || typeof horario !== 'object' || Array.isArray(horario)) {
            return { error: 'Cada horario debe ser un bloque valido' };
        }

        const { dia_semana, hora_inicio, hora_fin } = horario;
        const inicio = normalizarHora(hora_inicio);
        const fin = normalizarHora(hora_fin);

        if (!Number.isInteger(dia_semana) || dia_semana < 0 || dia_semana > 6) {
            return { error: 'dia_semana debe ser un entero entre 0 y 6' };
        }

        if (!inicio || !fin) {
            return { error: 'Las horas deben usar el formato HH:mm o HH:mm:ss' };
        }

        if (inicio >= fin) {
            return { error: 'hora_inicio debe ser anterior a hora_fin' };
        }

        const clave = `${dia_semana}-${inicio}-${fin}`;
        if (bloquesUnicos.has(clave)) {
            return { error: 'No se permiten bloques duplicados' };
        }

        bloquesUnicos.add(clave);
        bloques.push({
            dia_semana,
            hora_inicio: inicio,
            hora_fin: fin
        });
    }

    bloques.sort((a, b) =>
        a.dia_semana - b.dia_semana ||
        a.hora_inicio.localeCompare(b.hora_inicio)
    );

    for (let indice = 1; indice < bloques.length; indice += 1) {
        const anterior = bloques[indice - 1];
        const actual = bloques[indice];

        if (
            anterior.dia_semana === actual.dia_semana &&
            actual.hora_inicio < anterior.hora_fin
        ) {
            return { error: 'No se permiten bloques superpuestos en el mismo dia' };
        }
    }

    return { bloques };
};

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

exports.obtenerHorariosTaller = async (req, res) => {
    const tallerId = Number(req.params.id);
    const usuarioId = req.usuario.id;

    if (!Number.isInteger(tallerId) || tallerId <= 0) {
        return res.status(404).json({ mensaje: 'Taller no encontrado' });
    }

    try {
        const [talleres] = await db.promise().query(
            'SELECT id FROM talleres WHERE id = ? AND usuario_id = ?',
            [tallerId, usuarioId]
        );

        if (talleres.length === 0) {
            return res.status(404).json({ mensaje: 'Taller no encontrado' });
        }

        const [horarios] = await db.promise().query(
            `
            SELECT dia_semana, TIME_FORMAT(hora_inicio, '%H:%i:%s') AS hora_inicio,
                   TIME_FORMAT(hora_fin, '%H:%i:%s') AS hora_fin
            FROM horarios_taller
            WHERE taller_id = ?
            ORDER BY dia_semana ASC, hora_inicio ASC
            `,
            [tallerId]
        );

        return res.json({ taller_id: tallerId, horarios });
    } catch (error) {
        console.error('Error al obtener horarios del taller:', error);
        return res.status(500).json({
            mensaje: 'Error al obtener los horarios del taller'
        });
    }
};

exports.reemplazarHorariosTaller = async (req, res) => {
    const tallerId = Number(req.params.id);
    const usuarioId = req.usuario.id;
    const validacion = validarHorarios(req.body?.horarios);

    if (!Number.isInteger(tallerId) || tallerId <= 0) {
        return res.status(404).json({ mensaje: 'Taller no encontrado' });
    }

    if (validacion.error) {
        return res.status(400).json({ mensaje: validacion.error });
    }

    let connection;
    let transaccionIniciada = false;

    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();
        transaccionIniciada = true;

        const [talleres] = await connection.query(
            `
            SELECT id
            FROM talleres
            WHERE id = ? AND usuario_id = ?
            FOR UPDATE
            `,
            [tallerId, usuarioId]
        );

        if (talleres.length === 0) {
            await connection.rollback();
            transaccionIniciada = false;
            return res.status(404).json({ mensaje: 'Taller no encontrado' });
        }

        await connection.query(
            'DELETE FROM horarios_taller WHERE taller_id = ?',
            [tallerId]
        );

        if (validacion.bloques.length > 0) {
            const valores = validacion.bloques.map((bloque) => [
                tallerId,
                bloque.dia_semana,
                bloque.hora_inicio,
                bloque.hora_fin
            ]);

            await connection.query(
                `
                INSERT INTO horarios_taller
                    (taller_id, dia_semana, hora_inicio, hora_fin)
                VALUES ?
                `,
                [valores]
            );
        }

        await connection.commit();
        transaccionIniciada = false;

        return res.json({
            mensaje: 'Horarios del taller actualizados correctamente',
            taller_id: tallerId,
            horarios: validacion.bloques
        });
    } catch (error) {
        if (connection && transaccionIniciada) {
            try {
                await connection.rollback();
            } catch (errorRollback) {
                console.error('Error al revertir horarios del taller:', errorRollback);
            }
        }

        console.error('Error al actualizar horarios del taller:', error);
        return res.status(500).json({
            mensaje: 'Error al actualizar los horarios del taller'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};
