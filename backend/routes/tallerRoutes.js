const express = require('express');

const verificarToken = require('../middleware/authMiddleware');
const permitirRoles = require('../middleware/roleMiddleware');

const soloTalleres = permitirRoles('taller');

const router = express.Router();

const {
    obtenerTalleres,
    obtenerTaller,
    crearTaller,
    actualizarTaller,
    obtenerHorariosTaller,
    reemplazarHorariosTaller
} = require('../controllers/tallerController');

router.get('/', obtenerTalleres);

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
