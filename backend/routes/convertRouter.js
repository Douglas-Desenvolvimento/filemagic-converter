import express from "express";
import { exec, execSync } from "child_process";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Configura caminhos absolutos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cria diretórios temporários se não existirem
const tempDir = path.join(__dirname, "../container_backend/temp");
const outputDir = path.join(__dirname, "../container_backend/output");

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

function getContainerId() {
  try {
    const containerId = execSync('docker ps -qf "name=backend-converter"')
      .toString()
      .trim();
    if (!containerId) throw new Error("Container não encontrado");
    return containerId;
  } catch (error) {
    console.error("[BACKEND ERRO]", error.message);
    throw new Error("Container do conversor não está rodando");
  }
}

const upload = multer({
  dest: tempDir,
  fileFilter: (req, file, cb) => {
    const isHEIC = file.originalname.toLowerCase().endsWith(".heic");
    if (!isHEIC) {
      return cb(new Error("Apenas arquivos .HEIC são permitidos"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

const router = express.Router();

console.log("[BACKEND] Rota /api/convert inicializada");

// Rota para conversão de arquivos
router.post("/", upload.single("file"), async (req, res) => {
  try {
    // Validações iniciais
    if (!req.file) {
      throw new Error("Nenhum arquivo recebido");
    }

    const originalName = req.headers["x-file-name"] || req.file.originalname;
    const inputExtension = path.extname(originalName).toLowerCase();

    if (inputExtension !== ".heic") {
      throw new Error(
        `Formato inválido: ${originalName}. Apenas .HEIC são suportados`
      );
    }

    // Prepara caminhos
    const outputFileName = originalName.replace(".heic", ".jpg");
    const containerInputPath = `/app/temp/${originalName}`;
    const containerOutputPath = `/app/output/${outputFileName}`;
    const localTempPath = path.join(outputDir, outputFileName);

    console.log(`[BACKEND] Processando: ${originalName} -> ${outputFileName}`);

    // Copia arquivo para o container
    fs.copyFileSync(req.file.path, path.join(tempDir, originalName));

    // Executa conversão no container
    const containerId = getContainerId();
    const command = [
      "docker",
      "exec",
      containerId,
      "python3",
      "/app/heic_to_jpg.py",
      `"${containerInputPath}"`,
      `"${containerOutputPath}"`,
    ].join(" ");

    console.log(`[BACKEND] Executando: ${command}`);

    exec(command, async (error, stdout, stderr) => {
      try {
        // Limpeza do arquivo temporário de entrada
        fs.unlinkSync(req.file.path);
        fs.unlinkSync(path.join(tempDir, originalName));
        console.log("[BACKEND] Arquivos temporários removidos");

        if (error) {
          console.error(`[BACKEND ERRO] ${stderr || error.message}`);
          return res.status(500).json({
            error: "Falha na conversão",
            details: {
              message: stderr || error.message,
              command: command,
              stdout: stdout.toString(),
            },
          });
        }

        console.log(`[BACKEND] Saída do comando: ${stdout}`);

        // Verificação do arquivo convertido
        const maxAttempts = 5;
        let fileReady = false;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            if (fs.existsSync(localTempPath)) {
              const stats = fs.statSync(localTempPath);
              if (stats.size > 0) {
                fileReady = true;
                console.log(
                  `[BACKEND] Arquivo convertido encontrado na tentativa ${attempt}`
                );
                break;
              }
            }
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (checkError) {
            console.warn(
              `[BACKEND] Erro na verificação ${attempt}:`,
              checkError.message
            );
          }
        }

        if (!fileReady) {
          throw new Error(
            `Arquivo não foi gerado corretamente após ${maxAttempts} tentativas`
          );
        }

        // Lê o arquivo convertido em memória
        const fileBuffer = fs.readFileSync(localTempPath);

        // Remove o arquivo temporário de saída
        fs.unlinkSync(localTempPath);

        // Retorna o arquivo como download
        res.set("Content-Type", "image/jpeg");
        res.set(
          "Content-Disposition",
          `attachment; filename="${outputFileName}"`
        );
        res.send(fileBuffer);
      } catch (finalError) {
        console.error("[BACKEND ERRO FINAL]", finalError.message);
        res.status(500).json({
          error: "Falha na geração do arquivo",
          details: finalError.message,
        });
      }
    });
  } catch (outerError) {
    console.error("[BACKEND ERRO EXTERNO]", outerError.message);
    res.status(500).json({
      error: "Erro no processamento inicial",
      details: outerError.message,
    });
  }
});

export default router;
