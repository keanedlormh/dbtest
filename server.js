const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;

// --- Middlewares ---
// Usamos CORS para permitir peticiones desde el frontend
app.use(cors());
// Usamos express.json() para poder entender los JSON que envía el frontend
app.use(express.json());

// --- Conexión a la Base de Datos ---
// Esto crea el archivo 'database.db' si no existe
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error("Error al abrir la base de datos:", err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    // Creamos la tabla si no existe
    db.run(`CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// --- Definición de Rutas (API) ---

// RUTA [GET] /requests: Para leer todas las solicitudes
app.get('/requests', (req, res) => {
  const sql = "SELECT id, content FROM requests ORDER BY timestamp DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ "error": err.message });
      return;
    }
    // Enviamos los resultados como JSON
    res.json({
      message: "success",
      data: rows
    });
  });
});

// RUTA [POST] /add: Para registrar una nueva solicitud
app.post('/add', (req, res) => {
  const { content } = req.body; // Obtenemos el texto desde el body de la petición

  if (!content) {
    res.status(400).json({ "error": "El contenido no puede estar vacío." });
    return;
  }

  const sql = "INSERT INTO requests (content) VALUES (?)";
  db.run(sql, [content], function(err) {
    if (err) {
      res.status(500).json({ "error": err.message });
      return;
    }
    // Enviamos una respuesta exitosa, incluyendo el ID del nuevo registro
    res.json({
      message: "success",
      data: { id: this.lastID, content: content }
    });
  });
});

// --- Iniciar el Servidor ---
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
