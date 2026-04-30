import {z} from "zod";


const permissionSchema = z.object({
    module: z.enum(["QUOTATION","STUDIO_BOOKING","EMPLOYEE_MANAGEMENT"]),
    canCreate: z.boolean().optional(),
    canRead: z.boolean().optional(),
    canUpdate: z.boolean().optional(),
    canDelete: z.boolean().optional(),
    canDuplicate: z.boolean().optional(),
})

export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required."),
    email: z.email("Valid email is required."),
    password: z.string().min(6, "Password must be atleast 6 characters."),
    role: z.enum(["SUPER_ADMIN","EMPLOYEE"]).default("EMPLOYEE"),
    permissions: z.array(permissionSchema).optional()
})

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "EMPLOYEE"]).optional(),
  isActive: z.boolean().optional(),

  permissions: z.array(
    z.object({
      module: z.enum(["QUOTATION", "STUDIO_BOOKING", "EMPLOYEE_MANAGEMENT"]),
      canCreate: z.boolean().optional(),
      canRead: z.boolean().optional(),
      canUpdate: z.boolean().optional(),
      canDelete: z.boolean().optional(),
      canDuplicate: z.boolean().optional(),
    })
  ).optional(),
});