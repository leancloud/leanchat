import { z } from 'zod';

export const ObjectIdSchema = z
  .string()
  .length(24)
  .regex(/^[0-9A-Fa-f]+$/);

export const BooleanStringSchema = z.string().transform((s) => {
  if (s === '0' || s === 'false') {
    return false;
  }
  return true;
});

export const IntStringSchema = z
  .string()
  .regex(/^\d+$/)
  .transform((s) => parseInt(s));

export const DateStringSchema = z
  .string()
  .transform((s) => new Date(s))
  .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date string' });
