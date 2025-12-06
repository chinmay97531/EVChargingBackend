"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCarSchema = void 0;
const zod_1 = require("zod");
exports.deleteCarSchema = zod_1.z.object({
    carId: zod_1.z.string().min(1, "Car ID is required"),
});
