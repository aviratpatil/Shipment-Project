import { z } from "zod";

export const registerDriverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Must be a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(7, "Phone number must be at least 7 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  licenseNumber: z.string().min(4, "License number must be at least 4 characters"),
  photoUrl: z.string().url("Must be a valid URL").optional(),
});

export const updateDriverSchema = z.object({
  phone: z.string().min(7).optional(),
  address: z.string().min(5).optional(),
  licenseNumber: z.string().min(4).optional(),
  photoUrl: z.string().url().optional().nullable(),
  isOnDuty: z.boolean().optional(),
  isApproved: z.boolean().optional(),
});

export const driverIdParamSchema = z.object({
  id: z.string().uuid("Invalid driver ID"),
});

export type RegisterDriverInput = z.infer<typeof registerDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
