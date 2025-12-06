import { CarRepository } from "../repositories/car.repository";
import { NotFoundError } from "../utils/errors";

export class BatteryService {
  private carRepository: CarRepository;

  constructor() {
    this.carRepository = new CarRepository();
  }

  async getBatteryStatus(userId: number, carId?: number) {
    let car;

    if (carId) {
      car = await this.carRepository.findById(carId, userId);
    } else {
      const cars = await this.carRepository.findByUserId(userId);
      if (cars.length === 0) {
        throw new NotFoundError("No cars found for this user");
      }
      car = cars[0]; // Get first car if no carId specified
    }

    const latestHistory = car.batteryHistory[0];

    return {
      carId: car.id,
      carName: car.name,
      carModel: car.model,
      soc: latestHistory?.soc ?? car.currentBatteryStatus,
      soh: latestHistory?.soh ?? car.currentBatteryHealth,
      timestamp: latestHistory?.timestamp ?? new Date(),
      date: latestHistory?.timestamp?.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0],
    };
  }
}

