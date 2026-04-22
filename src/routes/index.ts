import { Router } from "express";

// Import module routes
import quotationRoutes from "../modules/quotation/quotation.routes";
// Future modules (keep commented for now)
// import authRoutes from "../modules/auth/auth.routes";
// import userRoutes from "../modules/user/user.routes";
// import bookingRoutes from "../modules/booking/booking.routes";
// import taskRoutes from "../modules/task/task.routes";

const router = Router();

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
router.use("/quotations", quotationRoutes);

// Future expansion (just uncomment when ready)
// router.use("/auth", authRoutes);
// router.use("/users", userRoutes);
// router.use("/bookings", bookingRoutes);
// router.use("/tasks", taskRoutes);

export default router;