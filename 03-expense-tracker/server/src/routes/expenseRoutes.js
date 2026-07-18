const express = require("express");
const controller = require("../controllers/expenseController");
const { asyncHandler } = require("../middleware/errors");

const router = express.Router();
router.get("/", asyncHandler(controller.list));
router.get("/export", asyncHandler(controller.exportCsv));
router.get("/:id", asyncHandler(controller.get));
router.post("/", asyncHandler(controller.create));
router.put("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));
module.exports = router;
