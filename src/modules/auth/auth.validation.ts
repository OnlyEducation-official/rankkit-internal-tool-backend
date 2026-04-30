import {z} from "zod";


export const loginSchema = z.object({
    email: z.email("Valid email is required"),
    password: z.string().min(6,"Password must be atleast 6 characters."),
})