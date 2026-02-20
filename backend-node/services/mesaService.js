/**
 * ANTIKA RESTAURANT – Mesa Service
 * Capa de servicios para gestión de mesas
 * 
 * Estados de mesa:
 * - libre: Mesa disponible
 * - ocupada: Mesa con clientes activos
 * - reservada: Mesa reservada
 * - cerrada: Mesa cerrada (equivalente a libre para el flujo)
 */

const db = require('../database');

// Estados válidos de mesa
const ESTADOS_MESA = ['libre', 'ocupada', 'reservada', 'cerrada'];

class MesaService {
  /**
   * Obtener todas las mesas
   */
  getAll() {
    try {
      const mesas = db.prepare('SELECT * FROM mesas ORDER BY numero').all();
      return {
        ok: true,
        data: mesas.map(this.mapearMesa)
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener mesa por ID/número
   */
  getById(numero) {
    try {
      const mesa = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(numero);
      if (!mesa) {
        return { ok: false, error: 'Mesa no encontrada', status: 404 };
      }
      return {
        ok: true,
        data: this.mapearMesa(mesa)
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener mesas por estado
   */
  getByEstado(estado) {
    try {
      const mesas = db.prepare('SELECT * FROM mesas WHERE estado = ? ORDER BY numero').all(estado);
      return {
        ok: true,
        data: mesas.map(this.mapearMesa)
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Crear nueva mesa
   */
  create(datos) {
    const { numero, capacidad = 4, mozo = null } = datos;

    // Validaciones
    if (!numero) return { ok: false, error: 'Número de mesa requerido' };
    if (typeof numero !== 'number' || numero < 1) {
      return { ok: false, error: 'Número de mesa debe ser un número positivo' };
    }

    // Verificar que no exista
    const existente = db.prepare('SELECT id FROM mesas WHERE numero = ?').get(numero);
    if (existente) {
      return { ok: false, error: 'Ya existe una mesa con ese número' };
    }

    try {
      db.prepare(`
        INSERT INTO mesas (numero, estado, mozo, capacidad)
        VALUES (?, 'libre', ?, ?)
      `).run(numero, mozo, capacidad);

      return {
        ok: true,
        data: { numero, estado: 'libre', mozo, capacidad },
        message: 'Mesa creada exitosamente'
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Actualizar mesa
   */
  update(numero, datos) {
    const { estado, mozo, capacidad } = datos;

    // Verificar que existe
    const mesaActual = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(numero);
    if (!mesaActual) {
      return { ok: false, error: 'Mesa no encontrada', status: 404 };
    }

    // Validar estado
    if (estado && !ESTADOS_MESA.includes(estado)) {
      return { ok: false, error: 'Estado de mesa inválido' };
    }

    try {
      // Construir consulta dinámica
      const updates = [];
      const params = [];

      if (estado !== undefined) {
        updates.push('estado = ?');
        params.push(estado);
      }
      if (mozo !== undefined) {
        updates.push('mozo = ?');
        params.push(mozo);
      }
      if (capacidad !== undefined) {
        updates.push('capacidad = ?');
        params.push(capacidad);
      }

      if (updates.length > 0) {
        params.push(numero);
        db.prepare(`UPDATE mesas SET ${updates.join(', ')} WHERE numero = ?`).run(...params);
      }

      // Obtener mesa actualizada
      const mesaActualizada = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(numero);

      return {
        ok: true,
        data: this.mapearMesa(mesaActualizada),
        message: 'Mesa actualizada'
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Abrir mesa (asignar mozo y cambiar a ocupada)
   */
  abrir(numero, nombreMozo) {
    const mesa = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(numero);
    if (!mesa) {
      return { ok: false, error: 'Mesa no encontrada' };
    }

    if (mesa.estado === 'ocupada') {
      // Si ya está ocupada, solo actualizar mozo
      return this.update(numero, { mozo: nombreMozo });
    }

    return this.update(numero, { 
      estado: 'ocupada', 
      mozo: nombreMozo 
    });
  }

  /**
   * Cerrar mesa (liberar)
   */
  cerrar(numero) {
    return this.update(numero, { 
      estado: 'libre', 
      mozo: null 
    });
  }

  /**
   * Reservar mesa
   */
  reservar(numero, nombreReserva) {
    const mesa = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(numero);
    if (!mesa) {
      return { ok: false, error: 'Mesa no encontrada' };
    }

    if (mesa.estado === 'ocupada') {
      return { ok: false, error: 'La mesa está ocupada' };
    }

    return this.update(numero, { 
      estado: 'reservada',
      mozo: nombreReserva // Usamos mozo para guardar la reserva
    });
  }

  /**
   * Eliminar mesa
   */
  delete(numero) {
    try {
      const result = db.prepare('DELETE FROM mesas WHERE numero = ?').run(numero);
      if (result.changes === 0) {
        return { ok: false, error: 'Mesa no encontrada', status: 404 };
      }
      return { ok: true, message: 'Mesa eliminada' };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas de mesas
   */
  getStats() {
    try {
      const stats = {};
      
      ESTADOS_MESA.forEach(estado => {
        const count = db.prepare('SELECT COUNT(*) as count FROM mesas WHERE estado = ?').get(estado);
        stats[estado] = count.count;
      });

      const total = db.prepare('SELECT COUNT(*) as count FROM mesas').get();
      stats.total = total.count;

      // Capacidad total
      const capacidad = db.prepare('SELECT SUM(capacidad) as total FROM mesas').get();
      stats.capacidadTotal = capacidad.total || 0;

      // Capacidad usada
      const ocupada = db.prepare('SELECT SUM(capacidad) as total FROM mesas WHERE estado = ?').get('ocupada');
      stats.capacidadOcupada = ocupada.total || 0;

      return { ok: true, data: stats };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener pedidos de una mesa
   */
  getPedidos(numero) {
    try {
      const pedidos = db.prepare(`
        SELECT * FROM pedidos 
        WHERE mesa_id = ? 
        AND estado NOT IN ('cerrado', 'anulado')
        ORDER BY tiempo DESC
      `).all(numero);

      return {
        ok: true,
        data: pedidos.map(p => ({
          id: p.id,
          estado: p.estado,
          items: JSON.parse(p.items || '[]'),
          total: p.total,
          tiempo: p.tiempo
        }))
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Mapear mesa de la base de datos al formato de API
   */
  mapearMesa(mesa) {
    return {
      id: mesa.numero,
      numero: mesa.numero,
      estado: mesa.estado,
      mozo: mesa.mozo,
      capacidad: mesa.capacidad
    };
  }
}

// Exportar instancia
const mesaService = new MesaService();

module.exports = mesaService;
module.exports.ESTADOS_MESA = ESTADOS_MESA;
