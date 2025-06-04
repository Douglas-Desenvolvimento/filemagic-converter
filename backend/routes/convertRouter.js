import express from "express";
import { exec } from "child_process";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, "../container_backend/temp");
const outputDir = path.join(__dirname, "../container_backend/output");
const logDir = path.join(__dirname, "../logs");
const logFile = path.join(logDir, "server-backend.log");

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const cleanTempDirectory = () => {
  try {
    const files = fs.readdirSync(tempDir);
    if (files.length === 0) return;

    logToFile(`Limpando diretório temp (${files.length} arquivos)`);
    let deletedCount = 0;

    for (const file of files) {
      try {
        const filePath = path.join(tempDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
      } catch (error) {
        logToFile(`Erro ao deletar ${file}: ${error.message}`);
      }
    }

    logToFile(
      `Diretório temp limpo (${deletedCount}/${files.length} arquivos removidos)`
    );
  } catch (error) {
    logToFile(`Erro ao limpar diretório temp: ${error.message}`);
  }
};

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  try {
    fs.appendFileSync(logFile, logMessage, { encoding: "utf8" });
  } catch (err) {
    console.error("Falha ao escrever no arquivo de log:", err);
  }
}

const router = express.Router();

const getContainerId = async () => {
  try {
    const { stdout } = await execAsync(
      'docker ps -qf "name=backend-converter"'
    );
    const containerId = stdout.trim();
    if (!containerId) throw new Error("Container não encontrado");
    return containerId;
  } catch (error) {
    console.error("[CONTAINER ERROR]", error.message);
    throw new Error("Serviço de conversão indisponível");
  }
};

const storage = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const isHEIC = /\.heic$/i.test(file.originalname);
    cb(null, isHEIC);
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

const processConversion = async (containerId, inputPath, outputPath) => {
  const command = `docker exec ${containerId} python3 /app/heic_to_jpg.py "${inputPath}" "${outputPath}"`;
  console.log(`Executando: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) throw new Error(stderr);
    return stdout;
  } catch (error) {
    console.error(`Erro na conversão: ${error.message}`);
    throw error;
  }
};

router.post("/", upload.array("files"), async (req, res) => {
  try {
    logToFile(`Iniciando conversão para ${req.files.length} arquivos`);
    if (!req.files || req.files.length === 0) {
      logToFile("Nenhum arquivo recebido");
      throw new Error("Nenhum arquivo recebido");
    }

    const containerId = await getContainerId();
    logToFile(`Container ID obtido: ${containerId}`);
    logToFile(`Processando ${req.files.length} arquivos`);

    const results = [];

    for (const file of req.files) {
      // Define filePath corretamente antes de usar
      const filePath = path.join(tempDir, file.originalname);
      logToFile(`Iniciando conversão de ${file.originalname}`);

      try {
        const outputFileName = file.originalname.replace(/\.heic$/i, ".jpg");
        const containerInput = `/app/temp/${file.originalname}`;
        const containerOutput = `/app/output/${outputFileName}`;
        const localOutput = path.join(outputDir, outputFileName);

        console.log(`Processando: ${file.originalname} → ${outputFileName}`);

        await processConversion(containerId, containerInput, containerOutput);

        if (fs.existsSync(localOutput)) {
          const fileBuffer = fs.readFileSync(localOutput);
          results.push({
            originalName: file.originalname,
            fileName: outputFileName,
            buffer: fileBuffer.toString("base64"),
            size: fileBuffer.length,
          });
          fs.unlinkSync(localOutput);
          logToFile(`Conversão bem-sucedida: ${file.originalname}`);
        }

        // Remove o arquivo temporário após a conversão
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        logToFile(
          `Erro na conversão de ${file.originalname}: ${error.message}`
        );
        console.error(`Erro processando ${file.originalname}:`, error.message);
        results.push({
          originalName: file.originalname,
          error: error.message,
        });

        // Tenta remover o arquivo temporário mesmo em caso de erro
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanError) {
          logToFile(
            `Erro ao limpar arquivo temporário ${file.originalname}: ${cleanError.message}`
          );
        }
      }
    }

    logToFile(
      `Conversão concluída: ${
        results.filter((r) => !r.error).length
      } sucessos, ${results.filter((r) => r.error).length} falhas`
    );

    res.json({
      success: true,
      converted: results.filter((r) => !r.error).length,
      failed: results.filter((r) => r.error).length,
      files: results,
    });
  } catch (error) {
    logToFile(`Erro geral na conversão: ${error.message}`);
    console.error("Erro geral:", error.message);
    res.status(500).json({
      error: "Falha no processamento",
      details: error.message,
    });
  }
});

setInterval(() => {
  cleanTempDirectory();
}, 3600000);

export default router;
