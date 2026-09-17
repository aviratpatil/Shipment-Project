import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Must be a valid email address"),
  company: z.string().min(1, "Company name is required"),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerIdParamSchema = z.object({
  id: z.string().uuid("Customer ID must be a valid UUID"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
