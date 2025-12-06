import { z } from "zod";

export const getPaymentDataSchema = z.object({
  userId: z.string().optional(),
});

export type GetPaymentDataDto = z.infer<typeof getPaymentDataSchema>;

