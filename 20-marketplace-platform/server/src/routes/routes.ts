import { Router } from "express";
import * as controller from "../controllers/controller";

const router = Router();
const wrap = (handler: any) => (req: any, res: any, next: any) => Promise.resolve(handler(req, res, next)).catch(next);

router.get("/", wrap(controller.list));
router.get("/dashboard", wrap(controller.dashboard));
router.get("/activity", wrap(controller.activity));
router.get("/audit", wrap(controller.audit));
router.get("/views", wrap(controller.views));
router.post("/views", wrap(controller.createView));
router.post("/bulk/status", wrap(controller.bulkStatus));
router.get("/:id", wrap(controller.get));
router.post("/", wrap(controller.create));
router.put("/:id", wrap(controller.update));
router.patch("/:id/archive", wrap(controller.archive));
router.patch("/:id/restore", wrap(controller.restore));
router.get("/:id/comments", wrap(controller.comments));
router.post("/:id/comments", wrap(controller.addComment));
router.delete("/:id", wrap(controller.remove));

export default router;
