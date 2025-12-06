"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const response_1 = require("../utils/response");
const authMiddleware = (req, res, next) => {
    var _a;
    const header = req.headers["token"] || req.headers["authorization"];
    if (!header) {
        (0, response_1.sendError)(res, "Authentication token required", 401);
        return;
    }
    try {
        const token = typeof header === "string"
            ? header.replace("Bearer ", "")
            : ((_a = header[0]) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "")) || header[0];
        const decoded = jsonwebtoken_1.default.verify(token, config_1.JWT_SECRET);
        req.userId = decoded.id;
        next();
    }
    catch (error) {
        (0, response_1.sendError)(res, "Invalid or expired token", 401);
    }
};
exports.authMiddleware = authMiddleware;
