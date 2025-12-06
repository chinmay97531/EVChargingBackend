"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const errorHandler = (err, req, res, next) => {
    if (err instanceof errors_1.AppError) {
        (0, response_1.sendError)(res, err.message, err.statusCode);
        return;
    }
    console.error("Unexpected error:", err);
    (0, response_1.sendError)(res, "Internal server error", 500, err);
};
exports.errorHandler = errorHandler;
