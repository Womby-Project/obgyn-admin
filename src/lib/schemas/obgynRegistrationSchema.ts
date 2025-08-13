// C:\Users\markn\Desktop\dashboard-obgyn\frontend\src\lib\schemas\obgynRegistrationSchema.ts

import { z } from "zod";

export const obgynRegistrationSchema = z.object({
  // obgyn_users
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other"]).optional(), // adjust to your enum
  email: z.string().email("Invalid email"),
  prc_license_number: z.string().min(3, "PRC license number is required"),
  affiliated_hospitals_clinics: z.array(z.string()).optional(),
  prc_id_document_url: z.string().url().optional(),
  phone_number: z.string().optional(),
  birth_date: z.string().optional(),
  education: z.string().optional(),
  profile_picture_url: z.string().url().optional(),

  // password (not stored in obgyn_users, only for Auth)
  password: z.string().min(8, "Password min 8 chars")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character")
    .regex(/\d/, "Must contain a number")
    .refine(v => /[a-z]/.test(v) && /[A-Z]/.test(v), "Must combine lower & upper case"),

  // availability
  availability: z.array(z.object({
    day_of_week: z.string(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
  })).min(1, "At least one availability slot is required"),
});

export type ObgynRegistrationData = z.infer<typeof obgynRegistrationSchema>;

/** Step-level schemas (validate only the fields present in that step) */
export const basicInfoSchema = obgynRegistrationSchema.pick({
  first_name: true,
  last_name: true,
  gender: true,
  email: true,
});

export const passwordSchema = z.object({
  password: obgynRegistrationSchema.shape.password,
  confirmPassword: z.string(),
}).refine(
  (d) => d.password === d.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] }
);

export const professionalInfoSchema = obgynRegistrationSchema.pick({
  prc_license_number: true,
  affiliated_hospitals_clinics: true,
  prc_id_document_url: true,
  education: true,
});
