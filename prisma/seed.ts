import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 5);

  const user1 = await prisma.user.upsert({
    where: { email: "user1@example.com" },
    update: {},
    create: {
      username: "John Doe",
      email: "user1@example.com",
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "user2@example.com" },
    update: {},
    create: {
      username: "Jane Smith",
      email: "user2@example.com",
      password: hashedPassword,
    },
  });

  console.log("Created users:", { user1: user1.id, user2: user2.id });

  // Create cars
  const car1 = await prisma.car.create({
    data: {
      userId: user1.id,
      name: "Tesla Model 3",
      model: "2023",
      number: "TSLA-001",
      currentBatteryHealth: 95.5,
      capacityOfBattery: 75.0,
      currentBatteryStatus: 45.0,
      typeOfPort: "CCS",
      fastSupporting: true,
    },
  });

  const car2 = await prisma.car.create({
    data: {
      userId: user1.id,
      name: "Nissan Leaf",
      model: "2022",
      number: "NISS-002",
      currentBatteryHealth: 88.0,
      capacityOfBattery: 40.0,
      currentBatteryStatus: 60.0,
      typeOfPort: "CHAdeMO",
      fastSupporting: false,
    },
  });

  console.log("Created cars:", { car1: car1.id, car2: car2.id });

  // Create battery history
  const now = new Date();
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  for (const date of dates) {
    // Car 1 battery history
    await prisma.batteryHistory.create({
      data: {
        carId: car1.id,
        soc: 40 + Math.random() * 20, // Random SOC between 40-60%
        soh: 95 + Math.random() * 1, // Random SOH between 95-96%
        timestamp: date,
      },
    });

    // Car 2 battery history
    await prisma.batteryHistory.create({
      data: {
        carId: car2.id,
        soc: 55 + Math.random() * 15, // Random SOC between 55-70%
        soh: 87 + Math.random() * 2, // Random SOH between 87-89%
        timestamp: date,
      },
    });
  }

  console.log("Created battery history records");

  // Create charging stations
  const station1 = await prisma.chargingStation.create({
    data: {
      name: "EV Station Downtown",
      capacity: 10,
      solarCapacity: 50.0,
      avaliableSlots: 7,
    },
  });

  const station2 = await prisma.chargingStation.create({
    data: {
      name: "EV Station Mall",
      capacity: 8,
      solarCapacity: 40.0,
      avaliableSlots: 5,
    },
  });

  console.log("Created charging stations:", { station1: station1.id, station2: station2.id });

  // Create bookings
  const booking1 = await prisma.booking.create({
    data: {
      userId: user1.id,
      chargingStationId: station1.id,
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
      slotNumber: 1,
      typeOfCharging: "FAST",
      isOccupied: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      userId: user1.id,
      chargingStationId: station2.id,
      startTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      endTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
      slotNumber: 2,
      typeOfCharging: "SLOW",
      isOccupied: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      userId: user1.id,
      chargingStationId: station1.id,
      startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // 1.5 hours later
      slotNumber: 3,
      typeOfCharging: "DYNAMIC",
      isOccupied: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
    },
  });

  console.log("Created bookings:", { booking1: booking1.id, booking2: booking2.id, booking3: booking3.id });

  // Create payments
  const payment1 = await prisma.payment.create({
    data: {
      userId: user1.id,
      bookingId: booking1.id,
      amount: 450.0,
      originalAmount: 500.0,
      savings: 50.0,
      paymentMode: "UPI",
      status: "SUCCESS",
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      userId: user1.id,
      bookingId: booking2.id,
      amount: 300.0,
      originalAmount: 350.0,
      savings: 50.0,
      paymentMode: "CREDIT_CARD",
      status: "SUCCESS",
    },
  });

  const payment3 = await prisma.payment.create({
    data: {
      userId: user1.id,
      bookingId: booking3.id,
      amount: 250.0,
      originalAmount: 280.0,
      savings: 30.0,
      paymentMode: "WALLET",
      status: "SUCCESS",
    },
  });

  console.log("Created payments:", { payment1: payment1.id, payment2: payment2.id, payment3: payment3.id });

  // Create energy usage records
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));

    await prisma.energyUsage.create({
      data: {
        chargingStationId: station1.id,
        update5Min: date,
        gridElectricityUsed: 10 + Math.random() * 20,
        fastChargingPrice: 8.5,
        slowChargingPrice: 6.0,
      },
    });

    await prisma.solarUsage.create({
      data: {
        chargingStationId: station1.id,
        update5Min: date,
        currentSolarPower: 20 + Math.random() * 15,
        fastChargingPrice: 7.0,
        slowChargingPrice: 5.0,
        solarChargingPrice: 4.5,
      },
    });

    await prisma.energyUsage.create({
      data: {
        chargingStationId: station2.id,
        update5Min: date,
        gridElectricityUsed: 8 + Math.random() * 15,
        fastChargingPrice: 8.5,
        slowChargingPrice: 6.0,
      },
    });

    await prisma.solarUsage.create({
      data: {
        chargingStationId: station2.id,
        update5Min: date,
        currentSolarPower: 15 + Math.random() * 10,
        fastChargingPrice: 7.0,
        slowChargingPrice: 5.0,
        solarChargingPrice: 4.5,
      },
    });
  }

  console.log("Created energy usage records");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

