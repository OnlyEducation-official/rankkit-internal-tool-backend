// src/modules/users/user.controller.ts

import { Request, Response } from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "./user.service";
import { createUserSchema, updateUserSchema } from "./user.validation";

export const createUserController = async (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    const user = await createUser(validatedData);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUsersController = async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserByIdController = async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const validatedData = updateUserSchema.parse(req.body);

    const user = await updateUser(req.params.id as string, validatedData);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    await deleteUser(req.params.id as string);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: null,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};