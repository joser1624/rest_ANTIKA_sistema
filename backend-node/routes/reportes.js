const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/reportes/resumen
router.get('/resumen', (req, res) => {
  try {
    const periodo = req.query.periodo || 'hoy';
    const hoy = new Date().toISOString().split('T')[0];

    let fechaInicio;
    if (periodo === 'hoy') {
      fechaInicio = hoy;
    } else if (periodo === 'semana') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      fechaInicio = d.toISOString().split('T')[0];
    } else if (periodo === 'mes') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      fechaInicio = d.toISOString().split('T')[0];
    }

    // Get totals from transactions
    const ingresos = db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM transacciones WHERE fecha >= ?').get(fechaInicio);
    const transCount = db.prepare('SELECT COUNT(*) as count FROM transacciones WHERE fecha >= ?').get(fechaInicio);
    const pedidosCount = db.prepare('SELECT COUNT(*) as count FROM pedidos WHERE created_at >= ?').get(fechaInicio);

    res.json({
      periodo,
      ingresos: ingresos.total,
      transacciones: transCount.count,
      pedidos: pedidosCount.count,
      ticketPromedio: transCount.count > 0 ? (ingresos.total / transCount.count).toFixed(2) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reportes/platos-top
router.get('/platos-top', (req, res) => {
  try {
    // Since we store items as JSON in pedidos, we'll return static data for now
    // In production, you'd parse the JSON and aggregate
    const topPlatos = [
      { nombre: 'Lomo Saltado', count: 89 },
      { nombre: 'Trucha Fungi', count: 74 },
      { nombre: 'Chaufa de Pollo', count: 61 },
      { nombre: 'Arroz con Pollo', count: 55 },
      { nombre: '6 Alitas BBQ', count: 48 },
    ];
    res.json(topPlatos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reportes/ingresos-diarios
router.get('/ingresos-diarios', (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;
    const registros = db.prepare(`
      SELECT fecha, SUM(total) as total, COUNT(*) as transacciones 
      FROM transacciones 
      WHERE fecha >= date('now', '-${dias} days')
      GROUP BY fecha 
      ORDER BY fecha
    `).all();
    res.json(registros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reportes/dashboard
router.get('/dashboard', (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    
    const pedidosActivos = db.prepare("SELECT COUNT(*) as count FROM pedidos WHERE estado != 'despachado'").get();
    const mesasOcupadas = db.prepare("SELECT COUNT(*) as count FROM mesas WHERE estado = 'ocupada'").get();
    const personalActivo = db.prepare("SELECT COUNT(*) as count FROM empleados WHERE estado = 'activo'").get();
    const ingresosHoy = db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM transacciones WHERE fecha = ?').get(hoy);

    res.json({
      pedidosActivos: pedidosActivos.count,
      mesasOcupadas: mesasOcupadas.count,
      personalActivo: personalActivo.count,
      ingresosHoy: ingresosHoy.total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
