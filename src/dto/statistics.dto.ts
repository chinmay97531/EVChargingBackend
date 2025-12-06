import { z } from "zod";

export const getStatisticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  carId: z.string().optional(),
});

export type GetStatisticsDto = z.infer<typeof getStatisticsSchema>;

