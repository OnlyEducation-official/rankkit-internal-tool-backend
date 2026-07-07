// src/modules/users/user.repository.ts

import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "../../config/prisma";
import { TGetAllQuotationsQuery } from "../quotation/quotation.validation";

export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isAdmin: true,
  isActive: true,
  salary: true,
  designation: true,
  aadharCard: true,
  panCard: true,
  profilePicture: true,
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

export type UserSelect = typeof userSelect;

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  findRawById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async findAll(query: TGetAllQuotationsQuery) {

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 25;
    const search = query.search?.trim() || "";
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const allowedSortFields = [
      "name",
      "email",
    ] as const;

    const safeSortBy = allowedSortFields.includes(sortBy as any)
      ? sortBy
      : "createdAt";

    const skip = (page - 1) * limit;

    const where = search
      ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
      : {};

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [safeSortBy]: sortOrder,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.user.count({
        where,
      }),
    ]);


    // return prisma.user.findMany({
    //   orderBy: { createdAt: "desc" },
    // select: {
    //   id: true,
    //   name: true,
    //   email: true,
    //   createdAt: true,
    // },
    // });

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data,
    };

  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      select: userSelect,
    });
  },

  updateBasicUser(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.UserUpdateInput
  ) {
    return tx.user.update({
      where: { id },
      data,
    });
  },

  deletePermissionsByUserId(
    tx: Prisma.TransactionClient,
    userId: string
  ) {
    return tx.userModulePermission.deleteMany({
      where: { userId },
    });
  },

  createPermissions(
    tx: Prisma.TransactionClient,
    data: Prisma.UserModulePermissionCreateManyInput[]
  ) {
    return tx.userModulePermission.createMany({
      data,
    });
  },

  findByIdWithTransaction(
    tx: Prisma.TransactionClient,
    id: string
  ) {
    return tx.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ) {
    return prisma.$transaction(callback);
  },

  deleteById(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },
};