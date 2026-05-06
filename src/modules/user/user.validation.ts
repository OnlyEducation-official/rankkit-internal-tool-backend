import { z } from "zod";

const permissionSchema = z.object({
  module: z.enum(["QUOTATION", "STUDIO_BOOKING", "EMPLOYEE_MANAGEMENT"]),
  canCreate: z.boolean().optional(),
  canRead: z.boolean().optional(),
  canUpdate: z.boolean().optional(),
  canDelete: z.boolean().optional(),
  canDuplicate: z.boolean().optional(),
});

const hasAtLeastOnePermission = (
  permissions?: z.infer<typeof permissionSchema>[]
) => {
  if (!permissions || permissions.length === 0) return false;

  return permissions.some((permission) =>
    Boolean(
      permission.canCreate ||
      permission.canRead ||
      permission.canUpdate ||
      permission.canDelete ||
      permission.canDuplicate
    )
  );
};

export const createUserSchema = z.object({
  body: z.object({
    name: z.string(),
    email: z.string(),
    password: z.string(),
    permissions: z.array(permissionSchema),
  }),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      name: z.string().optional(),
      email: z.email("Valid email is required.").optional(),
      password: z.string().optional(),
      isActive: z.boolean().optional(),
      isAdmin: z.boolean().optional(),

      permissions: z.array(permissionSchema).optional(),
    })
    .refine(
      (data) => {
        if (!data.permissions) return true;
        return hasAtLeastOnePermission(data.permissions);
      },
      {
        message: "At least one permission must be selected.",
        path: ["permissions"],
      }
    ),
});