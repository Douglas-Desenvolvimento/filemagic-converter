import express from "express";
import cors from "cors";
import convertRouter from "./routes/convertRouter.js";
import moveRouter from "./routes/moveRouter.js";
import "dotenv/config";

const app = express();

const corsOptions = {
  origin: ["https://your-frontend.vercel.app", "http://localhost:5173"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "X-File-Name"],
  exposedHeaders: ["Content-Disposition"],
  maxAge: 3600,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use("/api/convert", convertRouter);
app.use("/api/move-file", moveRouter);

const PORT = process.env.SERVER_PORT || 6000;
/* app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); */

export default app;
