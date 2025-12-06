import prisma from "../utils/prisma";
import { NotFoundError } from "../utils/errors";

export class CarRepository {
  async findById(carId: number, userId: number) {
    const car = await prisma.car.findFirst({
      where: {
        id: carId,
        userId: userId,
      },
      include: {
        batteryHistory: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
    });

    if (!car) {
      throw new NotFoundError("Car not found");
    }

    return car;
  }

  async findByUserId(userId: number) {
    return await prisma.car.findMany({
      where: {
        userId: userId,
      },
      include: {
        batteryHistory: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
    });
  }

  async deleteById(carId: number, userId: number) {
    const car = await prisma.car.findFirst({
      where: {
        id: carId,
        userId: userId,
      },
    });

    if (!car) {
      throw new NotFoundError("Car not found");
    }

    await prisma.car.delete({
      where: {
        id: carId,
      },
    });

    return { message: "Car deleted successfully" };
  }

  async createBatteryHistory(carId: number, soc: number, soh: number) {
    return await prisma.batteryHistory.create({
      data: {
        carId,
        soc,
        soh,
      },
    });
  }

  async getBatteryHistory(carId: number, startDate?: Date, endDate?: Date) {
    const where: any = { carId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    return await prisma.batteryHistory.findMany({
      where,
      orderBy: {
        timestamp: "asc",
      },
    });
  }
}

