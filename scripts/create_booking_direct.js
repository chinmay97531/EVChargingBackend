const { PrismaClient } = require('@prisma/client');
(async function(){
  const prisma = new PrismaClient();
  try{
    // find station with available slots
    let station = await prisma.chargingStation.findFirst({ where: { avaliableSlots: { gt: 0 } } });
    if(!station){
      station = await prisma.chargingStation.create({ data: { name: 'Dev Station Auto', capacity: 10, avaliableSlots: 5, solarCapacity: 0, status: true } });
      console.log('Created station', station.id);
    }
    // decrement slot and create booking in transaction
    const now = new Date();
    const endTime = new Date(now.getTime() + 60*60*1000);
    const booking = await prisma.$transaction(async (tx) => {
      await tx.chargingStation.update({ where: { id: station.id }, data: { avaliableSlots: { decrement: 1 } } });
      const b = await tx.booking.create({ data: { userId: 1, chargingStationId: station.id, startTime: now, endTime: endTime, slotNumber: Math.floor(Math.random()*1000), typeOfCharging: 'DYNAMIC', isOccupied: now, status: 'CONFIRMED' } });
      return b;
    });
    console.log('Created booking:', booking.id);
  } catch(e){
    console.error('Error:', e);
    process.exit(1);
  } finally{
    await prisma.$disconnect();
  }
})();
