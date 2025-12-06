"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const car_controller_1 = require("../controllers/car.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const carController = new car_controller_1.CarController();
router.delete("/:carId", auth_1.authMiddleware, carController.deleteCar);
exports.default = router;
