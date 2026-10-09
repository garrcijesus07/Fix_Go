require('dotenv').config();
require('./config/db');

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes')); /* ruta para endpoints*/
app.use('/api/talleres', require('./routes/tallerRoutes'));
app.use('/api/categorias', require('./routes/categoriaRoutes'));
app.use('/api/vehiculos', require('./routes/vehiculoRoutes'));
app.use('/api/citas', require('./routes/citaRoutes'));
app.use('/api/mecanicos', require('./routes/mecanicoRoutes'));

app.get('/', (req, res) => {
  res.send('API Taller Mecánico');
});

app.listen(3000, () => {
  console.log('Servidor iniciado en puerto 3000');
});
