const db = require('../config/db');
const bcrypt = require('bcryptjs');

const crearErrorHttp = (status, mensaje) => Object.assign(new Error(mensaje), { status });

const normalizarCategoriaIds = (valor) => {
    if (!Array.isArray(valor) || valor.length === 0) return null;
    const ids = [...new Set(valor.map(Number))];
    return ids.every((id) => Number.isInteger(id) && id > 0) ? ids : null;
};

const consultarCategoriasActivas = async (connection, ids) => {
    const [categorias] = await connection.query(
        'SELECT id, nombre, slug FROM categorias WHERE activo = 1 AND id IN (?)',
        [ids]
    );
    if (categorias.length !== ids.length) return null;
    const porId = new Map(categorias.map((categoria) => [Number(categoria.id), categoria]));
    return ids.map((id) => porId.get(id));
};

const adjuntarCategorias = async (talleres) => {
    if (talleres.length === 0) return talleres;
    const ids = talleres.map((taller) => taller.id);
    const [filas] = await db.promise().query(
        `SELECT tc.taller_id, c.id, c.nombre, c.slug
         FROM taller_categoria tc
         INNER JOIN categorias c ON c.id = tc.categoria_id
         WHERE tc.taller_id IN (?)
         ORDER BY c.orden ASC, c.nombre ASC`,
        [ids]
    );
    const porTaller = new Map(ids.map((id) => [Number(id), []]));
    filas.forEach((fila) => porTaller.get(Number(fila.taller_id))?.push({
        id: fila.id, nombre: fila.nombre, slug: fila.slug
    }));
    return talleres.map((taller) => ({ ...taller, categorias: porTaller.get(Number(taller.id)) || [] }));
};

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
exports.obtenerTalleres = async (req, res) => {
    const categoria = typeof req.query.categoria === 'string' ? req.query.categoria.trim() : '';
    try {
        const parametros = [];
        let filtro = '';
        if (categoria) {
            filtro = `WHERE EXISTS (
                SELECT 1 FROM taller_categoria tc
                INNER JOIN categorias c ON c.id = tc.categoria_id
                WHERE tc.taller_id = t.id AND c.slug = ? AND c.activo = 1
            )`;
            parametros.push(categoria);
        }
        const [talleres] = await db.promise().query(
            `SELECT t.* FROM talleres t ${filtro} ORDER BY t.id ASC`,
            parametros
        );
        return res.json(await adjuntarCategorias(talleres));
    } catch (error) {
        console.error('Error al obtener talleres:', error);
        return res.status(500).json({ mensaje: 'Error al obtener los talleres' });
    }
};

exports.obtenerMisTalleres = async (req, res) => {
    const usuarioId = req.usuario.id;

    try {
        const [talleres] = await db.promise().query(
            `
            SELECT id, nombre, categoria
            FROM talleres
            WHERE usuario_id = ?
            ORDER BY id ASC
            `,
            [usuarioId]
        );

        return res.json(await adjuntarCategorias(talleres));
    } catch (error) {
        console.error('Error al obtener los talleres propios:', error);
        return res.status(500).json({
            mensaje: 'Error al obtener los talleres'
        });
    }
};

exports.obtenerMecanicosTaller = async (req, res) => {
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

        const [mecanicos] = await db.promise().query(
            `
            SELECT u.id, u.nombre, u.correo, u.telefono, u.activo
            FROM mecanicos_taller mt
            INNER JOIN usuarios u ON u.id = mt.mecanico_id
            WHERE mt.taller_id = ? AND u.rol = 'mecanico'
            ORDER BY u.nombre ASC, u.id ASC
            `,
            [tallerId]
        );

        return res.json(mecanicos);
    } catch (error) {
        console.error('Error al obtener mecanicos del taller:', error);
        return res.status(500).json({
            mensaje: 'Error al obtener los mecanicos del taller'
        });
    }
};

exports.obtenerCitasTaller = async (req, res) => {
    const tallerId = Number(req.params.tallerId);
    const usuarioId = req.usuario.id;
    if (!Number.isInteger(tallerId) || tallerId <= 0) {
        return res.status(400).json({ mensaje: 'tallerId no valido' });
    }
    try {
        const [talleres] = await db.promise().query(
            'SELECT id, nombre FROM talleres WHERE id = ? AND usuario_id = ?',
            [tallerId, usuarioId]
        );
        if (talleres.length === 0) {
            return res.status(404).json({ mensaje: 'Taller no encontrado' });
        }
        const [filas] = await db.promise().query(
            `SELECT c.id AS cita_id, DATE_FORMAT(c.fecha, '%Y-%m-%dT%H:%i:%s') AS fecha,
                    c.duracion_minutos, c.tipo_cita, c.descripcion_falla, c.estado,
                    c.confirmada_mecanico,
                    DATE_FORMAT(c.fecha_confirmacion_mecanico, '%Y-%m-%dT%H:%i:%s') AS fecha_confirmacion_mecanico,
                    cl.id AS cliente_id, cl.nombre AS cliente_nombre,
                    v.id AS vehiculo_id, v.marca, v.modelo, v.placas,
                    m.id AS mecanico_id, m.nombre AS mecanico_nombre
             FROM citas c
             INNER JOIN usuarios cl ON cl.id = c.cliente_id
             INNER JOIN vehiculos v ON v.id = c.vehiculo_id
             LEFT JOIN usuarios m ON m.id = c.mecanico_id
             WHERE c.taller_id = ?
             ORDER BY (c.fecha >= NOW()) DESC,
                      CASE WHEN c.fecha >= NOW() THEN c.fecha END ASC,
                      CASE WHEN c.fecha < NOW() THEN c.fecha END DESC,
                      c.id ASC`,
            [tallerId]
        );
        const citas = filas.map((fila) => ({
            cita_id: fila.cita_id,
            fecha: fila.fecha,
            duracion_minutos: fila.duracion_minutos,
            tipo_cita: fila.tipo_cita,
            descripcion_falla: fila.descripcion_falla,
            estado: fila.estado,
            confirmada_mecanico: Boolean(fila.confirmada_mecanico),
            fecha_confirmacion_mecanico: fila.fecha_confirmacion_mecanico,
            cliente: { id: fila.cliente_id, nombre: fila.cliente_nombre },
            vehiculo: { id: fila.vehiculo_id, marca: fila.marca, modelo: fila.modelo, placas: fila.placas },
            mecanico: fila.mecanico_id === null ? null : { id: fila.mecanico_id, nombre: fila.mecanico_nombre }
        }));
        return res.json({ taller: talleres[0], citas });
    } catch (error) {
        console.error('Error al obtener citas del taller:', error);
        return res.status(500).json({ mensaje: 'Error al obtener las citas del taller' });
    }
};

exports.obtenerMecanicosDisponiblesCita = async (req, res) => {
    const tallerId = Number(req.params.tallerId);
    const citaId = Number(req.params.citaId);
    const usuarioId = req.usuario.id;
    if (!Number.isInteger(tallerId) || tallerId <= 0 || !Number.isInteger(citaId) || citaId <= 0) {
        return res.status(400).json({ mensaje: 'Identificadores no validos' });
    }
    try {
        const [citas] = await db.promise().query(
            `SELECT c.id, c.fecha, c.duracion_minutos, c.estado FROM citas c
             INNER JOIN talleres t ON t.id = c.taller_id
             WHERE c.id = ? AND c.taller_id = ? AND t.usuario_id = ?`,
            [citaId, tallerId, usuarioId]
        );
        if (citas.length === 0) return res.status(404).json({ mensaje: 'Cita o taller no encontrado' });
        if (!['pendiente', 'aceptada'].includes(citas[0].estado)) {
            return res.status(409).json({ mensaje: 'La cita ya no admite asignacion' });
        }
        const cita = citas[0];
        const [mecanicos] = await db.promise().query(
            `SELECT u.id, u.nombre FROM mecanicos_taller mt
             INNER JOIN usuarios u ON u.id = mt.mecanico_id
             WHERE mt.taller_id = ? AND u.rol = 'mecanico' AND u.activo = 1
               AND EXISTS (
                 SELECT 1 FROM horarios h WHERE h.mecanico_id = u.id
                   AND h.dia_semana = DAYOFWEEK(?) - 1
                   AND DATE(DATE_ADD(?, INTERVAL ? MINUTE)) = DATE(?)
                   AND TIME(?) >= h.hora_inicio
                   AND TIME(DATE_ADD(?, INTERVAL ? MINUTE)) <= h.hora_fin
               )
               AND NOT EXISTS (
                 SELECT 1 FROM citas conflicto WHERE conflicto.mecanico_id = u.id
                   AND conflicto.id <> ? AND conflicto.estado IN ('pendiente', 'aceptada')
                   AND conflicto.fecha < DATE_ADD(?, INTERVAL ? MINUTE)
                   AND DATE_ADD(conflicto.fecha, INTERVAL conflicto.duracion_minutos MINUTE) > ?
               )
             ORDER BY u.nombre ASC, u.id ASC`,
            [tallerId, cita.fecha, cita.fecha, cita.duracion_minutos, cita.fecha,
                cita.fecha, cita.fecha, cita.duracion_minutos, citaId,
                cita.fecha, cita.duracion_minutos, cita.fecha]
        );
        return res.json({ cita_id: citaId, mecanicos });
    } catch (error) {
        console.error('Error al obtener mecanicos disponibles:', error);
        return res.status(500).json({ mensaje: 'Error al obtener mecanicos disponibles' });
    }
};

exports.buscarMecanicoTaller = async (req, res) => {
    const tallerId = Number(req.params.id);
    const usuarioId = req.usuario.id;
    const correo = typeof req.query.correo === 'string'
        ? req.query.correo.trim().toLowerCase()
        : '';

    if (!Number.isInteger(tallerId) || tallerId <= 0) {
        return res.status(404).json({ mensaje: 'Taller no encontrado' });
    }

    if (!correo || correo.length > 100) {
        return res.status(400).json({ mensaje: 'Correo del mecanico requerido' });
    }

    try {
        const [talleres] = await db.promise().query(
            'SELECT id FROM talleres WHERE id = ? AND usuario_id = ?',
            [tallerId, usuarioId]
        );

        if (talleres.length === 0) {
            return res.status(404).json({ mensaje: 'Taller no encontrado' });
        }

        const [mecanicos] = await db.promise().query(
            `
            SELECT u.id, u.nombre, u.correo, u.telefono, mt.taller_id
            FROM usuarios u
            LEFT JOIN mecanicos_taller mt ON mt.mecanico_id = u.id
            WHERE LOWER(u.correo) = ?
              AND u.rol = 'mecanico'
              AND u.activo = 1
            LIMIT 1
            `,
            [correo]
        );

        if (mecanicos.length === 0) {
            return res.status(404).json({ mensaje: 'Mecanico no encontrado' });
        }

        const mecanico = mecanicos[0];
        const asociado = mecanico.taller_id !== null;
        const asociadoMismoTaller = Number(mecanico.taller_id) === tallerId;

        return res.json({
            id: mecanico.id,
            nombre: mecanico.nombre,
            correo: mecanico.correo,
            telefono: mecanico.telefono,
            asociado,
            disponible: !asociado,
            asociado_mismo_taller: asociadoMismoTaller
        });
    } catch (error) {
        console.error('Error al buscar mecanico:', error);
        return res.status(500).json({
            mensaje: 'Error al buscar el mecanico'
        });
    }
};

exports.asociarMecanicoTaller = async (req, res) => {
    const tallerId = Number(req.params.id);
    const mecanicoId = Number(req.body?.mecanico_id);
    const usuarioId = req.usuario.id;

    if (!Number.isInteger(tallerId) || tallerId <= 0) {
        return res.status(404).json({ mensaje: 'Taller no encontrado' });
    }

    if (!Number.isInteger(mecanicoId) || mecanicoId <= 0) {
        return res.status(400).json({ mensaje: 'mecanico_id debe ser un entero valido' });
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

        const [mecanicos] = await connection.query(
            `
            SELECT id
            FROM usuarios
            WHERE id = ? AND rol = 'mecanico' AND activo = 1
            FOR UPDATE
            `,
            [mecanicoId]
        );

        if (mecanicos.length === 0) {
            await connection.rollback();
            transaccionIniciada = false;
            return res.status(404).json({ mensaje: 'Mecanico no encontrado' });
        }

        const [asociaciones] = await connection.query(
            'SELECT taller_id FROM mecanicos_taller WHERE mecanico_id = ?',
            [mecanicoId]
        );

        if (asociaciones.length > 0) {
            await connection.rollback();
            transaccionIniciada = false;
            return res.status(409).json({
                mensaje: 'El mecanico ya esta asociado a un taller'
            });
        }

        await connection.query(
            'INSERT INTO mecanicos_taller (mecanico_id, taller_id) VALUES (?, ?)',
            [mecanicoId, tallerId]
        );

        await connection.commit();
        transaccionIniciada = false;

        return res.status(201).json({
            mensaje: 'Mecanico asociado correctamente'
        });
    } catch (error) {
        if (connection && transaccionIniciada) {
            try {
                await connection.rollback();
            } catch (errorRollback) {
                console.error('Error al revertir asociacion de mecanico:', errorRollback);
            }
        }

        if (error?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                mensaje: 'El mecanico ya esta asociado a un taller'
            });
        }

        console.error('Error al asociar mecanico:', error);
        return res.status(500).json({
            mensaje: 'Error al asociar el mecanico'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

exports.desvincularMecanicoTaller = async (req, res) => {
    const tallerId = Number(req.params.tallerId);
    const mecanicoId = Number(req.params.mecanicoId);
    const usuarioId = req.usuario.id;

    if (
        !Number.isInteger(tallerId) || tallerId <= 0 ||
        !Number.isInteger(mecanicoId) || mecanicoId <= 0
    ) {
        return res.status(400).json({ mensaje: 'Identificadores no validos' });
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

        const [asociaciones] = await connection.query(
            `
            SELECT id
            FROM mecanicos_taller
            WHERE taller_id = ? AND mecanico_id = ?
            FOR UPDATE
            `,
            [tallerId, mecanicoId]
        );

        if (asociaciones.length === 0) {
            await connection.rollback();
            transaccionIniciada = false;
            return res.status(404).json({ mensaje: 'Mecanico asociado no encontrado' });
        }

        const [citasActivas] = await connection.query(
            `
            SELECT id
            FROM citas
            WHERE taller_id = ?
              AND mecanico_id = ?
              AND estado IN ('pendiente', 'aceptada')
            FOR UPDATE
            `,
            [tallerId, mecanicoId]
        );

        if (citasActivas.length > 0) {
            await connection.rollback();
            transaccionIniciada = false;
            return res.status(409).json({
                mensaje: 'El mecanico tiene citas activas asignadas. Reasignalas antes de desvincularlo.'
            });
        }

        await connection.query(
            'DELETE FROM horarios WHERE mecanico_id = ?',
            [mecanicoId]
        );
        await connection.query(
            'DELETE FROM mecanicos_taller WHERE taller_id = ? AND mecanico_id = ?',
            [tallerId, mecanicoId]
        );

        await connection.commit();
        transaccionIniciada = false;

        return res.json({ mensaje: 'Mecanico desvinculado correctamente' });
    } catch (error) {
        if (connection && transaccionIniciada) {
            try {
                await connection.rollback();
            } catch (errorRollback) {
                console.error('Error al revertir desvinculacion de mecanico:', errorRollback);
            }
        }

        console.error('Error al desvincular mecanico:', error);
        return res.status(500).json({
            mensaje: 'Error al desvincular el mecanico'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

exports.registrarNuevoMecanicoTaller = async (req, res) => {
    const tallerId = Number(req.params.id);
    const usuarioId = req.usuario.id;
    const nombre = typeof req.body?.nombre === 'string'
        ? req.body.nombre.trim()
        : '';
    const correo = typeof req.body?.correo === 'string'
        ? req.body.correo.trim().toLowerCase()
        : '';
    const telefonoNormalizado = typeof req.body?.telefono === 'string'
        ? req.body.telefono.trim()
        : '';
    const telefono = telefonoNormalizado || null;
    const passwordTemporal = typeof req.body?.password_temporal === 'string'
        ? req.body.password_temporal
        : '';
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!Number.isInteger(tallerId) || tallerId <= 0) {
        return res.status(404).json({ mensaje: 'Taller no encontrado' });
    }

    if (!nombre || nombre.length > 100) {
        return res.status(400).json({
            mensaje: 'El nombre es obligatorio y admite hasta 100 caracteres'
        });
    }

    if (!correo || correo.length > 100 || !correoValido.test(correo)) {
        return res.status(400).json({ mensaje: 'El correo no es valido' });
    }

    if (telefono && telefono.length > 20) {
        return res.status(400).json({
            mensaje: 'El telefono admite hasta 20 caracteres'
        });
    }

    if (passwordTemporal.length < 8 || passwordTemporal.length > 72) {
        return res.status(400).json({
            mensaje: 'La contrasena temporal debe tener entre 8 y 72 caracteres'
        });
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

        const [usuariosExistentes] = await connection.query(
            'SELECT id FROM usuarios WHERE correo = ? FOR UPDATE',
            [correo]
        );

        if (usuariosExistentes.length > 0) {
            await connection.rollback();
            transaccionIniciada = false;
            return res.status(409).json({ mensaje: 'El correo ya esta registrado' });
        }

        const passwordHash = await bcrypt.hash(passwordTemporal, 10);
        const [usuarioCreado] = await connection.query(
            `
            INSERT INTO usuarios (nombre, correo, password, rol, telefono)
            VALUES (?, ?, ?, 'mecanico', ?)
            `,
            [nombre, correo, passwordHash, telefono]
        );

        await connection.query(
            'INSERT INTO mecanicos_taller (mecanico_id, taller_id) VALUES (?, ?)',
            [usuarioCreado.insertId, tallerId]
        );

        await connection.commit();
        transaccionIniciada = false;

        return res.status(201).json({
            mensaje: 'Mecanico registrado correctamente',
            mecanico: {
                id: usuarioCreado.insertId,
                nombre,
                correo,
                telefono
            }
        });
    } catch (error) {
        if (connection && transaccionIniciada) {
            try {
                await connection.rollback();
            } catch (errorRollback) {
                console.error('Error al revertir registro de mecanico:', errorRollback);
            }
        }

        if (error?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El correo ya esta registrado' });
        }

        console.error('Error al registrar mecanico:', error);
        return res.status(500).json({
            mensaje: 'Error al registrar el mecanico'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

exports.obtenerHorariosMecanico = async (req, res) => {
    const tallerId = Number(req.params.tallerId);
    const mecanicoId = Number(req.params.mecanicoId);
    const usuarioId = req.usuario.id;

    if (
        !Number.isInteger(tallerId) || tallerId <= 0 ||
        !Number.isInteger(mecanicoId) || mecanicoId <= 0
    ) {
        return res.status(400).json({ mensaje: 'Identificadores no validos' });
    }

    try {
        const [mecanicos] = await db.promise().query(
            `
            SELECT u.id, u.nombre
            FROM talleres t
            INNER JOIN mecanicos_taller mt ON mt.taller_id = t.id
            INNER JOIN usuarios u ON u.id = mt.mecanico_id
            WHERE t.id = ?
              AND t.usuario_id = ?
              AND mt.mecanico_id = ?
              AND u.rol = 'mecanico'
            LIMIT 1
            `,
            [tallerId, usuarioId, mecanicoId]
        );

        if (mecanicos.length === 0) {
            return res.status(404).json({
                mensaje: 'Taller o mecanico asociado no encontrado'
            });
        }

        const [horarios] = await db.promise().query(
            `
            SELECT id, dia_semana,
                   TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
                   TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin
            FROM horarios
            WHERE mecanico_id = ?
            ORDER BY dia_semana ASC, hora_inicio ASC
            `,
            [mecanicoId]
        );

        return res.json({
            taller_id: tallerId,
            mecanico: mecanicos[0],
            horarios
        });
    } catch (error) {
        console.error('Error al obtener horarios del mecanico:', error);
        return res.status(500).json({
            mensaje: 'Error al obtener los horarios del mecanico'
        });
    }
};

exports.reemplazarHorariosMecanico = async (req, res) => {
    const tallerId = Number(req.params.tallerId);
    const mecanicoId = Number(req.params.mecanicoId);
    const usuarioId = req.usuario.id;
    const validacion = validarHorarios(req.body?.horarios);

    if (
        !Number.isInteger(tallerId) || tallerId <= 0 ||
        !Number.isInteger(mecanicoId) || mecanicoId <= 0
    ) {
        return res.status(400).json({ mensaje: 'Identificadores no validos' });
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

        const [mecanicos] = await connection.query(
            `
            SELECT u.id, u.nombre
            FROM mecanicos_taller mt
            INNER JOIN usuarios u ON u.id = mt.mecanico_id
            WHERE mt.taller_id = ?
              AND mt.mecanico_id = ?
              AND u.rol = 'mecanico'
            FOR UPDATE
            `,
            [tallerId, mecanicoId]
        );

        if (mecanicos.length === 0) {
            await connection.rollback();
            transaccionIniciada = false;
            return res.status(404).json({
                mensaje: 'Mecanico asociado no encontrado'
            });
        }

        const [horariosTaller] = await connection.query(
            `
            SELECT dia_semana,
                   TIME_FORMAT(hora_inicio, '%H:%i:%s') AS hora_inicio,
                   TIME_FORMAT(hora_fin, '%H:%i:%s') AS hora_fin
            FROM horarios_taller
            WHERE taller_id = ?
            FOR UPDATE
            `,
            [tallerId]
        );

        for (const bloque of validacion.bloques) {
            const contenido = horariosTaller.some((horarioTaller) =>
                Number(horarioTaller.dia_semana) === bloque.dia_semana &&
                bloque.hora_inicio >= horarioTaller.hora_inicio &&
                bloque.hora_fin <= horarioTaller.hora_fin
            );

            if (!contenido) {
                await connection.rollback();
                transaccionIniciada = false;
                return res.status(400).json({
                    mensaje: 'Cada horario del mecanico debe estar dentro del horario general del taller'
                });
            }
        }

        await connection.query(
            'DELETE FROM horarios WHERE mecanico_id = ?',
            [mecanicoId]
        );

        if (validacion.bloques.length > 0) {
            const valores = validacion.bloques.map((bloque) => [
                mecanicoId,
                bloque.dia_semana,
                bloque.hora_inicio,
                bloque.hora_fin
            ]);

            await connection.query(
                `
                INSERT INTO horarios
                    (mecanico_id, dia_semana, hora_inicio, hora_fin)
                VALUES ?
                `,
                [valores]
            );
        }

        await connection.commit();
        transaccionIniciada = false;

        return res.json({
            mensaje: 'Horarios del mecanico actualizados correctamente',
            taller_id: tallerId,
            mecanico: mecanicos[0],
            horarios: validacion.bloques
        });
    } catch (error) {
        if (connection && transaccionIniciada) {
            try {
                await connection.rollback();
            } catch (errorRollback) {
                console.error('Error al revertir horarios del mecanico:', errorRollback);
            }
        }

        if (error?.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensaje: 'El horario contiene bloques duplicados' });
        }

        console.error('Error al actualizar horarios del mecanico:', error);
        return res.status(500).json({
            mensaje: 'Error al actualizar los horarios del mecanico'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Obtener un taller por ID
exports.obtenerTaller = async (req, res) => {
    const tallerId = Number(req.params.id);
    if (!Number.isInteger(tallerId) || tallerId <= 0) return res.status(404).json({ mensaje: 'Taller no encontrado' });
    try {
        const [talleres] = await db.promise().query('SELECT * FROM talleres WHERE id = ?', [tallerId]);
        if (talleres.length === 0) return res.status(404).json({ mensaje: 'Taller no encontrado' });
        const [taller] = await adjuntarCategorias(talleres);
        return res.json(taller);
    } catch (error) {
        console.error('Error al obtener taller:', error);
        return res.status(500).json({ mensaje: 'Error al obtener el taller' });
    }
};

// Crear taller
exports.crearTaller = async (req, res) => {
    const { nombre, descripcion, direccion, telefono, imagen } = req.body || {};
    const categoriaIds = normalizarCategoriaIds(req.body?.categoria_ids);
    if (!categoriaIds) return res.status(400).json({ mensaje: 'categoria_ids debe ser un arreglo no vacio de enteros positivos' });
    const usuarioId = req.usuario.id;
    let connection;
    let transaccionIniciada = false;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();
        transaccionIniciada = true;
        const categorias = await consultarCategoriasActivas(connection, categoriaIds);
        if (!categorias) throw crearErrorHttp(400, 'Una o mas categorias no existen o estan inactivas');
        const [resultado] = await connection.query(
            `INSERT INTO talleres (usuario_id, nombre, categoria, descripcion, direccion, telefono, imagen)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [usuarioId, nombre, categorias[0].slug, descripcion, direccion, telefono, imagen]
        );
        await connection.query(
            'INSERT INTO taller_categoria (taller_id, categoria_id) VALUES ?',
            [categoriaIds.map((categoriaId) => [resultado.insertId, categoriaId])]
        );
        await connection.commit();
        transaccionIniciada = false;
        return res.status(201).json({ mensaje: 'Taller creado correctamente', id: resultado.insertId });
    } catch (error) {
        if (connection && transaccionIniciada) await connection.rollback();
        if (error.status) return res.status(error.status).json({ mensaje: error.message });
        console.error('Error al crear taller:', error);
        return res.status(500).json({ mensaje: 'Error al crear el taller' });
    } finally {
        if (connection) connection.release();
    }
};

// Actualizar taller
exports.actualizarTaller = async (req, res) => {
    const tallerId = Number(req.params.id);
    const usuarioId = req.usuario.id;
    const { nombre, descripcion, direccion, telefono, imagen } = req.body || {};
    const categoriaIds = normalizarCategoriaIds(req.body?.categoria_ids);
    if (!Number.isInteger(tallerId) || tallerId <= 0) return res.status(400).json({ mensaje: 'Taller no valido' });
    if (!categoriaIds) return res.status(400).json({ mensaje: 'categoria_ids debe ser un arreglo no vacio de enteros positivos' });
    let connection;
    let transaccionIniciada = false;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();
        transaccionIniciada = true;
        const [talleres] = await connection.query(
            'SELECT id FROM talleres WHERE id = ? AND usuario_id = ? FOR UPDATE',
            [tallerId, usuarioId]
        );
        if (talleres.length === 0) throw crearErrorHttp(404, 'Taller no encontrado');
        const categorias = await consultarCategoriasActivas(connection, categoriaIds);
        if (!categorias) throw crearErrorHttp(400, 'Una o mas categorias no existen o estan inactivas');
        await connection.query(
            `UPDATE talleres SET nombre = ?, categoria = ?, descripcion = ?, direccion = ?, telefono = ?, imagen = ?
             WHERE id = ?`,
            [nombre, categorias[0].slug, descripcion, direccion, telefono, imagen, tallerId]
        );
        await connection.query('DELETE FROM taller_categoria WHERE taller_id = ?', [tallerId]);
        await connection.query(
            'INSERT INTO taller_categoria (taller_id, categoria_id) VALUES ?',
            [categoriaIds.map((categoriaId) => [tallerId, categoriaId])]
        );
        await connection.commit();
        transaccionIniciada = false;
        return res.json({ mensaje: 'Taller actualizado correctamente' });
    } catch (error) {
        if (connection && transaccionIniciada) await connection.rollback();
        if (error.status) return res.status(error.status).json({ mensaje: error.message });
        console.error('Error al actualizar taller:', error);
        return res.status(500).json({ mensaje: 'Error al actualizar el taller' });
    } finally {
        if (connection) connection.release();
    }
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
