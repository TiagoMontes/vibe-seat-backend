import type { Request, Response } from 'express';
import { approvalService } from '@/modules/approval/approval.service';

export const approvalController = {
  async getAllPendingApprovals(req: Request, res: Response) {
    const approvals = await approvalService.allPendingApprovals();
    return res.json(approvals);
  },

  async getById(req: Request, res: Response) {
    const id = parseInt(req.params.id as string);
    const approval = await approvalService.getById(id);
    return res.json(approval);
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const { status } = req.body;
      const approverId = (req as any).user?.id;

      if (!['approved', 'rejected'].includes(status)) {
        return res
          .status(400)
          .json({ message: "Status inválido. Use 'approved' ou 'rejected'." });
      }

      const result = await approvalService.updateApprovalStatus(
        id,
        status,
        approverId
      );
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },
};
