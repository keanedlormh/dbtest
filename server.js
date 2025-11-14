const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path'); // Necesario para servir el HTML

const app = express();
// Render te dará un puerto en la variable 'PORT'. Si no existe, usamos 3000.
const port = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Conexión a la Base de Datos ---
// Usamos path.join para crear la ruta a la base de datos en la misma carpeta.
// Esta base de datos se borrará con cada reinicio del servidor.
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al abrir la base de datos:", err.message);
  } else {
    console.log('Conectado a la base de datos SQLite (en memoria efímera).');
    // Creamos la tabla si no existe
    db.run(`CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// --- Ruta para servir el frontend ---
// Cuando alguien visite la URL raíz (ej: https://mi-app.onrender.com/)
// le enviaremos el archivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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
    res.json({
      message: "success",
      data: rows
    });
  });
});

// RUTA [POST] /add: Para registrar una nueva solicitud
app.post('/add', (req, res) => {
  const { content } = req.body; 

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
    res.json({
      message: "success",
      data: { id: this.lastID, content: content }
    });
  });
});

// --- Iniciar el Servidor ---
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});