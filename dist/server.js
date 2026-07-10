"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "127.0.0.1";
const startServer = async () => {
    const server = app_1.default.listen(PORT, HOST, () => {
        console.log(`Server ${process.env.APP_VERSION || "development"} running at http://${HOST}:${PORT}`);
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
