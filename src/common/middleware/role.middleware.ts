// src/middleware/role.middleware.ts

import { NextFunction, Request, Response } from "express";

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only super admin can access this route",
    });
  }

  next();
};