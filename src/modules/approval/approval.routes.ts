import { Router } from "express";
import { approvalController } from "./approval.controller";
import { isAdmin } from "@/middleware/authMiddleware";

const router = Router();

router.get("/", approvalController.getAllPendingApprovals);
router.get("/:id", approvalController.getById);
router.patch("/:id", isAdmin, approvalController.updateStatus);

export const approvalRoutes = router;