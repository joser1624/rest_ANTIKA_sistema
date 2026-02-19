/* ============================================================
   ANTIKA RESTAURANT – ADMIN JS
   Datos adaptados al menú real del restaurante
   Conectado al backend Node.js
   
   Arquitectura Cliente-Servidor:
   - Frontend: Servido por Live Server (http://127.0.0.1:5500)
   - Backend: Servidor API (http://localhost:3000)
   ============================================================ */

// Configuración API - Backend Server
const API_BASE = 'http://localhost:3000/api';

// ─── DATOS DEL MENÚ REAL DE ANTIKA ──────────────────────────
let CARTA_ANTIKA = [
  // Desayunos
  { id:1, nombre:'Desayuno Antika', categoria:'Desayunos', precio:14, desc:'Bistec encebollado / Saltado de pollo + café o jugo', disponible:true },
  { id:2, nombre:'Desayuno Americano', categoria:'Desayunos', precio:13, desc:'Pan artesanal, huevos al gusto, tocino, jugo y café', disponible:true },
  { id:3, nombre:'Tamal Peruano', categoria:'Desayunos', precio:13, desc:'Tamal de maíz con cerdo, sarsa criolla, café y pan', disponible:true },
  // Sándwiches
  { id:4, nombre:'Sándwich Lomo Saltado', categoria:'Sándwiches', precio:16, desc:'Lomo saltado jugoso en pan con papas andinas', disponible:true },
  { id:5, nombre:'Sándwich Milanesa de Pollo', categoria:'Sándwiches', precio:15, desc:'Milanesa crocante con lechuga, tomate y papas', disponible:true },
  { id:6, nombre:'Pan con Chicharrón', categoria:'Sándwiches', precio:12, desc:'Chicharrón de cerdo, camote frito y sarsa criolla', disponible:true },
  { id:7, nombre:'Choripán', categoria:'Sándwiches', precio:10, desc:'Chorizo al grill con chimichurri y papas', disponible:true },
  { id:8, nombre:'Sándwich Caprese', categoria:'Sándwiches', precio:15, desc:'Tomate, mozzarella, albahaca y pesto', disponible:true },
  // Ensaladas
  { id:9, nombre:'Ensalada César', categoria:'Ensaladas', precio:15, desc:'Lechugas, salsa César, parmesano y crutones', disponible:true },
  { id:10, nombre:'Ensalada Mango al Curry', categoria:'Ensaladas', precio:16, desc:'Lechugas, tocino, jamón y mango con vinagreta curry', disponible:true },
  { id:11, nombre:'Ensalada Campesina', categoria:'Ensaladas', precio:18, desc:'Atún, quinua, aceitunas, tomate y papas doradas', disponible:true },
  // Sopas
  { id:12, nombre:'Dieta de Pollo', categoria:'Sopas', precio:16, desc:'Caldo de pollo con vegetales', disponible:true },
  { id:13, nombre:'Sopa a la Minuta', categoria:'Sopas', precio:18, desc:'Carne tierna, fideos cabello de ángel, huevo y leche', disponible:true },
  { id:14, nombre:'Caldo de Gallina', categoria:'Sopas', precio:20, desc:'Gallina de corral, fideos, papa y huevo duro', disponible:true },
  // Medio Día
  { id:15, nombre:'Arroz con Pollo', categoria:'Medio Día', precio:22, desc:'Arroz con cilantro, pollo dorado y papa a la huancaína', disponible:true },
  { id:16, nombre:'Lomo Saltado', categoria:'Fondos', precio:28, desc:'Lomo de res al wok con cebolla, tomate y ají amarillo', disponible:true },
  { id:17, nombre:'Ají de Gallina', categoria:'Medio Día', precio:22, desc:'Pollo en salsa de ají amarillo con papas y arroz', disponible:true },
  { id:18, nombre:'Estofado de Res', categoria:'Medio Día', precio:22, desc:'Res en salsa de vino tinto, tomate y ajo', disponible:true },
  // Fondos
  { id:19, nombre:'Chaufa de Pollo', categoria:'Fondos', precio:18, desc:'Arroz frito al wok con pollo, huevo y cebollita china', disponible:true },
  { id:20, nombre:'Pollo a la Plancha', categoria:'Fondos', precio:22, desc:'Pechuga dorada con especias especiales', disponible:true },
  { id:21, nombre:'Bistec a lo Pobre', categoria:'Fondos', precio:27, desc:'Bistec, arroz, papas, huevo frito y plátano', disponible:true },
  { id:22, nombre:'Trucha a la Menuere', categoria:'Fondos', precio:24, desc:'Filete de trucha con mantequilla, limón y finas hierbas', disponible:true },
  { id:23, nombre:'Trucha Fungi', categoria:'Fondos', precio:25, desc:'Trucha en salsa de champiñones y bechamel', disponible:true },
  { id:24, nombre:'Pulpo Anticuchero', categoria:'Fondos', precio:42, desc:'Pulpo marinado en salsa anticuchera con papas y piña', disponible:true },
  { id:25, nombre:'Lomo Saltado al Pesto', categoria:'Fondos', precio:32, desc:'Lomo con fettuccine en salsa cremosa a elección', disponible:true },
  // Burgers
  { id:26, nombre:'Clásica Burger', categoria:'Burgers', precio:13, desc:'Carne de res, lechuga y tomate + papas', disponible:true },
  { id:27, nombre:'Cheese Burger', categoria:'Burgers', precio:15, desc:'Carne a la parrilla con queso, lechuga y tomate', disponible:true },
  { id:28, nombre:'Bacon Burger', categoria:'Burgers', precio:15, desc:'Carne con tocino ahumado, lechuga y tomate', disponible:true },
  { id:29, nombre:'Parrillera Burger', categoria:'Burgers', precio:16, desc:'Carne con chorizo, chimichurri, lechuga y tomate', disponible:true },
  // Alitas
  { id:30, nombre:'6 Alitas (salsa a elección)', categoria:'Alitas', precio:16, desc:'BBQ, Hot BBQ, Anticucheras, Maracuyá, Crispy...', disponible:true },
  { id:31, nombre:'Broaster Solo para Mí (2pzas)', categoria:'Alitas', precio:17, desc:'2 piezas de broaster Mr. Bross + papas personal', disponible:true },
  { id:32, nombre:'Broaster Dúo Conquistador (4pzas)', categoria:'Alitas', precio:32, desc:'4 piezas + 2 papas personales', disponible:true },
  // Adicionales
  { id:33, nombre:'Docena de Nuggets', categoria:'Adicionales', precio:16, desc:'12 nuggets de pollo crujientes', disponible:true },
  { id:34, nombre:'Porción Papas Personal', categoria:'Adicionales', precio:3.5, desc:'Papas fritas personales', disponible:true },
  { id:35, nombre:'Porción Arroz', categoria:'Adicionales', precio:5, desc:'Porción de arroz blanco', disponible:true },
];

// Cocineros del restaurante
const COCINEROS = ['Rosa', 'Ernesto', 'Milagros', 'Carlos'];

// Mozos del restaurante
let EMPLEADOS = [
  { id:1, nombre:'Rosa Mamani', cargo:'Cocinero', turno:'Mañana', sueldo:1400, estado:'activo' },
  { id:2, nombre:'Ernesto Quispe', cargo:'Cocinero', turno:'Tarde', sueldo:1400, estado:'activo' },
  { id:3, nombre:'Milagros Torres', cargo:'Cocinero', turno:'Mañana', sueldo:1300, estado:'activo' },
  { id:4, nombre:'Ana Lucía Flores', cargo:'Mozo', turno:'Mañana', sueldo:1100, estado:'activo' },
  { id:5, nombre:'Jorge Condori', cargo:'Mozo', turno:'Tarde', sueldo:1100, estado:'activo' },
  { id:6, nombre:'Carla Sánchez', cargo:'Mozo', turno:'Mañana', sueldo:1100, estado:'permiso' },
];

// Mesas del restaurante
let mesas = Array.from({length:12}, (_,i) => ({
  id: i+1,
  estado: i < 5 ? 'ocupada' : i < 7 ? 'reservada' : 'libre',
  mozo: i < 5 ? EMPLEADOS[3+Math.floor(i/3)].nombre.split(' ')[0] : null,
  pedidos: []
}));

// Pedidos de muestra basados en el menú real
let pedidos = [
  { id:'P-001', mesa:1, items:[{nombre:'Lomo Saltado', cant:2, nota:'sin ají'}, {nombre:'Caldo de Gallina', cant:1, nota:''}], estado:'pendiente', cocineros:[], tiempo: Date.now()-8*60000 },
  { id:'P-002', mesa:2, items:[{nombre:'Trucha Fungi', cant:1, nota:''}, {nombre:'Pollo a la Plancha', cant:1, nota:'bien cocido'}], estado:'tomado', cocineros:['Rosa'], tiempo: Date.now()-15*60000 },
  { id:'P-003', mesa:3, items:[{nombre:'Chaufa de Pollo', cant:2, nota:''}, {nombre:'6 Alitas', cant:1, nota:'BBQ'}], estado:'listo', cocineros:['Ernesto'], tiempo: Date.now()-22*60000 },
  { id:'P-004', mesa:4, items:[{nombre:'Arroz con Pollo', cant:3, nota:''}], estado:'pendiente', cocineros:[], tiempo: Date.now()-3*60000 },
  { id:'P-005', mesa:5, items:[{nombre:'Pulpo Anticuchero', cant:1, nota:''}, {nombre:'Trucha a la Menuere', cant:1, nota:''}], estado:'tomado', cocineros:['Rosa','Milagros'], tiempo: Date.now()-18*60000 },
];

let cocineroSeleccionado = null;
let filtroActual = 'todos';
let actividad = [];
let nuevosUsuarios = [];

// ─── API HELPERS ─────────────────────────────────────────────
async function apiGet(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API GET ${endpoint}:`, err);
    return null;
  }
}

async function apiPost(endpoint, data) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API POST ${endpoint}:`, err);
    return null;
  }
}

async function apiPut(endpoint, data) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API PUT ${endpoint}:`, err);
    return null;
  }
}

async function apiDelete(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API DELETE ${endpoint}:`, err);
    return null;
  }
}

// ─── LOAD DATA FROM BACKEND ─────────────────────────────────
async function loadDataFromBackend() {
  try {
    // Load platos
    const platosData = await apiGet('/platos');
    if (platosData && platosData.length > 0) {
      CARTA_ANTIKA = platosData;
    }

    // Load empleados
    const empData = await apiGet('/empleados');
    if (empData && empData.length > 0) {
      EMPLEADOS = empData;
    }

    // Load mesas
    const mesasData = await apiGet('/mesas');
    if (mesasData && mesasData.length > 0) {
      mesas = mesasData;
    }

    // Load pedidos
    const pedidosData = await apiGet('/pedidos');
    if (pedidosData && pedidosData.length > 0) {
      pedidos = pedidosData;
    }

    // Load usuarios
    const usersData = await apiGet('/usuarios');
    if (usersData && usersData.length > 0) {
      usuariosRoles = usersData;
    }

    console.log('✅ Datos cargados desde el backend');
  } catch (err) {
    console.warn('⚠️ Backend no disponible, usando datos locales:', err.message);
  }
}

// ─── NAVEGACIÓN ─────────────────────────────────────────────
function goTo(seccion) {
  // Role-based access check
  const user = getAntikaUser();
  if (user) {
    const allowed = ROLE_ALLOWED_SECTIONS[user.rol] || [];
    if (!allowed.includes(seccion)) {
      showToast('⛔ No tienes acceso a esta sección');
      return;
    }
  }

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelector(`[data-section="${seccion}"]`)?.classList.add('active');
  document.getElementById(`section-${seccion}`)?.classList.add('active');
  const titles = { dashboard:'Dashboard General', cocineros:'Cola de Pedidos – Cocina', mozos:'Panel de Sala', administracion:'Panel de Administración' };
  const breadcrumbs = { dashboard:'Antika Restaurant / Dashboard', cocineros:'Antika Restaurant / Cocina', mozos:'Antika Restaurant / Sala', administracion:'Antika Restaurant / Administración' };
  document.getElementById('pageTitle').textContent = titles[seccion] || seccion;
  document.getElementById('pageBreadcrumb').textContent = breadcrumbs[seccion] || '';
  if (seccion === 'dashboard') renderDashboard();
  if (seccion === 'cocineros') { renderChips(); renderCola(); }
  if (seccion === 'mozos') { renderMesas(); renderCarta(); renderAsistencia(); }
  if (seccion === 'administracion') { renderEmpleados(); actualizarReporte(); renderCaja(); renderReservas(); renderRoles(); }
}

document.querySelectorAll('.nav-item[data-section]').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); goTo(el.dataset.section); });
});

// Subtabs
document.querySelectorAll('.subtabs').forEach(tabGroup => {
  tabGroup.querySelectorAll('.subtab').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('section');
      parent.querySelectorAll('.subtab').forEach(t => t.classList.remove('active'));
      parent.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
      if (btn.dataset.tab === 'moz-carta') renderCarta();
      if (btn.dataset.tab === 'moz-asistencia') renderAsistencia();
      if (btn.dataset.tab === 'adm-empleados') renderEmpleados();
      if (btn.dataset.tab === 'adm-caja') renderCaja();
      if (btn.dataset.tab === 'adm-reservas') renderReservas();
      if (btn.dataset.tab === 'adm-reportes') actualizarReporte();
      if (btn.dataset.tab === 'adm-roles') renderRoles();
      if (btn.dataset.tab === 'adm-nuevo-usuario') renderNuevosUsuarios();
    });
  });
});

// Sidebar toggle móvil
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ─── RELOJ ───────────────────────────────────────────────────
function actualizarReloj() {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'});
  document.getElementById('currentDate').textContent = now.toLocaleDateString('es-PE', {weekday:'short', day:'numeric', month:'short'});
}
setInterval(actualizarReloj, 1000);
actualizarReloj();

function formatTime(ms) {
  const m = Math.floor((Date.now()-ms)/60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m/60)}h ${m%60}m`;
}

// ─── DASHBOARD ───────────────────────────────────────────────
function renderDashboard() {
  const pend = pedidos.filter(p => p.estado !== 'despachado').length;
  const ocup = mesas.filter(m => m.estado === 'ocupada').length;
  document.getElementById('dashPedidosPend').textContent = pend;
  document.getElementById('dashMesasOcup').textContent = ocup;
  document.getElementById('dashIngresos').textContent = 'S/. 1,847';
  document.getElementById('dashPersonal').textContent = EMPLEADOS.filter(e => e.estado === 'activo').length;
  document.getElementById('badgePedidos').textContent = pedidos.filter(p => p.estado === 'pendiente').length;

  // Orders live
  const ol = document.getElementById('dashOrdersLive');
  const activePedidos = pedidos.filter(p => p.estado !== 'despachado');
  if (!activePedidos.length) { ol.innerHTML = '<div class="empty-state"><span>🍽</span><p>No hay pedidos activos</p></div>'; }
  else ol.innerHTML = activePedidos.map(p => `
    <div class="order-live-card">
      <div class="order-live-top">
        <span class="order-live-mesa">Mesa ${p.mesa}</span>
        <span class="order-status status-${p.estado}">${p.estado}</span>
      </div>
      <div class="order-live-items">${p.items.map(i => `${i.cant}× ${i.nombre}`).join('<br>')}</div>
      <div class="order-live-footer">
        <span class="order-live-time">⏱ ${formatTime(p.tiempo)}</span>
        <span style="font-size:.72rem;color:var(--teal)">${p.cocineros.length ? p.cocineros.join(', ') : 'Sin asignar'}</span>
      </div>
    </div>`).join('');

  // Mesas mini
  const dm = document.getElementById('dashMesas');
  dm.innerHTML = mesas.map(m => `<div class="mesa-mini ${m.estado}" title="Mesa ${m.id}">${m.id}</div>`).join('');

  // Actividad
  const al = document.getElementById('activityList');
  const acts = actividad.slice(-8).reverse();
  if (!acts.length) al.innerHTML = '<li><span class="act-time">—</span>Sin actividad reciente</li>';
  else al.innerHTML = acts.map(a => `<li><span class="act-time">${a.hora}</span>${a.texto}</li>`).join('');
}

function registrarActividad(texto) {
  actividad.push({ hora: new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}), texto });
}

// ─── COCINA ──────────────────────────────────────────────────
function renderChips() {
  const c = document.getElementById('cocineroChips');
  c.innerHTML = COCINEROS.map(nombre => `
    <div class="coc-chip ${cocineroSeleccionado===nombre?'selected':''}" onclick="seleccionarCocinero('${nombre}')">${nombre}</div>
  `).join('');
}

function seleccionarCocinero(nombre) {
  cocineroSeleccionado = cocineroSeleccionado === nombre ? null : nombre;
  renderChips();
}

document.querySelectorAll('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroActual = btn.dataset.filtro;
    renderCola();
  });
});

function renderCola() {
  const filtrados = filtroActual === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtroActual);
  document.getElementById('countPend').textContent = pedidos.filter(p=>p.estado==='pendiente').length;
  document.getElementById('countProc').textContent = pedidos.filter(p=>p.estado==='tomado').length;
  document.getElementById('countList').textContent = pedidos.filter(p=>p.estado==='listo').length;
  const col = document.getElementById('colaPedidos');
  if (!filtrados.length) { col.innerHTML = '<div class="empty-state"><span>✅</span><p>No hay pedidos en esta categoría</p></div>'; return; }
  col.innerHTML = filtrados.map(p => {
    const mins = Math.floor((Date.now()-p.tiempo)/60000);
    const urgente = mins > 20;
    return `<div class="pedido-card estado-${p.estado}">
      <div class="pedido-card-header">
        <div class="pedido-info">
          <p class="pedido-mesa">Mesa ${p.mesa}</p>
          <p class="pedido-id">${p.id} · ${p.items.length} ítem(s)</p>
        </div>
        <div>
          <span class="order-status status-${p.estado}">${estadoLabel(p.estado)}</span>
          <p class="pedido-timer ${urgente?'urgente':''}">⏱ ${formatTime(p.tiempo)}</p>
        </div>
      </div>
      <div class="pedido-items">${p.items.map(i=>`
        <div class="pedido-item-row">
          <span class="pi-cant">${i.cant}×</span>
          <span>${i.nombre}</span>
          ${i.nota?`<span class="pi-nota">· ${i.nota}</span>`:''}
        </div>`).join('')}
      </div>
      ${p.cocineros.length?`<div class="pedido-cocineros">
        <p class="cocineros-label">Cocineros</p>
        <div class="cocineros-asignados">${p.cocineros.map(c=>`<span class="cocinero-tag">👨‍🍳 ${c}</span>`).join('')}</div>
      </div>`:''}
      <div class="pedido-acciones">${accionesBtn(p)}</div>
    </div>`;
  }).join('');
}

function estadoLabel(e) {
  return {pendiente:'🕐 Pendiente', tomado:'👨‍🍳 En Proceso', listo:'✅ Listo', despachado:'🚀 Despachado'}[e] || e;
}

function accionesBtn(p) {
  let html = '';
  if (p.estado === 'pendiente') html += `<button class="btn-accion btn-tomar" onclick="tomarPedido('${p.id}')">Tomar</button>`;
  if (p.estado === 'tomado') html += `<button class="btn-accion btn-listo" onclick="marcarListo('${p.id}')">✓ Listo</button>`;
  if (p.estado === 'listo') html += `<button class="btn-accion btn-despachar" onclick="despacharPedido('${p.id}')">🚀 Despachar</button>`;
  if (p.estado !== 'despachado' && p.cocineros.length === 0 && p.estado !== 'pendiente') html += '';
  html += `<span class="pedido-msg">${p.estado === 'despachado' ? '✓ Entregado':'Mesa '+p.mesa}</span>`;
  return html;
}

async function tomarPedido(id) {
  if (!cocineroSeleccionado) { showToast('⚠️ Selecciona tu nombre primero'); return; }
  const p = pedidos.find(x=>x.id===id);
  if (!p) return;
  p.estado = 'tomado';
  if (!p.cocineros.includes(cocineroSeleccionado)) p.cocineros.push(cocineroSeleccionado);
  
  // Sync with backend
  await apiPut(`/pedidos/${id}`, { estado: 'tomado', cocineros: p.cocineros });
  
  registrarActividad(`${cocineroSeleccionado} tomó pedido ${id} (Mesa ${p.mesa})`);
  renderCola(); renderDashboard(); showToast(`✅ ${cocineroSeleccionado} tomó el pedido ${id}`);
}

async function marcarListo(id) {
  const p = pedidos.find(x=>x.id===id); if (!p) return;
  p.estado = 'listo';
  
  await apiPut(`/pedidos/${id}`, { estado: 'listo' });
  
  registrarActividad(`Pedido ${id} (Mesa ${p.mesa}) marcado como listo`);
  renderCola(); renderDashboard(); showToast('🍽 Pedido listo para despachar');
}

async function despacharPedido(id) {
  const p = pedidos.find(x=>x.id===id); if (!p) return;
  p.estado = 'despachado';
  
  await apiPut(`/pedidos/${id}`, { estado: 'despachado' });
  
  registrarActividad(`Pedido ${id} (Mesa ${p.mesa}) despachado`);
  renderCola(); renderDashboard(); showToast('🚀 Pedido despachado a sala');
}

async function simularNuevoPedido() {
  const mesasOcupadas = mesas.filter(m=>m.estado==='ocupada');
  const mesa = mesasOcupadas[Math.floor(Math.random()*mesasOcupadas.length)] || mesas[0];
  const platosRand = [...CARTA_ANTIKA].sort(()=>Math.random()-.5).slice(0,Math.floor(Math.random()*3)+1);
  const nuevoId = 'P-'+ String(pedidos.length+1).padStart(3,'0');
  const nuevoPedido = { id:nuevoId, mesa:mesa.id, items:platosRand.map(p=>({nombre:p.nombre, cant:Math.floor(Math.random()*2)+1, nota:''})), estado:'pendiente', cocineros:[], tiempo:Date.now() };
  
  pedidos.unshift(nuevoPedido);
  
  // Sync with backend
  await apiPost('/pedidos', nuevoPedido);
  
  registrarActividad(`Nuevo pedido ${nuevoId} en Mesa ${mesa.id}`);
  renderCola(); renderDashboard(); showToast(`🔥 Nuevo pedido en Mesa ${mesa.id}`);
}

// ─── MESAS ───────────────────────────────────────────────────
function renderMesas() {
  const ml = document.getElementById('mesasLayout');
  ml.innerHTML = mesas.map(m=>`
    <div class="mesa-card ${m.estado}">
      <p class="mesa-num">${m.id}</p>
      <p class="mesa-info">${{libre:'Disponible',ocupada:'Ocupada',reservada:'Reservada'}[m.estado]}</p>
      ${m.mozo?`<p class="mesa-mozo">🤵 ${m.mozo}</p>`:''}
      <div class="mesa-actions">
        ${m.estado==='libre'?`<button class="btn-mesa-sm btn-mesa-abrir" onclick="abrirMesa(${m.id})">Abrir</button>`:''}
        ${m.estado==='ocupada'?`<button class="btn-mesa-sm btn-mesa-ver" onclick="verMesa(${m.id})">Ver</button><button class="btn-mesa-sm btn-mesa-cerrar" onclick="cerrarMesa(${m.id})">Cerrar</button>`:''}
        ${m.estado==='reservada'?`<button class="btn-mesa-sm btn-mesa-abrir" onclick="abrirMesa(${m.id})">Confirmar</button>`:''}
      </div>
    </div>`).join('');
  // Actualizar select de pedidos
  const sel = document.getElementById('selectMesaPedido');
  sel.innerHTML = '<option value="">— Elegir mesa ocupada —</option>' +
    mesas.filter(m=>m.estado==='ocupada').map(m=>`<option value="${m.id}">Mesa ${m.id}</option>`).join('');
}

async function abrirMesa(id) {
  const m = mesas.find(x=>x.id===id); if(!m) return;
  const mozos = EMPLEADOS.filter(e=>e.cargo==='Mozo'&&e.estado==='activo');
  const mozo = mozos[Math.floor(Math.random()*mozos.length)];
  m.estado='ocupada'; m.mozo=mozo.nombre.split(' ')[0];
  
  await apiPut(`/mesas/${id}`, { estado: 'ocupada', mozo: m.mozo });
  
  registrarActividad(`Mesa ${id} abierta por ${m.mozo}`);
  renderMesas(); renderDashboard(); showToast(`Mesa ${id} abierta`);
}

async function cerrarMesa(id) {
  const m = mesas.find(x=>x.id===id); if(!m) return;
  m.estado='libre'; m.mozo=null; m.pedidos=[];
  pedidos.filter(p=>p.mesa===id).forEach(p=>p.estado='despachado');
  
  await apiPut(`/mesas/${id}`, { estado: 'libre', mozo: null });
  
  registrarActividad(`Mesa ${id} cerrada`);
  renderMesas(); renderDashboard(); showToast(`Mesa ${id} cerrada y liberada`);
}

function verMesa(id) { renderPedidoMesaById(id); }

// ─── CARTA ───────────────────────────────────────────────────
function renderCarta() {
  const busq = document.getElementById('searchPlato')?.value?.toLowerCase() || '';
  const cat = document.getElementById('filtroCategoria')?.value || 'todos';
  const filtrados = CARTA_ANTIKA.filter(p =>
    (cat==='todos'||p.categoria===cat) &&
    (p.nombre.toLowerCase().includes(busq)||p.desc.toLowerCase().includes(busq))
  );
  const cg = document.getElementById('cartaGrid');
  cg.innerHTML = filtrados.map(p=>`
    <div class="carta-card">
      <span class="carta-badge-disponible ${p.disponible?'disponible-si':'disponible-no'}">${p.disponible?'Disponible':'Agotado'}</span>
      <p class="carta-categoria">${p.categoria}</p>
      <p class="carta-nombre">${p.nombre}</p>
      <p class="carta-desc">${p.desc}</p>
      <p class="carta-precio">S/ ${p.precio.toFixed(2)}</p>
      <div class="carta-acciones">
        <button class="btn-icon-sm btn-edit">✏️ Editar</button>
        <button class="btn-icon-sm" onclick="toggleDisponible(${p.id})">${p.disponible?'🔴 Agotar':'🟢 Disponible'}</button>
      </div>
    </div>`).join('');
}

async function toggleDisponible(id) {
  const p = CARTA_ANTIKA.find(x=>x.id===id); if(!p) return;
  p.disponible = !p.disponible;
  
  await apiPut(`/platos/${id}`, { disponible: p.disponible });
  
  renderCarta(); showToast(`${p.nombre}: ${p.disponible?'disponible':'agotado'}`);
}

document.getElementById('searchPlato')?.addEventListener('input', renderCarta);
document.getElementById('filtroCategoria')?.addEventListener('change', renderCarta);

// ─── ASISTENCIA ──────────────────────────────────────────────
function renderAsistencia() {
  const hoy = new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'long',year:'numeric'});
  document.getElementById('fechaAsistencia').textContent = hoy;
  const body = document.getElementById('bodyAsistencia');
  body.innerHTML = EMPLEADOS.map(e=>`
    <tr>
      <td><strong>${e.nombre}</strong></td>
      <td>${e.cargo}</td>
      <td>${e.entrada||'—'}</td>
      <td>${e.salida||'—'}</td>
      <td><span class="status-badge badge-${e.estado}">${e.estado}</span></td>
      <td>
        <button class="btn-registrar btn-entrada" onclick="registrarEntrada(${e.id})">▶ Entrada</button>
        <button class="btn-registrar btn-salida" onclick="registrarSalida(${e.id})">◼ Salida</button>
      </td>
    </tr>`).join('');
}

async function registrarEntrada(id) {
  const e = EMPLEADOS.find(x=>x.id===id); if(!e) return;
  e.entrada = new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
  e.estado = 'activo';
  
  await apiPost('/asistencia', { empleadoId: id, tipo: 'entrada', hora: e.entrada });
  
  renderAsistencia(); showToast(`✅ Entrada registrada: ${e.nombre}`);
}

async function registrarSalida(id) {
  const e = EMPLEADOS.find(x=>x.id===id); if(!e) return;
  e.salida = new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});
  
  await apiPost('/asistencia', { empleadoId: id, tipo: 'salida', hora: e.salida });
  
  renderAsistencia(); showToast(`🚪 Salida registrada: ${e.nombre}`);
}

// ─── PEDIDO POR MESA ─────────────────────────────────────────
function renderPedidoMesa() {
  const id = parseInt(document.getElementById('selectMesaPedido').value);
  if (!id) return;
  renderPedidoMesaById(id);
}

function renderPedidoMesaById(id) {
  const area = document.getElementById('pedidoMesaArea');
  const mPedidos = pedidos.filter(p => p.mesa === id && p.estado !== 'despachado');
  const allItems = mPedidos.flatMap(p => p.items);
  const total = allItems.reduce((sum,i) => {
    const plato = CARTA_ANTIKA.find(x=>x.nombre===i.nombre); return sum + (plato?plato.precio*i.cant:0);
  }, 0);
  area.innerHTML = `<div class="pedido-mesa-wrapper">
    <div class="pedido-lista-card">
      <p class="pedido-lista-title">Mesa ${id} — Consumo Actual</p>
      ${allItems.length ? allItems.map((i,idx)=>{
        const plato = CARTA_ANTIKA.find(x=>x.nombre===i.nombre);
        return `<div class="pedido-lista-row">
          <span class="pl-qty">${i.cant}×</span>
          <span class="pl-name">${i.nombre}</span>
          <span class="pl-price">S/ ${plato?(plato.precio*i.cant).toFixed(2):'—'}</span>
          <button class="pl-del" title="Quitar">✕</button>
        </div>`;
      }).join('') : '<p style="color:var(--text-light);font-size:.88rem">Sin pedidos activos</p>'}
      <div class="pedido-total-row"><span>TOTAL</span><span>S/ ${total.toFixed(2)}</span></div>
      <div class="pedido-acciones-row">
        <button class="btn-primary btn-sm" onclick="showToast('🧾 Cuenta generada: S/ ${total.toFixed(2)}')">🧾 Generar Cuenta</button>
        <button class="btn-secondary" onclick="cerrarMesa(${id});renderMesas();">Cerrar Mesa</button>
      </div>
    </div>
    <div class="agregar-plato-card">
      <p class="agregar-plato-title">+ Agregar Plato</p>
      <div class="carta-mini-list">
        ${CARTA_ANTIKA.filter(p=>p.disponible).map(p=>`
          <div class="carta-mini-item">
            <span class="cmi-name">${p.nombre}</span>
            <span class="cmi-price">S/${p.precio}</span>
            <button class="cmi-add" onclick="showToast('➕ ${p.nombre} agregado')">+</button>
          </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ─── EMPLEADOS ───────────────────────────────────────────────
function renderEmpleados() {
  const busq = document.getElementById('searchEmpleado')?.value?.toLowerCase() || '';
  const cargo = document.getElementById('filtroCargoEmp')?.value || 'todos';
  const filtrados = EMPLEADOS.filter(e =>
    (cargo==='todos'||e.cargo===cargo) &&
    e.nombre.toLowerCase().includes(busq)
  );
  document.getElementById('bodyEmpleados').innerHTML = filtrados.map(e=>`
    <tr>
      <td><strong>${e.nombre}</strong></td>
      <td>${e.cargo}</td>
      <td>${e.turno}</td>
      <td>S/ ${e.sueldo.toLocaleString()}</td>
      <td><span class="status-badge badge-${e.estado}">${e.estado}</span></td>
      <td>
        <button class="btn-icon-sm btn-edit">✏️</button>
        <button class="btn-icon-sm btn-delete" onclick="eliminarEmpleado(${e.id})">🗑</button>
      </td>
    </tr>`).join('');
}

async function eliminarEmpleado(id) {
  if (!confirm('¿Estás seguro de eliminar este empleado?')) return;
  const idx = EMPLEADOS.findIndex(e => e.id === id);
  if (idx !== -1) EMPLEADOS.splice(idx, 1);
  
  await apiDelete(`/empleados/${id}`);
  
  renderEmpleados();
  showToast('🗑 Empleado eliminado');
}

document.getElementById('searchEmpleado')?.addEventListener('input', renderEmpleados);
document.getElementById('filtroCargoEmp')?.addEventListener('change', renderEmpleados);

// ─── REPORTES ────────────────────────────────────────────────
const DATOS_REPORTE = {
  hoy:    { ingresos:1847, platos:62, clientes:38, semana:[1847] },
  semana: { ingresos:11340, platos:421, clientes:287, dias:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'], valores:[1420,1680,1540,1720,1890,2200,890] },
  mes:    { ingresos:47600, platos:1820, clientes:1190, dias:['S1','S2','S3','S4'], valores:[11200,12400,10800,13200] }
};

const TOP_PLATOS_ANTIKA = [
  { nombre:'Lomo Saltado', count:89 },
  { nombre:'Trucha Fungi', count:74 },
  { nombre:'Chaufa de Pollo', count:61 },
  { nombre:'Arroz con Pollo', count:55 },
  { nombre:'6 Alitas BBQ', count:48 },
];

function actualizarReporte() {
  const p = document.getElementById('periodoReporte')?.value || 'semana';
  const d = DATOS_REPORTE[p];
  document.getElementById('repTotal').textContent = `S/ ${d.ingresos.toLocaleString()}`;
  document.getElementById('repPlatos').textContent = d.platos;
  document.getElementById('repClientes').textContent = d.clientes;
  document.getElementById('repTicket').textContent = `S/ ${(d.ingresos/d.clientes).toFixed(2)}`;
  document.getElementById('repTotalTrend').innerHTML = '<span class="trend-up">↑ +8.4%</span> vs. período anterior';
  document.getElementById('repPlatosTrend').innerHTML = '<span class="trend-up">↑ +5.1%</span>';
  document.getElementById('repClientesTrend').innerHTML = '<span class="trend-up">↑ +6.2%</span>';
  document.getElementById('repTicketTrend').innerHTML = '<span class="trend-up">↑ +2.1%</span>';
  // Gráfico
  const chartTitle = {hoy:'Ingresos de Hoy', semana:'Ingresos por Día', mes:'Ingresos por Semana'};
  document.getElementById('chartTitle').textContent = chartTitle[p];
  const vals = d.dias ? d.valores : d.semana;
  const labels = d.dias || ['Hoy'];
  const maxV = Math.max(...vals);
  document.getElementById('barChart').innerHTML = vals.map((v,i)=>`
    <div class="bar-item">
      <span class="bar-val">S/${(v/1000).toFixed(1)}k</span>
      <div class="bar" style="height:${(v/maxV*100)}%" title="S/ ${v.toLocaleString()}"></div>
      <span class="bar-label">${labels[i]}</span>
    </div>`).join('');
  // Top platos
  const maxC = TOP_PLATOS_ANTIKA[0].count;
  document.getElementById('platosRanking').innerHTML = TOP_PLATOS_ANTIKA.map((pl,i)=>`
    <div class="plato-rank-row">
      <span class="rank-num ${i===0?'gold-rank':''}">${i+1}</span>
      <span class="plato-rank-name">${pl.nombre}</span>
      <div class="plato-rank-bar-wrap"><div class="plato-rank-bar" style="width:${(pl.count/maxC*100)}%"></div></div>
      <span class="plato-rank-count">${pl.count}</span>
    </div>`).join('');
}

// ─── CAJA ────────────────────────────────────────────────────
let TRANSACCIONES = [
  { hora:'13:42', mesa:'Mesa 3', mozo:'Ana Lucía', total:94, metodo:'Efectivo', estado:'pagado' },
  { hora:'13:15', mesa:'Mesa 7', mozo:'Jorge', total:56, metodo:'Tarjeta +5%', estado:'pagado' },
  { hora:'12:58', mesa:'Mesa 1', mozo:'Ana Lucía', total:112, metodo:'Efectivo', estado:'pagado' },
  { hora:'12:30', mesa:'Mesa 5', mozo:'Jorge', total:78, metodo:'Efectivo', estado:'pagado' },
];

function renderCaja() {
  const totalEf = TRANSACCIONES.filter(t=>t.metodo==='Efectivo').reduce((s,t)=>s+t.total,0);
  const totalTar = TRANSACCIONES.filter(t=>t.metodo.includes('Tarjeta')).reduce((s,t)=>s+t.total,0);
  const total = totalEf+totalTar;
  document.getElementById('cajaResumen').innerHTML = `
    <div class="caja-card"><div class="caja-card-icon">💵</div><div class="caja-card-val">S/ ${totalEf}</div><div class="caja-card-label">Efectivo</div></div>
    <div class="caja-card"><div class="caja-card-icon">💳</div><div class="caja-card-val">S/ ${totalTar}</div><div class="caja-card-label">Tarjeta</div></div>
    <div class="caja-card"><div class="caja-card-icon">📊</div><div class="caja-card-val">S/ ${total}</div><div class="caja-card-label">Total del Día</div></div>
    <div class="caja-card"><div class="caja-card-icon">🧾</div><div class="caja-card-val">${TRANSACCIONES.length}</div><div class="caja-card-label">Transacciones</div></div>`;
  document.getElementById('bodyTransacciones').innerHTML = TRANSACCIONES.map(t=>`
    <tr>
      <td>${t.hora}</td><td>${t.mesa}</td><td>${t.mozo}</td>
      <td><strong>S/ ${t.total}</strong></td><td>${t.metodo}</td>
      <td><span class="status-badge badge-${t.estado}">${t.estado}</span></td>
    </tr>`).join('');
}

function cerrarCaja() {
  showToast('🔒 Caja del día cerrada correctamente');
  registrarActividad('Caja cerrada por administrador');
}

// ─── RESERVAS ────────────────────────────────────────────────
let RESERVAS = [
  { cliente:'María Condori', fecha:'2025-01-20', hora:'13:00', personas:4, mesa:'Mesa 8', estado:'confirmada' },
  { cliente:'Familia Quispe', fecha:'2025-01-20', hora:'19:30', personas:6, mesa:'Mesa 10', estado:'confirmada' },
  { cliente:'José Huanca', fecha:'2025-01-21', hora:'13:30', personas:2, mesa:'Mesa 4', estado:'pendiente' },
];

function renderReservas() {
  document.getElementById('bodyReservas').innerHTML = RESERVAS.map(r=>`
    <tr>
      <td><strong>${r.cliente}</strong></td>
      <td>${r.fecha}</td><td>${r.hora}</td><td>${r.personas} personas</td>
      <td>${r.mesa}</td>
      <td><span class="status-badge badge-${r.estado}">${r.estado}</span></td>
      <td>
        <button class="btn-icon-sm btn-edit">✏️</button>
        <button class="btn-icon-sm btn-delete">🗑</button>
      </td>
    </tr>`).join('');
}

// ─── ROLES ───────────────────────────────────────────────────
const ROLES_LABELS = {1:'👑 Admin', 2:'👨‍🍳 Cocinero', 3:'🤵 Mozo', 4:'👤 Cliente'};
let usuariosRoles = [
  { nombre:'Admin Principal', email:'admin@antika.pe', rol:1, dni:'00000001', telefono:'999000001' },
  ...EMPLEADOS.map(e=>({ nombre:e.nombre, email:e.nombre.toLowerCase().replace(' ','.')+`@antika.pe`, rol:e.cargo==='Cocinero'?2:3, dni:'—', telefono:'—' }))
];

function renderRoles() {
  const busq = document.getElementById('searchRoles')?.value?.toLowerCase() || '';
  const filtroRol = document.getElementById('filtroRoles')?.value || 'todos';
  const filtrados = usuariosRoles.filter(u =>
    (filtroRol==='todos'||u.rol==filtroRol) &&
    (u.nombre.toLowerCase().includes(busq)||u.email.toLowerCase().includes(busq))
  );
  document.getElementById('bodyRoles').innerHTML = filtrados.map((u,i)=>`
    <tr>
      <td><strong>${u.nombre}</strong></td>
      <td>${u.email}</td>
      <td><span class="status-badge badge-activo">${ROLES_LABELS[u.rol]}</span></td>
      <td>${u.dni}</td>
      <td>${u.telefono}</td>
      <td>
        <select class="input-select" style="font-size:.8rem;padding:.3rem .6rem" onchange="cambiarRol(${i}, this.value)">
          ${[1,2,3,4].map(r=>`<option value="${r}" ${u.rol==r?'selected':''}>${ROLES_LABELS[r]}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn-icon-sm btn-delete">🗑</button></td>
    </tr>`).join('');
}

async function cambiarRol(idx, nuevoRol) {
  usuariosRoles[idx].rol = parseInt(nuevoRol);
  
  const user = usuariosRoles[idx];
  await apiPut(`/usuarios/${user.email}/rol`, { rol: parseInt(nuevoRol) });
  
  showToast(`✅ Rol actualizado: ${ROLES_LABELS[nuevoRol]}`);
}

document.getElementById('searchRoles')?.addEventListener('input', renderRoles);
document.getElementById('filtroRoles')?.addEventListener('change', renderRoles);

// ─── NUEVO USUARIO ───────────────────────────────────────────
async function registrarNuevoUsuario() {
  const nombre = document.getElementById('nuevoUserNombre').value.trim();
  const apellido = document.getElementById('nuevoUserApellido').value.trim();
  const email = document.getElementById('nuevoUserEmail').value.trim();
  const password = document.getElementById('nuevoUserPassword').value;
  const rol = document.getElementById('nuevoUserRol').value;
  if (!nombre||!apellido||!email||!password||!rol) { showToast('⚠️ Completa los campos obligatorios'); return; }
  
  const nuevo = {
    nombre: `${nombre} ${apellido}`,
    email,
    password,
    rol: parseInt(rol),
    telefono: document.getElementById('nuevoUserTelefono').value || '—',
    dni: document.getElementById('nuevoUserDNI').value || '—',
    fecha: new Date().toLocaleDateString('es-PE')
  };
  
  // Send to backend
  const result = await apiPost('/usuarios', nuevo);
  
  if (result && result.error) {
    showToast(`⚠️ ${result.error}`);
    return;
  }
  
  nuevosUsuarios.unshift(nuevo);
  usuariosRoles.push(nuevo);
  ['nuevoUserNombre','nuevoUserApellido','nuevoUserEmail','nuevoUserPassword','nuevoUserTelefono','nuevoUserDNI'].forEach(id=>{
    document.getElementById(id).value='';
  });
  document.getElementById('nuevoUserRol').value='';
  renderNuevosUsuarios();
  showToast(`✅ Usuario ${nuevo.nombre} creado como ${ROLES_LABELS[nuevo.rol]}`);
  registrarActividad(`Nuevo usuario creado: ${nuevo.nombre}`);
}

function renderNuevosUsuarios() {
  const body = document.getElementById('bodyNuevosUsuarios');
  if (!body) return;
  body.innerHTML = nuevosUsuarios.map(u=>`
    <tr>
      <td><strong>${u.nombre}</strong></td>
      <td>${u.email}</td>
      <td><span class="status-badge badge-activo">${ROLES_LABELS[u.rol]||u.rol}</span></td>
      <td>${u.telefono}</td>
      <td>${u.fecha}</td>
      <td><button class="btn-icon-sm btn-delete">🗑</button></td>
    </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:2rem">No hay usuarios registrados aún</td></tr>';
}

// ─── MODALES ─────────────────────────────────────────────────
function abrirModal(tipo) {
  const overlay = document.getElementById('modalOverlay');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const forms = {
    mesa: { t:'Nueva Mesa', html:`<div class="form-group"><label>Número de Mesa</label><input type="number" class="form-input" min="1" placeholder="13" id="modalMesaNum"></div><div class="form-group"><label>Capacidad (personas)</label><input type="number" class="form-input" placeholder="4" id="modalMesaCap"></div><div class="modal-actions"><button class="btn-secondary" onclick="cerrarModal()">Cancelar</button><button class="btn-primary" onclick="crearMesa()">Crear Mesa</button></div>` },
    plato: { t:'Agregar Plato', html:`<div class="form-group"><label>Nombre del Plato</label><input type="text" class="form-input" placeholder="Ej: Trucha a la Plancha" id="modalPlatoNombre"></div><div class="form-group"><label>Categoría</label><select class="input-select" style="width:100%" id="modalPlatoCat"><option>Desayunos</option><option>Sándwiches</option><option>Ensaladas</option><option>Sopas</option><option>Medio Día</option><option>Fondos</option><option>Burgers</option><option>Alitas</option><option>Adicionales</option></select></div><div class="form-group"><label>Precio (S/)</label><input type="number" class="form-input" step="0.5" placeholder="0.00" id="modalPlatoPrecio"></div><div class="form-group"><label>Descripción</label><textarea class="form-input" rows="3" placeholder="Descripción del plato..." id="modalPlatoDesc"></textarea></div><div class="modal-actions"><button class="btn-secondary" onclick="cerrarModal()">Cancelar</button><button class="btn-primary" onclick="crearPlato()">Agregar</button></div>` },
    empleado: { t:'Nuevo Empleado', html:`<div class="form-group"><label>Nombre Completo</label><input type="text" class="form-input" placeholder="Nombre completo" id="modalEmpNombre"></div><div class="form-row"><div class="form-group"><label>Cargo</label><select class="input-select" style="width:100%" id="modalEmpCargo"><option>Cocinero</option><option>Mozo</option></select></div><div class="form-group"><label>Turno</label><select class="input-select" style="width:100%" id="modalEmpTurno"><option>Mañana</option><option>Tarde</option></select></div></div><div class="form-group"><label>Sueldo (S/)</label><input type="number" class="form-input" placeholder="1100" id="modalEmpSueldo"></div><div class="modal-actions"><button class="btn-secondary" onclick="cerrarModal()">Cancelar</button><button class="btn-primary" onclick="crearEmpleado()">Registrar</button></div>` },
    reserva: { t:'Nueva Reserva', html:`<div class="form-group"><label>Cliente</label><input type="text" class="form-input" placeholder="Nombre del cliente" id="modalResCliente"></div><div class="form-row"><div class="form-group"><label>Fecha</label><input type="date" class="form-input" id="modalResFecha"></div><div class="form-group"><label>Hora</label><input type="time" class="form-input" id="modalResHora"></div></div><div class="form-row"><div class="form-group"><label>Personas</label><input type="number" class="form-input" min="1" max="20" placeholder="2" id="modalResPersonas"></div><div class="form-group"><label>Mesa</label><select class="input-select" style="width:100%" id="modalResMesa">${mesas.map(m=>`<option>Mesa ${m.id}</option>`).join('')}</select></div></div><div class="form-group"><label>Teléfono</label><input type="tel" class="form-input" placeholder="999 999 999" id="modalResTel"></div><div class="modal-actions"><button class="btn-secondary" onclick="cerrarModal()">Cancelar</button><button class="btn-primary" onclick="crearReserva()">Confirmar Reserva</button></div>` },
  };
  const form = forms[tipo];
  if (!form) return;
  title.textContent = form.t;
  body.innerHTML = form.html;
  overlay.classList.add('open');
}

// ─── MODAL ACTIONS (connected to backend) ────────────────────
async function crearMesa() {
  const num = document.getElementById('modalMesaNum')?.value;
  if (!num) { showToast('⚠️ Ingresa el número de mesa'); return; }
  const nuevaMesa = { id: parseInt(num), estado: 'libre', mozo: null, pedidos: [] };
  mesas.push(nuevaMesa);
  
  await apiPost('/mesas', nuevaMesa);
  
  renderMesas(); renderDashboard();
  showToast(`✅ Mesa ${num} creada`);
  cerrarModal();
}

async function crearPlato() {
  const nombre = document.getElementById('modalPlatoNombre')?.value;
  const categoria = document.getElementById('modalPlatoCat')?.value;
  const precio = parseFloat(document.getElementById('modalPlatoPrecio')?.value);
  const desc = document.getElementById('modalPlatoDesc')?.value;
  if (!nombre || !precio) { showToast('⚠️ Completa nombre y precio'); return; }
  
  const nuevoPlato = {
    id: CARTA_ANTIKA.length + 1,
    nombre, categoria, precio, desc: desc || '',
    disponible: true
  };
  CARTA_ANTIKA.push(nuevoPlato);
  
  await apiPost('/platos', nuevoPlato);
  
  renderCarta();
  showToast(`✅ ${nombre} agregado a la carta`);
  cerrarModal();
}

async function crearEmpleado() {
  const nombre = document.getElementById('modalEmpNombre')?.value;
  const cargo = document.getElementById('modalEmpCargo')?.value;
  const turno = document.getElementById('modalEmpTurno')?.value;
  const sueldo = parseInt(document.getElementById('modalEmpSueldo')?.value);
  if (!nombre || !sueldo) { showToast('⚠️ Completa nombre y sueldo'); return; }
  
  const nuevoEmp = {
    id: EMPLEADOS.length + 1,
    nombre, cargo, turno, sueldo,
    estado: 'activo'
  };
  EMPLEADOS.push(nuevoEmp);
  
  await apiPost('/empleados', nuevoEmp);
  
  renderEmpleados();
  showToast(`✅ ${nombre} registrado como ${cargo}`);
  cerrarModal();
}

async function crearReserva() {
  const cliente = document.getElementById('modalResCliente')?.value;
  const fecha = document.getElementById('modalResFecha')?.value;
  const hora = document.getElementById('modalResHora')?.value;
  const personas = parseInt(document.getElementById('modalResPersonas')?.value);
  const mesa = document.getElementById('modalResMesa')?.value;
  if (!cliente || !fecha || !hora) { showToast('⚠️ Completa los campos requeridos'); return; }
  
  const nuevaRes = { cliente, fecha, hora, personas: personas || 2, mesa, estado: 'pendiente' };
  RESERVAS.push(nuevaRes);
  
  await apiPost('/reservas', nuevaRes);
  
  renderReservas();
  showToast(`✅ Reserva creada para ${cliente}`);
  cerrarModal();
}

function cerrarModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function cerrarMesaModal() { document.getElementById('mesaModalOverlay').classList.remove('open'); }

document.getElementById('modalOverlay').addEventListener('click', e => { if(e.target.id==='modalOverlay') cerrarModal(); });

// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── AUTH / ROLE-BASED ACCESS ────────────────────────────────
const ROLES_MAP = { 1: 'Admin', 2: 'Cocinero', 3: 'Mozo', 4: 'Cliente' };
const ROLE_ALLOWED_SECTIONS = {
  1: ['dashboard', 'cocineros', 'mozos', 'administracion'], // Admin: all
  2: ['cocineros'],                                          // Cocinero: only cocina
  3: ['mozos'],                                              // Mozo: only sala
};
const ROLE_DEFAULT_SECTION = { 1: 'dashboard', 2: 'cocineros', 3: 'mozos' };

function getAntikaUser() {
  try {
    const data = localStorage.getItem('antika_user');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function checkAuth() {
  const user = getAntikaUser();
  if (!user || !user.rol || ![1, 2, 3].includes(user.rol)) {
    // Not logged in or not staff → redirect to index
    window.location.href = '/';
    return null;
  }
  return user;
}

function applyRoleRestrictions(user) {
  const allowed = ROLE_ALLOWED_SECTIONS[user.rol] || [];

  // Hide sidebar nav items that are not allowed
  document.querySelectorAll('.nav-item[data-section]').forEach(el => {
    const section = el.dataset.section;
    const li = el.closest('li');
    if (!allowed.includes(section)) {
      if (li) li.style.display = 'none';
    } else {
      if (li) li.style.display = '';
    }
  });

  // Update sidebar user info
  const initials = user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userName').textContent = user.nombre;
  document.getElementById('userRole').textContent = ROLES_MAP[user.rol] || 'Usuario';
}

// ─── CERRAR SESIÓN ───────────────────────────────────────────
function cerrarSesion() {
  localStorage.removeItem('antika_user');
  showToast('👋 Sesión cerrada. ¡Hasta pronto!');
  setTimeout(() => { window.location.href = '/'; }, 800);
}

// ─── INIT ─────────────────────────────────────────────────────
async function initApp() {
  // Auth check
  const user = checkAuth();
  if (!user) return;

  // Apply role restrictions
  applyRoleRestrictions(user);

  // Load data
  await loadDataFromBackend();

  // Determine initial section from URL param or role default
  const params = new URLSearchParams(window.location.search);
  let section = params.get('section') || ROLE_DEFAULT_SECTION[user.rol] || 'dashboard';

  // Ensure user can access the requested section
  const allowed = ROLE_ALLOWED_SECTIONS[user.rol] || [];
  if (!allowed.includes(section)) {
    section = ROLE_DEFAULT_SECTION[user.rol] || allowed[0] || 'dashboard';
  }

  goTo(section);
}

initApp();

setInterval(() => {
  if (document.getElementById('section-dashboard').classList.contains('active')) renderDashboard();
  if (document.getElementById('section-cocineros').classList.contains('active')) renderCola();
}, 30000);
