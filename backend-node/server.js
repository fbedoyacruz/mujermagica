require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const ensureSchema = require("./schema");
const { getState, replaceState } = require("./state");

const app = express();
const ROOT_DIR = path.resolve(__dirname, "..");
const IMAGES_DIR = path.join(ROOT_DIR, "Fuentes", "images");

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => {
    const baseName = path
      .parse(file.originalname)
      .name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "producto";
    const extension = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `${Date.now()}-${baseName}${extension}`);
  }
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten archivos de imagen"));
    }
    cb(null, true);
  }
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/images", express.static(IMAGES_DIR));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/state", async (req, res) => {
  try {
    const state = await getState();
    res.json(state);
  } catch (err) {
    console.error("Error obteniendo estado:", err);
    res.status(500).json({ error: "No se pudo leer la base de datos" });
  }
});

app.put("/api/state", async (req, res) => {
  try {
    await replaceState(req.body, req.get("X-Sale-Delete-Code"));
    res.json({ ok: true });
  } catch (err) {
    console.error("Error guardando estado:", err);
    res.status(err.status || 500).json({ error: err.status ? err.message : "No se pudo guardar la base de datos" });
  }
});

// Migración de un respaldo de localStorage (mismo shape que el estado)
app.post("/api/migrate", async (req, res) => {
  try {
    await replaceState(req.body, req.get("X-Sale-Delete-Code"));
    res.json({ ok: true });
  } catch (err) {
    console.error("Error migrando datos:", err);
    res.status(err.status || 500).json({ error: err.status ? err.message : "No se pudo migrar la base de datos" });
  }
});

app.post("/api/upload-image", (req, res) => {
  uploadImage.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "No se pudo procesar la imagen" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }

    return res.json({
      ok: true,
      path: `images/${req.file.filename}`
    });
  });
});

const PORT = process.env.PORT || 4000;

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend Mujer Magica escuchando en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("No se pudo preparar el esquema de la base de datos:", err);
    process.exit(1);
  });
