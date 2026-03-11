import { z } from "zod";

export const competitionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  date: z.string().refine(
    (val) => {
      const d = new Date(val + "T00:00:00");
      return !isNaN(d.getTime()) && d >= new Date(new Date().toISOString().split("T")[0] + "T00:00:00");
    },
    { message: "Date must be today or in the future" }
  ),
  location: z.string().min(1, "Location is required"),
  organizerName: z.string().min(1, "Organizer name is required"),
  optionalCategories: z.array(z.string().min(1).max(50)).max(3).default([]),
});

export const competitorSchema = z.object({
  teamName: z.string().min(1, "Team name is required"),
  anonymousNumber: z
    .string()
    .regex(/^\d{1,4}$/, "Must be 1–4 digits"),
  headCookName: z.string().optional(),
  headCookKcbsNumber: z.string().optional(),
});

export const tableAssignmentSchema = z.object({
  cbjNumber: z.string().min(1, "CBJ number is required"),
  isCaptain: z.boolean().default(false),
});

export type CompetitionSchemaType = z.input<typeof competitionSchema>;
export type CompetitorSchemaType = z.infer<typeof competitorSchema>;
export type TableAssignmentSchemaType = z.output<typeof tableAssignmentSchema>;

export const assignJudgeTableSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  tableNumber: z.coerce.number().int().min(1, "Table number must be at least 1"),
});

export type AssignJudgeTableSchemaType = z.infer<typeof assignJudgeTableSchema>;
