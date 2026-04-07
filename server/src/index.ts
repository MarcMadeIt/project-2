import express from "express";
import cors from "cors";
import { generalLimiter } from "./middleware/rateLimit";
import authRoutes from "./routes/auth";

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

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
