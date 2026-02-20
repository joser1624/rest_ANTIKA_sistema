/**
 * ANTIKA RESTAURANT – Plato Service
 * Capa de servicios para gestión del menú/platos
 * 
 * Permite obtener el menú completo desde el backend
 * sin hardcoded en el frontend
 */

const db = require('../database');

class PlatoService {
  /**
   * Obtener todos los platos
   */
  getAll() {
    try {
      const platos = db.prepare(`
        SELECT id, nombre, categoria, precio, descripcion as desc, disponible 
        FROM platos 
        ORDER BY categoria, nombre
      `).all();
      
      return {
        ok: true,
        data: platos.map(p => ({
          ...p,
          disponible: !!p.disponible
        }))
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener plato por ID
   */
  getById(id) {
    try {
      const plato = db.prepare('SELECT * FROM platos WHERE id = ?').get(id);
      if (!plato) {
        return { ok: false, error: 'Plato no encontrado', status: 404 };
      }
      return {
        ok: true,
        data: {
          ...plato,
          disponible: !!plato.disponible
        }
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener platos por categoría
   */
  getByCategoria(categoria) {
    try {
      const platos = db.prepare(`
        SELECT id, nombre, categoria, precio, descripcion as desc, disponible 
        FROM platos 
        WHERE categoria = ? 
        ORDER BY nombre
      `).all(categoria);

      return {
        ok: true,
        data: platos.map(p => ({
          ...p,
          disponible: !!p.disponible
        }))
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener todas las categorías únicas
   */
  getCategorias() {
    try {
      const categorias = db.prepare(`
        SELECT DISTINCT categoria 
        FROM platos 
        ORDER BY categoria
      `).all();

      return {
        ok: true,
        data: categorias.map(c => c.categoria)
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener menú completo por categorías
   * Estructura: { categoria1: [platos], categoria2: [platos] }
   */
  getMenuPorCategorias() {
    try {
      const platos = db.prepare(`
        SELECT id, nombre, categoria, precio, descripcion as desc, disponible 
        FROM platos 
        ORDER BY categoria, nombre
      `).all();

      // Agrupar por categoría
      const menu = {};
      platos.forEach(plato => {
        const categoria = plato.categoria;
        if (!menu[categoria]) {
          menu[categoria] = [];
        }
        menu[categoria].push({
          ...plato,
          disponible: !!plato.disponible
        });
      });

      return {
        ok: true,
        data: menu
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener platos disponibles
   */
  getDisponibles() {
    try {
      const platos = db.prepare(`
        SELECT id, nombre, categoria, precio, descripcion as desc, disponible 
        FROM platos 
        WHERE disponible = 1
        ORDER BY categoria, nombre
      `).all();

      return {
        ok: true,
        data: platos.map(p => ({
          ...p,
          disponible: true
        }))
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Buscar platos por nombre
   */
  buscar(termino) {
    try {
      const platos = db.prepare(`
        SELECT id, nombre, categoria, precio, descripcion as desc, disponible 
        FROM platos 
        WHERE nombre LIKE ? OR descripcion LIKE ?
        ORDER BY nombre
      `).all(`%${termino}%`, `%${termino}%`);

      return {
        ok: true,
        data: platos.map(p => ({
          ...p,
          disponible: !!p.disponible
        }))
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Crear nuevo plato
   */
  create(datos) {
    const { nombre, categoria, precio, desc, disponible = true } = datos;

    // Validaciones
    if (!nombre) {
      return { ok: false, error: 'Nombre del plato requerido' };
    }
    if (!precio || typeof precio !== 'number' || precio <= 0) {
      return { ok: false, error: 'Precio válido requerido' };
    }

    try {
      const result = db.prepare(`
        INSERT INTO platos (nombre, categoria, precio, descripcion, disponible)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        nombre,
        categoria || '',
        precio,
        desc || '',
        disponible ? 1 : 0
      );

      return {
        ok: true,
        data: {
          id: result.lastInsertRowid,
          nombre,
          categoria: categoria || '',
          precio,
          desc,
          disponible
        },
        message: 'Plato creado exitosamente'
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Actualizar plato
   */
  update(id, datos) {
    const { nombre, categoria, precio, desc, disponible } = datos;

    // Verificar que existe
    const platoActual = db.prepare('SELECT * FROM platos WHERE id = ?').get(id);
    if (!platoActual) {
      return { ok: false, error: 'Plato no encontrado', status: 404 };
    }

    try {
      db.prepare(`
        UPDATE platos SET 
          nombre = COALESCE(?, nombre),
          categoria = COALESCE(?, categoria),
          precio = COALESCE(?, precio),
          descripcion = COALESCE(?, descripcion),
          disponible = COALESCE(?, disponible)
        WHERE id = ?
      `).run(
        nombre || null,
        categoria || null,
        precio || null,
        desc || null,
        disponible !== undefined ? (disponible ? 1 : 0) : null,
        id
      );

      // Obtener plato actualizado
      const platoActualizado = db.prepare('SELECT * FROM platos WHERE id = ?').get(id);

      return {
        ok: true,
        data: {
          ...platoActualizado,
          disponible: !!platoActualizado.disponible
        },
        message: 'Plato actualizado'
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Cambiar disponibilidad
   */
  toggleDisponibilidad(id) {
    const plato = db.prepare('SELECT * FROM platos WHERE id = ?').get(id);
    if (!plato) {
      return { ok: false, error: 'Plato no encontrado' };
    }

    const nuevaDisponibilidad = !plato.disponible;
    return this.update(id, { disponible: nuevaDisponibilidad });
  }

  /**
   * Eliminar plato
   */
  delete(id) {
    try {
      const result = db.prepare('DELETE FROM platos WHERE id = ?').run(id);
      if (result.changes === 0) {
        return { ok: false, error: 'Plato no encontrado', status: 404 };
      }
      return { ok: true, message: 'Plato eliminado' };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas del menú
   */
  getStats() {
    try {
      const total = db.prepare('SELECT COUNT(*) as count FROM platos').get();
      const disponibles = db.prepare('SELECT COUNT(*) as count FROM platos WHERE disponible = 1').get();
      
      const categoriasCount = db.prepare(`
        SELECT COUNT(DISTINCT categoria) as count 
        FROM platos
      `).get();

      return {
        ok: true,
        data: {
          total: total.count,
          disponibles: disponibles.count,
          noDisponibles: total.count - disponibles.count,
          categorias: categoriasCount.count
        }
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}

// Exportar instancia
const platoService = new PlatoService();

module.exports = platoService;
