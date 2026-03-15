import { z } from 'zod';

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .optional(),

  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-()]{7,15}$/, 'Please provide a valid phone number')
    .optional()
    .nullable(),

  // Patient-specific
  patientProfile: z
    .object({
      dateOfBirth: z.string().datetime().optional().nullable(),
      bloodGroup: z
        .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .optional()
        .nullable(),
      allergies: z.array(z.string().trim().max(100)).max(50).optional(),
      emergencyContact: z
        .object({
          name: z.string().trim().min(2).max(100),
          phone: z
            .string()
            .trim()
            .regex(/^\+?[\d\s\-()]{7,15}$/, 'Invalid phone number'),
          relation: z.string().trim().min(2).max(50),
        })
        .optional()
        .nullable(),
    })
    .optional(),

  // Doctor-specific
  doctorProfile: z
    .object({
      specialization: z.string().trim().min(2).max(100).optional(),
      qualifications: z.array(z.string().trim().max(200)).max(20).optional(),
      consultationFee: z.number().min(0).optional(),
      experienceYears: z.number().min(0).max(60).optional(),
      bio: z.string().trim().max(1000).optional().nullable(),
      licenseNumber: z.string().trim().max(100).optional().nullable(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ─── List Doctors Query ───────────────────────────────────────────────────────

export const listDoctorsQuerySchema = z.object({
  specialization: z.string().trim().optional(),
  minFee: z.coerce.number().min(0).optional(),
  maxFee: z.coerce.number().min(0).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(['consultationFee', 'experienceYears', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;