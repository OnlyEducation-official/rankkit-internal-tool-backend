"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const notFound_1 = require("./common/middleware/notFound");
const errorHandler_1 = require("./common/middleware/errorHandler");
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)({
    origin(origin, callback) {
        // allow non-browser tools / server-to-server / curl / health checks
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("CORS policy does not allow this origin"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Quotations can carry large descriptions/notes, so raise the default 100kb
// body limit. The limit still protects against unbounded payloads.
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Rankkit Internal Tool Backend is running",
        version: process.env.APP_VERSION || "development",
    });
});
app.use("/api/v1", routes_1.default);
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
