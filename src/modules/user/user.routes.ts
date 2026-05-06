// src/modules/users/user.routes.ts

import express from "express";

import {
  createUserController,
  deleteUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
} from "./user.controller";
import { authMiddleware } from "../../common/middleware/auth.middleware";
import { checkPermission } from "../../common/middleware/permission.middleware";
import { ModuleName } from "@prisma/client";
import { validateRequest } from "../../common/middleware/validateRequest";
import { createUserSchema, updateUserSchema } from "./user.validation";

const router = express.Router();

router.use(authMiddleware);
// router.use(requireSuperAdmin);

// router.post(
//   "/",
//   checkPermission(ModuleName.EMPLOYEE_MANAGEMENT, "canCreate"), 
//   validateRequest(createUserSchema),
//   createUserController
// );

router.post(
  "/",
  checkPermission(ModuleName.EMPLOYEE_MANAGEMENT, "canCreate"),
  validateRequest(createUserSchema),
  createUserController
);

router.get(
  "/",
  checkPermission(ModuleName.EMPLOYEE_MANAGEMENT, "canRead"),
  getAllUsersController
);

router.get(
  "/:id", 
  checkPermission(ModuleName.EMPLOYEE_MANAGEMENT, "canRead"),
  getUserByIdController
);

router.patch(
  "/:id", 
  checkPermission(ModuleName.EMPLOYEE_MANAGEMENT, "canUpdate"),  
  validateRequest(updateUserSchema),
  updateUserController
);

router.delete(
  "/:id", 
  checkPermission(ModuleName.EMPLOYEE_MANAGEMENT, "canDelete"),
  deleteUserController
);

export default router;