import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create users
  const hashedPassword = await bcrypt.hash("password123", 5);
  const hashedTestPassword = await bcrypt.hash("Testing1233", 5);

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

  const chinmayUser = await prisma.user.upsert({
    where: { email: "chinmaymittal0000@gmail.com" },
    update: {},
    create: {
      username: "Chinmay Mittal",
      email: "chinmaymittal0000@gmail.com",
      password: hashedTestPassword,
    },
  });

  console.log("Created users:", { user1: user1.id, user2: user2.id, chinmayUser: chinmayUser.id });

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

  const car3 = await prisma.car.create({
    data: {
      userId: chinmayUser.id,
      name: "Tesla Model S",
      model: "2024",
      number: "TSLA-003",
      currentBatteryHealth: 98.0,
      capacityOfBattery: 100.0,
      currentBatteryStatus: 80.0,
      typeOfPort: "CCS",
      fastSupporting: true,
    },
  });

  const car4 = await prisma.car.create({
    data: {
      userId: chinmayUser.id,
      name: "BMW i3",
      model: "2023",
      number: "BMW-004",
      currentBatteryHealth: 92.0,
      capacityOfBattery: 42.0,
      currentBatteryStatus: 55.0,
      typeOfPort: "Type 2",
      fastSupporting: true,
    },
  });

  const car5 = await prisma.car.create({
    data: {
      userId: chinmayUser.id,
      name: "BMW iX",
      model: "2024",
      number: "BMW-005",
      currentBatteryHealth: 96.0,
      capacityOfBattery: 76.6,
      currentBatteryStatus: 70.0,
      typeOfPort: "CCS",
      fastSupporting: true,
    },
  });

  const car6 = await prisma.car.create({
    data: {
      userId: chinmayUser.id,
      name: "Mahindra e2o Plus",
      model: "2023",
      number: "MAH-006",
      currentBatteryHealth: 89.0,
      capacityOfBattery: 16.0,
      currentBatteryStatus: 45.0,
      typeOfPort: "Type 2",
      fastSupporting: false,
    },
  });

  console.log("Created cars:", { car1: car1.id, car2: car2.id, car3: car3.id, car4: car4.id, car5: car5.id, car6: car6.id });

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

    // Car 3 battery history (Chinmay's Tesla)
    await prisma.batteryHistory.create({
      data: {
        carId: car3.id,
        soc: 70 + Math.random() * 20, // Random SOC between 70-90%
        soh: 97 + Math.random() * 2, // Random SOH between 97-99%
        timestamp: date,
      },
    });

    // Car 4 battery history (Chinmay's BMW i3)
    await prisma.batteryHistory.create({
      data: {
        carId: car4.id,
        soc: 45 + Math.random() * 25, // Random SOC between 45-70%
        soh: 91 + Math.random() * 2, // Random SOH between 91-93%
        timestamp: date,
      },
    });

    // Car 5 battery history (Chinmay's BMW iX)
    await prisma.batteryHistory.create({
      data: {
        carId: car5.id,
        soc: 60 + Math.random() * 25, // Random SOC between 60-85%
        soh: 95 + Math.random() * 2, // Random SOH between 95-97%
        timestamp: date,
      },
    });

    // Car 6 battery history (Chinmay's Mahindra)
    await prisma.batteryHistory.create({
      data: {
        carId: car6.id,
        soc: 35 + Math.random() * 30, // Random SOC between 35-65%
        soh: 88 + Math.random() * 3, // Random SOH between 88-91%
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

  const booking4 = await prisma.booking.create({
    data: {
      userId: chinmayUser.id,
      chargingStationId: station1.id,
      startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      endTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000), // 2.5 hours later
      slotNumber: 4,
      typeOfCharging: "FAST",
      isOccupied: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
    },
  });

  const booking5 = await prisma.booking.create({
    data: {
      userId: chinmayUser.id,
      chargingStationId: station2.id,
      startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 1 hour later
      slotNumber: 1,
      typeOfCharging: "SLOW",
      isOccupied: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
    },
  });

  const booking6 = await prisma.booking.create({
    data: {
      userId: chinmayUser.id,
      chargingStationId: station1.id,
      startTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      endTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
      slotNumber: 2,
      typeOfCharging: "DYNAMIC",
      isOccupied: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
    },
  });

  console.log("Created bookings:", { booking1: booking1.id, booking2: booking2.id, booking3: booking3.id, booking4: booking4.id, booking5: booking5.id, booking6: booking6.id });

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

  const payment4 = await prisma.payment.create({
    data: {
      userId: chinmayUser.id,
      bookingId: booking4.id,
      amount: 520.0,
      originalAmount: 550.0,
      savings: 30.0,
      paymentMode: "UPI",
      status: "SUCCESS",
    },
  });

  const payment5 = await prisma.payment.create({
    data: {
      userId: chinmayUser.id,
      bookingId: booking5.id,
      amount: 180.0,
      originalAmount: 200.0,
      savings: 20.0,
      paymentMode: "CREDIT_CARD",
      status: "SUCCESS",
    },
  });

  const payment6 = await prisma.payment.create({
    data: {
      userId: chinmayUser.id,
      bookingId: booking6.id,
      amount: 480.0,
      originalAmount: 520.0,
      savings: 40.0,
      paymentMode: "NET_BANKING",
      status: "SUCCESS",
    },
  });

  console.log("Created payments:", { payment1: payment1.id, payment2: payment2.id, payment3: payment3.id, payment4: payment4.id, payment5: payment5.id, payment6: payment6.id });

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

