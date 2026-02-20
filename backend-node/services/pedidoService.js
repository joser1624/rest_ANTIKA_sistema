/**
 * ANTIKA RESTAURANT – Pedido Service (Flujo Real de Restaurante)
 * 
 * Flujo correcto:
 * 1. Abrir mesa → estado ABIERTA (sin pedido)
 * 2. Agregar platos → se crea pedido con items en estado PENDIENTE
 * 3. Cada plato tiene su propio estado: PENDIENTE → PREPARANDO → LISTO → ENTREGADO
 * 4. Quitar plato → solo si PENDIENTE
 * 5. Cerrar mesa → registra en transacciones, libera mesa
 */

const db = require('../database');

// Estados de mesa
const ESTADOS_MESA = {
  LIBRE: 'libre',
  ABIERTA: 'abierta',    // Mesa abierta, esperando pedido
  OCUPADA: 'ocupada',    // Con pedido activo
  RESERVADA: 'reservada',
  CERRADA: 'cerrada'
};

// Estados de cada PLATO en el pedido
const ESTADOS_PLATO = {
  PENDIENTE: 'pendiente',     // Esperando preparación
  PREPARANDO: 'preparando',   // En cocina
  LISTO: 'listo',            // Listo para servir
  ENTREGADO: 'entregado'      // Entregado al cliente
};

// Estados del PEDIDO (para compatibilidad)
const ESTADOS_PEDIDO = {
  ABIERTO: 'abierto',
  ACTIVO: 'activo',
  CERRADO: 'cerrado',
  ANULADO: 'anulado'
};

// Transiciones válidas por plato
const TRANSICIONES_PLATO = {
  'pendiente': ['preparando', 'anulado'],
  'preparando': ['listo', 'anulado'],
  'listo': ['entregado'],
  'entregado': [],
  'anulado': []
};

class PedidoService {
  /**
   * Abrir mesa (sin crear pedido)
   * La mesa queda ABIERTA esperando que agreguen platos
   */
  abrirMesa(numeroMesa, nombreMozo) {
    try {
      const mesa = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(numeroMesa);
      if (!mesa) {
        return { ok: false, error: 'Mesa no encontrada' };
      }
      
      if (mesa.estado === 'ocupada' || mesa.estado === 'abierta') {
        return { ok: false, error: 'La mesa ya está abierta' };
      }

      // Abrir mesa sin crear pedido
      db.prepare('UPDATE mesas SET estado = ?, mozo = ? WHERE numero = ?')
        .run(ESTADOS_MESA.ABIERTA, nombreMozo, numeroMesa);

      return {
        ok: true,
        data: { numero: numeroMesa, estado: 'abierta', mozo: nombreMozo },
        message: 'Mesa abierta correctamente'
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Agregar plato(s) a una mesa
   * Crea el pedido si no existe, o agrega al pedido activo
   */
  agregarPlatos(numeroMesa, items, nombreMozo) {
    try {
      const mesa = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(numeroMesa);
      if (!mesa) {
        return { ok: false, error: 'Mesa no encontrada' };
      }

      // Si la mesa está libre, abrirla primero
      if (mesa.estado === 'libre') {
        db.prepare('UPDATE mesas SET estado = ?, mozo = ? WHERE numero = ?')
          .run(ESTADOS_MESA.ABIERTA, nombreMozo || mesa.mozo, numeroMesa);
      }

      // Buscar pedido activo de la mesa
      let pedido = db.prepare(`
        SELECT * FROM pedidos 
        WHERE mesa_id = ? AND estado IN ('abierto', 'activo')
      `).get(numeroMesa);

      let itemsPedido = [];
      
      if (pedido) {
        // Agregar al pedido existente
        itemsPedido = JSON.parse(pedido.items || '[]');
      } else {
        // Crear nuevo pedido
        const idPedido = `P-${numeroMesa}-${Date.now()}`;
        db.prepare(`
          INSERT INTO pedidos (id, mesa_id, estado, cocineros, tiempo, items, total)
          VALUES (?, ?, 'abierto', '[]', ?, '[]', 0)
        `).run(idPedido, numeroMesa, Date.now());
        
        pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(idPedido);
        // Actualizar estado de mesa a ocupada
        db.prepare('UPDATE mesas SET estado = ? WHERE numero = ?')
          .run(ESTADOS_MESA.OCUPADA, numeroMesa);
      }

      // Agregar items con estado PENDIENTE
      const nuevosItems = items.map(item => ({
        id: item.id || Date.now() + Math.random(),
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad || item.cant || 1,
        nota: item.nota || '',
        estado: ESTADOS_PLATO.PENDIENTE,
        tiempoAgregado: Date.now()
      }));

      itemsPedido = [...itemsPedido, ...nuevosItems];

      // Calcular total
      const total = itemsPedido.reduce((sum, item) => {
        return sum + (item.precio * item.cantidad);
      }, 0);

      // Actualizar pedido
      db.prepare('UPDATE pedidos SET items = ?, total = ?, estado = ? WHERE id = ?')
        .run(JSON.stringify(itemsPedido), total, ESTADOS_PEDIDO.ACTIVO, pedido.id);

      return {
        ok: true,
        data: {
          id: pedido.id,
          mesa: numeroMesa,
          items: itemsPedido,
          total
        },
        message: `${nuevosItems.length} plato(s) agregado(s)`
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Modificar cantidad de un plato en el pedido
   */
  modificarCantidad(pedidoId, itemId, nuevaCantidad) {
    try {
      const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId);
      if (!pedido) {
        return { ok: false, error: 'Pedido no encontrado' };
      }

      const items = JSON.parse(pedido.items || '[]');
      const itemIndex = items.findIndex(i => i.id == itemId);
      
      if (itemIndex === -1) {
        return { ok: false, error: 'Plato no encontrado en el pedido' };
      }

      const item = items[itemIndex];

      // Solo permitir modificar si está PENDIENTE
      if (item.estado !== ESTADOS_PLATO.PENDIENTE) {
        return { 
          ok: false, 
          error: `No se puede modificar. El plato está en estado: ${item.estado}` 
        };
      }

      if (nuevaCantidad <= 0) {
        // Eliminar el item
        items.splice(itemIndex, 1);
      } else {
        // Actualizar cantidad
        items[itemIndex].cantidad = nuevaCantidad;
      }

      // Recalcular total
      const total = items.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);

      // Si no hay más items, eliminar pedido
      if (items.length === 0) {
        db.prepare('DELETE FROM pedidos WHERE id = ?').run(pedidoId);
        db.prepare('UPDATE mesas SET estado = ?, mozo = NULL WHERE numero = ?')
          .run(ESTADOS_MESA.LIBRE, pedido.mesa_id);
        return {
          ok: true,
          data: { items: [], total: 0 },
          message: 'Pedido eliminado'
        };
      }

      db.prepare('UPDATE pedidos SET items = ?, total = ? WHERE id = ?')
        .run(JSON.stringify(items), total, pedidoId);

      return {
        ok: true,
        data: { items, total },
        message: 'Cantidad actualizada'
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Quitar plato del pedido
   * Solo permitido si el plato está en estado PENDIENTE
   */
  quitarPlato(pedidoId, itemId) {
    try {
      const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId);
      if (!pedido) {
        return { ok: false, error: 'Pedido no encontrado' };
      }

      const items = JSON.parse(pedido.items || '[]');
      const itemIndex = items.findIndex(i => i.id == itemId);
      
      if (itemIndex === -1) {
        return { ok: false, error: 'Plato no encontrado en el pedido' };
      }

      const item = items[itemIndex];

      // Solo permitir quitar si está PENDIENTE
      if (item.estado !== ESTADOS_PLATO.PENDIENTE) {
        return { 
          ok: false, 
          error: `No se puede quitar. El plato está en estado: ${item.estado}` 
        };
      }

      // Quitar el item
      items.splice(itemIndex, 1);

      // Recalcular total
      const total = items.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);

      // Si no hay más items, eliminar pedido
      if (items.length === 0) {
        db.prepare('DELETE FROM pedidos WHERE id = ?').run(pedidoId);
        // Liberar mesa
        db.prepare('UPDATE mesas SET estado = ?, mozo = NULL WHERE numero = ?')
          .run(ESTADOS_MESA.LIBRE, pedido.mesa_id);
        
        return {
          ok: true,
          data: { items: [], total: 0 },
          message: 'Plato quitado. Pedido vacío, mesa liberada'
        };
      }

      // Actualizar pedido
      db.prepare('UPDATE pedidos SET items = ?, total = ? WHERE id = ?')
        .run(JSON.stringify(items), total, pedidoId);

      return {
        ok: true,
        data: { items, total },
        message: 'Plato quitado correctamente'
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Cambiar estado de un plato específico
   * Cocina: PENDIENTE → PREPARANDO → LISTO
   */
  cambiarEstadoPlato(pedidoId, itemId, nuevoEstado) {
    try {
      // Validar estado
      if (!Object.values(ESTADOS_PLATO).includes(nuevoEstado)) {
        return { ok: false, error: 'Estado de plato inválido' };
      }

      const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId);
      if (!pedido) {
        return { ok: false, error: 'Pedido no encontrado' };
      }

      const items = JSON.parse(pedido.items || '[]');
      const itemIndex = items.findIndex(i => i.id == itemId);
      
      if (itemIndex === -1) {
        return { ok: false, error: 'Plato no encontrado' };
      }

      const item = items[itemIndex];
      const estadoActual = item.estado;

      // Validar transición
      const transicionesValidas = TRANSICIONES_PLATO[estadoActual] || [];
      if (!transicionesValidas.includes(nuevoEstado)) {
        return { 
          ok: false, 
          error: `No se puede cambiar de '${estadoActual}' a '${nuevoEstado}'` 
        };
      }

      // Actualizar estado del plato
      items[itemIndex].estado = nuevoEstado;
      if (nuevoEstado === ESTADOS_PLATO.PREPARANDO) {
        items[itemIndex].tiempoInicio = Date.now();
      }
      if (nuevoEstado === ESTADOS_PLATO.ENTREGADO) {
        items[itemIndex].tiempoEntrega = Date.now();
      }

      // Guardar
      db.prepare('UPDATE pedidos SET items = ? WHERE id = ?')
        .run(JSON.stringify(items), pedidoId);

      return {
        ok: true,
        data: { 
          itemId, 
          estadoAnterior: estadoActual, 
          nuevoEstado 
        },
        message: `Plato actualizado a: ${nuevoEstado}`
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener todos los pedidos activos (para cocina)
   */
  getPedidosActivos() {
    try {
      const pedidos = db.prepare(`
        SELECT p.*, m.numero as numero_mesa, m.mozo as nombre_mozo
        FROM pedidos p
        JOIN mesas m ON p.mesa_id = m.numero
        WHERE p.estado IN ('abierto', 'activo')
        ORDER BY p.tiempo DESC
      `).all();

      return {
        ok: true,
        data: pedidos.map(p => ({
          id: p.id,
          mesa: p.mesa_id,
          numeroMesa: p.numero_mesa,
          mozo: p.nombre_mozo,
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

  /**
   * Obtener/items pendientes para cocina (vista de cocina)
   */
  getItemsParaCocina() {
    try {
      const pedidos = db.prepare(`
        SELECT p.*, m.numero as numero_mesa, m.mozo as nombre_mozo
        FROM pedidos p
        JOIN mesas m ON p.mesa_id = m.numero
        WHERE p.estado IN ('abierto', 'activo')
        ORDER BY p.tiempo ASC
      `).all();

      // Extraer todos los items pendientes/en preparación
      const itemsCocina = [];
      pedidos.forEach(pedido => {
        const items = JSON.parse(pedido.items || '[]');
        items.forEach(item => {
          if (item.estado !== 'entregado' && item.estado !== 'anulado') {
            itemsCocina.push({
              ...item,
              pedidoId: pedido.id,
              mesaId: pedido.mesa_id,
              numeroMesa: pedido.numero_mesa,
              mozo: pedido.nombre_mozo
            });
          }
        });
      });

      return { ok: true, data: itemsCocina };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Cerrar mesa
   * Registra la transacción y libera la mesa
   */
  cerrarMesa(numeroMesa, metodoPago = 'efectivo') {
    try {
      const mesa = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(numeroMesa);
      if (!mesa) {
        return { ok: false, error: 'Mesa no encontrada' };
      }

      // Buscar pedido activo
      const pedido = db.prepare(`
        SELECT * FROM pedidos 
        WHERE mesa_id = ? AND estado IN ('abierto', 'activo')
      `).get(numeroMesa);

      if (!pedido) {
        // No hay pedido, solo liberar mesa
        db.prepare('UPDATE mesas SET estado = ?, mozo = NULL WHERE numero = ?')
          .run(ESTADOS_MESA.LIBRE, numeroMesa);
        
        return { ok: true, message: 'Mesa liberada (sin consumo)' };
      }

      const items = JSON.parse(pedido.items || '[]');
      const total = pedido.total;

      // Registrar transacción en caja
      const hora = new Date().toTimeString().slice(0, 5);
      db.prepare(`
        INSERT INTO transacciones (hora, mesa, mozo, total, metodo, estado)
        VALUES (?, ?, ?, ?, ?, 'pagado')
      `).run(hora, `Mesa ${numeroMesa}`, mesa.mozo, total, metodoPago);

      // Cerrar pedido
      db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?')
        .run(ESTADOS_PEDIDO.CERRADO, pedido.id);

      // Liberar mesa
      db.prepare('UPDATE mesas SET estado = ?, mozo = NULL WHERE numero = ?')
        .run(ESTADOS_MESA.LIBRE, numeroMesa);

      return {
        ok: true,
        data: {
          mesa: numeroMesa,
          total: total,
          items: items.length,
          metodoPago
        },
        message: `Mesa cerrada. Total: S/ ${total.toFixed(2)}`
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener pedido activo de una mesa
   */
  getPedidoActivo(numeroMesa) {
    try {
      const pedido = db.prepare(`
        SELECT * FROM pedidos 
        WHERE mesa_id = ? AND estado IN ('abierto', 'activo')
      `).get(numeroMesa);

      if (!pedido) {
        return { ok: true, data: null };
      }

      return {
        ok: true,
        data: {
          id: pedido.id,
          mesa: pedido.mesa_id,
          estado: pedido.estado,
          items: JSON.parse(pedido.items || '[]'),
          total: pedido.total,
          tiempo: pedido.tiempo
        }
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  // Métodos legacy para compatibilidad
  getAll() {
    try {
      const pedidos = db.prepare('SELECT * FROM pedidos ORDER BY tiempo DESC').all();
      return {
        ok: true,
        data: pedidos.map(p => ({
          id: p.id,
          mesa: p.mesa_id,
          estado: p.estado,
          cocineros: JSON.parse(p.cocineros || '[]'),
          tiempo: p.tiempo,
          items: JSON.parse(p.items || '[]'),
          total: p.total
        }))
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  getById(id) {
    try {
      const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
      if (!pedido) {
        return { ok: false, error: 'Pedido no encontrado', status: 404 };
      }
      return {
        ok: true,
        data: {
          id: pedido.id,
          mesa: pedido.mesa_id,
          estado: pedido.estado,
          cocineros: JSON.parse(pedido.cocineros || '[]'),
          tiempo: pedido.tiempo,
          items: JSON.parse(pedido.items || '[]'),
          total: pedido.total
        }
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  create(datos) {
    // Legacy - crear pedido simple
    const { id, mesa, items, estado = 'abierto' } = datos;
    if (!id || !mesa) {
      return { ok: false, error: 'ID y mesa requeridos' };
    }
    
    const itemsConEstado = (items || []).map((item, idx) => ({
      ...item,
      id: item.id || `${id}-${idx}`,
      estado: ESTADOS_PLATO.PENDIENTE
    }));

    const total = itemsConEstado.reduce((sum, i) => sum + (i.precio * (i.cantidad || 1)), 0);

    try {
      db.prepare(`
        INSERT INTO pedidos (id, mesa_id, estado, cocineros, tiempo, items, total)
        VALUES (?, ?, ?, '[]', ?, ?, ?)
      `).run(id, mesa, estado, Date.now(), JSON.stringify(itemsConEstado), total);

      // Abrir mesa si está libre
      const mesaActual = db.prepare('SELECT * FROM mesas WHERE numero = ?').get(mesa);
      if (mesaActual && mesaActual.estado === 'libre') {
        db.prepare('UPDATE mesas SET estado = ? WHERE numero = ?')
          .run(ESTADOS_MESA.OCUPADA, mesa);
      }

      return { ok: true, data: { id, mesa, estado, items: itemsConEstado, total } };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  update(id, datos) {
    const { estado } = datos;
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    if (!pedido) {
      return { ok: false, error: 'Pedido no encontrado' };
    }

    try {
      if (estado) {
        db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(estado, id);
      }
      return { ok: true, message: 'Pedido actualizado' };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}

// Exportar
const pedidoService = new PedidoService();
module.exports = pedidoService;
module.exports.ESTADOS_MESA = ESTADOS_MESA;
module.exports.ESTADOS_PLATO = ESTADOS_PLATO;
module.exports.ESTADOS_PEDIDO = ESTADOS_PEDIDO;
