const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/pedidos
router.get('/', (req, res) => {
  try {
    const pedidos = db.prepare('SELECT * FROM pedidos ORDER BY tiempo DESC').all();
    res.json(pedidos.map(p => ({
      id: p.id,
      mesa: p.mesa_id,
      estado: p.estado,
      cocineros: JSON.parse(p.cocineros || '[]'),
      tiempo: p.tiempo,
      items: JSON.parse(p.items || '[]'),
      total: p.total
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pedidos/:id
router.get('/:id', (req, res) => {
  try {
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({
      ...pedido,
      mesa: pedido.mesa_id,
      cocineros: JSON.parse(pedido.cocineros || '[]'),
      items: JSON.parse(pedido.items || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pedidos
router.post('/', (req, res) => {
  try {
    const { id, mesa, items, estado, cocineros, tiempo } = req.body;
    if (!id || !mesa) return res.status(400).json({ error: 'ID y mesa son requeridos' });
    
    db.prepare('INSERT INTO pedidos (id, mesa_id, estado, cocineros, tiempo, items) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, mesa, estado || 'pendiente', JSON.stringify(cocineros || []), tiempo || Date.now(), JSON.stringify(items || []));
    res.status(201).json({ id, mesa, estado: estado || 'pendiente', message: 'Pedido creado' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ya existe un pedido con ese ID' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/pedidos/:id
router.put('/:id', (req, res) => {
  try {
    const { estado, cocineros, items, total } = req.body;
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (estado) {
      db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(estado, req.params.id);
    }
    if (cocineros) {
      db.prepare('UPDATE pedidos SET cocineros = ? WHERE id = ?').run(JSON.stringify(cocineros), req.params.id);
    }
    if (items) {
      db.prepare('UPDATE pedidos SET items = ? WHERE id = ?').run(JSON.stringify(items), req.params.id);
    }
    if (total !== undefined) {
      db.prepare('UPDATE pedidos SET total = ? WHERE id = ?').run(total, req.params.id);
    }
    res.json({ message: 'Pedido actualizado', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pedidos/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM pedidos WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ message: 'Pedido eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
