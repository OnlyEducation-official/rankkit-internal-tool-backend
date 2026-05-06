// src/modules/users/user.service.ts

import bcrypt from "bcryptjs";
import { ModuleName } from "@prisma/client";
import { userRepository } from "./user.repository";
import { TGetAllQuotationsQuery } from "../quotation/quotation.validation";

type PermissionInput = {
  module: ModuleName;
  canCreate?: boolean;
  canRead?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canDuplicate?: boolean;
};

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  permissions?: PermissionInput[];
};

type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  permissions?: PermissionInput[];
};

const normalizePermissions = (
  userId: string,
  permissions: PermissionInput[] = []
) => {
  return permissions.map((permission) => ({
    userId,
    module: permission.module,
    canCreate: permission.canCreate ?? false,
    canRead: permission.canRead ?? false,
    canUpdate: permission.canUpdate ?? false,
    canDelete: permission.canDelete ?? false,
    canDuplicate: permission.canDuplicate ?? false,
  }));
};

export const createUser = async (payload: CreateUserInput) => {
  const existingUser = await userRepository.findByEmail(payload.email);

  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = await userRepository.create({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
    isAdmin: payload.isAdmin ?? false,
    role: "EMPLOYEE",
    permissions: {
      create:
        payload.permissions?.map((permission) => ({
          module: permission.module,
          canCreate: permission.canCreate ?? false,
          canRead: permission.canRead ?? false,
          canUpdate: permission.canUpdate ?? false,
          canDelete: permission.canDelete ?? false,
          canDuplicate: permission.canDuplicate ?? false,
        })) ?? [],
    },
  });

  return user;
};

export const getAllUsers = async (query: TGetAllQuotationsQuery) => {
  return userRepository.findAll(query);
};

export const getUserById = async (id: string) => {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateUser = async (id: string, payload: UpdateUserInput) => {
  const existingUser = await userRepository.findRawById(id);

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (payload.email && payload.email !== existingUser.email) {
    const emailExists = await userRepository.findByEmail(payload.email);

    if (emailExists) {
      throw new Error("User already exists with this email");
    }
  }

  let hashedPassword: string | undefined;

  if (payload.password) {
    hashedPassword = await bcrypt.hash(payload.password, 10);
  }

  const user = await userRepository.transaction(async (tx) => {
    await userRepository.updateBasicUser(tx, id, {
      name: payload.name,
      email: payload.email,
      isAdmin: payload.isAdmin,
      isActive: payload.isActive,
      password: hashedPassword,
    });

    if (payload.permissions) {
      await userRepository.deletePermissionsByUserId(tx, id);

      const permissionData = normalizePermissions(id, payload.permissions);

      if (permissionData.length > 0) {
        await userRepository.createPermissions(tx, permissionData);
      }
    }

    return userRepository.findByIdWithTransaction(tx, id);
  });

  return user;
};

export const deleteUser = async (id: string) => {
  const user = await userRepository.findRawById(id);

  if (!user) {
    throw new Error("User not found");
  }

  await userRepository.deleteById(id);

  return null;
};