const express = require('express');
const { Pool } = require('pg'); // <-- CAMBIO: Importamos 'Pool' de 'pg'
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// --- Conexión a la Base de Datos PostgreSQL ---
// 'pg' es inteligente. Automáticamente buscará la variable de entorno
// 'DATABASE_URL' que configuraste en Render.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para las conexiones de base de datos en Render
  }
});

// --- Función para crear la tabla ---
// La sintaxis de SQL cambia ligeramente para PostgreSQL
const createTable = async () => {
  const queryText = `
  CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;
  try {
    // Ejecutamos la consulta para crear la tabla
    await pool.query(queryText);
    console.log('Tabla "requests" verificada/creada con éxito.');
  } catch (err) {
    console.error('Error al crear la tabla:', err.stack);
  }
};

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Ruta para servir el frontend (sin cambios) ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Definición de Rutas (API) ---

// RUTA [GET] /requests: Para leer todas las solicitudes
app.get('/requests', async (req, res) => {
  const sql = "SELECT id, content FROM requests ORDER BY timestamp DESC";
  try {
    // CAMBIO: pool.query devuelve un objeto 'result' y los datos están en 'result.rows'
    const result = await pool.query(sql);
    res.json({
      message: "success",
      data: result.rows
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ "error": err.message });
  }
});

// RUTA [POST] /add: Para registrar una nueva solicitud
app.post('/add', async (req, res) => {
  const { content } = req.body;

  if (!content) {
    res.status(400).json({ "error": "El contenido no puede estar vacío." });
    return;
  }

  // CAMBIO: En PostgreSQL, los parámetros se marcan con $1, $2, etc. en lugar de ?
  // CAMBIO: Usamos 'RETURNING *' para que la consulta nos devuelva la fila que acabamos de insertar.
  const sql = "INSERT INTO requests (content) VALUES ($1) RETURNING *";
  const values = [content];

  try {
    // CAMBIO: Pasamos la consulta y los valores por separado
    const result = await pool.query(sql, values);
    res.json({
      message: "success",
      // La fila recién creada está en result.rows[0]
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ "error": err.message });
  }
});

// --- Iniciar el Servidor ---
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
  // Una vez que el servidor inicia, mandamos a crear la tabla
  createTable();
});
