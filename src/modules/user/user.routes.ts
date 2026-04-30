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
import { requireSuperAdmin } from "../../common/middleware/role.middleware";

const router = express.Router();

router.use(authMiddleware);
router.use(requireSuperAdmin);

router.post("/", createUserController);
router.get("/", getAllUsersController);
router.get("/:id", getUserByIdController);
router.patch("/:id", updateUserController);
router.delete("/:id", deleteUserController);

export default router;