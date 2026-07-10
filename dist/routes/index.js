"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Import module routes
const quotation_routes_1 = __importDefault(require("../modules/quotation/quotation.routes"));
// Future modules (keep commented for now)
// import authRoutes from "../modules/auth/auth.routes";
// import userRoutes from "../modules/user/user.routes";
// import bookingRoutes from "../modules/booking/booking.routes";
// import taskRoutes from "../modules/task/task.routes";
const router = (0, express_1.Router)();
/**
 * Base route check
 */
router.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API v1 is working",
    });
});
/**
 * Module Routes
 */
router.use("/quotations", quotation_routes_1.default);
// Future expansion (just uncomment when ready)
// router.use("/auth", authRoutes);
// router.use("/users", userRoutes);
// router.use("/bookings", bookingRoutes);
// router.use("/tasks", taskRoutes);
exports.default = router;
