const express = require('express');
const verificarToken = require('../middleware/authMiddleware');
const permitirRoles = require('../middleware/roleMiddleware');
const {
    obtenerCategorias,
    obtenerCategoriasAdmin,
    crearCategoria,
    actualizarCategoria,
    actualizarEstadoCategoria
} = require('../controllers/categoriaController');

const router = express.Router();
const soloAdministradores = permitirRoles('administrador');

router.get('/', obtenerCategorias);
router.get('/admin', verificarToken, soloAdministradores, obtenerCategoriasAdmin);
router.post('/', verificarToken, soloAdministradores, crearCategoria);
router.put('/:id', verificarToken, soloAdministradores, actualizarCategoria);
router.patch('/:id/estado', verificarToken, soloAdministradores, actualizarEstadoCategoria);

module.exports = router;
