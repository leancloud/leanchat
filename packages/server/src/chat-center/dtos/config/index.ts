import { z } from 'zod';

export const GreetingMessageConfigSchema = z.object({
  enabled: z.boolean(),
  text: z.string(),
});

export const NoReadyOperatorMessageConfigSchema = z.object({
  text: z.string(),
});

export const AutoCloseConfigSchema = z.object({
  timeout: z.number().int().min(0),
  message: z.object({
    enabled: z.boolean(),
    text: z.string(),
  }),
});

export const QueueConfigSchema = z.object({
  capacity: z.number().int().min(0),
  fullMessage: z.object({
    text: z.string(),
  }),
  queuedMessage: z.object({
    text: z.string(),
  }),
});

const EvaluationTagConfigSchema = z.object({
  options: z.array(z.string()),
  required: z.boolean(),
});

export const EvaluationConfigSchema = z.object({
  tag: z.object({
    positive: EvaluationTagConfigSchema,
    negative: EvaluationTagConfigSchema,
  }),
  timeout: z.number().int().min(0).optional(),
});
