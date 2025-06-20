const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();


app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/prestamos-libros')
.then(() => {
  console.log('MongoDB conectado en:', mongoose.connection.host);
  console.log('Base de datos:', mongoose.connection.name);
})
.catch(err => {
  console.error('Error de conexion a MongoDB:', err.message);
  process.exit(1);
});

mongoose.connection.on('connected', () => {
  console.log('Mongoose conectado');
});

mongoose.connection.on('error', (err) => {
  console.error('Error con Mongoose:', err);
});


const Prestamo = mongoose.model('Prestamo', new mongoose.Schema({
  titulo: { type: String, required: [true, 'El título es obligatorio'], trim: true },
  autor: { type: String, required: [true, 'El autor es obligatorio'], trim: true },
  amigo: { type: String, required: [true, 'El nombre del amigo es obligatorio'], trim: true },
  fechaPrestamo: { type: Date, required: true, default: Date.now },
  fechaLimite: Date,
  fechaDevolucion: Date,
  estado: { type: String, enum: ['Prestado', 'Devuelto'], default: 'Prestado' }
}));


app.get('/', (req, res) => {
  res.send('Backend funcionando correctamente');
});

app.get('/api/prestamos', async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = estado ? { estado } : {};
    const prestamos = await Prestamo.find(filtro).sort({ fechaPrestamo: -1 });
    res.json(prestamos);
  } catch (err) {
    console.error('Error al obtener préstamos:', err);
    res.status(500).json({ error: 'Error al cargar préstamos' });
  }
});

app.post('/api/prestamos', async (req, res) => {
  try {
    if (!req.body.titulo || !req.body.autor || !req.body.amigo) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const prestamo = new Prestamo({
      ...req.body,
      estado: 'Prestado'
    });

    await prestamo.save();
    res.status(201).json(prestamo);
  } catch (err) {
    console.error('Error al crear préstamo:', err);
    res.status(400).json({
      error: err.message.includes('validation')
        ? 'Datos inválidos: ' + err.message
        : 'Error al guardar el préstamo'
    });
  }
});

app.put('/api/prestamos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    if (datosActualizados.estado === 'Devuelto') {
      datosActualizados.fechaDevolucion = new Date();
    }

    const prestamo = await Prestamo.findByIdAndUpdate(
      id,
      datosActualizados,
      { new: true, runValidators: true }
    );

    if (!prestamo) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    res.json(prestamo);
  } catch (err) {
    console.error('Error al actualizar préstamo:', err);
    res.status(400).json({ error: 'Error al actualizar' });
  }
});

app.delete('/api/prestamos/:id', async (req, res) => {
  try {
    const prestamo = await Prestamo.findByIdAndDelete(req.params.id);
    if (!prestamo) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    res.json({ message: 'Préstamo eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar préstamo:', err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name,
      host: mongoose.connection.host
    },
    collections: {
      prestamos: true
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nServidor escuchando en http://localhost:${PORT}`);
});
