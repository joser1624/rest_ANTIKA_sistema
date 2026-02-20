/**
 * ANTIKA RESTAURANT – Event Bus
 * Sistema de eventos para comunicación entre componentes
 * 
 * Permite:
 * - Suscribirse a eventos específicos
 * - Desuscribirse cuando ya no se necesita
 * - Eventos globales del sistema (pedidos, mesas, conexión)
 */

// Constructor de eventos
class EventEmitter {
  constructor() {
    this.events = {};
  }

  // Suscribir a un evento
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Devolver función para desuscribirse
    return () => this.off(event, callback);
  }

  // Desuscribirse de un evento
  off(event, callback) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    
    // Limpiar si no hay más listeners
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }

  // Emitir un evento
  emit(event, data) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en listener de ${event}:`, error);
      }
    });
  }

  // Suscribir solo una vez
  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  // Obtener cantidad de listeners
  listenerCount(event) {
    return this.events[event]?.length || 0;
  }

  // Limpiar todos los eventos
  clear() {
    this.events = {};
  }
}

// Instancia global del event bus
const eventBus = new EventEmitter();

// Definir constantes de eventos del sistema
const EVENTS = {
  // Estados de pedidos
  PEDIDO_CREADO: 'pedido:creado',
  PEDIDO_ACTUALIZADO: 'pedido:actualizado',
  PEDIDO_ESTADO_CAMBIADO: 'pedido:estado:cambiado',
  PEDIDO_CANCELADO: 'pedido:cancelado',
  
  // Platos (nuevo flujo)
  PLATO_AGREGADO: 'plato:agregado',
  PLATO_QUITADO: 'plato:quitado',
  PLATO_ESTADO_CAMBIADO: 'plato:estado:cambiado',
  
  // Cocina
  COCINA_ACTUALIZADA: 'cocina:actualizada',
  
  // Mesas
  MESA_ABIERTA: 'mesa:abierta',
  MESA_CERRADA: 'mesa:cerrada',
  MESA_ACTUALIZADA: 'mesa:actualizada',
  
  // Menú / Platos
  MENU_CARGADO: 'menu:cargado',
  PLATO_AGREGADO: 'plato:agregado',
  PLATO_ACTUALIZADO: 'plato:actualizado',
  PLATO_ELIMINADO: 'plato:eliminado',
  
  // Sincronización
  SYNC_INICIADO: 'sync:iniciado',
  SYNC_COMPLETADO: 'sync:completado',
  SYNC_ERROR: 'sync:error',
  
  // Conexión
  CONEXION_PERDIDA: 'conexion:perdida',
  CONEXION_RESTABLECIDA: 'conexion:restablecida',
  
  // Datos globales
  DATOS_ACTUALIZADOS: 'datos:actualizados',
  
  // UI
  NOTIFICACION: 'ui:notificacion',
  MODAL_ABIERTO: 'ui:modal:abierto',
  MODAL_CERRADO: 'ui:modal:cerrado'
};

// Estados de pedido válidos
const ESTADOS_PEDIDO = {
  CREADO: 'creado',
  EN_PREPARACION: 'en_preparacion',
  TOMADO: 'tomado',
  LISTO: 'listo',
  ENTREGADO: 'entregado',
  PAGADO: 'pagado',
  CERRADO: 'cerrado',
  ANULADO: 'anulado'
};

// Estados de PLATO en el pedido (nuevo flujo restaurante)
const ESTADOS_PLATO = {
  PENDIENTE: 'pendiente',
  PREPARANDO: 'preparando',
  LISTO: 'listo',
  ENTREGADO: 'entregado',
  ANULADO: 'anulado'
};

// Colores de categorías
const COLORES_CATEGORIA = {
  'Desayunos': '#f59e0b',     // amarillo
  'Sándwiches': '#f97316',   // naranja
  'Criollos': '#ef4444',     // rojo
  'Fondos': '#22c55e',       // verde
  'Sopas': '#0ea5e9',        // celeste
  'Burgers': '#78350f',      // marrón
  'Alitas': '#171717',       // negro
  'Vegetarianos': '#84cc16', // verde claro
  'Ensaladas': '#10b981',    // verde esmeralda
  'Medio Día': '#f59e0b',    // amarillo
  'Adicionales': '#6b7280'   // gris
};

// Helpers para emitir eventos comunes
const emitPedidoCreado = (pedido) => {
  eventBus.emit(EVENTS.PEDIDO_CREADO, pedido);
  eventBus.emit(EVENTS.DATOS_ACTUALIZADOS, { tipo: 'pedido', accion: 'crear' });
};

const emitPedidoEstadoCambiado = (pedidoId, estadoAnterior, nuevoEstado) => {
  eventBus.emit(EVENTS.PEDIDO_ESTADO_CAMBIADO, { 
    pedidoId, 
    estadoAnterior, 
    nuevoEstado 
  });
  eventBus.emit(EVENTS.DATOS_ACTUALIZADOS, { tipo: 'pedido', accion: 'estado', pedidoId });
};

const emitMesaAbierta = (mesaId, mozo) => {
  eventBus.emit(EVENTS.MESA_ABIERTA, { mesaId, mozo });
  eventBus.emit(EVENTS.DATOS_ACTUALIZADOS, { tipo: 'mesa', accion: 'abrir' });
};

const emitMesaCerrada = (mesaId) => {
  eventBus.emit(EVENTS.MESA_CERRADA, { mesaId });
  eventBus.emit(EVENTS.DATOS_ACTUALIZADOS, { tipo: 'mesa', accion: 'cerrar' });
};

const emitSyncCompletado = (datos) => {
  eventBus.emit(EVENTS.SYNC_COMPLETADOS, datos);
};

const emitNotificacion = (mensaje, tipo = 'info', duracion = 3000) => {
  eventBus.emit(EVENTS.NOTIFICACION, { mensaje, tipo, duracion });
};

// Exportar
if (typeof window !== 'undefined') {
  window.eventBus = eventBus;
  window.EVENTS = EVENTS;
  window.ESTADOS_PEDIDO = ESTADOS_PEDIDO;
  window.ESTADOS_PLATO = ESTADOS_PLATO;
  window.COLORES_CATEGORIA = COLORES_CATEGORIA;
  window.emitPedidoCreado = emitPedidoCreado;
  window.emitPedidoEstadoCambiado = emitPedidoEstadoCambiado;
  window.emitMesaAbierta = emitMesaAbierta;
  window.emitMesaCerrada = emitMesaCerrada;
  window.emitSyncCompletado = emitSyncCompletado;
  window.emitNotificacion = emitNotificacion;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    eventBus, 
    EVENTS, 
    ESTADOS_PEDIDO,
    ESTADOS_PLATO,
    COLORES_CATEGORIA,
    emitPedidoCreado,
    emitPedidoEstadoCambiado,
    emitMesaAbierta,
    emitMesaCerrada,
    emitSyncCompletado,
    emitNotificacion
  };
}
