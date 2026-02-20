/**
 * ANTIKA RESTAURANT – Menu Routes
 * Rutas para obtener el menú completo con categorías
 */

const express = require('express');
const router = express.Router();
const db = require('../database');

/**
 * GET /api/menu
 * Obtener menú completo organizado por categorías
 * 
 * Respuesta:
 * {
 *   categorias: ['Desayunos', 'Fondos', ...],
 *   menu: {
 *     Desayunos: [{id, nombre, precio, desc, disponible}, ...],
 *     Fondos: [...]
 *   }
 * }
 */
router.get('/', (req, res) => {
  try {
    // Obtener todas las categorías únicas
    const categorias = db.prepare(`
      SELECT DISTINCT categoria 
      FROM platos 
      WHERE disponible = 1
      ORDER BY categoria
    `).all();

    // Obtener todos los platos disponibles
    const platos = db.prepare(`
      SELECT id, nombre, categoria, precio, descripcion as desc, disponible 
      FROM platos 
      WHERE disponible = 1
      ORDER BY categoria, nombre
    `).all();

    // Organizar por categorías
    const menu = {};
    categorias.forEach(c => {
      menu[c.categoria] = [];
    });

    platos.forEach(plato => {
      if (menu[plato.categoria]) {
        menu[plato.categoria].push({
          ...plato,
          disponible: !!plato.disponible
        });
      }
    });

    res.json({
      categorias: categorias.map(c => c.categoria),
      menu,
      totalPlatos: platos.length,
      totalCategorias: categorias.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/menu/categorias
 * Obtener solo lista de categorías
 */
router.get('/categorias', (req, res) => {
  try {
    const categorias = db.prepare(`
      SELECT DISTINCT categoria, COUNT(*) as cantidad
      FROM platos 
      WHERE disponible = 1
      GROUP BY categoria
      ORDER BY categoria
    `).all();

    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/menu/:categoria
 * Obtener platos de una categoría específica
 */
router.get('/:categoria', (req, res) => {
  try {
    const { categoria } = req.params;
    
    const platos = db.prepare(`
      SELECT id, nombre, categoria, precio, descripcion as desc, disponible 
      FROM platos 
      WHERE categoria = ? AND disponible = 1
      ORDER BY nombre
    `).all(categoria);

    res.json({
      categoria,
      platos: platos.map(p => ({ ...p, disponible: !!p.disponible })),
      cantidad: platos.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/menu/buscar/:termino
 * Buscar platos por nombre o descripción
 */
router.get('/buscar/:termino', (req, res) => {
  try {
    const { termino } = req.params;
    
    const platos = db.prepare(`
      SELECT id, nombre, categoria, precio, descripcion as desc, disponible 
      FROM platos 
      WHERE (nombre LIKE ? OR descripcion LIKE ?) AND disponible = 1
      ORDER BY nombre
    `).all(`%${termino}%`, `%${termino}%`);

    res.json({
      termino,
      resultados: platos.map(p => ({ ...p, disponible: !!p.disponible })),
      cantidad: platos.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
