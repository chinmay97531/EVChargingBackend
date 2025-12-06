import prisma from "../src/utils/prisma";

async function main() {
  console.log("Seeding extra energy usage for station id 1...");
  const stationId = 1;
  const now = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);

    await prisma.energyUsage.create({
      data: {
        chargingStationId: stationId,
        update5Min: date,
        gridElectricityUsed: 5 + Math.random() * 10,
        fastChargingPrice: 8.0,
        slowChargingPrice: 6.0,
      },
    });

    await prisma.solarUsage.create({
      data: {
        chargingStationId: stationId,
        update5Min: date,
        currentSolarPower: 10 + Math.random() * 20,
        fastChargingPrice: 7.0,
        slowChargingPrice: 5.0,
        solarChargingPrice: 4.0,
      },
    });
  }

  console.log("Extra energy seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
