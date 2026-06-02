require('dotenv').config();
require('./config/db');

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Taller Mecánico');
});

app.listen(3000, () => {
  console.log('Servidor iniciado en puerto 3000');
});