const express = require('express');

const router = express.Router();

const verificarToken =
require('../middleware/authMiddleware');

const {
    obtenerVehiculos,
    obtenerVehiculo,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo
} = require('../controllers/vehiculoController');

router.get('/', verificarToken, obtenerVehiculos);

router.get('/:id', verificarToken, obtenerVehiculo);

router.post('/', verificarToken, crearVehiculo);

router.put('/:id', verificarToken, actualizarVehiculo);

router.delete('/:id', verificarToken, eliminarVehiculo);

module.exports = router;