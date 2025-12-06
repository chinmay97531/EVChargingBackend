"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
    const response = {
        success: true,
        message,
        data,
    };
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 400, error) => {
    const response = {
        success: false,
        message,
        error: (error === null || error === void 0 ? void 0 : error.message) || error,
    };
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
