import { z } from "zod";

const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  username: z
    .string()
    .trim()
    .regex(
      usernameRegex,
      "Username must be 3-20 characters: letters, numbers, underscores."
    ),
  displayName: z.string().trim().min(1, "Display name is required.").max(60),
  password: z.string().min(8, "Password must be at least 8 characters."),
  isCreator: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const avatarCategories = [
  "Base Model",
  "Full Avatar",
  "Modification",
  "Accessory",
  "Texture",
] as const;

export const avatarPlatforms = ["PC", "Quest", "PC & Quest"] as const;

export const avatarCreateSchema = z.object({
  title: z.string().trim().min(3, "Title is too short.").max(80),
  description: z.string().trim().min(20, "Add a bit more description.").max(5000),
  priceCents: z
    .number()
    .int()
    .min(0, "Price cannot be negative.")
    .max(100000000, "Price is too high."),
  category: z.enum(avatarCategories),
  platform: z.enum(avatarPlatforms),
  tags: z.array(z.string().trim().min(1).max(24)).max(10),
  polycount: z.number().int().min(0).max(10000000).optional(),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  bio: z.string().trim().max(1000),
  socialLinks: z.object({
    twitter: z.string().trim().max(200).optional().or(z.literal("")),
    discord: z.string().trim().max(200).optional().or(z.literal("")),
    website: z.string().trim().max(200).optional().or(z.literal("")),
    vrchat: z.string().trim().max(200).optional().or(z.literal("")),
  }),
});

export const commissionCreateSchema = z
  .object({
    title: z.string().trim().min(5, "Give it a short title.").max(100),
    description: z
      .string()
      .trim()
      .min(30, "Describe what you're looking for in more detail.")
      .max(5000),
    avatarBase: z.string().trim().max(300).optional().or(z.literal("")),
    budgetMinCents: z.number().int().min(0),
    budgetMaxCents: z.number().int().min(0),
    deadline: z.string().optional().or(z.literal("")),
    creatorUsername: z.string().optional().or(z.literal("")),
    contactNote: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((data) => data.budgetMaxCents >= data.budgetMinCents, {
    message: "Max budget must be greater than or equal to min budget.",
    path: ["budgetMaxCents"],
  });
