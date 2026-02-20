/**
 * ANTIKA RESTAURANT – Sync Manager
 * Sincronización automática con el backend
 * 
 * Características:
 * - Sincroniza cada 3 segundos
 * - Actualiza solo datos modificados (comparación por timestamp)
 * - Modo offline cuando el backend no responde
 * - Resincronización automática al volver la conexión
 */

class SyncManager {
  constructor() {
    // Intervalo de sincronización (3 segundos para tiempo real)
    this.SYNC_INTERVAL = 3000;
    
    // Intervalo de verificación de conexión (30 segundos)
    this.CONNECTION_CHECK_INTERVAL = 30000;
    
    // Estado
    this.isRunning = false;
    this.isOnline = true;
    this.lastSyncData = {
      mesas: null,
      pedidos: null,
      platos: null,
      empleados: null,
      transacciones: null,
      reservas: null
    };
    
    // Interval IDs
    this.syncIntervalId = null;
    this.connectionCheckId = null;
    
    // Callbacks
    this.onSyncStart = null;
    this.onSyncComplete = null;
    this.onSyncError = null;
    this.onConnectionChange = null;
    this.onOfflineMode = null;
    this.onReconnect = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTROL DE SINCRONIZACIÓN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Iniciar sincronización automática
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[SyncManager] Sincronización iniciada');
    
    // Primera sincronización inmediata
    this.sync();
    
    // Configurar intervalo de sincronización
    this.syncIntervalId = setInterval(() => {
      this.sync();
    }, this.SYNC_INTERVAL);
    
    // Verificar conexión periódicamente
    this.connectionCheckId = setInterval(() => {
      this.checkConnection();
    }, this.CONNECTION_CHECK_INTERVAL);
    
    // Escuchar cambios de conexión
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  /**
   * Detener sincronización
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    
    if (this.connectionCheckId) {
      clearInterval(this.connectionCheckId);
      this.connectionCheckId = null;
    }
    
    console.log('[SyncManager] Sincronización detenida');
  }

  /**
   * Pausar sincronización temporalmente
   */
  pause() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Reanudar sincronización
   */
  resume() {
    if (this.isRunning && !this.syncIntervalId) {
      this.sync();
      this.syncIntervalId = setInterval(() => {
        this.sync();
      }, this.SYNC_INTERVAL);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SINCRONIZACIÓN PRINCIPAL
  // ═══════════════════════════════════════════════════════════════

  /**
   * Ejecutar sincronización completa
   */
  async sync() {
    if (!this.isOnline) {
      console.log('[SyncManager] Offline, saltando sincronización');
      return;
    }

    // Notificar inicio
    if (this.onSyncStart) {
      this.onSyncStart();
    }
    if (typeof window !== 'undefined' && window.eventBus) {
      window.eventBus.emit(window.EVENTS.SYNC_INICIADO);
    }

    try {
      // Sincronizar todos los datos en paralelo
      const results = await Promise.allSettled([
        this.syncMesas(),
        this.syncPedidos(),
        this.syncPlatos(),
        this.syncEmpleados(),
        this.syncTransacciones(),
        this.syncReservas()
      ]);

      // Verificar resultados
      const successfulSyncs = results.filter(r => r.status === 'fulfilled').length;
      const failedSyncs = results.filter(r => r.status === 'rejected').length;

      if (failedSyncs > 0) {
        console.warn(`[SyncManager] Sincronización completada con ${failedSyncs} errores`);
        if (this.onSyncError) {
          this.onSyncError(failedSyncs);
        }
      } else {
        console.log('[SyncManager] Sincronización completada exitosamente');
      }

      // Notificar completación
      if (this.onSyncComplete) {
        this.onSyncComplete({
          successful: successfulSyncs,
          failed: failedSyncs,
          timestamp: new Date().toISOString()
        });
      }
      
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit(window.EVENTS.SYNC_COMPLETADO, {
          successful: successfulSyncs,
          failed: failedSyncs
        });
      }

    } catch (error) {
      console.error('[SyncManager] Error en sincronización:', error);
      if (this.onSyncError) {
        this.onSyncError(error);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS DE SINCRONIZACIÓN ESPECÍFICA
  // ═══════════════════════════════════════════════════════════════

  /**
   * Sincronizar pedidos activos (nuevo flujo restaurante)
   */
  async syncPedidosActivos() {
    if (!window.apiClient) return;
    
    const result = await window.apiClient.get('/pedidos/activos');
    if (result.ok) {
      this.lastSyncData.pedidosActivos = JSON.stringify(result.data);
      
      if (window.stateManager) {
        window.stateManager.set('pedidos', result.data);
      }
      
      if (window.eventBus) {
        window.eventBus.emit(window.EVENTS.DATOS_ACTUALIZADOS, { tipo: 'pedidosActivos' });
      }
    }
    return result;
  }

  /**
   * Sincronizar items para cocina
   */
  async syncCocina() {
    if (!window.apiClient) return;
    
    const result = await window.apiClient.get('/pedidos/cocina');
    if (result.ok) {
      this.lastSyncData.cocina = JSON.stringify(result.data);
      
      if (window.stateManager) {
        window.stateManager.state.cache.cocina = result.data;
      }
      
      if (window.eventBus) {
        window.eventBus.emit(window.EVENTS.DATOS_ACTUALIZADOS, { tipo: 'cocina' });
      }
    }
    return result;
  }

  /**
   * Sincronizar mesas
   */
  async syncMesas() {
    if (!window.apiClient) return;
    
    const result = await window.apiClient.get('/mesas');
    if (result.ok) {
      // Verificar si hay cambios reales
      const newData = JSON.stringify(result.data);
      if (newData !== this.lastSyncData.mesas) {
        this.lastSyncData.mesas = newData;
        
        if (window.stateManager) {
          window.stateManager.set('mesas', result.data);
        }
        
        if (window.eventBus) {
          window.eventBus.emit(window.EVENTS.DATOS_ACTUALIZADOS, { tipo: 'mesas' });
        }
      }
    }
    return result;
  }

  /**
   * Sincronizar pedidos
   */
  async syncPedidos() {
    if (!window.apiClient) return;
    
    const result = await window.apiClient.get('/pedidos');
    if (result.ok) {
      // Verificar si hay cambios
      const newData = JSON.stringify(result.data);
      if (newData !== this.lastSyncData.pedidos) {
        this.lastSyncData.pedidos = newData;
        
        if (window.stateManager) {
          window.stateManager.set('pedidos', result.data);
        }
        
        if (window.eventBus) {
          window.eventBus.emit(window.EVENTS.DATOS_ACTUALIZADOS, { tipo: 'pedidos' });
        }
      }
    }
    return result;
  }

  /**
   * Sincronizar platos/menú
   */
  async syncPlatos() {
    if (!window.apiClient) return;
    
    const result = await window.apiClient.get('/platos');
    if (result.ok) {
      const newData = JSON.stringify(result.data);
      if (newData !== this.lastSyncData.platos) {
        this.lastSyncData.platos = newData;
        
        // Extraer categorías
        const categorias = [...new Set(result.data.map(p => p.categoria))];
        
        if (window.stateManager) {
          window.stateManager.state.cache.platos = result.data;
          window.stateManager.set('categorias', categorias);
        }
        
        if (window.eventBus) {
          window.eventBus.emit(window.EVENTS.MENU_CARGADO, { 
            platos: result.data, 
            categorias 
          });
        }
      }
    }
    return result;
  }

  /**
   * Sincronizar empleados
   */
  async syncEmpleados() {
    if (!window.apiClient) return;
    
    const result = await window.apiClient.get('/empleados');
    if (result.ok) {
      const newData = JSON.stringify(result.data);
      if (newData !== this.lastSyncData.empleados) {
        this.lastSyncData.empleados = newData;
        
        if (window.stateManager) {
          window.stateManager.state.cache.empleados = result.data;
        }
      }
    }
    return result;
  }

  /**
   * Sincronizar transacciones
   */
  async syncTransacciones() {
    if (!window.apiClient) return;
    
    const result = await window.apiClient.get('/caja/transacciones');
    if (result.ok) {
      const newData = JSON.stringify(result.data);
      if (newData !== this.lastSyncData.transacciones) {
        this.lastSyncData.transacciones = newData;
        
        if (window.stateManager) {
          window.stateManager.state.cache.transacciones = result.data;
        }
      }
    }
    return result;
  }

  /**
   * Sincronizar reservas
   */
  async syncReservas() {
    if (!window.apiClient) return;
    
    const result = await window.apiClient.get('/reservas');
    if (result.ok) {
      const newData = JSON.stringify(result.data);
      if (newData !== this.lastSyncData.reservas) {
        this.lastSyncData.reservas = newData;
        
        if (window.stateManager) {
          window.stateManager.state.cache.reservas = result.data;
        }
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE CONEXIÓN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Verificar estado de conexión
   */
  async checkConnection() {
    if (!window.apiClient) return;
    
    const result = await window.apiClient.ping();
    const wasOnline = this.isOnline;
    
    this.isOnline = result.ok;
    
    if (!wasOnline && this.isOnline) {
      // Volvimos a estar online
      this.handleOnline();
    } else if (wasOnline && !this.isOnline) {
      // Perdimos conexión
      this.handleOffline();
    }
  }

  /**
   * Manejar recuperación de conexión
   */
  handleOnline() {
    if (this.isOnline) return;
    
    console.log('[SyncManager] Conexión restablecida');
    this.isOnline = true;
    
    // Notificar
    if (this.onReconnect) {
      this.onReconnect();
    }
    
    if (window.eventBus) {
      window.eventBus.emit(window.EVENTS.CONEXION_RESTABLECIDA);
    }
    
    if (window.stateManager) {
      window.stateManager.setConexion(true);
    }
    
    // Resincronizar inmediatamente
    this.sync();
  }

  /**
   * Manejar pérdida de conexión
   */
  handleOffline() {
    if (!this.isOnline) return;
    
    console.log('[SyncManager] Conexión perdida, modo offline');
    this.isOnline = false;
    
    // Notificar
    if (this.onOfflineMode) {
      this.onOfflineMode();
    }
    
    if (window.eventBus) {
      window.eventBus.emit(window.EVENTS.CONEXION_PERDIDA);
    }
    
    if (window.stateManager) {
      window.stateManager.setConexion(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CALLBACKS
  // ═══════════════════════════════════════════════════════════════

  setCallbacks({ 
    onSyncStart, 
    onSyncComplete, 
    onSyncError, 
    onConnectionChange,
    onOfflineMode,
    onReconnect 
  }) {
    if (onSyncStart) this.onSyncStart = onSyncStart;
    if (onSyncComplete) this.onSyncComplete = onSyncComplete;
    if (onSyncError) this.onSyncError = onSyncError;
    if (onConnectionChange) this.onConnectionChange = onConnectionChange;
    if (onOfflineMode) this.onOfflineMode = onOfflineMode;
    if (onReconnect) this.onReconnect = onReconnect;
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Forzar sincronización inmediata
   */
  forceSync() {
    return this.sync();
  }

  /**
   * Obtener estado actual
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isOnline: this.isOnline,
      lastSync: {
        mesas: this.lastSyncData.mesas ? new Date() : null,
        pedidos: this.lastSyncData.pedidos ? new Date() : null,
        platos: this.lastSyncData.platos ? new Date() : null
      }
    };
  }
}

// Instancia global
const syncManager = new SyncManager();

// Exportar
if (typeof window !== 'undefined') {
  window.syncManager = syncManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SyncManager };
}
