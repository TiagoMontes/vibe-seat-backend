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
    try {
      const approvals = await approvalService.allPendingApprovals();
      return res.status(200).json({
        success: true,
        message: 'Aprovações pendentes listadas com sucesso',
        data: approvals,
        total: approvals.length
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true
      });
    }
  },

  getAll: async (req: Request<{}, {}, {}, ApprovalQueryParams>, res: Response) => {
    try {
      // Check if any pagination/filter parameters are provided
      const hasQueryParams = Object.keys(req.query).length > 0;

      if (hasQueryParams) {
        // Use pagination when query parameters are present
        const filters = validateAndParseQueryParams(req.query);
        const result = await approvalService.getAllWithPagination(filters);
        return res.status(200).json({
          success: true,
          message: 'Aprovações listadas com sucesso',
          data: result
        });
      } else {
        // Maintain backward compatibility - return all approvals without pagination
        const result = await approvalService.getAll();
        return res.status(200).json({
          success: true,
          message: 'Aprovações listadas com sucesso',
          data: result,
          total: result.length
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true
      });
    }
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true
        });
      }

      const approval = await approvalService.getById(id);
      
      if (!approval) {
        return res.status(404).json({
          success: false,
          message: 'Aprovação não encontrada',
          data: null,
          error: true
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Aprovação encontrada',
        data: approval
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true
      });
    }
  },

  updateStatus: async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const approverId = (req as any).user?.id;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: true
        });
      }

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status inválido. Use 'approved' ou 'rejected'.",
          error: true
        });
      }

      const result = await approvalService.updateApprovalStatus(
        id,
        status,
        approverId
      );
      
      return res.status(200).json({
        success: true,
        message: `Aprovação ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`,
        data: result
      });
    } catch (err: any) {
      if (err.message === 'Aprovação não encontrada') {
        return res.status(404).json({
          success: false,
          message: err.message,
          error: true
        });
      }
      return res.status(500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: true
      });
    }
  },
};
