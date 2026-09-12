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

        return res.json(citas);
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
