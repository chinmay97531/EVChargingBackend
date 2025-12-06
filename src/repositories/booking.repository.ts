import prisma from "../utils/prisma";

export class BookingRepository {
  async getChargingSessions(userId: number, startDate?: Date, endDate?: Date) {
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    return await prisma.booking.findMany({
      where,
      include: {
        chargingStation: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });
  }

  async getChargingSessionsOverTime(userId: number, startDate?: Date, endDate?: Date) {
    const sessions = await this.getChargingSessions(userId, startDate, endDate);

    // Group by date
    const sessionsByDate: Record<string, number> = {};
    
    sessions.forEach((session) => {
      const date = session.startTime.toISOString().split("T")[0];
      sessionsByDate[date] = (sessionsByDate[date] || 0) + 1;
    });

    return Object.entries(sessionsByDate).map(([date, count]) => ({
      date,
      count,
    }));
  }
}

