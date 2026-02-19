const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/reservas
router.get('/', (req, res) => {
  try {
    const reservas = db.prepare('SELECT * FROM reservas ORDER BY fecha DESC, hora DESC').all();
    res.json(reservas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reservas/:id
router.get('/:id', (req, res) => {
  try {
    const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(reserva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reservas
router.post('/', (req, res) => {
  try {
    const { cliente, fecha, hora, personas, mesa, estado, telefono } = req.body;
    if (!cliente || !fecha || !hora) {
      return res.status(400).json({ error: 'Cliente, fecha y hora son requeridos' });
    }
    const result = db.prepare('INSERT INTO reservas (cliente, fecha, hora, personas, mesa, estado, telefono) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(cliente, fecha, hora, personas || 2, mesa || null, estado || 'pendiente', telefono || null);
    res.status(201).json({ id: result.lastInsertRowid, cliente, fecha, hora, message: 'Reserva creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/reservas/:id
router.put('/:id', (req, res) => {
  try {
    const { cliente, fecha, hora, personas, mesa, estado } = req.body;
    const reserva = db.prepare('SELECT * FROM reservas WHERE id = ?').get(req.params.id);
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    db.prepare(`UPDATE reservas SET 
      cliente = COALESCE(?, cliente),
      fecha = COALESCE(?, fecha),
      hora = COALESCE(?, hora),
      personas = COALESCE(?, personas),
      mesa = COALESCE(?, mesa),
      estado = COALESCE(?, estado)
      WHERE id = ?`).run(
      cliente || null, fecha || null, hora || null,
      personas || null, mesa || null, estado || null, req.params.id
    );
    res.json({ message: 'Reserva actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reservas/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM reservas WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ message: 'Reserva eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
