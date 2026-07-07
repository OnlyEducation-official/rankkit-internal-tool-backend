import app from "./app";

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "127.0.0.1";

const startServer = async (): Promise<void> => {
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });

  // Safety nets: never let an unhandled async error take the process down
  // silently. Log it, then shut down gracefully so the process manager can
  // restart a clean instance.
  process.on("unhandledRejection", (reason) => {
    console.error("UNHANDLED REJECTION:", reason);
    server.close(() => process.exit(1));
  });

  process.on("uncaughtException", (error) => {
    console.error("UNCAUGHT EXCEPTION:", error);
    server.close(() => process.exit(1));
  });
};

startServer();
