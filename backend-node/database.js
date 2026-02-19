/**
 * ANTIKA RESTAURANT – Database Module
 * SQLite database with better-sqlite3
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'antika.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── CREATE TABLES ───────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol INTEGER NOT NULL DEFAULT 4,
    telefono TEXT DEFAULT '—',
    dni TEXT DEFAULT '—',
    fecha_registro TEXT DEFAULT (date('now')),
    activo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS empleados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    cargo TEXT NOT NULL,
    turno TEXT NOT NULL,
    sueldo REAL NOT NULL,
    estado TEXT DEFAULT 'activo',
    entrada TEXT,
    salida TEXT
  );

  CREATE TABLE IF NOT EXISTS platos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    precio REAL NOT NULL,
    descripcion TEXT DEFAULT '',
    disponible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS mesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER UNIQUE NOT NULL,
    estado TEXT DEFAULT 'libre',
    mozo TEXT,
    capacidad INTEGER DEFAULT 4
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id TEXT PRIMARY KEY,
    mesa_id INTEGER NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    cocineros TEXT DEFAULT '[]',
    tiempo INTEGER NOT NULL,
    items TEXT NOT NULL DEFAULT '[]',
    total REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    personas INTEGER DEFAULT 2,
    mesa TEXT,
    estado TEXT DEFAULT 'pendiente',
    telefono TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS asistencia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    hora TEXT NOT NULL,
    fecha TEXT DEFAULT (date('now')),
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
  );

  CREATE TABLE IF NOT EXISTS transacciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hora TEXT NOT NULL,
    mesa TEXT NOT NULL,
    mozo TEXT NOT NULL,
    total REAL NOT NULL,
    metodo TEXT NOT NULL,
    estado TEXT DEFAULT 'pagado',
    fecha TEXT DEFAULT (date('now'))
  );
`);

// ─── SEED DATA ───────────────────────────────────────────────
function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
  if (userCount.count === 0) {
    console.log('📦 Seeding database with initial data...');

    // Admin user
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO usuarios (nombre, email, password, rol, telefono, dni) VALUES (?, ?, ?, ?, ?, ?)`)
      .run('Admin Principal', 'admin@antika.pe', hashedPassword, 1, '999000001', '00000001');

    // Empleados
    const empleados = [
      ['Rosa Mamani', 'Cocinero', 'Mañana', 1400, 'activo'],
      ['Ernesto Quispe', 'Cocinero', 'Tarde', 1400, 'activo'],
      ['Milagros Torres', 'Cocinero', 'Mañana', 1300, 'activo'],
      ['Ana Lucía Flores', 'Mozo', 'Mañana', 1100, 'activo'],
      ['Jorge Condori', 'Mozo', 'Tarde', 1100, 'activo'],
      ['Carla Sánchez', 'Mozo', 'Mañana', 1100, 'permiso'],
    ];
    const insertEmp = db.prepare('INSERT INTO empleados (nombre, cargo, turno, sueldo, estado) VALUES (?, ?, ?, ?, ?)');
    empleados.forEach(e => insertEmp.run(...e));

    // Create user accounts for employees
    const insertUser = db.prepare('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)');
    empleados.forEach(e => {
      const email = e[0].toLowerCase().replace(' ', '.') + '@antika.pe';
      const rol = e[1] === 'Cocinero' ? 2 : 3;
      insertUser.run(e[0], email, hashedPassword, rol);
    });

    // Platos (Carta Antika)
    const platos = [
      ['Desayuno Antika', 'Desayunos', 14, 'Bistec encebollado / Saltado de pollo + café o jugo'],
      ['Desayuno Americano', 'Desayunos', 13, 'Pan artesanal, huevos al gusto, tocino, jugo y café'],
      ['Tamal Peruano', 'Desayunos', 13, 'Tamal de maíz con cerdo, sarsa criolla, café y pan'],
      ['Sándwich Lomo Saltado', 'Sándwiches', 16, 'Lomo saltado jugoso en pan con papas andinas'],
      ['Sándwich Milanesa de Pollo', 'Sándwiches', 15, 'Milanesa crocante con lechuga, tomate y papas'],
      ['Pan con Chicharrón', 'Sándwiches', 12, 'Chicharrón de cerdo, camote frito y sarsa criolla'],
      ['Choripán', 'Sándwiches', 10, 'Chorizo al grill con chimichurri y papas'],
      ['Sándwich Caprese', 'Sándwiches', 15, 'Tomate, mozzarella, albahaca y pesto'],
      ['Ensalada César', 'Ensaladas', 15, 'Lechugas, salsa César, parmesano y crutones'],
      ['Ensalada Mango al Curry', 'Ensaladas', 16, 'Lechugas, tocino, jamón y mango con vinagreta curry'],
      ['Ensalada Campesina', 'Ensaladas', 18, 'Atún, quinua, aceitunas, tomate y papas doradas'],
      ['Dieta de Pollo', 'Sopas', 16, 'Caldo de pollo con vegetales'],
      ['Sopa a la Minuta', 'Sopas', 18, 'Carne tierna, fideos cabello de ángel, huevo y leche'],
      ['Caldo de Gallina', 'Sopas', 20, 'Gallina de corral, fideos, papa y huevo duro'],
      ['Arroz con Pollo', 'Medio Día', 22, 'Arroz con cilantro, pollo dorado y papa a la huancaína'],
      ['Lomo Saltado', 'Fondos', 28, 'Lomo de res al wok con cebolla, tomate y ají amarillo'],
      ['Ají de Gallina', 'Medio Día', 22, 'Pollo en salsa de ají amarillo con papas y arroz'],
      ['Estofado de Res', 'Medio Día', 22, 'Res en salsa de vino tinto, tomate y ajo'],
      ['Chaufa de Pollo', 'Fondos', 18, 'Arroz frito al wok con pollo, huevo y cebollita china'],
      ['Pollo a la Plancha', 'Fondos', 22, 'Pechuga dorada con especias especiales'],
      ['Bistec a lo Pobre', 'Fondos', 27, 'Bistec, arroz, papas, huevo frito y plátano'],
      ['Trucha a la Menuere', 'Fondos', 24, 'Filete de trucha con mantequilla, limón y finas hierbas'],
      ['Trucha Fungi', 'Fondos', 25, 'Trucha en salsa de champiñones y bechamel'],
      ['Pulpo Anticuchero', 'Fondos', 42, 'Pulpo marinado en salsa anticuchera con papas y piña'],
      ['Lomo Saltado al Pesto', 'Fondos', 32, 'Lomo con fettuccine en salsa cremosa a elección'],
      ['Clásica Burger', 'Burgers', 13, 'Carne de res, lechuga y tomate + papas'],
      ['Cheese Burger', 'Burgers', 15, 'Carne a la parrilla con queso, lechuga y tomate'],
      ['Bacon Burger', 'Burgers', 15, 'Carne con tocino ahumado, lechuga y tomate'],
      ['Parrillera Burger', 'Burgers', 16, 'Carne con chorizo, chimichurri, lechuga y tomate'],
      ['6 Alitas (salsa a elección)', 'Alitas', 16, 'BBQ, Hot BBQ, Anticucheras, Maracuyá, Crispy...'],
      ['Broaster Solo para Mí (2pzas)', 'Alitas', 17, '2 piezas de broaster Mr. Bross + papas personal'],
      ['Broaster Dúo Conquistador (4pzas)', 'Alitas', 32, '4 piezas + 2 papas personales'],
      ['Docena de Nuggets', 'Adicionales', 16, '12 nuggets de pollo crujientes'],
      ['Porción Papas Personal', 'Adicionales', 3.5, 'Papas fritas personales'],
      ['Porción Arroz', 'Adicionales', 5, 'Porción de arroz blanco'],
    ];
    const insertPlato = db.prepare('INSERT INTO platos (nombre, categoria, precio, descripcion) VALUES (?, ?, ?, ?)');
    platos.forEach(p => insertPlato.run(...p));

    // Mesas
    const insertMesa = db.prepare('INSERT INTO mesas (numero, estado, mozo) VALUES (?, ?, ?)');
    for (let i = 1; i <= 12; i++) {
      const estado = i <= 5 ? 'ocupada' : i <= 7 ? 'reservada' : 'libre';
      const mozo = i <= 5 ? (i <= 3 ? 'Ana Lucía' : 'Jorge') : null;
      insertMesa.run(i, estado, mozo);
    }

    // Pedidos de muestra
    const insertPedido = db.prepare('INSERT INTO pedidos (id, mesa_id, estado, cocineros, tiempo, items) VALUES (?, ?, ?, ?, ?, ?)');
    const now = Date.now();
    insertPedido.run('P-001', 1, 'pendiente', '[]', now - 8*60000, JSON.stringify([{nombre:'Lomo Saltado', cant:2, nota:'sin ají'}, {nombre:'Caldo de Gallina', cant:1, nota:''}]));
    insertPedido.run('P-002', 2, 'tomado', '["Rosa"]', now - 15*60000, JSON.stringify([{nombre:'Trucha Fungi', cant:1, nota:''}, {nombre:'Pollo a la Plancha', cant:1, nota:'bien cocido'}]));
    insertPedido.run('P-003', 3, 'listo', '["Ernesto"]', now - 22*60000, JSON.stringify([{nombre:'Chaufa de Pollo', cant:2, nota:''}, {nombre:'6 Alitas', cant:1, nota:'BBQ'}]));
    insertPedido.run('P-004', 4, 'pendiente', '[]', now - 3*60000, JSON.stringify([{nombre:'Arroz con Pollo', cant:3, nota:''}]));
    insertPedido.run('P-005', 5, 'tomado', '["Rosa","Milagros"]', now - 18*60000, JSON.stringify([{nombre:'Pulpo Anticuchero', cant:1, nota:''}, {nombre:'Trucha a la Menuere', cant:1, nota:''}]));

    // Reservas
    const insertReserva = db.prepare('INSERT INTO reservas (cliente, fecha, hora, personas, mesa, estado) VALUES (?, ?, ?, ?, ?, ?)');
    insertReserva.run('María Condori', '2025-01-20', '13:00', 4, 'Mesa 8', 'confirmada');
    insertReserva.run('Familia Quispe', '2025-01-20', '19:30', 6, 'Mesa 10', 'confirmada');
    insertReserva.run('José Huanca', '2025-01-21', '13:30', 2, 'Mesa 4', 'pendiente');

    // Transacciones
    const insertTrans = db.prepare('INSERT INTO transacciones (hora, mesa, mozo, total, metodo, estado) VALUES (?, ?, ?, ?, ?, ?)');
    insertTrans.run('13:42', 'Mesa 3', 'Ana Lucía', 94, 'Efectivo', 'pagado');
    insertTrans.run('13:15', 'Mesa 7', 'Jorge', 56, 'Tarjeta +5%', 'pagado');
    insertTrans.run('12:58', 'Mesa 1', 'Ana Lucía', 112, 'Efectivo', 'pagado');
    insertTrans.run('12:30', 'Mesa 5', 'Jorge', 78, 'Efectivo', 'pagado');

    console.log('✅ Database seeded successfully!');
  }
}

seedDatabase();

module.exports = db;
