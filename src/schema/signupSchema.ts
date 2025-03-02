import {z} from "zod";
import { emailSchema } from "./signInSchema";


export const signUpSchema = z.object({
    email: emailSchema,
    name: z.string(),
    provider: z.enum(["Credentials", "google"]).default("Credentials"),
    password: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.provider === "Credentials" && (!data.password || data.password.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required for credentials sign up",
        path: ["password"], // The field that caused the validation error
      });
    }
  });