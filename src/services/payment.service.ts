import { PaymentRepository } from "../repositories/payment.repository";

export class PaymentService {
  private paymentRepository: PaymentRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
  }

  async getPaymentData(userId: number, startDate?: Date, endDate?: Date) {
    const stats = await this.paymentRepository.getPaymentStats(userId, startDate, endDate);

    return {
      totalPaid: stats.totalPaid,
      totalSavings: stats.totalSavings,
      totalPayments: stats.totalPayments,
      paymentRecords: stats.payments.map((payment) => ({
        id: payment.id,
        bookingId: payment.bookingId,
        amount: payment.amount,
        originalAmount: payment.originalAmount,
        savings: payment.savings,
        paymentMode: payment.paymentMode,
        status: payment.status,
        createdAt: payment.createdAt,
      })),
    };
  }
}

