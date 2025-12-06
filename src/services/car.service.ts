import { CarRepository } from "../repositories/car.repository";
import { NotFoundError } from "../utils/errors";

export class CarService {
  private carRepository: CarRepository;

  constructor() {
    this.carRepository = new CarRepository();
  }

  async deleteCar(carId: number, userId: number) {
    return await this.carRepository.deleteById(carId, userId);
  }
}

