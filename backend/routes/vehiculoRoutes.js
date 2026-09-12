const express = require('express');

const router = express.Router();

const verificarToken =
require('../middleware/authMiddleware');

const permitirRoles =
require('../middleware/roleMiddleware');

const soloClientes = permitirRoles('cliente');

const {
    obtenerVehiculos,
    obtenerVehiculo,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo
} = require('../controllers/vehiculoController');

router.get('/', verificarToken, soloClientes, obtenerVehiculos);

router.get('/:id', verificarToken, soloClientes, obtenerVehiculo);

router.post('/', verificarToken, soloClientes, crearVehiculo);

router.put('/:id', verificarToken, soloClientes, actualizarVehiculo);

router.delete('/:id', verificarToken, soloClientes, eliminarVehiculo);

module.exports = router;
