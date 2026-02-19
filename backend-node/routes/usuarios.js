const express = require('express');
const router = express.Router();
const db = require('../database');
const bcrypt = require('bcryptjs');

const ROLES_LABELS = { 1: 'Admin', 2: 'Cocinero', 3: 'Mozo', 4: 'Cliente' };

// GET /api/usuarios
router.get('/', (req, res) => {
  try {
    const usuarios = db.prepare('SELECT id, nombre, email, rol, telefono, dni, fecha_registro as fecha, activo FROM usuarios ORDER BY id').all();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/usuarios/:id
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT id, nombre, email, rol, telefono, dni, fecha_registro, activo FROM usuarios WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/usuarios - Create user
router.post('/', (req, res) => {
  try {
    const { nombre, email, password, rol, telefono, dni } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO usuarios (nombre, email, password, rol, telefono, dni) VALUES (?, ?, ?, ?, ?, ?)')
      .run(nombre, email, hashedPassword, rol || 4, telefono || '—', dni || '—');

    res.status(201).json({
      id: result.lastInsertRowid,
      nombre, email, rol: rol || 4,
      telefono: telefono || '—',
      dni: dni || '—',
      message: 'Usuario creado exitosamente'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/usuarios/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = db.prepare('SELECT * FROM usuarios WHERE email = ? AND activo = 1').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      rolLabel: ROLES_LABELS[user.rol],
      message: 'Login exitoso'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/usuarios/:email/rol - Change user role
router.put('/:email/rol', (req, res) => {
  try {
    const { rol } = req.body;
    if (!rol || ![1, 2, 3, 4].includes(parseInt(rol))) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(req.params.email);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    db.prepare('UPDATE usuarios SET rol = ? WHERE email = ?').run(parseInt(rol), req.params.email);
    res.json({ message: `Rol actualizado a ${ROLES_LABELS[rol]}`, email: req.params.email, rol: parseInt(rol) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', (req, res) => {
  try {
    const { nombre, email, rol, telefono, dni, activo } = req.body;
    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    db.prepare(`UPDATE usuarios SET 
      nombre = COALESCE(?, nombre),
      email = COALESCE(?, email),
      rol = COALESCE(?, rol),
      telefono = COALESCE(?, telefono),
      dni = COALESCE(?, dni),
      activo = COALESCE(?, activo)
      WHERE id = ?`).run(
      nombre || null, email || null, rol || null,
      telefono || null, dni || null, activo !== undefined ? activo : null,
      req.params.id
    );
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/usuarios/:id
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
