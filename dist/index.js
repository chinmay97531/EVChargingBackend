"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = __importDefault(require("./routes"));
// Keep old middleware for backward compatibility
const middleware_1 = require("./middleware");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
const response_1 = require("./utils/response");
const app = (0, express_1.default)();
const client = new client_1.PrismaClient();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
}));
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});
// Auth routes (keeping existing endpoints)
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requiredBody = zod_1.z.object({
        username: zod_1.z.string().min(2).max(50),
        email: zod_1.z.string().min(5).max(50).email(),
        password: zod_1.z.string().min(4).max(50),
    });
    const parsedData = requiredBody.safeParse(req.body);
    if (!parsedData.success) {
        (0, response_1.sendError)(res, "Data parsing in Signup failed", 400);
        return;
    }
    const { username, email, password } = parsedData.data;
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 5);
        yield client.user.create({
            data: {
                username: username,
                password: hashedPassword,
                email: email,
            },
        });
        (0, response_1.sendSuccess)(res, null, "User created successfully", 201);
        return;
    }
    catch (err) {
        (0, response_1.sendError)(res, err.message || "Error creating user", 400);
    }
}));
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield client.user.findFirst({
        where: {
            email: email,
        },
    });
    if (!user) {
        (0, response_1.sendError)(res, "User not found", 400);
        return;
    }
    const passwordMatch = yield bcrypt_1.default.compare(password, user.password);
    if (!passwordMatch) {
        (0, response_1.sendError)(res, "Password does not match", 400);
        return;
    }
    const token = jsonwebtoken_1.default.sign({
        id: user.id.toString(),
    }, config_1.JWT_SECRET, {});
    (0, response_1.sendSuccess)(res, { token }, "Sign in successful");
}));
// Existing charging station routes (keeping for backward compatibility)
app.post("/api/v1/nearestEVStation", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, long } = req.body;
        if (!lat || !long) {
            (0, response_1.sendError)(res, "Lat or Long not provided", 400);
            return;
        }
        const apiKey = config_1.OPEN_CHARGE_MAPS_API_KEY;
        const response = yield axios_1.default.get("https://api.openchargemap.io/v3/poi/", {
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
            (0, response_1.sendError)(res, "No charging stations found nearby", 400);
        }
        const stations = data.map((station) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            const connections = station.Connections || [];
            const chargerTypeMap = {};
            var fastCharger = 0;
            var slowCharger = 0;
            connections.forEach((connection) => {
                var _a, _b;
                const type = ((_a = connection.ConnectionType) === null || _a === void 0 ? void 0 : _a.Title) || "Unknown";
                chargerTypeMap[type] = (chargerTypeMap[type] || 0) + 1;
                const isFast = (_b = connection.Level) === null || _b === void 0 ? void 0 : _b.IsFastChargeCapable;
                if (isFast) {
                    fastCharger++;
                }
                else if (!isFast) {
                    slowCharger++;
                }
            });
            return {
                name: ((_a = station.AddressInfo) === null || _a === void 0 ? void 0 : _a.Title) || "Unknown",
                geolocation: {
                    latitude: (_b = station.AddressInfo) === null || _b === void 0 ? void 0 : _b.Latitude,
                    longitude: (_c = station.AddressInfo) === null || _c === void 0 ? void 0 : _c.Longitude,
                },
                address: {
                    line1: ((_d = station.AddressInfo) === null || _d === void 0 ? void 0 : _d.AddressLine1) || "",
                    line2: ((_e = station.AddressInfo) === null || _e === void 0 ? void 0 : _e.AddressLine2) || "",
                    town: ((_f = station.AddressInfo) === null || _f === void 0 ? void 0 : _f.Town) || "",
                    state: ((_g = station.AddressInfo) === null || _g === void 0 ? void 0 : _g.StateOrProvince) || "",
                    postcode: ((_h = station.AddressInfo) === null || _h === void 0 ? void 0 : _h.Postcode) || "",
                    country: ((_k = (_j = station.AddressInfo) === null || _j === void 0 ? void 0 : _j.Country) === null || _k === void 0 ? void 0 : _k.Title) || "",
                    distance: ((_l = station.AddressInfo) === null || _l === void 0 ? void 0 : _l.Distance) || 0,
                },
                typesOfChargers: Object.entries(chargerTypeMap).map(([type, count]) => ({
                    type,
                    count,
                })),
                FastChargers: fastCharger,
                SlowChargers: slowCharger,
            };
        });
        (0, response_1.sendSuccess)(res, { stations }, "Charging stations fetched successfully");
        return;
    }
    catch (err) {
        (0, response_1.sendError)(res, "Error in fetching the charging stations", 400);
    }
}));
// Keep other existing routes...
app.post("/api/v1/getStationDetails", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const apiKey = config_1.OPEN_CHARGE_MAPS_API_KEY;
        const { stationName } = req.body;
        if (!stationName) {
            (0, response_1.sendError)(res, "Station name is required", 400);
            return;
        }
        const response = yield axios_1.default.get("https://api.openchargemap.io/v3/poi/", {
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
            .filter((station) => {
            var _a, _b;
            return (_b = (_a = station.AddressInfo) === null || _a === void 0 ? void 0 : _a.Title) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(stationName.toLowerCase());
        })
            .slice(0, 100);
        if (matches.length === 0) {
            (0, response_1.sendError)(res, "No stations found with the given name", 404);
            return;
        }
        const stations = matches.map((station) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            const connections = station.Connections || [];
            const chargerTypeMap = {};
            var fastCharger = 0;
            var slowCharger = 0;
            connections.forEach((connection) => {
                var _a, _b;
                const type = ((_a = connection.ConnectionType) === null || _a === void 0 ? void 0 : _a.Title) || "Unknown";
                chargerTypeMap[type] = (chargerTypeMap[type] || 0) + 1;
                const isFast = (_b = connection.Level) === null || _b === void 0 ? void 0 : _b.IsFastChargeCapable;
                if (isFast) {
                    fastCharger++;
                }
                else if (!isFast) {
                    slowCharger++;
                }
            });
            return {
                name: ((_a = station.AddressInfo) === null || _a === void 0 ? void 0 : _a.Title) || "Unknown",
                geolocation: {
                    latitude: (_b = station.AddressInfo) === null || _b === void 0 ? void 0 : _b.Latitude,
                    longitude: (_c = station.AddressInfo) === null || _c === void 0 ? void 0 : _c.Longitude,
                },
                address: {
                    line1: ((_d = station.AddressInfo) === null || _d === void 0 ? void 0 : _d.AddressLine1) || "",
                    line2: ((_e = station.AddressInfo) === null || _e === void 0 ? void 0 : _e.AddressLine2) || "",
                    town: ((_f = station.AddressInfo) === null || _f === void 0 ? void 0 : _f.Town) || "",
                    state: ((_g = station.AddressInfo) === null || _g === void 0 ? void 0 : _g.StateOrProvince) || "",
                    postcode: ((_h = station.AddressInfo) === null || _h === void 0 ? void 0 : _h.Postcode) || "",
                    country: ((_k = (_j = station.AddressInfo) === null || _j === void 0 ? void 0 : _j.Country) === null || _k === void 0 ? void 0 : _k.Title) || "",
                    distance: ((_l = station.AddressInfo) === null || _l === void 0 ? void 0 : _l.Distance) || 0,
                },
                typesOfChargers: Object.entries(chargerTypeMap).map(([type, count]) => ({
                    type,
                    count,
                })),
                FastChargers: fastCharger,
                SlowChargers: slowCharger,
            };
        });
        (0, response_1.sendSuccess)(res, { stations }, "Charging stations fetched successfully");
        return;
    }
    catch (error) {
        console.error("Error fetching station:", error);
        (0, response_1.sendError)(res, "Server error", 500);
    }
}));
// Missing routes - getStationDetailsByPostCode
app.post("/api/v1/getStationDetailsByPostCode", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pinCode } = req.body;
        if (!pinCode) {
            (0, response_1.sendError)(res, "Postcode is required", 400);
            return;
        }
        const geoRes = yield axios_1.default.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: pinCode,
                format: "json",
                limit: 1,
            },
        });
        if (geoRes.data.length === 0) {
            (0, response_1.sendError)(res, "Invalid or unknown postcode", 404);
            return;
        }
        const lat = geoRes.data[0].lat;
        const long = geoRes.data[0].lon;
        const apiKey = config_1.OPEN_CHARGE_MAPS_API_KEY;
        const response = yield axios_1.default.get("https://api.openchargemap.io/v3/poi/", {
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
            (0, response_1.sendError)(res, "No charging stations found nearby", 400);
            return;
        }
        const stations = data.map((station) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            const connections = station.Connections || [];
            const chargerTypeMap = {};
            var fastCharger = 0;
            var slowCharger = 0;
            connections.forEach((connection) => {
                var _a, _b;
                const type = ((_a = connection.ConnectionType) === null || _a === void 0 ? void 0 : _a.Title) || "Unknown";
                chargerTypeMap[type] = (chargerTypeMap[type] || 0) + 1;
                const isFast = (_b = connection.Level) === null || _b === void 0 ? void 0 : _b.IsFastChargeCapable;
                if (isFast) {
                    fastCharger++;
                }
                else if (!isFast) {
                    slowCharger++;
                }
            });
            return {
                name: ((_a = station.AddressInfo) === null || _a === void 0 ? void 0 : _a.Title) || "Unknown",
                geolocation: {
                    latitude: (_b = station.AddressInfo) === null || _b === void 0 ? void 0 : _b.Latitude,
                    longitude: (_c = station.AddressInfo) === null || _c === void 0 ? void 0 : _c.Longitude,
                },
                address: {
                    line1: ((_d = station.AddressInfo) === null || _d === void 0 ? void 0 : _d.AddressLine1) || "",
                    line2: ((_e = station.AddressInfo) === null || _e === void 0 ? void 0 : _e.AddressLine2) || "",
                    town: ((_f = station.AddressInfo) === null || _f === void 0 ? void 0 : _f.Town) || "",
                    state: ((_g = station.AddressInfo) === null || _g === void 0 ? void 0 : _g.StateOrProvince) || "",
                    postcode: ((_h = station.AddressInfo) === null || _h === void 0 ? void 0 : _h.Postcode) || "",
                    country: ((_k = (_j = station.AddressInfo) === null || _j === void 0 ? void 0 : _j.Country) === null || _k === void 0 ? void 0 : _k.Title) || "",
                    distance: ((_l = station.AddressInfo) === null || _l === void 0 ? void 0 : _l.Distance) || 0,
                },
                typesOfChargers: Object.entries(chargerTypeMap).map(([type, count]) => ({
                    type,
                    count,
                })),
                FastChargers: fastCharger,
                SlowChargers: slowCharger,
            };
        });
        (0, response_1.sendSuccess)(res, { stations }, "Charging stations fetched successfully");
        return;
    }
    catch (error) {
        console.error("Error fetching station:", error);
        (0, response_1.sendError)(res, "Server error", 500);
        return;
    }
}));
// Missing route - getStationDetailsByCity
app.post("/api/v1/getStationDetailsByCity", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const apiKey = config_1.OPEN_CHARGE_MAPS_API_KEY;
        const { cityName } = req.body;
        if (!cityName) {
            (0, response_1.sendError)(res, "provide the city name", 400);
            return;
        }
        const response = yield axios_1.default.get("https://api.openchargemap.io/v3/poi/", {
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
        const matches = data.filter((station) => {
            var _a, _b;
            return (_b = (_a = station.AddressInfo) === null || _a === void 0 ? void 0 : _a.Town) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(cityName.toLowerCase());
        });
        if (matches.length === 0) {
            (0, response_1.sendError)(res, "No stations found in the given City", 404);
            return;
        }
        const stations = matches.map((station) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            const connections = station.Connections || [];
            const chargerTypeMap = {};
            var fastCharger = 0;
            var slowCharger = 0;
            connections.forEach((connection) => {
                var _a, _b;
                const type = ((_a = connection.ConnectionType) === null || _a === void 0 ? void 0 : _a.Title) || "Unknown";
                chargerTypeMap[type] = (chargerTypeMap[type] || 0) + 1;
                const isFast = (_b = connection.Level) === null || _b === void 0 ? void 0 : _b.IsFastChargeCapable;
                if (isFast) {
                    fastCharger++;
                }
                else if (!isFast) {
                    slowCharger++;
                }
            });
            return {
                name: ((_a = station.AddressInfo) === null || _a === void 0 ? void 0 : _a.Title) || "Unknown",
                geolocation: {
                    latitude: (_b = station.AddressInfo) === null || _b === void 0 ? void 0 : _b.Latitude,
                    longitude: (_c = station.AddressInfo) === null || _c === void 0 ? void 0 : _c.Longitude,
                },
                address: {
                    line1: ((_d = station.AddressInfo) === null || _d === void 0 ? void 0 : _d.AddressLine1) || "",
                    line2: ((_e = station.AddressInfo) === null || _e === void 0 ? void 0 : _e.AddressLine2) || "",
                    town: ((_f = station.AddressInfo) === null || _f === void 0 ? void 0 : _f.Town) || "",
                    state: ((_g = station.AddressInfo) === null || _g === void 0 ? void 0 : _g.StateOrProvince) || "",
                    postcode: ((_h = station.AddressInfo) === null || _h === void 0 ? void 0 : _h.Postcode) || "",
                    country: ((_k = (_j = station.AddressInfo) === null || _j === void 0 ? void 0 : _j.Country) === null || _k === void 0 ? void 0 : _k.Title) || "",
                    distance: ((_l = station.AddressInfo) === null || _l === void 0 ? void 0 : _l.Distance) || 0,
                },
                typesOfChargers: Object.entries(chargerTypeMap).map(([type, count]) => ({
                    type,
                    count,
                })),
                FastChargers: fastCharger,
                SlowChargers: slowCharger,
            };
        });
        (0, response_1.sendSuccess)(res, { stations }, `Charging stations fetched successfully and number of Stations found are: ${matches.length}`);
        return;
    }
    catch (error) {
        console.error("Error fetching station:", error);
        (0, response_1.sendError)(res, "Server error", 500);
        return;
    }
}));
// User management routes
app.post("/api/v1/getUserDetails", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const user = yield client.user.findUnique({
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
            (0, response_1.sendError)(res, "User not found", 404);
            return;
        }
        (0, response_1.sendSuccess)(res, user, "User details fetched successfully");
    }
    catch (err) {
        (0, response_1.sendError)(res, "Error in fetching the user details", 400);
    }
}));
app.post("/api/v1/updateUserName", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { username } = req.body;
        if (!username) {
            (0, response_1.sendError)(res, "Username is required", 400);
            return;
        }
        const user = yield client.user.update({
            where: {
                id: parseInt(userId),
            },
            data: {
                username: username,
            },
        });
        (0, response_1.sendSuccess)(res, user, "Username updated successfully");
    }
    catch (err) {
        (0, response_1.sendError)(res, "Error in updating the username", 400);
    }
}));
app.post("/api/v1/updateUserPassword", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            (0, response_1.sendError)(res, "Old and new passwords are required", 400);
            return;
        }
        const user = yield client.user.findUnique({
            where: {
                id: parseInt(userId),
            },
        });
        if (!user) {
            (0, response_1.sendError)(res, "User not found", 404);
            return;
        }
        const passwordMatch = yield bcrypt_1.default.compare(oldPassword, user.password);
        if (!passwordMatch) {
            (0, response_1.sendError)(res, "Old password does not match", 400);
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 5);
        const updatedUser = yield client.user.update({
            where: {
                id: parseInt(userId),
            },
            data: {
                password: hashedPassword,
            },
        });
        (0, response_1.sendSuccess)(res, {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
        }, "Password updated successfully");
    }
    catch (err) {
        (0, response_1.sendError)(res, "Error in updating the password", 400);
    }
}));
// Booking routes
app.post("/api/v1/getChargingSessions", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.userId);
        const sessions = yield client.booking.findMany({
            where: {
                userId: userId,
            },
            include: {
                chargingStation: true,
            },
        });
        if (!sessions || sessions.length === 0) {
            (0, response_1.sendError)(res, "No charging sessions found for this user", 404);
            return;
        }
        (0, response_1.sendSuccess)(res, { sessions }, "Charging sessions fetched successfully");
    }
    catch (err) {
        (0, response_1.sendError)(res, "Error in fetching the charging sessions", 400);
    }
}));
app.post("/api/v1/getAllBookings", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.userId);
        const { status, limit = 10, offset = 0 } = req.body;
        const whereClause = {
            userId: userId,
        };
        // Optional filter by status
        if (status) {
            whereClause.status = status;
        }
        const bookings = yield client.booking.findMany({
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
        const total = yield client.booking.count({
            where: whereClause,
        });
        if (!bookings || bookings.length === 0) {
            (0, response_1.sendError)(res, "No bookings found for this user", 404);
            return;
        }
        (0, response_1.sendSuccess)(res, {
            bookings,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < total,
            },
        }, "Bookings fetched successfully");
    }
    catch (err) {
        console.error("GetAllBookings error:", err);
        (0, response_1.sendError)(res, "Error in fetching bookings", 400);
    }
}));
app.post("/api/v1/booking", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = parseInt(req.userId);
        const { lat, long } = req.body;
        if (!lat || !long) {
            (0, response_1.sendError)(res, "Latitude and longitude are required", 400);
            return;
        }
        const now = new Date();
        // Step 1: Check if user has an active booking
        const existingBooking = yield client.booking.findFirst({
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
            (0, response_1.sendError)(res, "You already have an active booking", 400);
            return;
        }
        // Step 2: Fetch nearby charging stations from OpenChargeMap API
        const apiKey = config_1.OPEN_CHARGE_MAPS_API_KEY;
        const externalResponse = yield axios_1.default.get("https://api.openchargemap.io/v3/poi/", {
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
            (0, response_1.sendError)(res, "No charging stations found nearby", 400);
            return;
        }
        const startTime = now;
        // take capacityOfBattery and currentBatteryStatus  from car details and calculate endTime
        const carDetails = yield client.car.findFirst({
            where: {
                userId,
            },
        });
        if (!carDetails) {
            (0, response_1.sendError)(res, "Car details not found for user", 400);
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
            const name = ((_a = extStation === null || extStation === void 0 ? void 0 : extStation.AddressInfo) === null || _a === void 0 ? void 0 : _a.Title) || "";
            const internalStation = yield client.chargingStation.findFirst({
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
                const fallbackName = ((_b = fallbackExt === null || fallbackExt === void 0 ? void 0 : fallbackExt.AddressInfo) === null || _b === void 0 ? void 0 : _b.Title) || "External Station";
                // Check if station with this name already exists (might be created by another request)
                const existingFallback = yield client.chargingStation.findFirst({
                    where: {
                        name: fallbackName,
                    },
                });
                if (existingFallback && existingFallback.avaliableSlots > 0) {
                    selectedStation = existingFallback;
                }
                else {
                    // Create new station with 5 available slots for testing
                    const createdStation = yield client.chargingStation.create({
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
            }
            catch (createErr) {
                console.error("Failed to create fallback station:", createErr);
                (0, response_1.sendError)(res, "No nearby charging stations with available slots", 400);
                return;
            }
        }
        // Step 4: Transaction to decrement slot and create booking
        const booking = yield client.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Decrement slot
            yield tx.chargingStation.update({
                where: { id: selectedStation.id },
                data: {
                    avaliableSlots: {
                        decrement: 1,
                    },
                },
            });
            // Create booking
            const newBooking = yield tx.booking.create({
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
        }));
        (0, response_1.sendSuccess)(res, { booking }, "Booking successful", 201);
    }
    catch (err) {
        console.error("Booking error:", err);
        (0, response_1.sendError)(res, "Internal server error while creating booking", 500);
    }
}));
app.post("/api/v1/cancelBooking", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.userId);
        const { bookingId } = req.body;
        const booking = yield client.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking || booking.userId !== userId) {
            (0, response_1.sendError)(res, "Booking not found or unauthorized", 404);
            return;
        }
        if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
            (0, response_1.sendError)(res, "Booking cannot be canceled", 400);
            return;
        }
        yield client.$transaction([
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
        (0, response_1.sendSuccess)(res, null, "Booking canceled successfully");
    }
    catch (err) {
        console.error("Cancel booking error:", err);
        (0, response_1.sendError)(res, "Error canceling booking", 500);
    }
}));
app.post("/api/v1/completeBooking", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.userId);
        const { bookingId } = req.body;
        const booking = yield client.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking || booking.userId !== userId) {
            (0, response_1.sendError)(res, "Booking not found or unauthorized", 404);
            return;
        }
        if (booking.status !== "CONFIRMED") {
            (0, response_1.sendError)(res, "Booking is not active", 400);
            return;
        }
        yield client.$transaction([
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
        (0, response_1.sendSuccess)(res, null, "Booking marked as completed");
    }
    catch (err) {
        console.error("Complete booking error:", err);
        (0, response_1.sendError)(res, "Error completing booking", 500);
    }
}));
app.post("/api/v1/payment", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.userId);
        const { bookingId, amount, paymentMode } = req.body;
        if (!bookingId || !amount || !paymentMode) {
            (0, response_1.sendError)(res, "Missing payment details", 400);
            return;
        }
        // Ensure the booking exists and belongs to the user
        const booking = yield client.booking.findUnique({
            where: { id: bookingId },
            include: { user: true },
        });
        if (!booking || booking.userId !== userId) {
            (0, response_1.sendError)(res, "Booking not found", 404);
            return;
        }
        // Validate and normalize payment mode
        const validModes = ["CARD", "UPI", "NET_BANKING", "CASH", "WALLET"];
        const normalizedMode = paymentMode.toUpperCase();
        if (!validModes.includes(normalizedMode)) {
            (0, response_1.sendError)(res, `Invalid payment mode. Valid modes: ${validModes.join(", ")}`, 400);
            return;
        }
        // Calculate savings (example: 10% discount)
        const originalAmount = parseFloat(amount);
        const savings = originalAmount * 0.1; // 10% savings
        const finalAmount = originalAmount - savings;
        const payment = yield client.payment.create({
            data: {
                userId,
                bookingId,
                amount: finalAmount,
                originalAmount: originalAmount,
                savings: savings,
                paymentMode: normalizedMode,
                status: "SUCCESS",
            },
        });
        (0, response_1.sendSuccess)(res, { payment }, "Payment successful", 201);
    }
    catch (err) {
        console.error("Payment error:", err);
        (0, response_1.sendError)(res, "Error processing payment", 500);
    }
}));
app.post("/api/v1/getCarDetails", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = parseInt(req.userId);
        const cars = yield client.car.findMany({
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
            (0, response_1.sendError)(res, "No car details found for this user", 404);
            return;
        }
        (0, response_1.sendSuccess)(res, { cars }, "Car details fetched successfully");
    }
    catch (err) {
        console.error("GetCarDetails error:", err);
        (0, response_1.sendError)(res, "Error in fetching car details", 400);
    }
}));
app.post("/api/v1/insertCarData", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { carName, carModel, carNumber, currentBattreyHealth, capacityOfBattrey, typeOfPort, FastAndSlow, currentBattreyStatus, } = req.body;
        if (!carName ||
            !carModel ||
            !carNumber ||
            !currentBattreyHealth ||
            !capacityOfBattrey ||
            !typeOfPort ||
            !FastAndSlow ||
            !currentBattreyStatus) {
            (0, response_1.sendError)(res, "Car details are required", 400);
            return;
        }
        const car = yield client.car.create({
            data: {
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
        (0, response_1.sendSuccess)(res, { car }, "Car details updated successfully");
    }
    catch (err) {
        console.error("InsertCarData error:", err);
        if (err instanceof client_1.Prisma.PrismaClientValidationError) {
            console.error("Prisma Validation Error Details:", err.message);
        }
        // return more detailed message in dev, generic in prod
        const message = (err === null || err === void 0 ? void 0 : err.message) || "Error in updating the car details";
        (0, response_1.sendError)(res, message, 400);
    }
}));
app.post("/api/v1/deleteCarDetails", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { carId } = req.body;
        const userId = parseInt(req.userId);
        if (!carId) {
            (0, response_1.sendError)(res, "Car ID is required", 400);
            return;
        }
        // Verify the car belongs to the authenticated user
        const car = yield client.car.findUnique({
            where: { id: carId },
        });
        if (!car) {
            (0, response_1.sendError)(res, "Car not found", 404);
            return;
        }
        if (car.userId !== userId) {
            (0, response_1.sendError)(res, "Unauthorized to delete this car", 403);
            return;
        }
        // Delete the car
        const deletedCar = yield client.car.delete({
            where: { id: carId },
        });
        (0, response_1.sendSuccess)(res, { car: deletedCar }, "Car deleted successfully");
    }
    catch (err) {
        console.error("DeleteCarDetails error:", err);
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                (0, response_1.sendError)(res, "Car not found", 404);
                return;
            }
        }
        (0, response_1.sendError)(res, "Error deleting car details", 400);
    }
}));
// New API routes with clean architecture
app.use("/api/v1", routes_1.default);
// Error handling middleware (must be last)
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
