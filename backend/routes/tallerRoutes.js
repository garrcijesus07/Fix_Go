const express = require('express');

const verificarToken = require('../middleware/authMiddleware');
const permitirRoles = require('../middleware/roleMiddleware');

const soloTalleres = permitirRoles('taller');

const router = express.Router();

const {
    obtenerTalleres,
    obtenerMisTalleres,
    obtenerMecanicosTaller,
    obtenerCitasTaller,
    obtenerMecanicosDisponiblesCita,
    buscarMecanicoTaller,
    asociarMecanicoTaller,
    desvincularMecanicoTaller,
    registrarNuevoMecanicoTaller,
    obtenerHorariosMecanico,
    reemplazarHorariosMecanico,
    obtenerTaller,
    crearTaller,
    actualizarTaller,
    obtenerHorariosTaller,
    reemplazarHorariosTaller
} = require('../controllers/tallerController');

router.get('/', obtenerTalleres);

router.get(
    '/mios',
    verificarToken,
    soloTalleres,
    obtenerMisTalleres
);

router.get(
    '/:tallerId/citas/:citaId/mecanicos-disponibles',
    verificarToken,
    soloTalleres,
    obtenerMecanicosDisponiblesCita
);

router.get(
    '/:tallerId/citas',
    verificarToken,
    soloTalleres,
    obtenerCitasTaller
);

router.get(
    '/:tallerId/mecanicos/:mecanicoId/horarios',
    verificarToken,
    soloTalleres,
    obtenerHorariosMecanico
);

router.put(
    '/:tallerId/mecanicos/:mecanicoId/horarios',
    verificarToken,
    soloTalleres,
    reemplazarHorariosMecanico
);

router.delete(
    '/:tallerId/mecanicos/:mecanicoId',
    verificarToken,
    soloTalleres,
    desvincularMecanicoTaller
);

router.get(
    '/:id/mecanicos/buscar',
    verificarToken,
    soloTalleres,
    buscarMecanicoTaller
);

router.get(
    '/:id/mecanicos',
    verificarToken,
    soloTalleres,
    obtenerMecanicosTaller
);

router.post(
    '/:id/mecanicos/nuevo',
    verificarToken,
    soloTalleres,
    registrarNuevoMecanicoTaller
);

router.post(
    '/:id/mecanicos',
    verificarToken,
    soloTalleres,
    asociarMecanicoTaller
);

router.get('/:id', obtenerTaller);

router.get(
    '/:id/horarios',
    verificarToken,
    soloTalleres,
    obtenerHorariosTaller
);

router.put(
    '/:id/horarios',
    verificarToken,
    soloTalleres,
    reemplazarHorariosTaller
);

router.post(
    '/',
    verificarToken,
    soloTalleres,
    crearTaller
);

router.put(
    '/:id',
    verificarToken,
    soloTalleres,
    actualizarTaller
);

module.exports = router;
