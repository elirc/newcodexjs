const express = require("express");
const controller = require("../controllers/budgetController");
const { asyncHandler } = require("../middleware/errors");

const router = express.Router();
router.get("/", asyncHandler(controller.list));
router.post("/", asyncHandler(controller.upsert));
router.delete("/:id", asyncHandler(controller.remove));
module.exports = router;
