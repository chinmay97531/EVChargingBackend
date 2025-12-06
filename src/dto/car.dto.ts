import { z } from "zod";

export const deleteCarSchema = z.object({
  carId: z.string().min(1, "Car ID is required"),
});

export type DeleteCarDto = z.infer<typeof deleteCarSchema>;

