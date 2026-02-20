/**
 * ANTIKA RESTAURANT – Test Script
 * Script para verificar que el sistema funciona correctamente
 * 
 * Uso: node test_system.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// Colores para consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(50));
  log(`  ${title}`, 'blue');
  console.log('='.repeat(50));
}

// Función para hacer requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Tests
async function runTests() {
  log('\n🍽  ANTIKA RESTAURANT - TEST SUITE', 'blue');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  try {
    logSection('Test 1: Health Check');
    const res = await request('GET', '/health');
    if (res.status === 200 && res.data.status === 'ok') {
      log('✓ Health check PASSED', 'green');
      passed++;
    } else {
      log('✗ Health check FAILED', 'red');
      failed++;
    }
  } catch (e) {
    log(`✗ Health check ERROR: ${e.message}`, 'red');
    failed++;
  }

  // Test 2: Get Platos
  try {
    logSection('Test 2: Get Platos');
    const res = await request('GET', '/platos');
    if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
      log(`✓ Get platos PASSED (${res.data.length} platos)`, 'green');
      passed++;
    } else {
      log('✗ Get platos FAILED', 'red');
      failed++;
    }
  } catch (e) {
    log(`✗ Get platos ERROR: ${e.message}`, 'red');
    failed++;
  }

  // Test 3: Get Menu (new endpoint)
  try {
    logSection('Test 3: Get Menu with Categories');
    const res = await request('GET', '/menu');
    if (res.status === 200 && res.data.categorias && res.data.menu) {
      log(`✓ Get menu PASSED (${res.data.totalCategorias} categorías)`, 'green');
      log(`  Categorías: ${res.data.categorias.join(', ')}`, 'yellow');
      passed++;
    } else {
      log('✗ Get menu FAILED', 'red');
      failed++;
    }
  } catch (e) {
    log(`✗ Get menu ERROR: ${e.message}`, 'red');
    failed++;
  }

  // Test 4: Get Mesas
  try {
    logSection('Test 4: Get Mesas');
    const res = await request('GET', '/mesas');
    if (res.status === 200 && Array.isArray(res.data)) {
      log(`✓ Get mesas PASSED (${res.data.length} mesas)`, 'green');
      const occupied = res.data.filter(m => m.estado === 'ocupada').length;
      const free = res.data.filter(m => m.estado === 'libre').length;
      log(`  Ocupadas: ${occupied}, Libres: ${free}`, 'yellow');
      passed++;
    } else {
      log('✗ Get mesas FAILED', 'red');
      failed++;
    }
  } catch (e) {
    log(`✗ Get mesas ERROR: ${e.message}`, 'red');
    failed++;
  }

  // Test 5: Get Pedidos
  try {
    logSection('Test 5: Get Pedidos');
    const res = await request('GET', '/pedidos');
    if (res.status === 200 && Array.isArray(res.data)) {
      log(`✓ Get pedidos PASSED (${res.data.length} pedidos)`, 'green');
      passed++;
    } else {
      log('✗ Get pedidos FAILED', 'red');
      failed++;
    }
  } catch (e) {
    log(`✗ Get pedidos ERROR: ${e.message}`, 'red');
    failed++;
  }

  // Test 6: Create and Update Pedido
  try {
    logSection('Test 6: Create Pedido');
    const pedidoData = {
      id: 'TEST-001',
      mesa: 99,
      items: [{ nombre: 'Test Plato', precio: 25, cant: 1 }],
      estado: 'creado',
      cocineros: [],
      tiempo: Date.now()
    };
    
    // Create
    let res = await request('POST', '/pedidos', pedidoData);
    if (res.status === 201) {
      log('✓ Create pedido PASSED', 'green');
      
      // Update estado
      res = await request('PUT', '/pedidos/TEST-001', { estado: 'en_preparacion' });
      if (res.status === 200) {
        log('✓ Update pedido PASSED', 'green');
        passed++;
      } else {
        log('✗ Update pedido FAILED', 'red');
        failed++;
      }
      
      // Delete test pedido
      await request('DELETE', '/pedidos/TEST-001');
    } else {
      log('✗ Create pedido FAILED', 'red');
      failed++;
    }
  } catch (e) {
    log(`✗ Pedido test ERROR: ${e.message}`, 'red');
    failed++;
  }

  // Test 7: Get Empleados
  try {
    logSection('Test 7: Get Empleados');
    const res = await request('GET', '/empleados');
    if (res.status === 200 && Array.isArray(res.data)) {
      log(`✓ Get empleados PASSED (${res.data.length} empleados)`, 'green');
      passed++;
    } else {
      log('✗ Get empleados FAILED', 'red');
      failed++;
    }
  } catch (e) {
    log(`✗ Get empleados ERROR: ${e.message}`, 'red');
    failed++;
  }

  // Resumen
  logSection('RESUMEN DE TESTS');
  log(`  ✓ Passed: ${passed}`, 'green');
  log(`  ✗ Failed: ${failed}`, failed > 0 ? 'red' : 'yellow');
  
  if (failed === 0) {
    log('\n🎉 TODOS LOS TESTS PASARON', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  ALGUNOS TESTS FALLARON', 'red');
    process.exit(1);
  }
}

// Ejecutar tests
runTests().catch(err => {
  log(`\nError ejecutando tests: ${err.message}`, 'red');
  process.exit(1);
});
