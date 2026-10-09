const db = require('../config/db');

const normalizarSlug = (valor) => {
    if (typeof valor !== 'string') return '';
    return valor.trim().toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
};

const validarDatos = (body) => {
    const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';
    const slug = normalizarSlug(body?.slug);
    const orden = Number(body?.orden);
    if (!nombre || nombre.length > 100) return { error: 'El nombre es obligatorio y admite hasta 100 caracteres' };
    if (!slug || slug.length > 100) return { error: 'El slug es obligatorio y admite hasta 100 caracteres' };
    if (!Number.isInteger(orden) || orden < 0 || orden > 100000) return { error: 'El orden debe ser un entero entre 0 y 100000' };
    return { nombre, slug, orden };
};

exports.obtenerCategorias = async (req, res) => {
    try {
        const [categorias] = await db.promise().query(
            `SELECT id, nombre, slug FROM categorias
             WHERE activo = 1 ORDER BY orden ASC, nombre ASC`
        );
        return res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorias:', error);
        return res.status(500).json({ mensaje: 'Error al obtener las categorias' });
    }
};

exports.obtenerCategoriasAdmin = async (req, res) => {
    try {
        const [categorias] = await db.promise().query(
            `SELECT id, nombre, slug, activo, orden
             FROM categorias
             ORDER BY orden ASC, nombre ASC`
        );
        return res.json(categorias.map((categoria) => ({
            ...categoria,
            activo: Boolean(categoria.activo)
        })));
    } catch (error) {
        console.error('Error al obtener categorias para administracion:', error);
        return res.status(500).json({ mensaje: 'Error al obtener las categorias' });
    }
};

exports.crearCategoria = async (req, res) => {
    const datos = validarDatos(req.body);
    if (datos.error) return res.status(400).json({ mensaje: datos.error });
    try {
        const [resultado] = await db.promise().query(
            'INSERT INTO categorias (nombre, slug, orden) VALUES (?, ?, ?)',
            [datos.nombre, datos.slug, datos.orden]
        );
        return res.status(201).json({
            mensaje: 'Categoria creada correctamente',
            categoria: { id: resultado.insertId, nombre: datos.nombre, slug: datos.slug, activo: true, orden: datos.orden }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'El slug ya esta registrado' });
        console.error('Error al crear categoria:', error);
        return res.status(500).json({ mensaje: 'Error al crear la categoria' });
    }
};

exports.actualizarCategoria = async (req, res) => {
    const categoriaId = Number(req.params.id);
    const datos = validarDatos(req.body);
    if (!Number.isInteger(categoriaId) || categoriaId <= 0) return res.status(400).json({ mensaje: 'Categoria no valida' });
    if (datos.error) return res.status(400).json({ mensaje: datos.error });
    try {
        const [resultado] = await db.promise().query(
            'UPDATE categorias SET nombre = ?, slug = ?, orden = ? WHERE id = ?',
            [datos.nombre, datos.slug, datos.orden, categoriaId]
        );
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Categoria no encontrada' });
        return res.json({ mensaje: 'Categoria actualizada correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'El slug ya esta registrado' });
        console.error('Error al actualizar categoria:', error);
        return res.status(500).json({ mensaje: 'Error al actualizar la categoria' });
    }
};

exports.actualizarEstadoCategoria = async (req, res) => {
    const categoriaId = Number(req.params.id);
    if (!Number.isInteger(categoriaId) || categoriaId <= 0) return res.status(400).json({ mensaje: 'Categoria no valida' });
    if (typeof req.body?.activo !== 'boolean') return res.status(400).json({ mensaje: 'activo debe ser booleano' });
    try {
        const [resultado] = await db.promise().query(
            'UPDATE categorias SET activo = ? WHERE id = ?',
            [req.body.activo ? 1 : 0, categoriaId]
        );
        if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Categoria no encontrada' });
        return res.json({ mensaje: 'Estado de la categoria actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar estado de categoria:', error);
        return res.status(500).json({ mensaje: 'Error al actualizar el estado de la categoria' });
    }
};

exports.normalizarSlug = normalizarSlug;
