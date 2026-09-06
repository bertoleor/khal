import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .min(6, "Invalid phone")
  .max(24, "Invalid phone")
  .regex(/^\+?[0-9\s-]+$/, "Invalid phone format");

export const emailSchema = z.string().trim().email().max(320);