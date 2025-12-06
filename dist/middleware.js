"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const userMiddleware = (req, res, next) => {
    const header = req.headers["token"];
    if (!header) {
        res.status(403).json({ message: "You are not logged in" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(header, config_1.JWT_SECRET);
        // attach userId to request
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        req.userId = decoded.id;
        next();
    }
    catch (error) {
        res.status(403).json({ message: "Invalid or expired token" });
        return;
    }
};
exports.userMiddleware = userMiddleware;
