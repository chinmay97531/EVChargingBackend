import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { PaymentService } from "../services/payment.service";
import { sendSuccess, sendError } from "../utils/response";

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  getPaymentData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.userId!);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const paymentData = await this.paymentService.getPaymentData(userId, startDate, endDate);

      sendSuccess(res, paymentData, "Payment data retrieved successfully");
    } catch (error) {
      sendError(res, "Failed to retrieve payment data", 500, error);
    }
  };
}

