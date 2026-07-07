import express, { Application, Request, Response } from "express";
import cors from "cors";

import apiRoutes from "./routes";
import { notFound } from "./common/middleware/notFound";
import { errorHandler } from "./common/middleware/errorHandler";

const app: Application = express();

// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//   })
// );

const allowedOrigins = [
  "https://quotation.rankkitstudio.com",
  "http://localhost:3000"
];

app.use(
  cors({
    origin(origin, callback) {
      // allow non-browser tools / server-to-server / curl / health checks
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS policy does not allow this origin"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Quotations can carry large descriptions/notes, so raise the default 100kb
// body limit. The limit still protects against unbounded payloads.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Rankkit Internal Tool Backend is running",
  });
});

app.use("/api/v1", apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;