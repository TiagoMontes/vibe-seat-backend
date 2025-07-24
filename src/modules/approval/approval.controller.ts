import type { Request, Response } from 'express';
import { approvalService } from '@/modules/approval/approval.service';
import type { ApprovalQueryParams, ApprovalFilters } from '@/modules/approval/types';

const validateAndParseQueryParams = (query: ApprovalQueryParams): ApprovalFilters => {
  // Parse and validate page
  let page = parseInt(query.page || '1', 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  // Parse and validate limit
  let limit = parseInt(query.limit || '9', 10);
  if (isNaN(limit) || limit < 1 || limit > 50) {
    limit = 9;
  }

  // Validate status
  const validStatuses = ['pending', 'approved', 'rejected'];
  const status = query.status && validStatuses.includes(query.status) ? query.status : undefined;

  // Validate sortBy
  const validSortOptions = ['newest', 'oldest', 'user-asc', 'user-desc'];
  const sortBy = query.sortBy && validSortOptions.includes(query.sortBy) ? query.sortBy : 'newest';

  // Sanitize search
  const search = query.search ? query.search.trim() : undefined;

  return {
    page,
    limit,
    search,
    status,
    sortBy,
  };
};

export const approvalController = {
  getAllPendingApprovals: async (req: Request, res: Response) => {
    const approvals = await approvalService.allPendingApprovals();
    return res.json(approvals);
  },

  getAll: async (req: Request<{}, {}, {}, ApprovalQueryParams>, res: Response) => {
    try {
      // Check if any pagination/filter parameters are provided
      const hasQueryParams = Object.keys(req.query).length > 0;

      if (hasQueryParams) {
        // Use pagination when query parameters are present
        const filters = validateAndParseQueryParams(req.query);
        const result = await approvalService.getAllWithPagination(filters);
        return res.json(result);
      } else {
        // Maintain backward compatibility - return all approvals without pagination
        const result = await approvalService.getAll();
        return res.json(result);
      }
    } catch (error) {
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const approval = await approvalService.getById(id);
    return res.json(approval);
  },

  updateStatus: async (req: Request, res: Response) => {
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
