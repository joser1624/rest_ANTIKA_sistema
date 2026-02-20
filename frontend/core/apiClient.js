/**
 * ANTIKA RESTAURANT – API Client
 * Cliente centralizado de comunicación con el backend
 * 
 * Características:
 * - Reconexión automática
 * - Timeout configurables
 * - Manejo de errores centralizado
 * - Siempre devuelve formato: { ok, data, error }
 */

const API_BASE = 'http://localhost:3000/api';

// Configuración de timeout y reintentos
const CONFIG = {
  timeout: 10000,           // 10 segundos timeout
  maxRetries: 3,            // Máximo 3 reintentos
  retryDelay: 1000,          // 1 segundo entre reintentos
  retryOn: [408, 500, 502, 503, 504] // Códigos que justifican reintento
};

// Estado de conexión
let connectionStatus = {
  isOnline: true,
  lastChecked: null,
  consecutiveFailures: 0
};

/**
 * Función principal para hacer requests
 * @param {string} endpoint - Endpoint de la API (ej: '/pedidos')
 * @param {object} options - Opciones del request
 * @returns {Promise<{ok: boolean, data: any, error: string|null}>}
 */
async function apiRequest(endpoint, options = {}) {
  const { 
    method = 'GET', 
    body = null, 
    headers = {},
    timeout = CONFIG.timeout,
    retries = CONFIG.maxRetries
  } = options;

  const url = `${API_BASE}${endpoint}`;
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        signal: controller.signal
      };

      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Procesar respuesta
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Error HTTP (4xx, 5xx)
        const errorMsg = data.error || `Error HTTP ${response.status}`;
        
        // Decidir si reintentar
        if (CONFIG.retryOn.includes(response.status) && attempt < retries) {
          lastError = errorMsg;
          await sleep(CONFIG.retryDelay * (attempt + 1));
          continue;
        }
        
        updateConnectionStatus(false);
        return { ok: false, data: null, error: errorMsg };
      }

      // Success
      updateConnectionStatus(true);
      return { ok: true, data, error: null };

    } catch (error) {
      lastError = error.message || 'Error de conexión';
      
      // Error de red o abort
      if (error.name === 'AbortError') {
        lastError = 'Tiempo de espera agotado';
      }
      
      // Si hay más reintentos disponibles
      if (attempt < retries) {
        await sleep(CONFIG.retryDelay * (attempt + 1));
        continue;
      }
    }
  }

  updateConnectionStatus(false);
  return { ok: false, data: null, error: lastError };
}

/**
 * Métodos convenience para losverbos HTTP más comunes
 */
const api = {
  // GET request
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  
  // POST request
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
  
  // PUT request
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
  
  // DELETE request
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  
  // PATCH request
  patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body }),
  
  // Obtener estado de conexión
  getStatus: () => ({ ...connectionStatus }),
  
  // Verificar conectividad
  async ping() {
    return apiRequest('/health', { timeout: 5000 });
  }
};

/**
 * Actualiza el estado de conexión
 */
function updateConnectionStatus(isOnline) {
  const wasOnline = connectionStatus.isOnline;
  connectionStatus.isOnline = isOnline;
  connectionStatus.lastChecked = new Date().toISOString();
  
  if (isOnline) {
    connectionStatus.consecutiveFailures = 0;
  } else {
    connectionStatus.consecutiveFailures++;
  }

  // Notificar cambio de estado si hubo transición
  if (wasOnline !== isOnline && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('connectionChange', { 
      detail: { isOnline } 
    }));
  }
}

/**
 * Utilidad: sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.apiClient = api;
  window.API_BASE = API_BASE;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { api, API_BASE, CONFIG };
}
