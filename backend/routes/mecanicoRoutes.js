const express = require('express');
const verificarToken = require('../middleware/authMiddleware');
const permitirRoles = require('../middleware/roleMiddleware');
const { obtenerCitasMecanico } = require('../controllers/citaController');

const router = express.Router();

router.get('/citas/mias', verificarToken, permitirRoles('mecanico'), obtenerCitasMecanico);

module.exports = router;
