const express = require('express');

const verificarToken = require('../middleware/authMiddleware');
const permitirRoles = require('../middleware/roleMiddleware');
const {
    crearCita,
    obtenerMisCitas,
    obtenerDisponibilidad,
    asignarMecanico,
    actualizarEstadoCita,
    confirmarCitaMecanico
} = require('../controllers/citaController');

const router = express.Router();
const soloClientes = permitirRoles('cliente');
const soloTalleres = permitirRoles('taller');
const soloMecanicos = permitirRoles('mecanico');

router.get('/mias', verificarToken, soloClientes, obtenerMisCitas);

router.get(
    '/disponibilidad',
    verificarToken,
    soloClientes,
    obtenerDisponibilidad
);

router.post('/', verificarToken, soloClientes, crearCita);
router.patch('/:id/mecanico', verificarToken, soloTalleres, asignarMecanico);
router.patch('/:id/estado', verificarToken, soloTalleres, actualizarEstadoCita);
router.patch('/:id/confirmar-mecanico', verificarToken, soloMecanicos, confirmarCitaMecanico);

module.exports = router;
