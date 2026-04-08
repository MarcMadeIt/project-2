import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { generalLimiter } from "./middleware/rateLimit";
import authRoutes from "./routes/auth";
import quizRoutes from "./routes/quizzes";
import { swaggerSpec } from "./config/swagger";
import resultsRoutes from "./routes/results";

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(generalLimiter);

app.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/auth", authRoutes);
app.use("/quizzes", quizRoutes);
app.use("/results", resultsRoutes);

// Swagger docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Optional raw JSON spec
app.get("/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
});