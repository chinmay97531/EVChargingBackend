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
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("./config");
const config_2 = require("./config");
const middleware_1 = require("./middleware");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const client = new client_1.PrismaClient();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requiredBody = zod_1.z.object({
        username: zod_1.z.string().min(2).max(50),
        email: zod_1.z.string().min(5).max(50).email(),
        password: zod_1.z.string().min(4).max(50),
    });
    const parsedData = requiredBody.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({
            message: "Data parsing in Signup failed",
        });
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
        res.status(200).json({
            message: "User created successfully",
        });
    }
    catch (err) {
        res.status(400).json({
            message: err,
        });
    }
}));
//@ts-ignore
app.post("/api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield client.user.findFirst({
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
    const hashedPassword = user === null || user === void 0 ? void 0 : user.password;
    if (!hashedPassword) {
        res.status(400).json({
            message: "Password not found",
        });
        return;
    }
    const passwordMatch = yield bcrypt_1.default.compare(password, user === null || user === void 0 ? void 0 : user.password);
    if (!passwordMatch) {
        res.status(400).json({
            message: "Password does not match",
        });
        return;
    }
    if (passwordMatch) {
        const token = jsonwebtoken_1.default.sign({
            id: user === null || user === void 0 ? void 0 : user.id.toString(),
        }, config_1.JWT_SECRET, {});
        res.json({ token });
    }
    else {
        res.json({
            message: "Incoorect Credentials",
        });
    }
}));
//@ts-ignore
app.post("/api/v1/nearestEVStation", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, long } = req.body;
        if (!lat || !long) {
            res.status(400).json({
                message: "Lat or Long not provided",
            });
            return;
        }
        const apiKey = config_2.OPEN_CHARGE_MAPS_API_KEY;
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
            res.status(400).json({
                message: "No charging stations found nearby",
            });
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
        res.status(200).json({
            message: "Charging stations fetched successfully",
            stations,
        });
    }
    catch (err) {
        res.status(400).json({
            message: "Error in fetching the charging stations",
        });
    }
}));
//@ts-ignore
app.post("/api/v1/getStationDetails", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const apiKey = config_2.OPEN_CHARGE_MAPS_API_KEY;
        const { stationName } = req.body;
        if (!stationName) {
            return res.status(400).json({
                message: "Station name is required",
            });
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
            return res.status(404).json({
                message: "No stations found with the given name",
            });
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
        res.status(200).json({
            message: "Charging stations fetched successfully",
            stations,
        });
    }
    catch (error) {
        console.error("Error fetching station:", error);
        return res.status(500).json({ message: "Server error" });
    }
}));
//@ts-ignore
app.post("/api/v1/getStationDetailsByPostCode", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //both string and number are accepting
        const { pinCode } = req.body;
        if (!pinCode) {
            return res.status(400).json({ message: "Postcode is required" });
        }
        const geoRes = yield axios_1.default.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: pinCode,
                format: "json",
                limit: 1,
            },
        });
        if (geoRes.data.length === 0) {
            return res.status(404).json({ message: "Invalid or unknown postcode" });
        }
        const lat = geoRes.data[0].lat;
        const long = geoRes.data[0].lon;
        const apiKey = config_2.OPEN_CHARGE_MAPS_API_KEY;
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
            res.status(400).json({
                message: "No charging stations found nearby",
            });
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
        res.status(200).json({
            message: "Charging stations fetched successfully",
            stations,
        });
    }
    catch (error) {
        console.error("Error fetching station:", error);
        return res.status(500).json({ message: "Server error" });
    }
}));
//@ts-ignore
app.post("/api/v1/getStationDetailsByCity", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const apiKey = config_2.OPEN_CHARGE_MAPS_API_KEY;
        const { cityName } = req.body;
        if (!cityName) {
            return res.status(400).json({
                message: "provide the city name",
            });
        }
        //for different regoins provide country code
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
            return res.status(404).json({
                message: "No stations found in the given City",
            });
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
        res.status(200).json({
            message: `Charging stations fetched successfully and number of Stations found are: ${matches.length}`,
            stations,
        });
    }
    catch (error) {
        console.error("Error fetching station:", error);
        return res.status(500).json({ message: "Server error" });
    }
}));
//Update user Car details  (email, name and password already in table)
//@ts-ignore
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
            res.status(400).json({
                message: "Car details are required",
            });
            return;
        }
        const car = yield client.car.create({
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
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientValidationError) {
            console.error("Validation Error Details:", err.message);
        }
        res.status(400).json({
            message: "Error in updating the car details",
            error: err,
        });
    }
}));
//@ts-ignore
app.post("/api/v1/getCarDetails", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        const car = yield client.car.findMany({
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
    }
    catch (err) {
        res.status(400).json({
            message: "Error in fetching the car details",
            error: err,
        });
    }
}));
//@ts-ignore
app.post("/api/v1/getUserDetails", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
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
            return res.status(404).json({
                message: "User not found",
            });
        }
        res.status(200).json({
            message: "User details fetched successfully",
            user,
        });
    }
    catch (err) {
        res.status(400).json({
            message: "Error in fetching the user details",
            error: err,
        });
    }
}));
//@ts-ignore
app.post("/api/v1/updateUserName", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({
                message: "Username is required",
            });
        }
        const user = yield client.user.update({
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
    }
    catch (err) {
        res.status(400).json({
            message: "Error in updating the username",
            error: err,
        });
    }
}));
//@ts-ignore
app.post("/api/v1/updateUserPassword", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                message: "Old and new passwords are required",
            });
        }
        const user = yield client.user.findUnique({
            where: {
                id: parseInt(userId),
            },
        });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        const passwordMatch = yield bcrypt_1.default.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return res.status(400).json({
                message: "Old password does not match",
            });
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
        res.status(200).json({
            message: "Password updated successfully",
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
            },
        });
    }
    catch (err) {
        res.status(400).json({
            message: "Error in updating the password",
            error: err,
        });
    }
}));
//@ts-ignore
app.post("/api/v1/getChargingSessions", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userId;
        const sessions = yield client.booking.findMany({
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
    }
    catch (err) {
        res.status(400).json({
            message: "Error in fetching the charging sessions",
            error: err,
        });
    }
}));
//@ts-ignore
app.post("/api/v1/booking", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        //@ts-ignore
        const userId = parseInt(req.userId);
        const { lat, long } = req.body;
        if (!lat || !long) {
            return res.status(400).json({ message: "Latitude and longitude are required" });
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
            return res.status(400).json({
                message: "You already have an active booking",
            });
        }
        // Step 2: Fetch nearby charging stations from OpenChargeMap API
        const apiKey = config_2.OPEN_CHARGE_MAPS_API_KEY;
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
            return res.status(400).json({ message: "No charging stations found nearby" });
        }
        const startTime = now;
        // take capacityOfBattery and currentBatteryStatus  from car details and calculate endTime
        const carDetails = yield client.car.findFirst({
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
            return res.status(400).json({ message: "No nearby charging stations with available slots" });
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
        return res.status(201).json({
            message: "Booking successful",
            booking,
        });
    }
    catch (err) {
        console.error("Booking error:", err);
        return res.status(500).json({
            message: "Internal server error while creating booking",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
}));
//@ts-ignore
app.post("/api/v1/cancelBooking", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = parseInt(req.userId);
        const { bookingId } = req.body;
        const booking = yield client.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking || booking.userId !== userId) {
            return res.status(404).json({ message: "Booking not found or unauthorized" });
        }
        if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
            return res.status(400).json({ message: "Booking cannot be canceled" });
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
        return res.status(200).json({ message: "Booking canceled successfully" });
    }
    catch (err) {
        console.error("Cancel booking error:", err);
        return res.status(500).json({ message: "Error canceling booking", error: err });
    }
}));
//@ts-ignore
app.post("/api/v1/completeBooking", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = parseInt(req.userId);
        const { bookingId } = req.body;
        const booking = yield client.booking.findUnique({
            where: { id: bookingId },
        });
        if (!booking || booking.userId !== userId) {
            return res.status(404).json({ message: "Booking not found or unauthorized" });
        }
        if (booking.status !== "CONFIRMED") {
            return res.status(400).json({ message: "Booking is not active" });
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
        return res.status(200).json({ message: "Booking marked as completed" });
    }
    catch (err) {
        console.error("Complete booking error:", err);
        return res.status(500).json({ message: "Error completing booking", error: err });
    }
}));
//@ts-ignore
app.get("/api/v1/getBookingStatus", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = parseInt(req.userId);
        const booking = yield client.booking.findFirst({
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
    }
    catch (err) {
        console.error("Booking status error:", err);
        return res.status(500).json({ message: "Error fetching booking", error: err });
    }
}));
//@ts-ignore
app.get("/api/v1/getBookingHistory", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = parseInt(req.userId);
        const bookings = yield client.booking.findMany({
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
    }
    catch (err) {
        console.error("Booking history error:", err);
        return res.status(500).json({ message: "Error fetching history", error: err });
    }
}));
//@ts-ignore
app.post("/api/v1/payment", middleware_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = parseInt(req.userId);
        const { bookingId, amount, paymentMode } = req.body;
        if (!bookingId || !amount || !paymentMode) {
            return res.status(400).json({ message: "Missing payment details" });
        }
        // Ensure the booking exists and belongs to the user
        const booking = yield client.booking.findUnique({
            where: { id: bookingId },
            include: { user: true },
        });
        if (!booking || booking.userId !== userId) {
            return res.status(404).json({ message: "Booking not found" });
        }
        const payment = yield client.payment.create({
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
    }
    catch (err) {
        console.error("Payment error:", err);
        return res.status(500).json({ message: "Error processing payment", error: err });
    }
}));
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
