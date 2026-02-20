const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/pedidos/mesa/:mesaId - Obtener pedido activo de una mesa
router.get('/mesa/:mesaId', (req, res) => {
  try {
    const mesaId = parseInt(req.params.mesaId);
    // Buscar pedido activo para esta mesa (no despachado ni cerrado)
    const pedido = db.prepare("SELECT * FROM pedidos WHERE mesa_id = ? AND estado != 'despachado' AND estado != 'cerrado' ORDER BY tiempo DESC").get(mesaId);
    
    if (!pedido) {
      return res.json({ id: null, mesa: mesaId, items: [], total: 0, estado: null });
    }
    
    res.json({
      id: pedido.id,
      mesa: pedido.mesa_id,
      estado: pedido.estado,
      cocineros: JSON.parse(pedido.cocineros || '[]'),
      tiempo: pedido.tiempo,
      items: JSON.parse(pedido.items || '[]'),
      total: pedido.total,
      mozo: pedido.mozo
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// POST /api/pedidos/agregar/:mesaId - Agregar platos a una mesa
router.post('/agregar/:mesaId', (req, res) => {
  try {
    const mesaId = parseInt(req.params.mesaId);
    const { items, mozo } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de items' });
    }
    
    // Find existing pedido for this mesa
    let pedido = db.prepare("SELECT * FROM pedidos WHERE mesa_id = ? AND estado != 'despachado' AND estado != 'cerrado' ORDER BY tiempo DESC").get(mesaId);
    
    if (!pedido) {
      // Create new pedido
      const newId = 'P-' + String(Date.now()).slice(-6);
      const now = Date.now();
      db.prepare('INSERT INTO pedidos (id, mesa_id, estado, cocineros, tiempo, items, total) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(newId, mesaId, 'pendiente', '[]', now, JSON.stringify(items), 0);
      
      // Update mesa estado - use numero to match the correct column
      db.prepare('UPDATE mesas SET estado = ?, mozo = ? WHERE numero = ?').run('ocupada', mozo || 'Mozo', mesaId);
      
      res.status(201).json({ id: newId, mesa: mesaId, message: 'Pedido creado y platos agregados' });
    } else {
      // Add items to existing pedido
      const existingItems = JSON.parse(pedido.items || '[]');
      const updatedItems = [...existingItems, ...items];
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      
      db.prepare('UPDATE pedidos SET items = ?, total = ? WHERE id = ?')
        .run(JSON.stringify(updatedItems), newTotal, pedido.id);
      
      res.json({ id: pedido.id, mesa: mesaId, message: 'Platos agregados al pedido existente' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pedidos/quitar/:pedidoId - Quitar un item del pedido
router.post('/quitar/:pedidoId', (req, res) => {
  try {
    const { itemId } = req.body;
    const pedidoId = req.params.pedidoId;
    
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    
    const items = JSON.parse(pedido.items || '[]');
    
    // Filter out the item to remove
    const updatedItems = items.filter((item, index) => index !== itemId);
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    db.prepare('UPDATE pedidos SET items = ?, total = ? WHERE id = ?')
      .run(JSON.stringify(updatedItems), newTotal, pedidoId);
    
    res.json({ message: 'Item eliminado', pedidoId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pedidos/cantidad/:pedidoId - Cambiar cantidad de un item
router.post('/cantidad/:pedidoId', (req, res) => {
  try {
    const { itemId, cantidad } = req.body;
    const pedidoId = req.params.pedidoId;
    
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    
    const items = JSON.parse(pedido.items || '[]');
    
    if (itemId >= 0 && itemId < items.length) {
      items[itemId].cantidad = cantidad;
      const newTotal = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
      
      db.prepare('UPDATE pedidos SET items = ?, total = ? WHERE id = ?')
        .run(JSON.stringify(items), newTotal, pedidoId);
      
      res.json({ message: 'Cantidad actualizada', pedidoId });
    } else {
      return res.status(400).json({ error: 'Índice de item inválido' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
