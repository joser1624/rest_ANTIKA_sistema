/**
 * ANTIKA RESTAURANT – Integration Helper
 * Helper para integrar el nuevo sistema de estado con el frontend existente
 * 
 * Este archivo proporciona funciones que trabajan junto con el código existente
 * sin modificar su funcionamiento
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════════

  function init() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDOMReady);
    } else {
      onDOMReady();
    }
  }

  function onDOMReady() {
    console.log('[Antika Integration] Inicializando...');
    
    // Inicializar state manager con datos del backend
    if (window.stateManager) {
      window.stateManager.cargarDatosIniciales().then(() => {
        console.log('[Antika Integration] Datos iniciales cargados');
        
        // Iniciar sincronización automática
        if (window.syncManager) {
          window.syncManager.start();
        }
      });
    }

    // Escuchar eventos de sincronización
    if (window.eventBus) {
      window.eventBus.on(window.EVENTS.DATOS_ACTUALIZADOS, manejarActualizacion);
      window.eventBus.on(window.EVENTS.CONEXION_PERDIDA, () => mostrarModoOffline());
      window.eventBus.on(window.EVENTS.CONEXION_RESTABLECIDA, () => ocultarModoOffline());
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS PARA INTEGRACIÓN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Cargar menú dinámicamente desde el backend
   * Uso: AntikaMenu.render('#menu-container')
   */
  window.AntikaMenu = {
    /**
     * Renderizar menú en un contenedor
     */
    render: async function(contenedorId) {
      const result = await window.apiClient.get('/platos');
      if (!result.ok) {
        console.error('Error cargando menú:', result.error);
        return;
      }

      const platos = result.data;
      const categorias = [...new Set(platos.map(p => p.categoria))];
      
      const container = document.querySelector(contenedorId);
      if (!container) return;

      // Renderizar por categorías
      container.innerHTML = '';
      categorias.forEach(cat => {
        const platosCat = platos.filter(p => p.categoria === cat);
        const catSection = this.crearSeccion(categoria, platosCat);
        container.appendChild(catSection);
      });

      return { platos, categorias };
    },

    /**
     * Crear sección de categoría
     */
    crearSeccion: function(categoria, platos) {
      const section = document.createElement('div');
      section.className = 'menu-categoria';
      section.dataset.categoria = categoria;
      
      // Color de cabecera por categoría
      const color = (window.COLORES_CATEGORIA && window.COLORES_CATEGORIA[categoria]) || '#6b7280';
      
      const title = document.createElement('h3');
      title.className = 'categoria-titulo';
      title.textContent = categoria;
      title.style.borderLeftColor = color;
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'categoria-grid';

      platos.forEach(plato => {
        const card = this.crearTarjeta(plato);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      return section;
    },

    /**
     * Crear tarjeta de plato
     */
    crearTarjeta: function(plato) {
      const card = document.createElement('div');
      card.className = 'plato-card';
      card.dataset.id = plato.id;
      card.dataset.nombre = plato.nombre;
      card.dataset.precio = plato.precio;
      card.dataset.categoria = plato.categoria;

      // Estados de la tarjeta
      card.dataset.estado = 'normal'; // normal, hover, seleccionado, en-pedido

      card.innerHTML = `
        <div class="plato-nombre">${plato.nombre}</div>
        <div class="plato-desc">${plato.desc || ''}</div>
        <div class="plato-precio">S/ ${plato.precio.toFixed(2)}</div>
        <div class="plato-badge" style="display:none">0</div>
      `;

      // Eventos
      card.addEventListener('click', () => this.onPlatoClick(plato, card));
      card.addEventListener('mouseenter', () => this.setCardState(card, 'hover'));
      card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('seleccionado')) {
          this.setCardState(card, 'normal');
        }
      });

      return card;
    },

    /**
     * Establecer estado visual de la tarjeta
     */
    setCardState: function(card, estado) {
      card.dataset.estado = estado;
      card.className = 'plato-card';
      
      if (estado === 'hover') card.classList.add('hover');
      if (estado === 'seleccionado') card.classList.add('seleccionado');
      if (estado === 'en-pedido') card.classList.add('en-pedido');
    },

    /**
     * Manejar click en plato
     */
    onPlatoClick: function(plato, card) {
      // Toggle selección
      const yaSeleccionado = card.classList.contains('seleccionado');
      
      if (yaSeleccionado) {
        this.setCardState(card, 'normal');
        card.classList.remove('seleccionado');
        if (window.stateManager) {
          window.stateManager.quitarDelPedido(plato.nombre);
        }
      } else {
        this.setCardState(card, 'seleccionado');
        card.classList.add('seleccionado');
        if (window.stateManager) {
          window.stateManager.agregarAlPedido(plato);
        }
      }

      // Actualizar badge
      this.actualizarBadge(card, plato.nombre);
    },

    /**
     * Actualizar badge de cantidad
     */
    actualizarBadge: function(card, nombrePlato) {
      const pedido = window.stateManager?.getPedidoActivo() || [];
      const item = pedido.find(i => i.nombre === nombrePlato);
      const badge = card.querySelector('.plato-badge');
      
      if (badge) {
        if (item && item.cant > 0) {
          badge.textContent = item.cant;
          badge.style.display = 'block';
          this.setCardState(card, 'en-pedido');
        } else {
          badge.style.display = 'none';
          this.setCardState(card, 'normal');
        }
      }
    },

    /**
     * Sincronizar badges con pedido activo
     */
    syncBadges: function() {
      const pedido = window.stateManager?.getPedidoActivo() || [];
      document.querySelectorAll('.plato-card').forEach(card => {
        const nombre = card.dataset.nombre;
        const item = pedido.find(i => i.nombre === nombre);
        const badge = card.querySelector('.plato-badge');
        
        if (badge) {
          if (item && item.cant > 0) {
            badge.textContent = item.cant;
            badge.style.display = 'block';
            card.classList.add('en-pedido');
          } else {
            badge.style.display = 'none';
            card.classList.remove('en-pedido', 'seleccionado');
          }
        }
      });
    },

    /**
     * Quitar plato del pedido (solo si está PENDIENTE)
     */
    quitarPlato: async function(pedidoId, itemId) {
      if (!window.apiClient) {
        console.error('API no disponible');
        return { ok: false, error: 'API no disponible' };
      }

      const result = await window.apiClient.post(`/pedidos/quitar/${pedidoId}`, {
        itemId: itemId
      });

      if (result.ok) {
        // Sincronizar después de quitar
        if (window.syncManager) {
          window.syncManager.sync();
        }
        window.AntikaMenu.syncBadges();
      }

      return result;
    },

    /**
     * Cambiar estado de plato (para cocina)
     */
    cambiarEstadoPlato: async function(pedidoId, itemId, nuevoEstado) {
      if (!window.apiClient) {
        return { ok: false, error: 'API no disponible' };
      }

      const result = await window.apiClient.post(`/pedidos/estado-item/${pedidoId}`, {
        itemId: itemId,
        estado: nuevoEstado
      });

      if (result.ok) {
        if (window.syncManager) {
          window.syncManager.sync();
        }
      }

      return result;
    },

    /**
     * Obtener pedido actual de una mesa
     */
    getPedidoMesa: async function(numeroMesa) {
      if (!window.apiClient) return null;
      const result = await window.apiClient.get(`/pedidos/mesa/${numeroMesa}`);
      return result.ok ? result.data : null;
    },

    /**
     * Abrir mesa
     */
    abrirMesa: async function(numeroMesa, nombreMozo) {
      if (!window.apiClient) {
        return { ok: false, error: 'API no disponible' };
      }
      const result = await window.apiClient.post(`/pedidos/abrir/${numeroMesa}`, {
        mozo: nombreMozo
      });
      if (result.ok && window.syncManager) {
        window.syncManager.sync();
      }
      return result;
    },

    /**
     * Cerrar mesa y registrar pago
     */
    cerrarMesa: async function(numeroMesa, metodoPago = 'efectivo') {
      if (!window.apiClient) {
        return { ok: false, error: 'API no disponible' };
      }
      const result = await window.apiClient.post(`/pedidos/cerrar/${numeroMesa}`, {
        metodoPago: metodoPago
      });
      if (result.ok && window.syncManager) {
        window.syncManager.sync();
      }
      return result;
    },

    /**
     * Agregar plato a mesa específica
     */
    agregarPlato: async function(numeroMesa, plato) {
      if (!window.apiClient) {
        return { ok: false, error: 'API no disponible' };
      }
      
      const items = [{
        nombre: plato.nombre,
        precio: plato.precio,
        cantidad: 1
      }];

      const result = await window.apiClient.post(`/pedidos/agregar/${numeroMesa}`, {
        items: items,
        mozo: window.stateManager?.getUsuario()?.nombre || 'Mozo'
      });

      if (result.ok && window.syncManager) {
        window.syncManager.sync();
      }

      return result;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // MANEJO DE ACTUALIZACIONES
  // ═══════════════════════════════════════════════════════════════

  function manejarActualizacion(data) {
    console.log('[Antika Integration] Datos actualizados:', data);
    
    // Sincronizar badges del menú
    if (window.AntikaMenu && typeof window.AntikaMenu.syncBadges === 'function') {
      window.AntikaMenu.syncBadges();
    }

    // Refrescar UI de mesas si existe
    if (typeof window.renderMesas === 'function') {
      window.renderMesas();
    }

    // Refrescar UI de pedidos si existe
    if (typeof window.renderPedidos === 'function') {
      window.renderPedidos();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MODO OFFLINE
  // ═══════════════════════════════════════════════════════════════

  function mostrarModoOffline() {
    let banner = document.getElementById('offline-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.className = 'offline-banner';
      banner.innerHTML = '⚠️ Sin conexión - Trabajando en modo offline';
      document.body.appendChild(banner);
    }
    banner.style.display = 'block';
  }

  function ocultarModoOffline() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORTAR
  // ═══════════════════════════════════════════════════════════════

  window.AntikaIntegration = {
    init,
    menu: window.AntikaMenu
  };

  // Iniciar
  init();

})();
