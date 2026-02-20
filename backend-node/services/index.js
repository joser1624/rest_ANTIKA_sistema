/**
 * ANTIKA RESTAURANT – Services Index
 * Exporta todos los servicios del backend
 */

const pedidoService = require('./pedidoService');
const mesaService = require('./mesaService');
const platoService = require('./platoService');

module.exports = {
  pedidoService,
  mesaService,
  platoService
};
