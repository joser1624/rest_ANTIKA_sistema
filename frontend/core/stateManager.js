/**
 * ANTIKA RESTAURANT – State Manager
 * Gestión centralizada del estado global de la aplicación
 * 
 * Estructura del estado:
 * - mesas: Array de mesas del restaurante
 * - pedidos: Array de pedidos activos
 * - pedidoActivo: Pedido actualmente en edición
 * - categorias: Categorías del menú
 * - conexion: Estado de conexión (online/offline)
 * - usuario: Usuario logueado actual
 * - ultimosDatos: Timestamp de última actualización
 */

class StateManager {
  constructor() {
    // Estado inicial
    this.state = {
      mesas: [],
      pedidos: [],
      pedidoActivo: [],
      categorias: [],
      conexion: {
        isOnline: true,
        lastChecked: null
      },
      usuario: null,
      ultimosDatos: null,
      // Caché de datos
      cache: {
        empleados: [],
        transacciones: [],
        reservas: []
      }
    };

    // Suscriptores al estado
    this.subscribers = new Map();
    
    // Inicializar si estamos en navegador
    if (typeof window !== 'undefined') {
      this.initFromStorage();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SUSCRIPTORES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Suscribirse a cambios en una parte del estado
   * @param {string} key - Clave del estado a observar
   * @param {function} callback - Función a ejecutar cuando cambie
   * @returns {function} Función para cancelar suscripción
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Devolver función de cleanup
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * Notificar a todos los suscriptores de un cambio
   */
  notify(key) {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(this.state[key]);
        } catch (error) {
          console.error(`Error en suscriptor de ${key}:`, error);
        }
      });
    }

    // También notificar a suscriptores globales
    const globalSubs = this.subscribers.get('*');
    if (globalSubs) {
      globalSubs.forEach(callback => {
        try {
          callback(this.state);
        } catch (error) {
          console.error('Error en suscriptor global:', error);
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════

  get(key) {
    return this.state[key];
  }

  getState() {
    return { ...this.state };
  }

  // Métodos convenience
  getMesas() {
    return this.state.mesas;
  }

  getPedidos() {
    return this.state.pedidos;
  }

  getPedidoActivo() {
    return this.state.pedidoActivo;
  }

  getCategorias() {
    return this.state.categorias;
  }

  isOnline() {
    return this.state.conexion.isOnline;
  }

  getUsuario() {
    return this.state.usuario;
  }

  // ═══════════════════════════════════════════════════════════════
  // SETTERS
  // ═══════════════════════════════════════════════════════════════

  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // Persistir en localStorage si es necesario
    if (typeof window !== 'undefined' && this.shouldPersist(key)) {
      localStorage.setItem(`antika_${key}`, JSON.stringify(value));
    }

    this.notify(key);
    return oldValue;
  }

  setState(partialState) {
    Object.keys(partialState).forEach(key => {
      this.set(key, partialState[key]);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS ESPECÍFICOS DEL DOMINIO
  // ═══════════════════════════════════════════════════════════════

  /**
   * Cargar datos iniciales desde el backend
   */
  async cargarDatosIniciales() {
    if (typeof window !== 'undefined' && window.apiClient) {
      const resultados = await Promise.allSettled([
        window.apiClient.get('/mesas'),
        window.apiClient.get('/pedidos'),
        window.apiClient.get('/platos'),
        window.apiClient.get('/empleados')
      ]);

      // Procesar mesas
      if (resultados[0].status === 'fulfilled' && resultados[0].value.ok) {
        this.set('mesas', resultados[0].value.data);
      }

      // Procesar pedidos
      if (resultados[1].status === 'fulfilled' && resultados[1].value.ok) {
        this.set('pedidos', resultados[1].value.data);
      }

      // Procesar platos y extraer categorías
      if (resultados[2].status === 'fulfilled' && resultados[2].value.ok) {
        const platos = resultados[2].value.data;
        const categorias = [...new Set(platos.map(p => p.categoria))];
        this.set('categorias', categorias);
        // También guardar platos en cache si los necesitamos
        this.state.cache.platos = platos;
      }

      // Procesar empleados
      if (resultados[3].status === 'fulfilled' && resultados[3].value.ok) {
        this.state.cache.empleados = resultados[3].value.data;
      }

      this.set('ultimosDatos', new Date().toISOString());
    }
  }

  /**
   * Actualizar una mesa específica
   */
  actualizarMesa(mesaId, datos) {
    const mesas = this.state.mesas.map(m => {
      if (m.id === mesaId) {
        return { ...m, ...datos };
      }
      return m;
    });
    this.set('mesas', mesas);
  }

  /**
   * Obtener pedidos de una mesa específica
   */
  getPedidosDeMesa(mesaId) {
    return this.state.pedidos.filter(p => p.mesa === mesaId);
  }

  /**
   * Agregar plato al pedido activo
   */
  agregarAlPedido(plato, mesaId) {
    const pedidoActual = [...this.state.pedidoActivo];
    const existente = pedidoActual.find(p => p.nombre === plato.nombre);
    
    if (existente) {
      existente.cantidad = (existente.cantidad || existente.cant || 1) + 1;
    } else {
      pedidoActual.push({
        id: Date.now() + Math.random(),
        nombre: plato.nombre,
        precio: plato.precio,
        cantidad: 1,
        nota: '',
        estado: 'pendiente', // Estado del plato
        mesaId: mesaId
      });
    }
    
    this.set('pedidoActivo', pedidoActual);
    return pedidoActual;
  }

  /**
   * Agregar platos directamente al backend y actualizar estado local
   */
  async agregarPlatosAMesa(mesaId, items) {
    if (!window.apiClient) return { ok: false, error: 'API no disponible' };
    
    const result = await window.apiClient.post(`/pedidos/agregar/${mesaId}`, {
      items: items,
      mozo: this.state.usuario?.nombre || 'Mozo'
    });
    
    if (result.ok) {
      // Sincronizar después de agregar
      await this.syncPedidos();
    }
    
    return result;
  }

  /**
   * Quitar plato del pedido
   */
  async quitarPlato(pedidoId, itemId) {
    if (!window.apiClient) return { ok: false, error: 'API no disponible' };
    
    const result = await window.apiClient.post(`/pedidos/quitar/${pedidoId}`, {
      itemId: itemId
    });
    
    if (result.ok) {
      await this.syncPedidos();
    }
    
    return result;
  }

  /**
   * Modificar cantidad de un plato
   */
  async modificarCantidad(pedidoId, itemId, cantidad) {
    if (!window.apiClient) return { ok: false, error: 'API no disponible' };
    
    const result = await window.apiClient.post(`/pedidos/cantidad/${pedidoId}`, {
      itemId: itemId,
      cantidad: cantidad
    });
    
    if (result.ok) {
      await this.syncPedidos();
    }
    
    return result;
  }

  /**
   * Cambiar estado de un plato
   */
  async cambiarEstadoPlato(pedidoId, itemId, nuevoEstado) {
    if (!window.apiClient) return { ok: false, error: 'API no disponible' };
    
    const result = await window.apiClient.post(`/pedidos/estado-item/${pedidoId}`, {
      itemId: itemId,
      estado: nuevoEstado
    });
    
    if (result.ok) {
      await this.syncPedidos();
    }
    
    return result;
  }

  /**
   * Abrir mesa
   */
  async abrirMesa(mesaId, nombreMozo) {
    if (!window.apiClient) return { ok: false, error: 'API no disponible' };
    
    const result = await window.apiClient.post(`/pedidos/abrir/${mesaId}`, {
      mozo: nombreMozo
    });
    
    if (result.ok) {
      await this.syncMesas();
    }
    
    return result;
  }

  /**
   * Cerrar mesa
   */
  async cerrarMesa(mesaId, metodoPago = 'efectivo') {
    if (!window.apiClient) return { ok: false, error: 'API no disponible' };
    
    const result = await window.apiClient.post(`/pedidos/cerrar/${mesaId}`, {
      metodoPago: metodoPago
    });
    
    if (result.ok) {
      await this.syncTodo();
    }
    
    return result;
  }

  /**
   * Obtener pedido activo de una mesa
   */
  async getPedidoDeMesa(mesaId) {
    if (!window.apiClient) return null;
    
    const result = await window.apiClient.get(`/pedidos/mesa/${mesaId}`);
    return result.ok ? result.data : null;
  }

  /**
   * Obtener items para cocina
   */
  async getItemsParaCocina() {
    if (!window.apiClient) return [];
    
    const result = await window.apiClient.get('/pedidos/cocina');
    return result.ok ? result.data : [];
  }

  /**
   * Quitar plato del pedido activo
   */
  quitarDelPedido(nombre) {
    const pedidoActual = this.state.pedidoActivo.filter(p => p.nombre !== nombre);
    this.set('pedidoActivo', pedidoActual);
  }

  /**
   * Limpiar pedido activo
   */
  limpiarPedido() {
    this.set('pedidoActivo', []);
  }

  /**
   * Actualizar estado de conexión
   */
  setConexion(isOnline) {
    this.set('conexion', {
      isOnline,
      lastChecked: new Date().toISOString()
    });
  }

  /**
   * Actualizar usuario
   */
  setUsuario(usuario) {
    if (usuario) {
      localStorage.setItem('antika_user', JSON.stringify(usuario));
    } else {
      localStorage.removeItem('antika_user');
    }
    this.set('usuario', usuario);
  }

  // ═══════════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════════

  shouldPersist(key) {
    // Keys que se deben persistir
    return ['usuario'].includes(key);
  }

  initFromStorage() {
    // Cargar usuario desde localStorage
    try {
      const userData = localStorage.getItem('antika_user');
      if (userData) {
        this.state.usuario = JSON.parse(userData);
      }
    } catch (e) {
      console.warn('Error cargando usuario desde storage:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calcular total del pedido activo
   */
  getTotalPedido() {
    return this.state.pedidoActivo.reduce((sum, item) => {
      return sum + (item.precio * (item.cantidad || item.cant || 1));
    }, 0);
  }

  /**
   * Sincronizar solo pedidos
   */
  async syncPedidos() {
    if (!window.apiClient) return;
    const result = await window.apiClient.get('/pedidos');
    if (result.ok) {
      this.set('pedidos', result.data);
    }
  }

  /**
   * Sincronizar solo mesas
   */
  async syncMesas() {
    if (!window.apiClient) return;
    const result = await window.apiClient.get('/mesas');
    if (result.ok) {
      this.set('mesas', result.data);
    }
  }

  /**
   * Sincronizar todo
   */
  async syncTodo() {
    await Promise.all([
      this.syncMesas(),
      this.syncPedidos()
    ]);
  }

  /**
   * Obtener mesa por ID
   */
  getMesaPorId(id) {
    return this.state.mesas.find(m => m.id === id);
  }

  /**
   * Obtener pedido por ID
   */
  getPedidoPorId(id) {
    return this.state.pedidos.find(p => p.id === id);
  }

  /**
   * Obtener pedidos por estado
   */
  getPedidosPorEstado(estado) {
    return this.state.pedidos.filter(p => p.estado === estado);
  }

  /**
   * Obtener empleados por cargo
   */
  getEmpleadosPorCargo(cargo) {
    return this.state.cache.empleados.filter(e => e.cargo === cargo);
  }

  /**
   * Obtener platos por categoría
   */
  getPlatosPorCategoria(categoria) {
    return this.state.cache.platos?.filter(p => p.categoria === categoria) || [];
  }
}

// Instancia global
const stateManager = new StateManager();

// Exportar
if (typeof window !== 'undefined') {
  window.stateManager = stateManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { stateManager: StateManager };
}
