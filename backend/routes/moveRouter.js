import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// Pasta base onde os arquivos podem ser salvos
const BASE_OUTPUT_DIR = path.join(
  process.cwd(),
  "container_backend",
  "user_destinations"
);

router.post("/", express.json(), async (req, res) => {
  try {
    const { tempPath, destination } = req.body;

    // 1. Validações básicas
    if (!tempPath || !destination) {
      throw new Error("Caminhos inválidos");
    }

    // 2. Sanitiza o caminho de destino
    const sanitizedPath = destination.replace(/\.\./g, "").replace(/\\/g, "/");
    const finalPath = path.join(BASE_OUTPUT_DIR, sanitizedPath);

    // 3. Cria diretórios necessários
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });

    // 4. Move o arquivo
    fs.renameSync(tempPath, finalPath);

    res.json({
      success: true,
      finalPath: finalPath,
      message: "Arquivo movido com sucesso!",
    });
  } catch (error) {
    console.error("[MOVE ERROR]", error);
    res.status(500).json({
      error: "Falha ao mover arquivo",
      details: error.message,
    });
  }
});

export default router;
