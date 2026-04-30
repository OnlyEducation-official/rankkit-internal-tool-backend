// src/modules/auth/auth.controller.ts

import { Request, Response } from "express";
import { loginUser, getCurrentUser } from "./auth.service";
import { loginSchema } from "./auth.validation";

export const login = async (req: Request, res: Response) => {
    try {
        const validated = loginSchema.parse(req.body);

        const result = await loginUser(
            validated.email,
            validated.password
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const me = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const user = await getCurrentUser(req.user.id);

        return res.status(200).json({
            success: true,
            message: "User fetched",
            data: user,
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};