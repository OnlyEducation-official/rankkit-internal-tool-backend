import { NextFunction, Request, Response } from "express";
import { ModuleName } from "@prisma/client";
import prisma from "../../config/prisma";

type PermissionAction =
  | "canCreate"
  | "canRead"
  | "canUpdate"
  | "canDelete"
  | "canDuplicate";

const actionLabels: Record<PermissionAction, string> = {
  canCreate: "create",
  canRead: "view",
  canUpdate: "edit",
  canDelete: "delete",
  canDuplicate: "duplicate",
};

const moduleLabels: Record<string, string> = {
  QUOTATION: "quotations",
  STUDIO_BOOKING: "studio bookings",
  EMPLOYEE_MANAGEMENT: "employee data",
};

export const checkPermission = (
  module: ModuleName,
  action: PermissionAction
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (req.user.role === "SUPER_ADMIN") {
        return next();
      }

      const permission = await prisma.userModulePermission.findUnique({
        where: {
          userId_module: {
            userId: req.user.id,
            module,
          },
        },
      });

      if (!permission || !permission[action]) {
        const actionLabel = actionLabels[action];
        const moduleLabel = moduleLabels[module] || module.toLowerCase();

        return res.status(403).json({
          success: false,
          message: `You do not have permission to ${actionLabel} ${moduleLabel}`,
        });
      }

      return next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};