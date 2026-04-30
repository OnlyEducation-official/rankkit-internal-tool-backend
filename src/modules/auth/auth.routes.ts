// src/modules/auth/auth.routes.ts

import express from "express";
import { login, me } from "./auth.controller";
import { authMiddleware } from "../../common/middleware/auth.middleware";

const router = express.Router();

router.post("/login", login);
router.get("/me", authMiddleware, me);

export default router;