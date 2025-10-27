import { date, z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import express from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import axios from "axios";
import { JWT_SECRET } from "./config";
import { OPEN_CHARGE_MAPS_API_KEY } from "./config";
import { userMiddleware } from "./middleware";
import cors from "cors";

const app = express();
const client = new PrismaClient();

app.use(express.json());
app.use(cors());

app.post("/api/v1/signup", async (req, res) => {
  const requiredBody = z.object({
    username: z.string().min(2).max(50),
    email: z.string().min(5).max(50).email(),
    password: z.string().min(4).max(50),
  });

  const parsedData = requiredBody.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({
      message: "Data parsing in Signup failed",
    });
    return;
  }

  const { username, email, password } = parsedData.data!;

  try {
    const hashedPassword = await bcrypt.hash(password, 5);

    await client.user.create({
      data: {
        username: username,
        password: hashedPassword,
        email: email,
      },
    });

    res.status(200).json({
      message: "User created successfully",
    });
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});

//@ts-ignore
app.post("/api/v1/signin", async (req, res) => {
  const { email, password } = req.body;

  const user = await client.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    res.status(400).json({
      message: "User not found",
    });
    return;
  }

  const hashedPassword = user?.password;
  if (!hashedPassword) {
    res.status(400).json({
      message: "Password not found",
    });
    return;
  }
  const passwordMatch = await bcrypt.compare(password, user?.password);

  if (!passwordMatch) {
    res.status(400).json({
      message: "Password does not match",
    });
    return;
  }

  if (passwordMatch) {
    const token = jwt.sign(
      {
        id: user?.id.toString(),
      },
      JWT_SECRET,
      {}
    );

    res.json({ token });
  } else {
    res.json({
      message: "Incoorect Credentials",
    });
  }
});

//@ts-ignore
app.post("/api/v1/nearestEVStation", userMiddleware, async (req, res) => {
  try {
    const { lat, long } = req.body;
    if (!lat || !long) {
      res.status(400).json({
        message: "Lat or Long not provided",
      });
      return;
    }

    const apiKey = OPEN_CHARGE_MAPS_API_KEY;

    const response = await axios.get("https://api.openchargemap.io/v3/poi/", {
      params: {
        output: "json",
        latitude: lat,
        longitude: long,
        distance: 500,
        distanceunit: "KM",
        maxresults: 20,
        key: apiKey,
      },
    });

    const data = response.data;

    if (data.length === 0) {
      res.status(400).json({
        message: "No charging stations found nearby",
      });
      return;
    }

    const stations = data.map(
      (station: { AddressInfo?: any; Connections?: any[] }) => {
        const connections = station.Connections || [];

        const chargerTypeMap: Record<string, number> = {};
        var fastCharger: number = 0;
        var slowCharger: number = 0;
        connections.forEach(
          (connection: {
            Level?: { IsFastChargeCapable: boolean };
            ConnectionType?: { Title?: string };
          }) => {
            const type = connection.ConnectionType?.Title || "Unknown";
            chargerTypeMap[type] = (chargerTypeMap[type] || 0) + 1;

            const isFast = connection.Level?.IsFastChargeCapable;
            if (isFast) {
              fastCharger++;
            } else if (!isFast) {
              slowCharger++;
            }
          }
        );

        return {
          name: station.AddressInfo?.Title || "Unknown",
          geolocation: {
            latitude: station.AddressInfo?.Latitude,
            longitude: station.AddressInfo?.Longitude,
          },
          address: {
            line1: station.AddressInfo?.AddressLine1 || "",
            line2: station.AddressInfo?.AddressLine2 || "",
            town: station.AddressInfo?.Town || "",
            state: station.AddressInfo?.StateOrProvince || "",
            postcode: station.AddressInfo?.Postcode || "",
            country: station.AddressInfo?.Country?.Title || "",
            distance: station.AddressInfo?.Distance || 0,
          },
          typesOfChargers: Object.entries(chargerTypeMap).map(
            ([type, count]) => ({
              type,
              count,
            })
          ),
          FastChargers: fastCharger,
          SlowChargers: slowCharger,
        };
      }
    );

    res.status(200).json({
      message: "Charging stations fetched successfully",
      stations,
    });
  } catch (err) {
    res.status(400).json({
      message: "Error in fetching the charging stations",
    });
  }
});

//@ts-ignore
app.post("/api/v1/getStationDetails", userMiddleware, async (req, res) => {
  try {
    const apiKey = OPEN_CHARGE_MAPS_API_KEY;
    const { stationName } = req.body;

    if (!stationName) {
      return res.status(400).json({
        message: "Station name is required",
      });
    }

    const response = await axios.get("https://api.openchargemap.io/v3/poi/", {
      params: {
        output: "json",
        countrycode: "IN",
        maxresults: 10000000,
        key: apiKey,
      },
      headers: {
        "X-API-Key": apiKey,
      },
    });

    const data = response.data;

    const matches = data
      .filter((station: any) =>
        station.AddressInfo?.Title?.toLowerCase().includes(
          stationName.toLowerCase()
        )
      )
      .slice(0, 100);

    if (matches.length === 0) {
      return res.status(404).json({
        message: "No stations found with the given name",
      });
    }

    const stations = matches.map(
      (station: { AddressInfo?: any; Connections?: any[] }) => {
        const connections = station.Connections || [];

        const chargerTypeMap: Record<string, number> = {};
        var fastCharger: number = 0;
        var slowCharger: number = 0;
        connections.forEach(
          (connection: {
            Level?: { IsFastChargeCapable: boolean };
            ConnectionType?: { Title?: string };
          }) => {
            const type = connection.ConnectionType?.Title || "Unknown";
            chargerTypeMap[type] = (chargerTypeMap[type] || 0) + 1;

            const isFast = connection.Level?.IsFastChargeCapable;
            if (isFast) {
              fastCharger++;
            } else if (!isFast) {
              slowCharger++;
            }
          }
        );

        return {
          name: station.AddressInfo?.Title || "Unknown",
          geolocation: {
            latitude: station.AddressInfo?.Latitude,
            longitude: station.AddressInfo?.Longitude,
          },
          address: {
            line1: station.AddressInfo?.AddressLine1 || "",
            line2: station.AddressInfo?.AddressLine2 || "",
            town: station.AddressInfo?.Town || "",
            state: station.AddressInfo?.StateOrProvince || "",
            postcode: station.AddressInfo?.Postcode || "",
            country: station.AddressInfo?.Country?.Title || "",
            distance: station.AddressInfo?.Distance || 0,
          },
          typesOfChargers: Object.entries(chargerTypeMap).map(
            ([type, count]) => ({
              type,
              count,
            })
          ),
          FastChargers: fastCharger,
          SlowChargers: slowCharger,
        };
      }
    );

    res.status(200).json({
      message: "Charging stations fetched successfully",
      stations,
    });
  } catch (error) {
    console.error("Error fetching station:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

//@ts-ignore
app.post("/api/v1/getStationDetailsByPostCode", userMiddleware, async (req, res) => {
    try {
      //both string and number are accepting
      const { pinCode } = req.body;

      if (!pinCode) {
        return res.status(400).json({ message: "Postcode is required" });
      }

      const geoRes = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: pinCode,
            format: "json",
            limit: 1,
          },
        }
      );

      if (geoRes.data.length === 0) {
        return res.status(404).json({ message: "Invalid or unknown postcode" });
      }

      const lat = geoRes.data[0].lat;
      const long = geoRes.data[0].lon;

      const apiKey = OPEN_CHARGE_MAPS_API_KEY;

      const response = await axios.get("https://api.openchargemap.io/v3/poi/", {
        params: {
          output: "json",
          latitude: lat,
          longitude: long,
          distance: 500,
          distanceunit: "KM",
          maxresults: 20,
          key: apiKey,
        },
      });

      const data = response.data;

      if (data.length === 0) {
        res.status(400).json({
          message: "No charging stations found nearby",
        });
        return;
      }

      const stations = data.map(
        (station: { AddressInfo?: any; Connections?: any[] }) => {
          const connections = station.Connections || [];

          const chargerTypeMap: Record<string, number> = {};
          var fastCharger: number = 0;
          var slowCharger: number = 0;
          connections.forEach(
            (connection: {
              Level?: { IsFastChargeCapable: boolean };
              ConnectionType?: { Title?: string };
            }) => {
              const type = connection.ConnectionType?.Title || "Unknown";
              chargerTypeMap[type] = (chargerTypeMap[type] || 0) + 1;

              const isFast = connection.Level?.IsFastChargeCapable;
              if (isFast) {
                fastCharger++;
              } else if (!isFast) {
                slowCharger++;
              }
            }
          );

          return {
            name: station.AddressInfo?.Title || "Unknown",
            geolocation: {
              latitude: station.AddressInfo?.Latitude,
              longitude: station.AddressInfo?.Longitude,
            },
            address: {
              line1: station.AddressInfo?.AddressLine1 || "",
              line2: station.AddressInfo?.AddressLine2 || "",
              town: station.AddressInfo?.Town || "",
              state: station.AddressInfo?.StateOrProvince || "",
              postcode: station.AddressInfo?.Postcode || "",
              country: station.AddressInfo?.Country?.Title || "",
              distance: station.AddressInfo?.Distance || 0,
            },
            typesOfChargers: Object.entries(chargerTypeMap).map(
              ([type, count]) => ({
                type,
                count,
              })
            ),
            FastChargers: fastCharger,
            SlowChargers: slowCharger,
          };
        }
      );

      res.status(200).json({
        message: "Charging stations fetched successfully",
        stations,
      });
    } catch (error) {
      console.error("Error fetching station:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

//@ts-ignore
app.post("/api/v1/getStationDetailsByCity", userMiddleware, async (req, res) => {
    try {
      const apiKey = OPEN_CHARGE_MAPS_API_KEY;
      const { cityName } = req.body;

      if (!cityName) {
        return res.status(400).json({
          message: "provide the city name",
        });
      }
      //for different regoins provide country code

      const response = await axios.get("https://api.openchargemap.io/v3/poi/", {
        params: {
          output: "json",
          countrycode: "IN",
          maxresults: 100000000,
          key: apiKey,
        },
        headers: {
          "X-API-Key": apiKey,
        },
      });

      const data = response.data;

      const matches = data.filter((station: any) =>
        station.AddressInfo?.Town?.toLowerCase().includes(
          cityName.toLowerCase()
        )
      );

      if (matches.length === 0) {
        return res.status(404).json({
          message: "No stations found in the given City",
        });
      }

      const stations = matches.map(
        (station: { AddressInfo?: any; Connections?: any[] }) => {
          const connections = station.Connections || [];

          const chargerTypeMap: Record<string, number> = {};
          var fastCharger: number = 0;
          var slowCharger: number = 0;
          connections.forEach(
            (connection: {
              Level?: { IsFastChargeCapable: boolean };
              ConnectionType?: { Title?: string };
            }) => {
              const type = connection.ConnectionType?.Title || "Unknown";
              chargerTypeMap[type] = (chargerTypeMap[type] || 0) + 1;

              const isFast = connection.Level?.IsFastChargeCapable;
              if (isFast) {
                fastCharger++;
              } else if (!isFast) {
                slowCharger++;
              }
            }
          );

          return {
            name: station.AddressInfo?.Title || "Unknown",
            geolocation: {
              latitude: station.AddressInfo?.Latitude,
              longitude: station.AddressInfo?.Longitude,
            },
            address: {
              line1: station.AddressInfo?.AddressLine1 || "",
              line2: station.AddressInfo?.AddressLine2 || "",
              town: station.AddressInfo?.Town || "",
              state: station.AddressInfo?.StateOrProvince || "",
              postcode: station.AddressInfo?.Postcode || "",
              country: station.AddressInfo?.Country?.Title || "",
              distance: station.AddressInfo?.Distance || 0,
            },
            typesOfChargers: Object.entries(chargerTypeMap).map(
              ([type, count]) => ({
                type,
                count,
              })
            ),
            FastChargers: fastCharger,
            SlowChargers: slowCharger,
          };
        }
      );

      res.status(200).json({
        message: `Charging stations fetched successfully and number of Stations found are: ${matches.length}`,
        stations,
      });
    } catch (error) {
      console.error("Error fetching station:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);


//Update user Car details  (email, name and password already in table)
//@ts-ignore
app.post("/api/v1/insertCarData", userMiddleware, async (req, res) => {
  try {
    const {
      carName,
      carModel,
      carNumber,
      currentBattreyHealth,
      capacityOfBattrey,
      typeOfPort,
      FastAndSlow,
      currentBattreyStatus,
    } = req.body;

    if (
      !carName ||
      !carModel ||
      !carNumber ||
      !currentBattreyHealth ||
      !capacityOfBattrey ||
      !typeOfPort ||
      !FastAndSlow ||
      !currentBattreyStatus
    ) {
      res.status(400).json({
        message: "Car details are required",
      });
      return;
    }

    const car = await client.car.create({
      data: {
        //@ts-ignore
        userId: parseInt(req.userId),
        name: carName,
        model: carModel,
        number: carNumber,
        currentBatteryHealth: parseFloat(currentBattreyHealth),
        capacityOfBattery: parseFloat(capacityOfBattrey),
        typeOfPort: typeOfPort,
        fastSupporting: FastAndSlow.toLowerCase() == "fast",
        currentBatteryStatus: parseFloat(currentBattreyStatus),
      },
    });

    res.status(200).json({
      message: "Car details updated successfully",
      car,
    });
    
  } catch (err) {

    if (err instanceof Prisma.PrismaClientValidationError) {
      console.error("Validation Error Details:", err.message);
    }

    res.status(400).json({
      message: "Error in updating the car details",
      error: err,
    });
  }
});

//@ts-ignore
app.post("/api/v1/getCarDetails", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.userId;
    const car = await client.car.findMany({
      where: {
        userId: parseInt(userId),
      },
    });
    if (!car) {
      return res.status(404).json({
        message: "No car details found for this user",
      });
    }


    //send the details of each with number of cars user have
    res.status(200).json({
      message: "Car details fetched successfully",
      car,
    });


  } catch (err) {
    res.status(400).json({
      message: "Error in fetching the car details",
      error: err,
    });
  }
});

//@ts-ignore
app.post("/api/v1/getUserDetails", userMiddleware, async (req, res) => {
  try{
    //@ts-ignore
    const userId = req.userId;
    const user = await client.user.findUnique({
      where: {
        id: parseInt(userId),
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.status(200).json({
      message: "User details fetched successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({
      message: "Error in fetching the user details",
      error: err,
    });
  }
});

//@ts-ignore
app.post("/api/v1/updateUserName", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.userId;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        message: "Username is required",
      });
    }

    const user = await client.user.update({
      where: {
        id: parseInt(userId),
      },
      data: {
        username: username,
      },
    });

    res.status(200).json({
      message: "Username updated successfully",
      user,
    });
  } catch (err) {
    res.status(400).json({
      message: "Error in updating the username",
      error: err,
    });
  }
});

//@ts-ignore
app.post("/api/v1/updateUserPassword", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.userId;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old and new passwords are required",
      });
    }
    const user = await client.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({
        message: "Old password does not match",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 5);
    const updatedUser = await client.user.update({
      where: {
        id: parseInt(userId),
      },
      data: {
        password: hashedPassword,
      },
    });
    res.status(200).json({
      message: "Password updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  } catch (err) {
    res.status(400).json({
      message: "Error in updating the password",
      error: err,
    });
  }
});

//@ts-ignore
app.post("/api/v1/getChargingSessions", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = req.userId;
    const sessions = await client.booking.findMany({
      where: {
        userId: parseInt(userId),
      },
      include: {
        chargingStation: true,
      },
    });

    if (!sessions || sessions.length === 0) {
      return res.status(404).json({
        message: "No charging sessions found for this user",
      });
    }
    res.status(200).json({
      message: "Charging sessions fetched successfully",
      sessions,
    });
  } catch (err) {
    res.status(400).json({
      message: "Error in fetching the charging sessions",
      error: err,
    });
  }
});






//@ts-ignore
app.post("/api/v1/booking", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = parseInt(req.userId);
    const { lat, long } = req.body;

    if (!lat || !long) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const now = new Date();

    // Step 1: Check if user has an active booking
    const existingBooking = await client.booking.findFirst({
      where: {
        userId,
        endTime: {
          gt: now,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You already have an active booking",
      });
    }

    // Step 2: Fetch nearby charging stations from OpenChargeMap API
    const apiKey = OPEN_CHARGE_MAPS_API_KEY;
    const externalResponse = await axios.get("https://api.openchargemap.io/v3/poi/", {
      params: {
        output: "json",
        latitude: lat,
        longitude: long,
        distance: 500,
        distanceunit: "KM",
        maxresults: 20,
        key: apiKey,
      },
    });

    const externalStations = externalResponse.data;

    if (externalStations.length === 0) {
      return res.status(400).json({ message: "No charging stations found nearby" });
    }

    const startTime = now;
    // take capacityOfBattery and currentBatteryStatus  from car details and calculate endTime
    const carDetails = await client.car.findFirst({
      where: {
        userId,
      },
    });
    
    if (!carDetails) {
      return res.status(400).json({ message: "Car details not found for user" });
    }
    
    const capacityOfBattery = carDetails.capacityOfBattery || 50; // Default to 50 if not set
    const currentBatteryStatus = carDetails.currentBatteryStatus || 0; // Default to 0 if not set

    const chargingTime = (capacityOfBattery - currentBatteryStatus) * 60 * 1000; // Assuming 1 minute per 1% battery
    const endTime = new Date(startTime.getTime() + chargingTime);


    // Step 3: Iterate over nearby stations to find one with available slots
    let selectedStation = null;
    for (const extStation of externalStations) {
      const name = extStation?.AddressInfo?.Title || "";

      const internalStation = await client.chargingStation.findFirst({
        where: {
          name,
          status: true,
          avaliableSlots: {
            gt: 0,
          },
        },
      });

      if (internalStation) {
        selectedStation = internalStation;
        break;
      }
    }

    if (!selectedStation) {
      return res.status(400).json({ message: "No nearby charging stations with available slots" });
    }

    // Step 4: Transaction to decrement slot and create booking
    const booking = await client.$transaction(async (tx) => {
      // Decrement slot
      await tx.chargingStation.update({
        where: { id: selectedStation.id },
        data: {
          avaliableSlots: {
            decrement: 1,
          },
        },
      });

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          userId,
          chargingStationId: selectedStation.id,
          startTime: startTime,
          endTime: endTime,
          slotNumber: Math.floor(Math.random() * 1000),
          typeOfCharging: "DYNAMIC",
          isOccupied: now,
          status: "CONFIRMED",
        },
      });

      return newBooking;
    });

    return res.status(201).json({
      message: "Booking successful",
      booking,
    });

  } catch (err) {
    console.error("Booking error:", err);
    return res.status(500).json({
      message: "Internal server error while creating booking",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

//@ts-ignore
app.post("/api/v1/cancelBooking", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = parseInt(req.userId);
    const { bookingId } = req.body;

    const booking = await client.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ message: "Booking not found or unauthorized" });
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
      return res.status(400).json({ message: "Booking cannot be canceled" });
    }

    await client.$transaction([
      client.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      }),
      client.chargingStation.update({
        where: { id: booking.chargingStationId },
        data: {
          avaliableSlots: { increment: 1 },
        },
      }),
    ]);

    return res.status(200).json({ message: "Booking canceled successfully" });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return res.status(500).json({ message: "Error canceling booking", error: err });
  }
});

//@ts-ignore
app.post("/api/v1/completeBooking", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = parseInt(req.userId);
    const { bookingId } = req.body;

    const booking = await client.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ message: "Booking not found or unauthorized" });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({ message: "Booking is not active" });
    }

    await client.$transaction([
      client.booking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          endTime: new Date(),
        },
      }),
      client.chargingStation.update({
        where: { id: booking.chargingStationId },
        data: {
          avaliableSlots: { increment: 1 },
        },
      }),
    ]);

    return res.status(200).json({ message: "Booking marked as completed" });
  } catch (err) {
    console.error("Complete booking error:", err);
    return res.status(500).json({ message: "Error completing booking", error: err });
  }
});

//@ts-ignore
app.get("/api/v1/getBookingStatus", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = parseInt(req.userId);

    const booking = await client.booking.findFirst({
      where: {
        userId,
      },
      orderBy: {
        startTime: "desc",
      },
      include: {
        chargingStation: true,
        payment: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "No booking found" });
    }

    return res.status(200).json({
      message: "Booking status fetched",
      booking,
    });
  } catch (err) {
    console.error("Booking status error:", err);
    return res.status(500).json({ message: "Error fetching booking", error: err });
  }
});

//@ts-ignore
app.get("/api/v1/getBookingHistory", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = parseInt(req.userId);

    const bookings = await client.booking.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
      include: {
        chargingStation: true,
        payment: true,
      },
    });

    return res.status(200).json({
      message: "Booking history fetched",
      bookings,
    });
  } catch (err) {
    console.error("Booking history error:", err);
    return res.status(500).json({ message: "Error fetching history", error: err });
  }
});

//@ts-ignore
app.post("/api/v1/payment", userMiddleware, async (req, res) => {
  try {
    //@ts-ignore
    const userId = parseInt(req.userId);
    const { bookingId, amount, paymentMode } = req.body;

    if (!bookingId || !amount || !paymentMode) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // Ensure the booking exists and belongs to the user
    const booking = await client.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const payment = await client.payment.create({
      data: {
        userId,
        bookingId,
        amount: parseFloat(amount),
        paymentMode,
        status: "SUCCESS",
      },
    });

    return res.status(201).json({
      message: "Payment successful",
      payment,
    });

  } catch (err) {
    console.error("Payment error:", err);
    return res.status(500).json({ message: "Error processing payment", error: err });
  }
});


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
