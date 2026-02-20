/**
 * ANTIKA RESTAURANT – Frontend Core Index
 * Exporta todos los módulos del core del frontend
 * 
 * Para usar en el frontend:
 * <script src="core/apiClient.js"></script>
 * <script src="core/eventBus.js"></script>
 * <script src="core/stateManager.js"></script>
 * <script src="core/syncManager.js"></script>
 * <script src="core/index.js"></script>
 */

// Los módulos ya están disponibles globalmente window
// Este archivo solo re-exporta para facilitar el uso

console.log('[Antika Core] Módulos cargados:', {
  apiClient: typeof window.apiClient !== 'undefined',
  eventBus: typeof window.eventBus !== 'undefined',
  stateManager: typeof window.stateManager !== 'undefined',
  syncManager: typeof window.syncManager !== 'undefined'
});

// Inicializar sync manager si está disponible
if (typeof window.syncManager !== 'undefined') {
  // El sync manager se inicia manualmente cuando sea necesario
  console.log('[Antika Core] Listo para sincronización');
}
