const express = require('express');

const verificarToken = require('../middleware/authMiddleware');
const permitirRoles = require('../middleware/roleMiddleware');

const soloTalleres = permitirRoles('taller');

const router = express.Router();

const {
    obtenerTalleres,
    obtenerTaller,
    crearTaller,
    actualizarTaller
} = require('../controllers/tallerController');

router.get('/', obtenerTalleres);

router.get('/:id', obtenerTaller);

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
