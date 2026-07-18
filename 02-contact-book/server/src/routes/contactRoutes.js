const express = require("express");
const controller = require("../controllers/contactController");
const { asyncHandler } = require("../middleware/errors");

const router = express.Router();

router.get("/", asyncHandler(controller.list));
router.get("/export", asyncHandler(controller.exportCsv));
router.get("/:id", asyncHandler(controller.get));
router.post("/", asyncHandler(controller.create));
router.post("/bulk-delete", asyncHandler(controller.bulkDelete));
router.post("/import", asyncHandler(controller.importCsv));
router.put("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.remove));

module.exports = router;
