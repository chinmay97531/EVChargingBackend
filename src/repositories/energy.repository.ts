import prisma from "../utils/prisma";

export class EnergyRepository {
  async getEnergyConsumption(userId: number, startDate?: Date, endDate?: Date) {
    // Get user's bookings to find associated charging stations
    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        ...(startDate || endDate
          ? {
              startTime: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        chargingStation: {
          include: {
            energyUsage: {
              where: {
                ...(startDate || endDate
                  ? {
                      update5Min: {
                        ...(startDate ? { gte: startDate } : {}),
                        ...(endDate ? { lte: endDate } : {}),
                      },
                    }
                  : {}),
              },
              orderBy: {
                update5Min: "asc",
              },
            },
            solarUsage: {
              where: {
                ...(startDate || endDate
                  ? {
                      update5Min: {
                        ...(startDate ? { gte: startDate } : {}),
                        ...(endDate ? { lte: endDate } : {}),
                      },
                    }
                  : {}),
              },
              orderBy: {
                update5Min: "asc",
              },
            },
          },
        },
      },
    });

    // Aggregate energy consumption by date
    const energyByDate: Record<string, { grid: number; solar: number }> = {};

    bookings.forEach((booking) => {
      const station = booking.chargingStation;
      
      station.energyUsage.forEach((usage) => {
        const date = usage.update5Min.toISOString().split("T")[0];
        if (!energyByDate[date]) {
          energyByDate[date] = { grid: 0, solar: 0 };
        }
        energyByDate[date].grid += usage.gridElectricityUsed;
      });

      station.solarUsage.forEach((usage) => {
        const date = usage.update5Min.toISOString().split("T")[0];
        if (!energyByDate[date]) {
          energyByDate[date] = { grid: 0, solar: 0 };
        }
        energyByDate[date].solar += usage.currentSolarPower;
      });
    });

    return Object.entries(energyByDate).map(([date, energy]) => ({
      date,
      gridElectricity: energy.grid,
      solarPower: energy.solar,
      total: energy.grid + energy.solar,
    }));
  }
}

