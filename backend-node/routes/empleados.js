const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/empleados
router.get('/', (req, res) => {
  try {
    const empleados = db.prepare('SELECT * FROM empleados ORDER BY id').all();
    res.json(empleados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/empleados/:id
router.get('/:id', (req, res) => {
  try {
    const emp = db.prepare('SELECT * FROM empleados WHERE id = ?').get(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/empleados
router.post('/', (req, res) => {
  try {
    const { nombre, cargo, turno, sueldo, estado } = req.body;
    if (!nombre || !cargo) return res.status(400).json({ error: 'Nombre y cargo son requeridos' });
    const result = db.prepare('INSERT INTO empleados (nombre, cargo, turno, sueldo, estado) VALUES (?, ?, ?, ?, ?)')
      .run(nombre, cargo, turno || 'Mañana', sueldo || 0, estado || 'activo');
    res.status(201).json({ id: result.lastInsertRowid, nombre, cargo, turno, sueldo, estado: estado || 'activo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/empleados/:id
router.put('/:id', (req, res) => {
  try {
    const { nombre, cargo, turno, sueldo, estado, entrada, salida } = req.body;
    const emp = db.prepare('SELECT * FROM empleados WHERE id = ?').get(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });

    db.prepare(`UPDATE empleados SET 
      nombre = COALESCE(?, nombre),
      cargo = COALESCE(?, cargo),
      turno = COALESCE(?, turno),
      sueldo = COALESCE(?, sueldo),
      estado = COALESCE(?, estado),
      entrada = COALESCE(?, entrada),
      salida = COALESCE(?, salida)
      WHERE id = ?`).run(
      nombre || null, cargo || null, turno || null, sueldo || null,
      estado || null, entrada || null, salida || null, req.params.id
    );
    res.json({ message: 'Empleado actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/empleados/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM empleados WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json({ message: 'Empleado eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
