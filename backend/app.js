import express from "express";
import cors from "cors";
import convertRouter from "./routes/convertRouter.js";
import "dotenv/config";
const PORT = process.env.PORT || 4000;

const app = express();

const corsOptions = {
  origin: [
    "https://vercel.com/douglas-pereira-da-silvas-projects/filemagic-converter",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "X-File-Name"],
  exposedHeaders: ["Content-Disposition"],
  maxAge: 3600,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/api/convert", convertRouter);

//const PORT = process.env.SERVER_PORT || 6000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;
