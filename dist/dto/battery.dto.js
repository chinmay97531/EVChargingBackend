"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBatteryStatusSchema = void 0;
const zod_1 = require("zod");
exports.getBatteryStatusSchema = zod_1.z.object({
    carId: zod_1.z.string().optional(),
});
