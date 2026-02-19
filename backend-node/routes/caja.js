const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/caja - Get today's transactions
router.get('/', (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const transacciones = db.prepare('SELECT * FROM transacciones WHERE fecha = ? ORDER BY hora DESC').all(fecha);
    res.json(transacciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/caja/resumen
router.get('/resumen', (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const efectivo = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM transacciones WHERE fecha = ? AND metodo = 'Efectivo'").get(fecha);
    const tarjeta = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM transacciones WHERE fecha = ? AND metodo LIKE '%Tarjeta%'").get(fecha);
    const count = db.prepare('SELECT COUNT(*) as count FROM transacciones WHERE fecha = ?').get(fecha);
    const total = efectivo.total + tarjeta.total;

    res.json({
      fecha,
      efectivo: efectivo.total,
      tarjeta: tarjeta.total,
      total,
      transacciones: count.count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/caja - Register transaction
router.post('/', (req, res) => {
  try {
    const { hora, mesa, mozo, total, metodo, estado } = req.body;
    if (!mesa || !total || !metodo) {
      return res.status(400).json({ error: 'Mesa, total y método de pago son requeridos' });
    }

    const horaRegistro = hora || new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const result = db.prepare('INSERT INTO transacciones (hora, mesa, mozo, total, metodo, estado) VALUES (?, ?, ?, ?, ?, ?)')
      .run(horaRegistro, mesa, mozo || '—', total, metodo, estado || 'pagado');

    res.status(201).json({ id: result.lastInsertRowid, message: 'Transacción registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/caja/cerrar - Close today's register
router.post('/cerrar', (req, res) => {
  try {
    const fecha = new Date().toISOString().split('T')[0];
    const resumen = db.prepare('SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count FROM transacciones WHERE fecha = ?').get(fecha);

    res.json({
      message: 'Caja cerrada correctamente',
      fecha,
      total: resumen.total,
      transacciones: resumen.count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
