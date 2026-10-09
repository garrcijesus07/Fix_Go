const db = require('../config/db');

const duracionesPorTipo = {
    diagnostico: 60,
    reparacion: 120
};

const minutosDesdeHora = (hora) => {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
};

const horaDesdeMinutos = (minutos) => {
    const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
    const resto = String(minutos % 60).padStart(2, '0');
    return `${horas}:${resto}`;
};

const normalizarDia = (valor) => {
    if (typeof valor !== 'string') {
        return null;
    }

    const coincidencia = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!coincidencia) {
        return null;
    }

    const [, anio, mes, dia] = coincidencia;
    const partes = [anio, mes, dia].map(Number);
    // Se construye en hora local; no se interpreta YYYY-MM-DD como UTC.
    const fecha = new Date(partes[0], partes[1] - 1, partes[2]);

    if (
        fecha.getFullYear() !== partes[0] ||
        fecha.getMonth() !== partes[1] - 1 ||
        fecha.getDate() !== partes[2]
    ) {
        return null;
    }

    return { valor: valor, fecha, diaSemana: fecha.getDay() };
};

const normalizarFecha = (valor) => {
    if (typeof valor !== 'string') {
        return null;
    }

    const coincidencia = valor.trim().match(
        /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/
    );

    if (!coincidencia) {
        return null;
    }

    const [, anio, mes, dia, hora, minuto, segundo = '00'] = coincidencia;
    const partes = [anio, mes, dia, hora, minuto, segundo].map(Number);
    const fecha = new Date(
        partes[0],
        partes[1] - 1,
        partes[2],
        partes[3],
        partes[4],
        partes[5]
    );

    const fechaValida =
        fecha.getFullYear() === partes[0] &&
        fecha.getMonth() === partes[1] - 1 &&
        fecha.getDate() === partes[2] &&
        fecha.getHours() === partes[3] &&
        fecha.getMinutes() === partes[4] &&
        fecha.getSeconds() === partes[5];

    if (!fechaValida) {
        return null;
    }

    return {
        fecha,
        valorMysql: `${anio}-${mes}-${dia} ${hora}:${minuto}:${segundo}`
    };
};

const crearErrorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

exports.crearCita = async (req, res) => {
    const {
        vehiculo_id,
        taller_id,
        fecha,
        tipo_cita,
        descripcion_falla
    } = req.body || {};
    const cliente_id = req.usuario.id;

    const vehiculoId = Number(vehiculo_id);
    const tallerId = Number(taller_id);
    const fechaNormalizada = normalizarFecha(fecha);
    const duracionMinutos = duracionesPorTipo[tipo_cita];

    if (
        !Number.isInteger(vehiculoId) || vehiculoId <= 0 ||
        !Number.isInteger(tallerId) || tallerId <= 0 ||
        !fechaNormalizada
    ) {
        return res.status(400).json({
            mensaje: 'Vehiculo, taller y fecha validos son requeridos'
        });
    }

    if (!duracionMinutos) {
        return res.status(400).json({ mensaje: 'Tipo de cita no valido' });
    }

    if (
        descripcion_falla !== undefined &&
        descripcion_falla !== null &&
        typeof descripcion_falla !== 'string'
    ) {
        return res.status(400).json({
            mensaje: 'La descripcion de la falla debe ser texto'
        });
    }

    const descripcionNormalizada = typeof descripcion_falla === 'string'
        ? descripcion_falla.trim()
        : '';

    if (descripcionNormalizada.length > 2000) {
        return res.status(400).json({
            mensaje: 'La descripcion de la falla no puede exceder 2000 caracteres'
        });
    }

    if (tipo_cita === 'reparacion' && !descripcionNormalizada) {
        return res.status(400).json({
            mensaje: 'La descripcion de la falla es requerida para una reparacion'
        });
    }

    if (fechaNormalizada.fecha <= new Date()) {
        return res.status(400).json({
            mensaje: 'La fecha de la cita debe ser futura'
        });
    }

    const descripcionGuardada = descripcionNormalizada || null;
    let connection;
    let transaccionIniciada = false;

    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();
        transaccionIniciada = true;

        const [talleres] = await connection.query(
            'SELECT id FROM talleres WHERE id = ? FOR UPDATE',
            [tallerId]
        );

        if (talleres.length === 0) {
            throw crearErrorHttp(404, 'Taller no encontrado');
        }

        const [vehiculos] = await connection.query(
            'SELECT id FROM vehiculos WHERE id = ? AND cliente_id = ? FOR UPDATE',
            [vehiculoId, cliente_id]
        );

        if (vehiculos.length === 0) {
            throw crearErrorHttp(404, 'Vehiculo no encontrado');
        }

        // Capacidad temporal: una sola cita activa simultanea por taller.
        const consultaSolapamiento = `
            SELECT id
            FROM citas
            WHERE estado IN ('pendiente', 'aceptada')
              AND fecha < DATE_ADD(?, INTERVAL ? MINUTE)
              AND DATE_ADD(fecha, INTERVAL duracion_minutos MINUTE) > ?
        `;

        const [conflictosTaller] = await connection.query(
            `${consultaSolapamiento} AND taller_id = ? LIMIT 1 FOR UPDATE`,
            [
                fechaNormalizada.valorMysql,
                duracionMinutos,
                fechaNormalizada.valorMysql,
                tallerId
            ]
        );

        if (conflictosTaller.length > 0) {
            throw crearErrorHttp(
                409,
                'Ya existe una cita activa del taller que se solapa con el horario seleccionado'
            );
        }

        const [conflictosVehiculo] = await connection.query(
            `${consultaSolapamiento} AND vehiculo_id = ? LIMIT 1 FOR UPDATE`,
            [
                fechaNormalizada.valorMysql,
                duracionMinutos,
                fechaNormalizada.valorMysql,
                vehiculoId
            ]
        );

        if (conflictosVehiculo.length > 0) {
            throw crearErrorHttp(
                409,
                'Ya existe una cita activa del vehiculo que se solapa con el horario seleccionado'
            );
        }

        const [resultado] = await connection.query(
            `
            INSERT INTO citas
                (
                    cliente_id,
                    vehiculo_id,
                    taller_id,
                    mecanico_id,
                    fecha,
                    tipo_cita,
                    descripcion_falla,
                    duracion_minutos,
                    estado
                )
            VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 'pendiente')
            `,
            [
                cliente_id,
                vehiculoId,
                tallerId,
                fechaNormalizada.valorMysql,
                tipo_cita,
                descripcionGuardada,
                duracionMinutos
            ]
        );

        await connection.commit();
        transaccionIniciada = false;

        return res.status(201).json({
            mensaje: 'Cita creada correctamente',
            id: resultado.insertId,
            cliente_id,
            vehiculo_id: vehiculoId,
            taller_id: tallerId,
            mecanico_id: null,
            fecha: fechaNormalizada.valorMysql,
            tipo_cita,
            descripcion_falla: descripcionGuardada,
            duracion_minutos: duracionMinutos,
            estado: 'pendiente'
        });
    } catch (error) {
        if (connection && transaccionIniciada) {
            try {
                await connection.rollback();
            } catch (errorRollback) {
                console.error('Error al revertir la creacion de cita:', errorRollback);
            }
        }

        if (error.status) {
            return res.status(error.status).json({ mensaje: error.message });
        }

        console.error('Error al crear la cita:', error);
        return res.status(500).json({ mensaje: 'Error al crear la cita' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

exports.obtenerMisCitas = (req, res) => {
    const cliente_id = req.usuario.id;

    const sql = `
        SELECT
            c.id,
            c.fecha,
            c.estado,
            c.confirmada_mecanico,
            c.taller_id,
            t.nombre AS taller_nombre,
            c.vehiculo_id,
            v.marca,
            v.modelo,
            v.placas,
            c.mecanico_id
        FROM citas c
        INNER JOIN talleres t ON t.id = c.taller_id
        INNER JOIN vehiculos v ON v.id = c.vehiculo_id
        WHERE c.cliente_id = ?
        ORDER BY c.fecha ASC
    `;

    db.query(sql, [cliente_id], (error, citas) => {
        if (error) {
            console.error('Error al obtener las citas del cliente:', error);
            return res.status(500).json({
                mensaje: 'Error al obtener las citas'
            });
        }

        return res.json(citas.map((cita) => ({
            ...cita,
            confirmada_mecanico: Boolean(cita.confirmada_mecanico)
        })));
    });
};

exports.obtenerDisponibilidad = async (req, res) => {
    const tallerId = Number(req.query.taller_id);
    const diaNormalizado = normalizarDia(req.query.fecha);
    const tipoCita = req.query.tipo_cita;
    const duracionMinutos = duracionesPorTipo[tipoCita];

    if (!Number.isInteger(tallerId) || tallerId <= 0) {
        return res.status(400).json({ mensaje: 'taller_id debe ser un entero positivo' });
    }

    if (!diaNormalizado) {
        return res.status(400).json({ mensaje: 'fecha debe usar el formato YYYY-MM-DD' });
    }

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    if (diaNormalizado.fecha < inicioHoy) {
        return res.status(400).json({ mensaje: 'La fecha no puede ser anterior al dia actual' });
    }

    if (!duracionMinutos) {
        return res.status(400).json({ mensaje: 'Tipo de cita no valido' });
    }

    try {
        const [talleres] = await db.promise().query(
            'SELECT id FROM talleres WHERE id = ?',
            [tallerId]
        );

        if (talleres.length === 0) {
            return res.status(404).json({ mensaje: 'Taller no encontrado' });
        }

        const [horarios] = await db.promise().query(
            `
            SELECT
                TIME_FORMAT(hora_inicio, '%H:%i:%s') AS hora_inicio,
                TIME_FORMAT(hora_fin, '%H:%i:%s') AS hora_fin
            FROM horarios_taller
            WHERE taller_id = ? AND dia_semana = ?
            ORDER BY hora_inicio ASC
            `,
            [tallerId, diaNormalizado.diaSemana]
        );

        if (horarios.length === 0) {
            return res.json({
                taller_id: tallerId,
                fecha: diaNormalizado.valor,
                tipo_cita: tipoCita,
                duracion_minutos: duracionMinutos,
                slots: []
            });
        }

        const inicioDia = `${diaNormalizado.valor} 00:00:00`;
        const [citas] = await db.promise().query(
            `
            SELECT
                DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') AS inicio,
                DATE_FORMAT(
                    DATE_ADD(fecha, INTERVAL duracion_minutos MINUTE),
                    '%Y-%m-%d %H:%i:%s'
                ) AS fin
            FROM citas
            WHERE taller_id = ?
              AND estado IN ('pendiente', 'aceptada')
              AND fecha < DATE_ADD(?, INTERVAL 1 DAY)
              AND DATE_ADD(fecha, INTERVAL duracion_minutos MINUTE) > ?
            `,
            [tallerId, inicioDia, inicioDia]
        );

        const intervalosOcupados = citas.map((cita) => ({
            inicio: new Date(cita.inicio.replace(' ', 'T')),
            fin: new Date(cita.fin.replace(' ', 'T'))
        }));
        const slots = [];
        const ahora = new Date();

        for (const horario of horarios) {
            const inicioBloque = minutosDesdeHora(horario.hora_inicio);
            const finBloque = minutosDesdeHora(horario.hora_fin);

            for (
                let inicioSlot = inicioBloque;
                inicioSlot + duracionMinutos <= finBloque;
                inicioSlot += 30
            ) {
                const finSlot = inicioSlot + duracionMinutos;
                const inicioTexto = `${diaNormalizado.valor}T${horaDesdeMinutos(inicioSlot)}`;
                const finTexto = `${diaNormalizado.valor}T${horaDesdeMinutos(finSlot)}`;
                const inicioFecha = new Date(inicioTexto);
                const finFecha = new Date(finTexto);

                if (inicioFecha <= ahora) {
                    continue;
                }

                const solapado = intervalosOcupados.some((ocupado) =>
                    inicioFecha < ocupado.fin && finFecha > ocupado.inicio
                );

                if (!solapado) {
                    slots.push({ inicio: inicioTexto, fin: finTexto });
                }
            }
        }

        return res.json({
            taller_id: tallerId,
            fecha: diaNormalizado.valor,
            tipo_cita: tipoCita,
            duracion_minutos: duracionMinutos,
            slots
        });
    } catch (error) {
        console.error('Error al obtener disponibilidad de citas:', error);
        return res.status(500).json({ mensaje: 'Error al obtener la disponibilidad' });
    }
};

exports.asignarMecanico = async (req, res) => {
    const citaId = Number(req.params.id);
    const mecanicoId = Number(req.body?.mecanico_id);
    const usuarioId = req.usuario.id;
    if (!Number.isInteger(citaId) || citaId <= 0 || !Number.isInteger(mecanicoId) || mecanicoId <= 0) {
        return res.status(400).json({ mensaje: 'Cita y mecanico validos son requeridos' });
    }

    let connection;
    let transaccionIniciada = false;
    try {
        connection = await db.promise().getConnection();
        const [referencias] = await connection.query('SELECT taller_id FROM citas WHERE id = ?', [citaId]);
        if (referencias.length === 0) return res.status(404).json({ mensaje: 'Cita no encontrada' });
        const tallerId = referencias[0].taller_id;

        await connection.beginTransaction();
        transaccionIniciada = true;
        const [talleres] = await connection.query(
            'SELECT id FROM talleres WHERE id = ? AND usuario_id = ? FOR UPDATE',
            [tallerId, usuarioId]
        );
        if (talleres.length === 0) throw crearErrorHttp(404, 'Cita no encontrada');

        const [asociaciones] = await connection.query(
            `SELECT mt.id FROM mecanicos_taller mt
             INNER JOIN usuarios u ON u.id = mt.mecanico_id
             WHERE mt.taller_id = ? AND mt.mecanico_id = ?
               AND u.rol = 'mecanico' AND u.activo = 1 FOR UPDATE`,
            [tallerId, mecanicoId]
        );
        if (asociaciones.length === 0) throw crearErrorHttp(404, 'Mecanico asociado no encontrado');

        const [citas] = await connection.query(
            `SELECT id, taller_id, mecanico_id, fecha, duracion_minutos, estado,
                    confirmada_mecanico, fecha_confirmacion_mecanico
             FROM citas WHERE id = ? AND taller_id = ? FOR UPDATE`,
            [citaId, tallerId]
        );
        if (citas.length === 0) throw crearErrorHttp(404, 'Cita no encontrada');
        const cita = citas[0];
        if (!['pendiente', 'aceptada'].includes(cita.estado)) {
            throw crearErrorHttp(409, 'La cita ya no admite asignacion de mecanico');
        }
        if (Number(cita.mecanico_id) === mecanicoId) {
            await connection.commit();
            transaccionIniciada = false;
            return res.json({
                mensaje: 'El mecanico ya estaba asignado a la cita',
                cita: {
                    id: cita.id,
                    mecanico_id: mecanicoId,
                    confirmada_mecanico: Boolean(cita.confirmada_mecanico),
                    fecha_confirmacion_mecanico: cita.fecha_confirmacion_mecanico
                }
            });
        }

        const [horarios] = await connection.query(
            `SELECT id FROM horarios WHERE mecanico_id = ?
               AND dia_semana = DAYOFWEEK(?) - 1
               AND DATE(DATE_ADD(?, INTERVAL ? MINUTE)) = DATE(?)
               AND TIME(?) >= hora_inicio
               AND TIME(DATE_ADD(?, INTERVAL ? MINUTE)) <= hora_fin
             LIMIT 1 FOR UPDATE`,
            [mecanicoId, cita.fecha, cita.fecha, cita.duracion_minutos, cita.fecha,
                cita.fecha, cita.fecha, cita.duracion_minutos]
        );
        if (horarios.length === 0) {
            throw crearErrorHttp(409, 'El mecanico no tiene horario disponible para la cita');
        }

        const [conflictos] = await connection.query(
            `SELECT id FROM citas WHERE mecanico_id = ? AND id <> ?
               AND estado IN ('pendiente', 'aceptada')
               AND fecha < DATE_ADD(?, INTERVAL ? MINUTE)
               AND DATE_ADD(fecha, INTERVAL duracion_minutos MINUTE) > ?
             FOR UPDATE`,
            [mecanicoId, citaId, cita.fecha, cita.duracion_minutos, cita.fecha]
        );
        if (conflictos.length > 0) {
            throw crearErrorHttp(409, 'El mecanico ya tiene una cita activa en ese horario');
        }

        await connection.query(
            `UPDATE citas SET mecanico_id = ?, confirmada_mecanico = 0,
                    fecha_confirmacion_mecanico = NULL WHERE id = ?`,
            [mecanicoId, citaId]
        );
        await connection.commit();
        transaccionIniciada = false;
        return res.json({
            mensaje: 'Mecanico asignado correctamente',
            cita: { id: citaId, mecanico_id: mecanicoId, confirmada_mecanico: false, fecha_confirmacion_mecanico: null }
        });
    } catch (error) {
        if (connection && transaccionIniciada) {
            try { await connection.rollback(); } catch (errorRollback) {
                console.error('Error al revertir asignacion de mecanico:', errorRollback);
            }
        }
        if (error.status) return res.status(error.status).json({ mensaje: error.message });
        console.error('Error al asignar mecanico:', error);
        return res.status(500).json({ mensaje: 'Error al asignar el mecanico' });
    } finally {
        if (connection) connection.release();
    }
};

exports.actualizarEstadoCita = async (req, res) => {
    const citaId = Number(req.params.id);
    const nuevoEstado = req.body?.estado;
    const usuarioId = req.usuario.id;
    const transiciones = {
        pendiente: ['aceptada', 'cancelada'],
        aceptada: ['cancelada', 'finalizada'],
        cancelada: [],
        finalizada: []
    };

    if (!Number.isInteger(citaId) || citaId <= 0) {
        return res.status(400).json({ mensaje: 'Cita no valida' });
    }
    if (!Object.prototype.hasOwnProperty.call(transiciones, nuevoEstado)) {
        return res.status(400).json({ mensaje: 'Estado no valido' });
    }

    let connection;
    let transaccionIniciada = false;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();
        transaccionIniciada = true;
        const [citas] = await connection.query(
            `SELECT c.id, c.estado, c.mecanico_id, c.confirmada_mecanico
             FROM citas c
             INNER JOIN talleres t ON t.id = c.taller_id
             WHERE c.id = ? AND t.usuario_id = ?
             FOR UPDATE`,
            [citaId, usuarioId]
        );
        if (citas.length === 0) throw crearErrorHttp(404, 'Cita no encontrada');

        const cita = citas[0];
        if (!transiciones[cita.estado]?.includes(nuevoEstado)) {
            throw crearErrorHttp(409, `No se permite cambiar una cita ${cita.estado} a ${nuevoEstado}`);
        }
        if (
            nuevoEstado === 'finalizada' &&
            (cita.estado !== 'aceptada' || cita.mecanico_id === null || !cita.confirmada_mecanico)
        ) {
            throw crearErrorHttp(
                409,
                'Para finalizar, la cita debe estar aceptada, tener mecanico asignado y estar confirmada por el mecanico'
            );
        }

        await connection.query('UPDATE citas SET estado = ? WHERE id = ?', [nuevoEstado, citaId]);
        await connection.commit();
        transaccionIniciada = false;
        return res.json({
            mensaje: 'Estado de la cita actualizado correctamente',
            cita: {
                id: citaId,
                estado: nuevoEstado,
                mecanico_id: cita.mecanico_id,
                confirmada_mecanico: Boolean(cita.confirmada_mecanico)
            }
        });
    } catch (error) {
        if (connection && transaccionIniciada) {
            try { await connection.rollback(); } catch (errorRollback) {
                console.error('Error al revertir cambio de estado de cita:', errorRollback);
            }
        }
        if (error.status) return res.status(error.status).json({ mensaje: error.message });
        console.error('Error al actualizar estado de cita:', error);
        return res.status(500).json({ mensaje: 'Error al actualizar el estado de la cita' });
    } finally {
        if (connection) connection.release();
    }
};

exports.obtenerCitasMecanico = async (req, res) => {
    const mecanicoId = req.usuario.id;
    try {
        const [filas] = await db.promise().query(
            `SELECT c.id, DATE_FORMAT(c.fecha, '%Y-%m-%dT%H:%i:%s') AS fecha,
                    c.duracion_minutos, c.tipo_cita, c.descripcion_falla, c.estado,
                    c.confirmada_mecanico,
                    DATE_FORMAT(c.fecha_confirmacion_mecanico, '%Y-%m-%dT%H:%i:%s') AS fecha_confirmacion_mecanico,
                    t.id AS taller_id, t.nombre AS taller_nombre,
                    cl.id AS cliente_id, cl.nombre AS cliente_nombre,
                    v.id AS vehiculo_id, v.marca, v.modelo, v.placas
             FROM citas c
             INNER JOIN talleres t ON t.id = c.taller_id
             INNER JOIN usuarios cl ON cl.id = c.cliente_id
             INNER JOIN vehiculos v ON v.id = c.vehiculo_id
             WHERE c.mecanico_id = ?
             ORDER BY (c.fecha >= NOW()) DESC,
                      CASE WHEN c.fecha >= NOW() THEN c.fecha END ASC,
                      CASE WHEN c.fecha < NOW() THEN c.fecha END DESC,
                      c.id ASC`,
            [mecanicoId]
        );
        const citas = filas.map((fila) => ({
            id: fila.id,
            fecha: fila.fecha,
            duracion_minutos: fila.duracion_minutos,
            tipo_cita: fila.tipo_cita,
            descripcion_falla: fila.descripcion_falla,
            estado: fila.estado,
            confirmada_mecanico: Boolean(fila.confirmada_mecanico),
            fecha_confirmacion_mecanico: fila.fecha_confirmacion_mecanico,
            taller: { id: fila.taller_id, nombre: fila.taller_nombre },
            cliente: { id: fila.cliente_id, nombre: fila.cliente_nombre },
            vehiculo: { id: fila.vehiculo_id, marca: fila.marca, modelo: fila.modelo, placas: fila.placas }
        }));
        return res.json(citas);
    } catch (error) {
        console.error('Error al obtener citas del mecanico:', error);
        return res.status(500).json({ mensaje: 'Error al obtener las citas del mecanico' });
    }
};

exports.confirmarCitaMecanico = async (req, res) => {
    const citaId = Number(req.params.id);
    const mecanicoId = req.usuario.id;
    if (!Number.isInteger(citaId) || citaId <= 0) {
        return res.status(400).json({ mensaje: 'Cita no valida' });
    }

    let connection;
    let transaccionIniciada = false;
    try {
        connection = await db.promise().getConnection();
        const [referencias] = await connection.query(
            'SELECT taller_id FROM citas WHERE id = ? AND mecanico_id = ?',
            [citaId, mecanicoId]
        );
        if (referencias.length === 0) return res.status(404).json({ mensaje: 'Cita no encontrada' });

        await connection.beginTransaction();
        transaccionIniciada = true;
        const tallerId = referencias[0].taller_id;
        const [talleres] = await connection.query(
            'SELECT id FROM talleres WHERE id = ? FOR UPDATE', [tallerId]
        );
        if (talleres.length === 0) throw crearErrorHttp(404, 'Cita no encontrada');

        const [asociaciones] = await connection.query(
            `SELECT mt.id FROM mecanicos_taller mt
             INNER JOIN usuarios u ON u.id = mt.mecanico_id
             WHERE mt.taller_id = ? AND mt.mecanico_id = ?
               AND u.rol = 'mecanico' AND u.activo = 1 FOR UPDATE`,
            [tallerId, mecanicoId]
        );
        if (asociaciones.length === 0) throw crearErrorHttp(404, 'Cita no encontrada');

        const [citas] = await connection.query(
            `SELECT id, mecanico_id, estado, confirmada_mecanico,
                    fecha_confirmacion_mecanico
             FROM citas WHERE id = ? AND taller_id = ? FOR UPDATE`,
            [citaId, tallerId]
        );
        if (citas.length === 0 || Number(citas[0].mecanico_id) !== Number(mecanicoId)) {
            throw crearErrorHttp(404, 'Cita no encontrada');
        }
        const cita = citas[0];
        if (cita.estado !== 'aceptada') {
            throw crearErrorHttp(409, 'La cita ya no admite confirmacion');
        }

        if (cita.confirmada_mecanico) {
            await connection.commit();
            transaccionIniciada = false;
            return res.json({
                mensaje: 'Cita confirmada correctamente',
                cita: {
                    id: cita.id,
                    mecanico_id: mecanicoId,
                    confirmada_mecanico: true,
                    fecha_confirmacion_mecanico: cita.fecha_confirmacion_mecanico
                }
            });
        }

        await connection.query(
            `UPDATE citas SET confirmada_mecanico = 1,
                    fecha_confirmacion_mecanico = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [citaId]
        );
        const [[confirmada]] = await connection.query(
            'SELECT fecha_confirmacion_mecanico FROM citas WHERE id = ?', [citaId]
        );
        await connection.commit();
        transaccionIniciada = false;
        return res.json({
            mensaje: 'Cita confirmada correctamente',
            cita: {
                id: citaId,
                mecanico_id: mecanicoId,
                confirmada_mecanico: true,
                fecha_confirmacion_mecanico: confirmada.fecha_confirmacion_mecanico
            }
        });
    } catch (error) {
        if (connection && transaccionIniciada) {
            try { await connection.rollback(); } catch (errorRollback) {
                console.error('Error al revertir confirmacion de cita:', errorRollback);
            }
        }
        if (error.status) return res.status(error.status).json({ mensaje: error.message });
        console.error('Error al confirmar cita:', error);
        return res.status(500).json({ mensaje: 'Error al confirmar la cita' });
    } finally {
        if (connection) connection.release();
    }
};
