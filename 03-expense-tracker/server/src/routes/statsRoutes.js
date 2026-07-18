const express = require("express");
const controller = require("../controllers/statsController");
const { asyncHandler } = require("../middleware/errors");

const router = express.Router();
router.get("/monthly", asyncHandler(controller.monthly));
router.get("/weekly", asyncHandler(controller.weekly));
router.get("/by-category", asyncHandler(controller.byCategory));
router.get("/daily-trend", asyncHandler(controller.daily));
module.exports = router;
