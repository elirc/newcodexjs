import { Router } from "express";
import * as controller from "../controllers/controller.js";

const router = Router();
const wrap = (handler: any) => (req: any, res: any, next: any) => Promise.resolve(handler(req, res, next)).catch(next);
router.get("/", wrap(controller.list));
router.get("/stats", wrap(controller.stats));
router.post("/metadata", wrap(controller.metadata));
router.get("/:id", wrap(controller.get));
router.post("/", wrap(controller.create));
router.put("/:id", wrap(controller.update));
router.delete("/:id", wrap(controller.remove));
export default router;
