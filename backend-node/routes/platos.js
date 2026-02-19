const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/platos - Get all platos
router.get('/', (req, res) => {
  try {
    const platos = db.prepare('SELECT id, nombre, categoria, precio, descripcion as desc, disponible FROM platos ORDER BY id').all();
    res.json(platos.map(p => ({ ...p, disponible: !!p.disponible })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/platos/:id
router.get('/:id', (req, res) => {
  try {
    const plato = db.prepare('SELECT * FROM platos WHERE id = ?').get(req.params.id);
    if (!plato) return res.status(404).json({ error: 'Plato no encontrado' });
    res.json({ ...plato, disponible: !!plato.disponible });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/platos - Create plato
router.post('/', (req, res) => {
  try {
    const { nombre, categoria, precio, desc, disponible } = req.body;
    if (!nombre || !precio) return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    const result = db.prepare('INSERT INTO platos (nombre, categoria, precio, descripcion, disponible) VALUES (?, ?, ?, ?, ?)')
      .run(nombre, categoria || '', precio, desc || '', disponible !== false ? 1 : 0);
    res.status(201).json({ id: result.lastInsertRowid, nombre, categoria, precio, desc, disponible: disponible !== false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/platos/:id - Update plato
router.put('/:id', (req, res) => {
  try {
    const { nombre, categoria, precio, desc, disponible } = req.body;
    const plato = db.prepare('SELECT * FROM platos WHERE id = ?').get(req.params.id);
    if (!plato) return res.status(404).json({ error: 'Plato no encontrado' });

    db.prepare(`UPDATE platos SET 
      nombre = COALESCE(?, nombre),
      categoria = COALESCE(?, categoria),
      precio = COALESCE(?, precio),
      descripcion = COALESCE(?, descripcion),
      disponible = COALESCE(?, disponible)
      WHERE id = ?`).run(
      nombre || null, categoria || null, precio || null, desc || null,
      disponible !== undefined ? (disponible ? 1 : 0) : null,
      req.params.id
    );
    res.json({ message: 'Plato actualizado', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/platos/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM platos WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Plato no encontrado' });
    res.json({ message: 'Plato eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
