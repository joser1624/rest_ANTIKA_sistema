/**
 * ANTIKA RESTAURANT – Pedidos Manager
 * Mejoras para el módulo Pedidos por Mesa
 * 
 * Funcionalidades:
 * - Edición de pedidos (eliminar, modificar cantidad)
 * - Cancelar pedido completo
 * - Platos agrupados por categoría
 * - Agregar desde La Carta
 * - Keyboard shortcuts: + para agregar, x para quitar
 */

const PedidosManager = {
  // Mesa actualmente seleccionada
  mesaSeleccionada: null,
  
  // Cache de platos por categoría
  platosPorCategoria: {},

  // Selected item index for keyboard navigation
  selectedItemIndex: -1,

  // Keyboard state
  keysPressed: {},

  /**
   * Inicializar el manager
   */
  init: async function() {
    await this.cargarMenuPorCategorias();
    this.configurarEventListeners();
    this.configurarKeyboardShortcuts();
    
    // Also initialize keyboard if not already done
    if (!window.keyboardInitialized) {
      this.configurarKeyboardShortcuts();
      window.keyboardInitialized = true;
    }
  },

  /**
   * Cargar menú agrupado por categorías desde backend
   */
  cargarMenuPorCategorias: async function() {
    const result = await window.apiClient?.get('/menu');
    if (result?.ok) {
      this.platosPorCategoria = result.data.menu;
    }
  },

  /**
   * Configurar event listeners
   */
  configurarEventListeners: function() {
    // Evento cuando cambia la selección de mesa
    const selectMesa = document.getElementById('selectMesaPedido');
    if (selectMesa) {
      selectMesa.addEventListener('change', (e) => {
        if (e.target.value) {
          this.onMesaSeleccionada(parseInt(e.target.value));
        }
      });
    }

    // Escuchar eventos de sincronización
    if (window.eventBus) {
      window.eventBus.on(window.EVENTS?.DATOS_ACTUALIZADOS, () => {
        if (this.mesaSeleccionada) {
          this.actualizarVistaPedido(this.mesaSeleccionada);
        }
      });
    }
  },

  /**
   * Configure keyboard shortcuts (+ and x)
   */
  configurarKeyboardShortcuts: function() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      
      // '+' key - Add new dish (focus on search/selector)
      if (key === '+' || e.key === 'Add') {
        e.preventDefault();
        const searchInput = document.querySelector('.buscador-platos');
        if (searchInput) {
          searchInput.focus();
          this.mostrarNotificacionTecla('Modo agregar plato - Busque y seleccione un plato');
        }
        return;
      }

      // 'x' key - Remove selected item
      if (key === 'x') {
        e.preventDefault();
        this.quitarItemSeleccionado();
        return;
      }

      // Arrow keys for navigation
      if (key === 'arrowup' || key === 'arrowdown') {
        e.preventDefault();
        this.navegarItems(e.key === 'arrowup' ? -1 : 1);
        return;
      }

      // Enter to add quantity
      if (key === 'enter') {
        e.preventDefault();
        this.agregarCantidadItemSeleccionado();
        return;
      }

      // Delete/Backspace to reduce quantity
      if (key === 'delete' || key === 'backspace') {
        e.preventDefault();
        this.reducirCantidadItemSeleccionado();
        return;
      }
    });

    // Track held keys
    document.addEventListener('keyup', (e) => {
      this.keysPressed[e.key.toLowerCase()] = false;
    });
  },

  /**
   * Navigate through order items with keyboard
   */
  navegarItems: function(direction) {
    const items = document.querySelectorAll('.pedido-lista-row');
    if (items.length === 0) return;

    // Remove previous selection
    items.forEach(item => item.classList.remove('keyboard-selected'));

    // Calculate new index
    this.selectedItemIndex += direction;
    if (this.selectedItemIndex < 0) this.selectedItemIndex = items.length - 1;
    if (this.selectedItemIndex >= items.length) this.selectedItemIndex = 0;

    // Select new item
    const newItem = items[this.selectedItemIndex];
    newItem.classList.add('keyboard-selected');
    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  /**
   * Remove the currently selected item
   */
  quitarItemSeleccionado: async function() {
    const selectedItem = document.querySelector('.pedido-lista-row.keyboard-selected');
    if (!selectedItem) {
      this.mostrarNotificacionTecla('Seleccione un plato con ↑↓ y presione x para quitar', 'warning');
      return;
    }

    const pedidoId = selectedItem.dataset.pedidoId;
    const itemId = parseInt(selectedItem.dataset.itemId);

    if (pedidoId && itemId) {
      await this.quitarItem(pedidoId, itemId);
      this.mostrarNotificacionTecla('✓ Plato quitado');
    }
  },

  /**
   * Add 1 to quantity of selected item
   */
  agregarCantidadItemSeleccionado: async function() {
    const selectedItem = document.querySelector('.pedido-lista-row.keyboard-selected');
    if (!selectedItem) {
      this.mostrarNotificacionTecla('Seleccione un plato con ↑↓ y presione Enter para agregar', 'warning');
      return;
    }

    const pedidoId = selectedItem.dataset.pedidoId;
    const itemId = parseInt(selectedItem.dataset.itemId);

    if (pedidoId && itemId) {
      await this.cambiarCantidad(pedidoId, itemId, 1);
      this.mostrarNotificacionTecla('✓ Cantidad aumentada (+1)');
    }
  },

  /**
   * Reduce quantity of selected item
   */
  reducirCantidadItemSeleccionado: async function() {
    const selectedItem = document.querySelector('.pedido-lista-row.keyboard-selected');
    if (!selectedItem) {
      this.mostrarNotificacionTecla('Seleccione un plato con ↑↓ y presione Supr para reducir', 'warning');
      return;
    }

    const pedidoId = selectedItem.dataset.pedidoId;
    const itemId = parseInt(selectedItem.dataset.itemId);

    if (pedidoId && itemId) {
      await this.cambiarCantidad(pedidoId, itemId, -1);
      this.mostrarNotificacionTecla('✓ Cantidad reducida (-1)');
    }
  },

  /**
   * Show keyboard notification
   */
  mostrarNotificacionTecla: function(mensaje, tipo = 'success') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `keyboard-toast toast-${tipo}`;
    toast.innerHTML = `
      <span class="keyboard-toast-icon">⌨️</span>
      <span class="keyboard-toast-message">${mensaje}</span>
    `;
    
    // Add styles if not exists
    if (!document.getElementById('keyboard-styles')) {
      const style = document.createElement('style');
      style.id = 'keyboard-styles';
      style.textContent = `
        .keyboard-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #22c55e;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 10000;
          animation: slideIn 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .keyboard-toast.toast-warning {
          background: #f59e0b;
        }
        .keyboard-toast.toast-error {
          background: #ef4444;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .pedido-lista-row.keyboard-selected {
          outline: 3px solid #3b82f6 !important;
          background: rgba(59, 130, 246, 0.1) !important;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Remove after 2 seconds
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  },

  /**
   * Cuando se selecciona una mesa
   */
  onMesaSeleccionada: function(mesaId) {
    this.mesaSeleccionada = mesaId;
    this.actualizarVistaPedido(mesaId);
  },

  /**
   * Obtener pedido activo de una mesa
   */
  obtenerPedidoMesa: function(mesaId) {
    return window.stateManager?.getPedidoDeMesa(mesaId) || 
           window.pedidos?.find(p => p.mesa === mesaId && p.estado !== 'despachado' && p.estado !== 'cerrado');
  },

  /**
   * Renderizar vista de pedido mejorada
   */
  actualizarVistaPedido: async function(mesaId) {
    const area = document.getElementById('pedidoMesaArea');
    if (!area) return;

    // Obtener datos del backend
    let pedido = null;
    const result = await window.apiClient?.get(`/pedidos/mesa/${mesaId}`);
    if (result?.ok && result.data) {
      pedido = result.data;
    }

    // Si no hay pedido activo, mostrar vista de agregar
    if (!pedido || !pedido.items || pedido.items.length === 0) {
      this.renderVistaVacia(area, mesaId);
      return;
    }

    this.renderVistaPedido(area, mesaId, pedido);
  },

  /**
   * Renderizar vista cuando no hay pedido
   */
  renderVistaVacia: function(area, mesaId) {
    const mesa = window.mesas?.find(m => m.id === mesaId);
    const estadoMesa = mesa?.estado || 'libre';
    
    area.innerHTML = `
      <div class="pedido-mesa-wrapper">
        <div class="pedido-lista-card">
          <p class="pedido-lista-title">Mesa ${mesaId} — Sin Pedido</p>
          <p style="color: var(--text-light); font-size: 0.9rem; margin: 20px 0;">
            ${estadoMesa === 'abierta' ? 'Mesa abierta, puede agregar platos' : 'Abra la mesa para comenzar'}
          </p>
          <div class="pedido-acciones-row">
            ${estadoMesa === 'libre' || estadoMesa === 'abierta' ? 
              `<button class="btn-primary" onclick="PedidosManager.abrirMesa(${mesaId})">▶ Abrir Mesa</button>` : ''}
          </div>
        </div>
        <div class="agregar-plato-card">
          ${this.renderSelectorPlatos(mesaId)}
        </div>
      </div>
    `;
  },

  /**
   * Renderizar vista de pedido con items
   */
  renderVistaPedido: function(area, mesaId, pedido) {
    const items = pedido.items || [];
    const total = pedido.total || items.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
    
    // Determinar estado editable
    const hayItemsPendientes = items.some(i => i.estado === 'pendiente');
    const hayItemsPreparando = items.some(i => i.estado === 'preparando');
    const hayItemsListos = items.some(i => i.estado === 'listo');
    
    const esEditable = hayItemsPendientes && !hayItemsPreparando && !hayItemsListos;
    const soloAgregar = hayItemsPreparando || hayItemsListos;
    const bloqueado = hayItemsListos;

    area.innerHTML = `
      <div class="pedido-mesa-wrapper">
        <div class="pedido-lista-card">
          <div class="pedido-header-info">
            <p class="pedido-lista-title">Mesa ${mesaId} — ${pedido.mozo || 'Mozo'}</p>
            <span class="badge badge-${esEditable ? 'warning' : soloAgregar ? 'info' : 'success'}">
              ${esEditable ? 'Editable' : soloAgregar ? 'En Proceso' : 'Completado'}
            </span>
          </div>
          
          <div class="pedido-items-list">
            ${items.map((item, idx) => this.renderItemPedido(item, idx, pedido.id, esEditable)).join('')}
          </div>
          
          <div class="pedido-total-row">
            <span>TOTAL</span>
            <span class="total-amount">S/ ${total.toFixed(2)}</span>
          </div>
          
          <div class="pedido-acciones-row">
            ${esEditable ? `
              <button class="btn-danger btn-sm" onclick="PedidosManager.cancelarPedido('${pedido.id}', ${mesaId})">
                🗑 Cancelar Pedido
              </button>
            ` : ''}
            ${bloqueado ? '' : `
              <button class="btn-primary btn-sm" onclick="PedidosManager.generarCuenta(${mesaId}, ${total})">
                🧾 Generar Cuenta
              </button>
              <button class="btn-secondary" onclick="PedidosManager.cerrarMesa(${mesaId});renderMesas();">
                Cerrar Mesa
              </button>
            `}
          </div>
          
          ${soloAgregar ? '<p class="info-text">⚠️ Solo puede agregar platos. Los existentes están en preparación.</p>' : ''}
        </div>
        <div class="agregar-plato-card">
          ${this.renderSelectorPlatos(mesaId, bloqueado)}
        </div>
      </div>
    `;
  },

  /**
   * Renderizar un item del pedido
   */
  renderItemPedido: function(item, idx, pedidoId, esEditable) {
    const colorEstado = this.getColorEstado(item.estado);
    const subtotal = (item.precio * item.cantidad).toFixed(2);
    
    return `
      <div class="pedido-lista-row item-${item.estado}" data-pedido-id="${pedidoId}" data-item-id="${item.id}" data-index="${idx}">
        ${esEditable ? `
          <div class="item-controls">
            <button class="btn-qty" onclick="PedidosManager.cambiarCantidad('${pedidoId}', ${item.id}, -1)">−</button>
            <span class="item-qty">${item.cantidad}</span>
            <button class="btn-qty" onclick="PedidosManager.cambiarCantidad('${pedidoId}', ${item.id}, 1)">+</button>
          </div>
        ` : `
          <span class="pl-qty">${item.cantidad}×</span>
        `}
        <div class="item-info">
          <span class="pl-name">${item.nombre}</span>
          <span class="item-nota">${item.nota || ''}</span>
        </div>
        <div class="item-right">
          <span class="badge badge-sm" style="background:${colorEstado}">${item.estado}</span>
          ${esEditable && item.estado === 'pendiente' ? `
            <button class="btn-remove" onclick="PedidosManager.quitarItem('${pedidoId}', ${item.id})" title="Quitar (x)">
              ✕
            </button>
          ` : ''}
          <span class="pl-price">S/ ${subtotal}</span>
        </div>
      </div>
    `;
  },

  /**
   * Renderizar selector de platos agrupado por categoría
   */
  renderSelectorPlatos: function(mesaId, bloqueado = false) {
    let platos = window.CARTA_ANTIKA || [];
    let menuAgrupado = this.platosPorCategoria;
    
    // Si no hay menú del backend, agrupar localmente
    if (Object.keys(menuAgrupado).length === 0) {
      menuAgrupado = {};
      platos.forEach(p => {
        if (!menuAgrupado[p.categoria]) menuAgrupado[p.categoria] = [];
        menuAgrupado[p.categoria].push(p);
      });
    }

    const categorias = Object.keys(menuAgrupado).sort();
    
    return `
      <div class="selector-platos-container">
        <p class="agregar-plato-title">+ Agregar Plato</p>
        <input type="text" class="buscador-platos" placeholder="🔍 Buscar plato..." 
               onkeyup="PedidosManager.filtrarPlatos(this.value)">
        
        <div class="categorias-list">
          ${categorias.map(cat => `
            <div class="categoria-grupo" data-categoria="${cat}">
              <div class="categoria-header" style="border-left-color: ${this.getColorCategoria(cat)}">
                ${cat} <span class="categoria-count">${menuAgrupado[cat].length}</span>
              </div>
              <div class="categoria-items">
                ${menuAgrupado[cat].map(p => `
                  <div class="plato-option" data-nombre="${p.nombre.toLowerCase()}">
                    <span class="plato-nombre">${p.nombre}</span>
                    <span class="plato-precio">S/${p.precio}</span>
                    <button class="cmi-add" ${bloqueado ? 'disabled' : ''} 
                            onclick="PedidosManager.agregarPlato(${mesaId}, ${p.id})">+</button>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Filtrar platos por búsqueda
   */
  filtrarPlatos: function(termino) {
    const opciones = document.querySelectorAll('.plato-option');
    const terminoLower = termino.toLowerCase();
    
    opciones.forEach(op => {
      const nombre = op.dataset.nombre;
      op.style.display = nombre.includes(terminoLower) ? 'flex' : 'none';
    });
  },

  /**
   * Obtener color por categoría
   */
  getColorCategoria: function(categoria) {
    const colores = {
      'Desayunos': '#f59e0b',
      'Sándwiches': '#f97316', 
      'Ensaladas': '#10b981',
      'Sopas': '#0ea5e9',
      'Medio Día': '#f59e0b',
      'Fondos': '#22c55e',
      'Burgers': '#78350f',
      'Alitas': '#171717',
      'Adicionales': '#6b7280'
    };
    return colores[categoria] || '#6b7280';
  },

  /**
   * Obtener color por estado
   */
  getColorEstado: function(estado) {
    const colores = {
      'pendiente': '#f59e0b',
      'preparando': '#3b82f6',
      'listo': '#22c55e',
      'entregado': '#6b7280',
      'anulado': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  },

  // ═══════════════════════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Abrir mesa
   */
  abrirMesa: async function(mesaId) {
    const mozo = window.getCurrentUser?.()?.nombre || 'Mozo';
    
    if (window.stateManager?.abrirMesa) {
      await window.stateManager.abrirMesa(mesaId, mozo);
    } else {
      // Fallback: usar API directamente
      await window.apiClient?.post(`/pedidos/abrir/${mesaId}`, { mozo });
    }
    
    this.actualizarVistaPedido(mesaId);
    if (typeof renderMesas === 'function') renderMesas();
  },

  /**
   * Agregar plato a la mesa
   */
  agregarPlato: async function(mesaId, platoId) {
    const plato = window.CARTA_ANTIKA?.find(p => p.id === platoId);
    if (!plato) return;

    const mozo = window.getCurrentUser?.()?.nombre || 'Mozo';
    
    // Check if mesa is open, if not, open it
    const mesa = window.mesas?.find(m => m.id === mesaId);
    if (!mesa || mesa.estado === 'libre') {
      // Open the mesa first
      await window.apiClient?.put(`/mesas/${mesaId}`, { estado: 'ocupada', mozo: mozo });
    }

    if (window.stateManager?.agregarPlatosAMesa) {
      await window.stateManager.agregarPlatosAMesa(mesaId, [{
        nombre: plato.nombre,
        precio: plato.precio,
        cantidad: 1
      }]);
    } else {
      const result = await window.apiClient?.post(`/pedidos/agregar/${mesaId}`, {
        items: [{ nombre: plato.nombre, precio: plato.precio, cantidad: 1 }],
        mozo: mozo
      });
      
      if (!result?.ok && !result?.id) {
        console.error('Error al agregar plato:', result?.error);
        return;
      }
    }

    this.actualizarVistaPedido(mesaId);
    if (typeof renderMesas === 'function') renderMesas();
  },

  /**
   * Quitar item del pedido
   */
  quitarItem: async function(pedidoId, itemId) {
    const result = await window.apiClient?.post(`/pedidos/quitar/${pedidoId}`, { itemId });
    
    if (result?.ok) {
      this.actualizarVistaPedido(this.mesaSeleccionada);
      if (typeof renderMesas === 'function') renderMesas();
    } else {
      alert(result?.error || 'No se pudo quitar el plato');
    }
  },

  /**
   * Cambiar cantidad de un item
   */
  cambiarCantidad: async function(pedidoId, itemId, cambio) {
    // Obtener pedido actual
    const result = await window.apiClient?.get(`/pedidos/${pedidoId}`);
    if (!result?.ok) return;

    const items = result.data.items;
    const item = items.find(i => i.id == itemId);
    if (!item || item.estado !== 'pendiente') return;

    const nuevaCantidad = item.cantidad + cambio;
    
    if (nuevaCantidad <= 0) {
      // Quitar el item
      await this.quitarItem(pedidoId, itemId);
    } else {
      // Usar el nuevo endpoint de cantidad
      const updateResult = await window.apiClient?.post(`/pedidos/cantidad/${pedidoId}`, {
        itemId: itemId,
        cantidad: nuevaCantidad
      });
      
      if (updateResult?.ok) {
        this.actualizarVistaPedido(this.mesaSeleccionada);
        if (typeof renderMesas === 'function') renderMesas();
      }
    }
  },

  /**
   * Cancelar pedido completo
   */
  cancelarPedido: async function(pedidoId, mesaId) {
    if (!confirm('¿Está seguro de cancelar el pedido? No aparecerá en cocina ni reportes.')) {
      return;
    }

    // Eliminar pedido
    await window.apiClient?.delete(`/pedidos/${pedidoId}`);
    
    // Liberar mesa
    await window.apiClient?.put(`/mesas/${mesaId}`, { estado: 'libre', mozo: null });

    this.actualizarVistaPedido(mesaId);
    if (typeof renderMesas === 'function') renderMesas();
  },

  /**
   * Generar cuenta
   */
  generarCuenta: function(mesaId, total) {
    if (typeof window.generarCuenta === 'function') {
      window.generarCuenta(mesaId, total);
    } else {
      alert(`Generando cuenta para Mesa ${mesaId}: S/ ${total.toFixed(2)}`);
    }
  },

  /**
   * Cerrar mesa
   */
  cerrarMesa: async function(mesaId) {
    if (window.stateManager?.cerrarMesa) {
      await window.stateManager.cerrarMesa(mesaId);
    } else {
      await window.apiClient?.post(`/pedidos/cerrar/${mesaId}`, { metodoPago: 'efectivo' });
    }
    
    this.mesaSeleccionada = null;
  },

  // ═══════════════════════════════════════════════════════════════
  // LA CARTA - AGREGAR DESDE SECCIÓN PRINCIPAL
  // ═══════════════════════════════════════════════════════════════

  /**
   * Mesa seleccionada globally (para La Carta)
   */
  mesaGlobalSeleccionada: null,

  /**
   * Seleccionar mesa desde La Carta
   */
  seleccionarMesaGlobal: function(mesaId) {
    this.mesaGlobalSeleccionada = mesaId;
    
    // Actualizar UI
    document.querySelectorAll('.mesa-btn-mini').forEach(btn => {
      btn.classList.remove('selected');
      if (parseInt(btn.dataset.mesa) === mesaId) {
        btn.classList.add('selected');
      }
    });
  },

  /**
   * Renderizar selector de mesas para La Carta
   */
  renderSelectorMesasGlobal: function() {
    const mesas = window.mesas || [];
    return `
      <div class="mesa-selector-mini">
        ${mesas.map(m => {
          const estaOcupada = m.estado === 'ocupada' || m.estado === 'abierta';
          const claseOcupada = estaOcupada ? 'occupied' : '';
          const claseSeleccionada = this.mesaGlobalSeleccionada === m.id ? 'selected' : '';
          return `<button class="mesa-btn-mini ${claseOcupada} ${claseSeleccionada}" 
                  data-mesa="${m.id}" 
                  onclick="PedidosManager.seleccionarMesaGlobal(${m.id})">
            Mesa ${m.id} ${m.mozo ? '(' + m.mozo + ')' : ''}
          </button>`;
        }).join('')}
      </div>
      ${this.mesaGlobalSeleccionada ? 
        `<p style="font-size:0.8rem;color:var(--primary)">✓ Seleccionado: Mesa ${this.mesaGlobalSeleccionada}</p>` :
        '<p style="font-size:0.8rem;color:var(--text-light)">Seleccione una mesa para agregar platos</p>'
      }
    `;
  },

  /**
   * Agregar plato desde La Carta (botón en cada tarjeta)
   */
  agregarPlatoDesdeCarta: async function(platoId) {
    if (!this.mesaGlobalSeleccionada) {
      alert('Por favor seleccione una mesa primero');
      return;
    }

    const plato = window.CARTA_ANTIKA?.find(p => p.id === platoId);
    if (!plato) return;

    // Agregar el plato
    await this.agregarPlato(this.mesaGlobalSeleccionada, platoId);
    
    // Mostrar confirmación
    alert(`✓ ${plato.nombre} agregado a Mesa ${this.mesaGlobalSeleccionada}`);
  }
};

// Hacer disponible globalmente
window.PedidosManager = PedidosManager;
