const express = require('express');

const verificarToken = require('../middleware/authMiddleware');

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
    crearTaller
);

router.put('/:id', actualizarTaller);

module.exports = router;