const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/mesas
router.get('/', (req, res) => {
  try {
    const mesas = db.prepare('SELECT id, numero as id, estado, mozo, capacidad FROM mesas ORDER BY numero').all();
    // Map to frontend format
    res.json(mesas.map(m => ({
      id: m.id,
      estado: m.estado,
      mozo: m.mozo,
      pedidos: []
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/mesas/:id
router.get('/:id', (req, res) => {
  try {
    const mesa = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(req.params.id);
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json(mesa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mesas
router.post('/', (req, res) => {
  try {
    const { id, estado, mozo, capacidad } = req.body;
    if (!id) return res.status(400).json({ error: 'Número de mesa requerido' });
    const result = db.prepare('INSERT INTO mesas (numero, estado, mozo, capacidad) VALUES (?, ?, ?, ?)')
      .run(id, estado || 'libre', mozo || null, capacidad || 4);
    res.status(201).json({ id, estado: estado || 'libre', mozo, message: 'Mesa creada' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ya existe una mesa con ese número' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/mesas/:id
router.put('/:id', (req, res) => {
  try {
    const { estado, mozo } = req.body;
    const mesa = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(req.params.id);
    if (!mesa) return res.status(404).json({ error: 'Mesa no encontrada' });

    db.prepare('UPDATE mesas SET estado = COALESCE(?, estado), mozo = ? WHERE numero = ?')
      .run(estado || null, mozo !== undefined ? mozo : mesa.mozo, req.params.id);
    res.json({ message: 'Mesa actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/mesas/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM mesas WHERE numero = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Mesa no encontrada' });
    res.json({ message: 'Mesa eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
