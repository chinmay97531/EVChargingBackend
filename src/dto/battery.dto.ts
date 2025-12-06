import { z } from "zod";

export const getBatteryStatusSchema = z.object({
  carId: z.string().optional(),
});

export type GetBatteryStatusDto = z.infer<typeof getBatteryStatusSchema>;

