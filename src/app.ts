import express, { Application, Request, Response } from "express";
import cors from "cors";

import apiRoutes from "./routes";
import { notFound } from "./common/middleware/notFound";
import { errorHandler } from "./common/middleware/errorHandler";

const app: Application = express();

// Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Rankkit Internal Tool Backend is running",
  });
});

// API routes
app.use("/api/v1", apiRoutes);

// Not found middleware
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;