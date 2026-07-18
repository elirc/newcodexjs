import { z } from "zod";

export const optionSchema = z.object({
  id: z.number().optional(),
  label: z.string().min(1),
  sort_order: z.number().int().positive().optional()
});

export const surveySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  access_code: z.string().max(20).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  max_responses: z.number().int().positive().optional().nullable(),
  is_template: z.boolean().optional()
});

export const questionSchema = z.object({
  question_type: z.enum(["short_text", "long_text", "single_choice", "multi_choice", "rating", "yes_no", "number", "date", "matrix"]),
  title: z.string().min(1).max(500),
  description: z.string().optional().nullable(),
  is_required: z.boolean().default(false),
  sort_order: z.number().int().positive().optional(),
  config: z.record(z.unknown()).optional().nullable(),
  options: z.array(optionSchema).optional()
});

export const reorderSchema = z.object({
  questionIds: z.array(z.number().int().positive()).min(1)
});

export const responseSchema = z.object({
  accessCode: z.string().optional(),
  answers: z.record(z.string(), z.unknown())
});

