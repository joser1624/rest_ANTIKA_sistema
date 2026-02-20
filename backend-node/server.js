/**
 * ANTIKA RESTAURANT – Backend Node.js
 * Servidor Express con SQLite para el panel de administración
 * 
 * Arquitectura Cliente-Servidor:
 * - Frontend: Servido por Live Server (http://127.0.0.1:5500)
 * - Backend: Servidor API (http://localhost:3000)
 * - Comunicación via REST API + CORS
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - Allow frontend from Live Server
const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Database setup
const db = require('./database');

// API Routes
const platosRoutes = require('./routes/platos');
const empleadosRoutes = require('./routes/empleados');
const mesasRoutes = require('./routes/mesas');
const pedidosRoutes = require('./routes/pedidos');
const usuariosRoutes = require('./routes/usuarios');
const reservasRoutes = require('./routes/reservas');
const asistenciaRoutes = require('./routes/asistencia');
const reportesRoutes = require('./routes/reportes');
const cajaRoutes = require('./routes/caja');

app.use('/api/platos', platosRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/caja', cajaRoutes);

// Serve favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'favicon.svg'));
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'admin.html'));
});

// Serve index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Antika Restaurant API running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Error interno del servidor', details: err.message });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🍽  ANTIKA RESTAURANT – Backend API    ║
  ║   Servidor corriendo en puerto ${PORT}       ║
  ║   http://localhost:${PORT}                   ║
  ║   Admin: http://localhost:${PORT}/admin      ║
  ╚══════════════════════════════════════════╝
  `);
});
