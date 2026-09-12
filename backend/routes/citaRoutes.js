const express = require('express');

const verificarToken = require('../middleware/authMiddleware');
const permitirRoles = require('../middleware/roleMiddleware');
const {
    crearCita,
    obtenerMisCitas,
    obtenerDisponibilidad
} = require('../controllers/citaController');

const router = express.Router();
const soloClientes = permitirRoles('cliente');

router.get('/mias', verificarToken, soloClientes, obtenerMisCitas);

router.get(
    '/disponibilidad',
    verificarToken,
    soloClientes,
    obtenerDisponibilidad
);

router.post('/', verificarToken, soloClientes, crearCita);

module.exports = router;
