const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/asistencia - Get today's attendance
router.get('/', (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const registros = db.prepare('SELECT a.*, e.nombre, e.cargo FROM asistencia a JOIN empleados e ON a.empleado_id = e.id WHERE a.fecha = ? ORDER BY a.hora DESC').all(fecha);
    res.json(registros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/asistencia - Register entry/exit
router.post('/', (req, res) => {
  try {
    const { empleadoId, tipo, hora } = req.body;
    if (!empleadoId || !tipo) {
      return res.status(400).json({ error: 'empleadoId y tipo son requeridos' });
    }

    const horaRegistro = hora || new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const fecha = new Date().toISOString().split('T')[0];

    const result = db.prepare('INSERT INTO asistencia (empleado_id, tipo, hora, fecha) VALUES (?, ?, ?, ?)')
      .run(empleadoId, tipo, horaRegistro, fecha);

    // Update employee record
    if (tipo === 'entrada') {
      db.prepare('UPDATE empleados SET entrada = ?, estado = ? WHERE id = ?').run(horaRegistro, 'activo', empleadoId);
    } else if (tipo === 'salida') {
      db.prepare('UPDATE empleados SET salida = ? WHERE id = ?').run(horaRegistro, empleadoId);
    }

    res.status(201).json({ id: result.lastInsertRowid, empleadoId, tipo, hora: horaRegistro, message: `${tipo} registrada` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/asistencia/resumen - Get attendance summary
router.get('/resumen', (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const total = db.prepare('SELECT COUNT(DISTINCT empleado_id) as total FROM asistencia WHERE fecha = ? AND tipo = ?').get(fecha, 'entrada');
    const salidas = db.prepare('SELECT COUNT(DISTINCT empleado_id) as total FROM asistencia WHERE fecha = ? AND tipo = ?').get(fecha, 'salida');
    res.json({
      fecha,
      entradas: total.total,
      salidas: salidas.total,
      presentes: total.total - salidas.total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
