import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import apiRoutes from "./routes";
// Keep old middleware for backward compatibility
import { userMiddleware } from "./middleware";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import axios from "axios";
import { JWT_SECRET, OPEN_CHARGE_MAPS_API_KEY } from "./config";
import { sendSuccess, sendError } from "./utils/response";
import { AuthenticatedRequest } from "./types";

const app = express();
const client = new PrismaClient();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
  })
);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Auth routes (keeping existing endpoints)
app.post("/api/v1/signup", async (req, res) => {
  const requiredBody = z.object({
    username: z.string().min(2).max(50),
    email: z.string().min(5).max(50).email(),
    password: z.string().min(4).max(50),
  });

  const parsedData = requiredBody.safeParse(req.body);

  if (!parsedData.success) {
    sendError(res, "Data parsing in Signup failed", 400);
    return;
  }

  const { username, email, password } = parsedData.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 5);

    await client.user.create({
      data: {
        username: username,
        password: hashedPassword,
        email: email,
      },
    });

    sendSuccess(res, null, "User created successfully", 201);
    return;
  } catch (err: any) {
    sendError(res, err.message || "Error creating user", 400);
  }
});

app.post("/api/v1/signin", async (req, res) => {
  const { email, password } = req.body;

  const user = await client.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    sendError(res, "User not found", 400);
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    sendError(res, "Password does not match", 400);
    return;
  }

    const token = jwt.sign(
      {
      id: user.id.toString(),
      },
      JWT_SECRET,
      {}
    );

  sendSuccess(res, { token }, "Sign in successful");
});

// Existing charging station routes (keeping for backward compatibility)
app.post("/api/v1/nearestEVStation", userMiddleware, async (req, res) => {
  try {
    const { lat, long } = req.body;
    if (!lat || !long) {
      sendError(res, "Lat or Long not provided", 400);
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
      sendError(res, "No charging stations found nearby", 400);
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

    sendSuccess(res, { stations }, "Charging stations fetched successfully");
    return;
  } catch (err) {
    sendError(res, "Error in fetching the charging stations", 400);
  }
});

// Keep other existing routes...
app.post("/api/v1/getStationDetails", userMiddleware, async (req, res) => {
  try {
    const apiKey = OPEN_CHARGE_MAPS_API_KEY;
    const { stationName } = req.body;

    if (!stationName) {
      sendError(res, "Station name is required", 400);
      return;
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
      sendError(res, "No stations found with the given name", 404);
      return;
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

    sendSuccess(res, { stations }, "Charging stations fetched successfully");
    return;
  } catch (error) {
    console.error("Error fetching station:", error);
    sendError(res, "Server error", 500);
  }
});

// Missing routes - getStationDetailsByPostCode
app.post("/api/v1/getStationDetailsByPostCode", userMiddleware, async (req, res) => {
  try {
    const { pinCode } = req.body;

    if (!pinCode) {
      sendError(res, "Postcode is required", 400);
      return;
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
      sendError(res, "Invalid or unknown postcode", 404);
      return;
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
      sendError(res, "No charging stations found nearby", 400);
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

    sendSuccess(res, { stations }, "Charging stations fetched successfully");
    return;
  } catch (error) {
    console.error("Error fetching station:", error);
    sendError(res, "Server error", 500);
    return;
  }
});

// Missing route - getStationDetailsByCity
app.post("/api/v1/getStationDetailsByCity", userMiddleware, async (req, res) => {
  try {
    const apiKey = OPEN_CHARGE_MAPS_API_KEY;
    const { cityName } = req.body;

    if (!cityName) {
      sendError(res, "provide the city name", 400);
      return;
    }

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
      sendError(res, "No stations found in the given City", 404);
      return;
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

    sendSuccess(
      res,
      { stations },
      `Charging stations fetched successfully and number of Stations found are: ${matches.length}`
    );
    return;
  } catch (error) {
    console.error("Error fetching station:", error);
    sendError(res, "Server error", 500);
    return;
  }
});

// User management routes
app.post("/api/v1/getUserDetails", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
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
      sendError(res, "User not found", 404);
      return;
    }
    sendSuccess(res, user, "User details fetched successfully");
  } catch (err) {
    sendError(res, "Error in fetching the user details", 400);
  }
});

app.post("/api/v1/updateUserName", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { username } = req.body;

    if (!username) {
      sendError(res, "Username is required", 400);
      return;
    }

    const user = await client.user.update({
      where: {
        id: parseInt(userId),
      },
      data: {
        username: username,
      },
    });

    sendSuccess(res, user, "Username updated successfully");
  } catch (err) {
    sendError(res, "Error in updating the username", 400);
  }
});

app.post("/api/v1/updateUserPassword", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      sendError(res, "Old and new passwords are required", 400);
      return;
    }
    const user = await client.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });
    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      sendError(res, "Old password does not match", 400);
      return;
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
    sendSuccess(
      res,
      {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
      "Password updated successfully"
    );
  } catch (err) {
    sendError(res, "Error in updating the password", 400);
  }
});

// Booking routes
app.post("/api/v1/getChargingSessions", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const sessions = await client.booking.findMany({
      where: {
        userId: userId,
      },
      include: {
        chargingStation: true,
      },
    });

    if (!sessions || sessions.length === 0) {
      sendError(res, "No charging sessions found for this user", 404);
      return;
    }
    sendSuccess(res, { sessions }, "Charging sessions fetched successfully");
  } catch (err) {
    sendError(res, "Error in fetching the charging sessions", 400);
  }
});

app.post("/api/v1/getAllBookings", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { status, limit = 10, offset = 0 } = req.body;

    const whereClause: any = {
      userId: userId,
    };

    // Optional filter by status
    if (status) {
      whereClause.status = status;
    }

    const bookings = await client.booking.findMany({
      where: whereClause,
      include: {
        chargingStation: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await client.booking.count({
      where: whereClause,
    });

    if (!bookings || bookings.length === 0) {
      sendError(res, "No bookings found for this user", 404);
      return;
    }

    sendSuccess(
      res,
      {
        bookings,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total,
        },
      },
      "Bookings fetched successfully"
    );
  } catch (err) {
    console.error("GetAllBookings error:", err);
    sendError(res, "Error in fetching bookings", 400);
  }
});

app.post("/api/v1/booking", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { lat, long } = req.body;

    if (!lat || !long) {
      sendError(res, "Latitude and longitude are required", 400);
      return;
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
      sendError(res, "You already have an active booking", 400);
      return;
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
      sendError(res, "No charging stations found nearby", 400);
      return;
    }

    const startTime = now;
    // take capacityOfBattery and currentBatteryStatus  from car details and calculate endTime
    const carDetails = await client.car.findFirst({
      where: {
        userId,
      },
    });
    
    if (!carDetails) {
      sendError(res, "Car details not found for user", 400);
      return;
    }
    
    const capacityOfBattery = carDetails.capacityOfBattery || 50; // Default to 50 if not set
    const currentBatteryStatus = carDetails.currentBatteryStatus || 0; // Default to 0 if not set

    // Calculate charging time: 1 minute per 1% battery
    // Ensure minimum 15 minutes and maximum 8 hours
    let chargingMinutes = capacityOfBattery - currentBatteryStatus;
    chargingMinutes = Math.max(15, Math.min(chargingMinutes * 1, 480)); // 480 minutes = 8 hours
    const chargingTime = chargingMinutes * 60 * 1000;
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
      // Fallback: if external stations exist but no internal station has available slots,
      // create a minimal internal chargingStation from the first external result so booking
      // can proceed in development/testing environments.
      try {
        const fallbackExt = externalStations[0];
        const fallbackName = fallbackExt?.AddressInfo?.Title || "External Station";

        // Check if station with this name already exists (might be created by another request)
        const existingFallback = await client.chargingStation.findFirst({
          where: {
            name: fallbackName,
          },
        });

        if (existingFallback && existingFallback.avaliableSlots > 0) {
          selectedStation = existingFallback;
        } else {
          // Create new station with 5 available slots for testing
          const createdStation = await client.chargingStation.create({
            data: {
              name: fallbackName,
              status: true,
              avaliableSlots: 5,
              capacity: 10,
              solarCapacity: 0,
            },
          });
          selectedStation = createdStation;
        }
      } catch (createErr) {
        console.error("Failed to create fallback station:", createErr);
        sendError(res, "No nearby charging stations with available slots", 400);
        return;
      }
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

    sendSuccess(res, { booking }, "Booking successful", 201);
  } catch (err) {
    console.error("Booking error:", err);
    sendError(res, "Internal server error while creating booking", 500);
  }
});

app.post("/api/v1/cancelBooking", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { bookingId } = req.body;

    const booking = await client.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      sendError(res, "Booking not found or unauthorized", 404);
      return;
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
      sendError(res, "Booking cannot be canceled", 400);
      return;
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

    sendSuccess(res, null, "Booking canceled successfully");
  } catch (err) {
    console.error("Cancel booking error:", err);
    sendError(res, "Error canceling booking", 500);
  }
});

app.post("/api/v1/completeBooking", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { bookingId } = req.body;

    const booking = await client.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      sendError(res, "Booking not found or unauthorized", 404);
      return;
    }

    if (booking.status !== "CONFIRMED") {
      sendError(res, "Booking is not active", 400);
      return;
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

    sendSuccess(res, null, "Booking marked as completed");
  } catch (err) {
    console.error("Complete booking error:", err);
    sendError(res, "Error completing booking", 500);
  }
});

app.post("/api/v1/payment", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const { bookingId, amount, paymentMode } = req.body;

    if (!bookingId || !amount || !paymentMode) {
      sendError(res, "Missing payment details", 400);
      return;
    }

    // Ensure the booking exists and belongs to the user
    const booking = await client.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking || booking.userId !== userId) {
      sendError(res, "Booking not found", 404);
      return;
    }

    // Validate and normalize payment mode
    const validModes = ["CARD", "UPI", "NET_BANKING", "CASH", "WALLET"];
    const normalizedMode = paymentMode.toUpperCase();
    if (!validModes.includes(normalizedMode)) {
      sendError(res, `Invalid payment mode. Valid modes: ${validModes.join(", ")}`, 400);
      return;
    }

    // Calculate savings (example: 10% discount)
    const originalAmount = parseFloat(amount);
    const savings = originalAmount * 0.1; // 10% savings
    const finalAmount = originalAmount - savings;

    const payment = await client.payment.create({
      data: {
        userId,
        bookingId,
        amount: finalAmount,
        originalAmount: originalAmount,
        savings: savings,
        paymentMode: normalizedMode as any,
        status: "SUCCESS",
      },
    });

    sendSuccess(res, { payment }, "Payment successful", 201);
  } catch (err) {
    console.error("Payment error:", err);
    sendError(res, "Error processing payment", 500);
  }
});

app.post("/api/v1/getCarDetails", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.userId!);
    const cars = await client.car.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        model: true,
        number: true,
        currentBatteryHealth: true,
        capacityOfBattery: true,
        currentBatteryStatus: true,
        typeOfPort: true,
        fastSupporting: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!cars || cars.length === 0) {
      sendError(res, "No car details found for this user", 404);
      return;
    }

    sendSuccess(res, { cars }, "Car details fetched successfully");
  } catch (err) {
    console.error("GetCarDetails error:", err);
    sendError(res, "Error in fetching car details", 400);
  }
});

app.post("/api/v1/insertCarData", userMiddleware, async (req: AuthenticatedRequest, res) => {
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
      sendError(res, "Car details are required", 400);
      return;
    }

    const car = await client.car.create({
      data: {
        userId: parseInt(req.userId!),
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

    sendSuccess(res, { car }, "Car details updated successfully");
  } catch (err: any) {
    console.error("InsertCarData error:", err);
    if (err instanceof Prisma.PrismaClientValidationError) {
      console.error("Prisma Validation Error Details:", err.message);
    }
    // return more detailed message in dev, generic in prod
    const message = err?.message || "Error in updating the car details";
    sendError(res, message, 400);
  }
});

app.post("/api/v1/deleteCarDetails", userMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { carId } = req.body;
    const userId = parseInt(req.userId!);

    if (!carId) {
      sendError(res, "Car ID is required", 400);
      return;
    }

    // Verify the car belongs to the authenticated user
    const car = await client.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      sendError(res, "Car not found", 404);
      return;
    }

    if (car.userId !== userId) {
      sendError(res, "Unauthorized to delete this car", 403);
      return;
    }

    // Delete the car
    const deletedCar = await client.car.delete({
      where: { id: carId },
    });

    sendSuccess(res, { car: deletedCar }, "Car deleted successfully");
  } catch (err: any) {
    console.error("DeleteCarDetails error:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        sendError(res, "Car not found", 404);
        return;
      }
    }
    sendError(res, "Error deleting car details", 400);
  }
});

// New API routes with clean architecture
app.use("/api/v1", apiRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
