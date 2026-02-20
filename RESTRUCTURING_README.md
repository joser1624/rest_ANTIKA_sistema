# ANTIKA RESTAURANT - Sistema POS Reestructurado

## 📋 Resumen de la Reestructuración

Este documento detalla los cambios realizados para transformar el sistema en una arquitectura profesional, mantenible y orientada a eventos.

---

## 📁 Archivos Creados

### Frontend Core (`frontend/core/`)

| Archivo | Descripción |
|---------|-------------|
| [`apiClient.js`](frontend/core/apiClient.js) | Cliente centralizado de comunicación con el backend. Maneja timeouts, reintentos automáticos y errores. |
| [`eventBus.js`](frontend/core/eventBus.js) | Sistema de eventos para comunicación entre componentes. |
| [`stateManager.js`](frontend/core/stateManager.js) | Gestión de estado global de la aplicación. |
| [`syncManager.js`](frontend/core/syncManager.js) | Sincronización automática cada 8 segundos con modo offline. |
| [`integration.js`](frontend/core/integration.js) | Helper de integración con el frontend existente. |
| [`index.js`](frontend/core/index.js) | Punto de entrada del core. |

### Backend Services (`backend-node/services/`)

| Archivo | Descripción |
|---------|-------------|
| [`pedidoService.js`](backend-node/services/pedidoService.js) | Lógica de negocio para pedidos. Estados: CREADO → EN_PREPARACION → LISTO → ENTREGADO → PAGADO → CERRADO/ANULADO |
| [`mesaService.js`](backend-node/services/mesaService.js) | Lógica de negocio para mesas. |
| [`platoService.js`](backend-node/services/platoService.js) | Lógica de negocio para el menú/platos. |
| [`index.js`](backend-node/services/index.js) | Índice de servicios. |

### Nuevas Rutas API

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/menu` | Obtiene el menú completo organizado por categorías |
| `GET /api/menu/categorias` | Lista de categorías con cantidad de platos |
| `GET /api/menu/:categoria` | Platos de una categoría específica |
| `GET /api/menu/buscar/:termino` | Buscar platos por nombre |

### Utilidades

| Archivo | Descripción |
|---------|-------------|
| [`test_system.js`](test_system.js) | Script de verificación de funcionamiento |

---

## 🔄 Flujo Operativo del Sistema

```
CLIENTE LLEGA
     ↓
MOZO ABRE MESA (libre → ocupada)
     ↓
MOZO AGREGA PLATOS AL PEDIDO
     ↓
PEDIDO SE ENVÍA A COCINA (creado → en_preparacion)
     ↓
COCINA PREPARA (en_preparacion → listo)
     ↓
MOZO ENTREGA (listo → entregado)
     ↓
CLIENTE PIDE CUENTA (entregado → pagado)
     ↓
CAJA REGISTRA PAGO (pagado → cerrado)
     ↓
MESA SE CIERRA (ocupada → libre)
     ↓
DATOS PASAN A REPORTES
```

### Estados del Pedido

| Estado | Descripción |
|--------|-------------|
| `creado` | Pedido nuevo, sin confirmar |
| `en_preparacion` | Confirmado y en cocina |
| `tomado` | Alias de compatibilidad (equivalente a en_preparacion) |
| `listo` | Listo para servir |
| `entregado` | Entregado al cliente |
| `pagado` | Cliente pagó |
| `cerrado` | Mesa cerrada |
| `anulado` | Pedido cancelado |

---

## ⚡ Características Implementadas

### 1. Cliente API Centralizado (`apiClient.js`)

- ✅ Reconexión automática (hasta 3 reintentos)
- ✅ Timeout configurable (10 segundos por defecto)
- ✅ Manejo de errores centralizado
- ✅ Formato de respuesta consistente: `{ ok, data, error }`
- ✅ Notifica cambios de conexión

### 2. Sincronización Automática (`syncManager.js`)

- ✅ Sincroniza cada 8 segundos
- ✅ Actualiza solo datos modificados (comparación por JSON)
- ✅ Modo offline cuando el backend no responde
- ✅ Resincronización automática al volver la conexión
- ✅ Verificación de conexión cada 30 segundos

### 3. Estado Global (`stateManager.js`)

```javascript
state = {
  mesas: [],        // Mesas del restaurante
  pedidos: [],      // Pedidos activos
  pedidoActivo: [], // Pedido en edición
  categorias: [],   // Categorías del menú
  conexion: {
    isOnline: true/false,
    lastChecked: timestamp
  },
  usuario: null,
  ultimosDatos: timestamp,
  cache: {
    empleados: [],
    transacciones: [],
    reservas: []
  }
}
```

### 4. Sistema de Eventos (`eventBus.js`)

Eventos disponibles:
- `pedido:creado`, `pedido:actualizado`, `pedido:estado:cambiado`
- `mesa:abierta`, `mesa:cerrada`, `mesa:actualizada`
- `menu:cargado`, `plato:agregado`
- `sync:iniciado`, `sync:completado`
- `conexion:perdida`, `conexion:restablecida`
- `datos:actualizados`

### 5. Menú Dinámico

El menú se carga completamente desde el backend:
- `GET /api/platos` - Todos los platos
- `GET /api/menu` - Menú organizado por categorías
- Los platos se agregan automáticamente al backend y aparecen en el frontend

### 6. Tarjetas Interactivas (CSS)

Estados visuales de las tarjetas de platos:
- `normal` - Borde gris
- `hover` - Borde dorado
- `seleccionado` - Borde verde
- `en-pedido` - Badge con cantidad

---

## 🧪 Cómo Probar que Nada se Rompió

### 1. Iniciar el Servidor

```bash
cd backend-node
node server.js
```

### 2. Ejecutar Tests Automáticos

```bash
node test_system.js
```

Deberían pasar todos los tests.

### 3. Verificar Frontend Existente

1. Abrir http://localhost:3000 en el navegador
2. Iniciar sesión con:
   - Email: `admin@antika.pe`
   - Password: `admin123`
3. Verificar que el panel admin carga correctamente
4. Probar las siguientes funciones:
   - [ ] Ver mesas
   - [ ] Ver pedidos
   - [ ] Cambiar estado de pedido
   - [ ] Ver menú

### 4. Verificar Nuevas APIs

```bash
# Health check
curl http://localhost:3000/api/health

# Menu con categorías
curl http://localhost:3000/api/menu

# Plato específico
curl http://localhost:3000/api/platos/1
```

---

## 🔧 Para Integrar el Nuevo Sistema en el Frontend

### Opción 1: Carga Incremental

Agregar al final del `<body>` en `admin.html`:

```html
<!-- Core Modules -->
<script src="../core/apiClient.js"></script>
<script src="../core/eventBus.js"></script>
<script src="../core/stateManager.js"></script>
<script src="../core/syncManager.js"></script>

<!-- Integration -->
<script src="../core/integration.js"></script>
```

### Opción 2: Usar Funcionalidad Específica

```javascript
// Obtener menú dinámicamente
const result = await window.apiClient.get('/menu');
// result.data.categorias - lista de categorías
// result.data.menu - objeto con platos por categoría

// Usar state manager
window.stateManager.subscribe('mesas', (mesas) => {
  console.log('Mesas actualizadas:', mesas);
});

// Iniciar sincronización
window.syncManager.start();
```

---

## 📱 Endpoints API (Mantienen Compatibilidad)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Verificar estado del servidor |
| GET | `/api/platos` | Obtener todos los platos |
| POST | `/api/platos` | Crear plato |
| PUT | `/api/platos/:id` | Actualizar plato |
| DELETE | `/api/platos/:id` | Eliminar plato |
| GET | `/api/mesas` | Obtener todas las mesas |
| PUT | `/api/mesas/:id` | Actualizar mesa |
| GET | `/api/pedidos` | Obtener todos los pedidos |
| POST | `/api/pedidos` | Crear pedido |
| PUT | `/api/pedidos/:id` | Actualizar pedido |
| GET | `/api/empleados` | Obtener empleados |
| GET | `/api/reservas` | Obtener reservas |
| GET | `/api/reportes` | Obtener reportes |
| GET | `/api/caja/transacciones` | Obtener transacciones |
| GET | `/api/menu` | **NUEVO** - Menú por categorías |
| GET | `/api/menu/categorias` | **NUEVO** - Lista de categorías |

---

## 🎯 Estado Final del Sistema

El sistema ahora cuenta con:

1. ✅ **Arquitectura limpia** - Separación clara entre frontend y backend
2. ✅ **Comunicación robusta** - API client con reintentos y timeouts
3. ✅ **Estado centralizado** - State manager con suscripción a cambios
4. ✅ **Sincronización automática** - Sync manager cada 8 segundos
5. ✅ **Sistema de eventos** - Comunicación desacoplada entre componentes
6. ✅ **Menú dinámico** - Platos por categorías desde el backend
7. ✅ **Compatibilidad** - Todos los endpoints existentes funcionan igual
8. ✅ **Modo offline** - Funciona cuando el backend no está disponible
9. ✅ **Tests automatizados** - Script de verificación incluido

---

*Sistema desarrollado para ANTIKA RESTAURANT*
