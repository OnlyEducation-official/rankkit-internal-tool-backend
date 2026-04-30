// src/modules/users/user.service.ts

import bcrypt from "bcryptjs";
import prisma from "../../config/prisma";
import { createUserSchema, updateUserSchema } from "./user.validation";
import { z } from "zod";

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const createUser = async (payload: CreateUserInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: payload.role,
      permissions: {
        create:
          payload.role === "EMPLOYEE"
            ? payload.permissions?.map((permission) => ({
              module: permission.module,
              canCreate: permission.canCreate ?? false,
              canRead: permission.canRead ?? false,
              canUpdate: permission.canUpdate ?? false,
              canDelete: permission.canDelete ?? false,
              canDuplicate: permission.canDuplicate ?? false,
            }))
            : [],
      },
    },
    select: userSelect,
  });

  return user;
};

export const getAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: userSelect,
  });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateUser = async (id: string, payload: UpdateUserInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  let hashedPassword: string | undefined;

  if (payload.password) {
    hashedPassword = await bcrypt.hash(payload.password, 10);
  }

  const user = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        name: payload.name,
        email: payload.email,
        role: payload.role,
        isActive: payload.isActive,
        password: hashedPassword,
      },
    });

    if (payload.permissions) {
      await tx.userModulePermission.deleteMany({
        where: { userId: id },
      });

      if (payload.role !== "SUPER_ADMIN") {
        await tx.userModulePermission.createMany({
          data: payload.permissions.map((permission) => ({
            userId: id,
            module: permission.module,
            canCreate: permission.canCreate ?? false,
            canRead: permission.canRead ?? false,
            canUpdate: permission.canUpdate ?? false,
            canDelete: permission.canDelete ?? false,
            canDuplicate: permission.canDuplicate ?? false,
          })),
        });
      }
    }

    return tx.user.findUnique({
      where: { id },
      select: userSelect,
    });
  });

  return user;
};

export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.user.delete({
    where: { id },
  });

  return null;
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  permissions: {
    select: {
      id: true,
      module: true,
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
      canDuplicate: true,
    },
  },
};