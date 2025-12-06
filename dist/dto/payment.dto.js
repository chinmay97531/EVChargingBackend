"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentDataSchema = void 0;
const zod_1 = require("zod");
exports.getPaymentDataSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
});
