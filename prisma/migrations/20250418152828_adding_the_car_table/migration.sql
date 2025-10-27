/*
  Warnings:

  - You are about to drop the column `carDetails` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "carDetails";

-- CreateTable
CREATE TABLE "Car" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "currentBatteryHealth" DOUBLE PRECISION NOT NULL,
    "capacityOfBattery" DOUBLE PRECISION NOT NULL,
    "currentBatteryStatus" DOUBLE PRECISION NOT NULL,
    "typeOfPort" TEXT NOT NULL,
    "fastSupporting" BOOLEAN NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
