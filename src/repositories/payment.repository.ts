import prisma from "../utils/prisma";

export class PaymentRepository {
  async findByUserId(userId: number) {
    return await prisma.payment.findMany({
      where: {
        userId: userId,
      },
      include: {
        booking: {
          include: {
            chargingStation: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getPaymentStats(userId: number, startDate?: Date, endDate?: Date) {
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const payments = await prisma.payment.findMany({
      where,
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalSavings = payments.reduce((sum, p) => sum + (p.savings || 0), 0);

    return {
      totalPaid,
      totalSavings,
      totalPayments: payments.length,
      payments,
    };
  }

  async getRevenueTrends(userId: number, startDate?: Date, endDate?: Date) {
    const where: any = { userId, status: "SUCCESS" };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by date
    const revenueByDate: Record<string, number> = {};
    
    payments.forEach((payment) => {
      const date = payment.createdAt.toISOString().split("T")[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + payment.amount;
    });

    return Object.entries(revenueByDate).map(([date, amount]) => ({
      date,
      amount,
    }));
  }

  async getPaymentsByMode(userId: number, startDate?: Date, endDate?: Date) {
    const where: any = { userId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const payments = await prisma.payment.findMany({ where });

    const byMode: Record<string, number> = {};
    payments.forEach((p) => {
      const mode = p.paymentMode || "UNKNOWN";
      byMode[mode] = (byMode[mode] || 0) + p.amount;
    });

    return Object.entries(byMode).map(([mode, amount]) => ({ mode, amount }));
  }
}

