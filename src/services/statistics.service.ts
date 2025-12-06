import { CarRepository } from "../repositories/car.repository";
import { PaymentRepository } from "../repositories/payment.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { EnergyRepository } from "../repositories/energy.repository";

export class StatisticsService {
  private carRepository: CarRepository;
  private paymentRepository: PaymentRepository;
  private bookingRepository: BookingRepository;
  private energyRepository: EnergyRepository;

  constructor() {
    this.carRepository = new CarRepository();
    this.paymentRepository = new PaymentRepository();
    this.bookingRepository = new BookingRepository();
    this.energyRepository = new EnergyRepository();
  }

  // Public wrappers for granular stats endpoints
  async getSessionsOverTime(userId: number, startDate?: Date, endDate?: Date) {
    return await this.bookingRepository.getChargingSessionsOverTime(userId, startDate, endDate);
  }

  async getRevenueTrends(userId: number, startDate?: Date, endDate?: Date) {
    return await this.paymentRepository.getRevenueTrends(userId, startDate, endDate);
  }

  async getEnergyConsumption(userId: number, startDate?: Date, endDate?: Date) {
    return await this.energyRepository.getEnergyConsumption(userId, startDate, endDate);
  }

  // expose SoC trends publicly for the stats endpoints
  async getSoCTrends(carId: number, startDate?: Date, endDate?: Date) {
    return await this.getSoCTrendsInternal(carId, startDate, endDate);
  }

  async getPaymentsByMode(userId: number, startDate?: Date, endDate?: Date) {
    // implemented in payment repository
    // returns array of { mode, amount }
    // fallback to computing from payments list if repo method not present
    // We'll call repository method if available
    // @ts-ignore
    if (typeof this.paymentRepository.getPaymentsByMode === "function") {
      // @ts-ignore
      return await this.paymentRepository.getPaymentsByMode(userId, startDate, endDate);
    }

    const stats = await this.paymentRepository.getPaymentStats(userId, startDate, endDate);
    const byMode: Record<string, number> = {};
    (stats.payments || []).forEach((p: any) => {
      const mode = (p.paymentMode || "UNKNOWN") as string;
      byMode[mode] = (byMode[mode] || 0) + p.amount;
    });
    return Object.entries(byMode).map(([mode, amount]) => ({ mode, amount }));
  }

  async getStatistics(userId: number, carId?: number, startDate?: Date, endDate?: Date) {
    // Numerical Statistics
    const paymentStats = await this.paymentRepository.getPaymentStats(userId, startDate, endDate);
    const sessions = await this.bookingRepository.getChargingSessions(userId, startDate, endDate);
    const completedSessions = sessions.filter((s) => s.status === "COMPLETED").length;

    const numericalStats = {
      totalChargingSessions: sessions.length,
      completedSessions,
      cancelledSessions: sessions.filter((s) => s.status === "CANCELLED").length,
      totalAmountPaid: paymentStats.totalPaid,
      totalSavings: paymentStats.totalSavings,
      averageSessionDuration: this.calculateAverageSessionDuration(sessions),
      totalEnergyConsumed: await this.calculateTotalEnergyConsumed(userId, startDate, endDate),
    };

    // Graphical Statistics - Format for Chart.js/Recharts
    const targetCarId = carId || (await this.getFirstCarId(userId));

    const socTrends = targetCarId
      ? await this.getSoCTrends(targetCarId, startDate, endDate)
      : [];

    const chargingSessionsOverTime = await this.bookingRepository.getChargingSessionsOverTime(
      userId,
      startDate,
      endDate
    );

    const revenueTrends = await this.paymentRepository.getRevenueTrends(
      userId,
      startDate,
      endDate
    );

    const energyConsumption = await this.energyRepository.getEnergyConsumption(
      userId,
      startDate,
      endDate
    );

    return {
      numerical: numericalStats,
      graphical: {
        socTrends: {
          labels: socTrends.map((item) => item.date),
          datasets: [
            {
              label: "State of Charge (%)",
              data: socTrends.map((item) => item.soc),
            },
          ],
        },
        chargingSessionsOverTime: {
          labels: chargingSessionsOverTime.map((item) => item.date),
          datasets: [
            {
              label: "Charging Sessions",
              data: chargingSessionsOverTime.map((item) => item.count),
            },
          ],
        },
        revenueTrends: {
          labels: revenueTrends.map((item) => item.date),
          datasets: [
            {
              label: "Revenue (₹)",
              data: revenueTrends.map((item) => item.amount),
            },
          ],
        },
        energyConsumption: {
          labels: energyConsumption.map((item) => item.date),
          datasets: [
            {
              label: "Grid Electricity (kWh)",
              data: energyConsumption.map((item) => item.gridElectricity),
            },
            {
              label: "Solar Power (kWh)",
              data: energyConsumption.map((item) => item.solarPower),
            },
            {
              label: "Total Energy (kWh)",
              data: energyConsumption.map((item) => item.total),
            },
          ],
        },
      },
    };
  }

  private async getSoCTrendsInternal(carId: number, startDate?: Date, endDate?: Date) {
    const history = await this.carRepository.getBatteryHistory(carId, startDate, endDate);

    // Group by date
    const socByDate: Record<string, number[]> = {};

    history.forEach((record) => {
      const date = record.timestamp.toISOString().split("T")[0];
      if (!socByDate[date]) {
        socByDate[date] = [];
      }
      socByDate[date].push(record.soc);
    });

    // Average SOC per date
    return Object.entries(socByDate).map(([date, socs]) => ({
      date,
      soc: socs.reduce((sum, val) => sum + val, 0) / socs.length,
    }));
  }

  private calculateAverageSessionDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      return sum + duration;
    }, 0);

    return totalDuration / sessions.length / (1000 * 60); // Convert to minutes
  }

  private async calculateTotalEnergyConsumed(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const consumption = await this.energyRepository.getEnergyConsumption(
      userId,
      startDate,
      endDate
    );

    return consumption.reduce((sum, item) => sum + item.total, 0);
  }

  private async getFirstCarId(userId: number): Promise<number | undefined> {
    const cars = await this.carRepository.findByUserId(userId);
    return cars[0]?.id;
  }
}

