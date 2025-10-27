/*
  Warnings:

  - You are about to drop the column `parkingSlotId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailiable` on the `ChargingStation` table. All the data in the column will be lost.
  - You are about to drop the column `stationId` on the `ChargingStation` table. All the data in the column will be lost.
  - You are about to drop the column `energyConsumed` on the `EnergyUsage` table. All the data in the column will be lost.
  - You are about to drop the column `energyGenerated` on the `EnergyUsage` table. All the data in the column will be lost.
  - You are about to drop the column `panelId` on the `EnergyUsage` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `EnergyUsage` table. All the data in the column will be lost.
  - You are about to drop the `ParkingSlot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SolarPanel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `isOccupied` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slotNumber` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avaliableSlots` to the `ChargingStation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capacity` to the `ChargingStation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ChargingStation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `solarCapacity` to the `ChargingStation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chargingStationId` to the `EnergyUsage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fastChargingPrice` to the `EnergyUsage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gridElectricityUsed` to the `EnergyUsage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slowChargingPrice` to the `EnergyUsage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChargingType" AS ENUM ('SLOW', 'FAST', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "PaymnetType" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET', 'CASH');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_parkingSlotId_fkey";

-- DropForeignKey
ALTER TABLE "EnergyUsage" DROP CONSTRAINT "EnergyUsage_panelId_fkey";

-- DropIndex
DROP INDEX "ChargingStation_stationId_key";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "parkingSlotId",
ADD COLUMN     "isOccupied" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "slotNumber" INTEGER NOT NULL,
ADD COLUMN     "typeOfCharging" "ChargingType" NOT NULL DEFAULT 'DYNAMIC';

-- AlterTable
ALTER TABLE "ChargingStation" DROP COLUMN "isAvailiable",
DROP COLUMN "stationId",
ADD COLUMN     "avaliableSlots" INTEGER NOT NULL,
ADD COLUMN     "capacity" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "solarCapacity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "EnergyUsage" DROP COLUMN "energyConsumed",
DROP COLUMN "energyGenerated",
DROP COLUMN "panelId",
DROP COLUMN "timestamp",
ADD COLUMN     "chargingStationId" INTEGER NOT NULL,
ADD COLUMN     "fastChargingPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "gridElectricityUsed" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "slowChargingPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "update5Min" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentMode" "PaymnetType" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "remarks" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "carDetails" TEXT[],
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "ParkingSlot";

-- DropTable
DROP TABLE "SolarPanel";

-- CreateTable
CREATE TABLE "SolarUsage" (
    "id" SERIAL NOT NULL,
    "chargingStationId" INTEGER NOT NULL,
    "update5Min" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentSolarPower" DOUBLE PRECISION NOT NULL,
    "fastChargingPrice" DOUBLE PRECISION NOT NULL,
    "slowChargingPrice" DOUBLE PRECISION NOT NULL,
    "solarChargingPrice" DOUBLE PRECISION NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,

    CONSTRAINT "SolarUsage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EnergyUsage" ADD CONSTRAINT "EnergyUsage_chargingStationId_fkey" FOREIGN KEY ("chargingStationId") REFERENCES "ChargingStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarUsage" ADD CONSTRAINT "SolarUsage_chargingStationId_fkey" FOREIGN KEY ("chargingStationId") REFERENCES "ChargingStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
