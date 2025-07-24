import type { Request, Response } from 'express';
import { userService } from '@/modules/user/user.service';
import type { UserQueryParams, UserFilters } from '@/modules/user/types';

const validateAndParseQueryParams = (query: UserQueryParams): UserFilters => {
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

  // Parse roleId if provided
  let roleId: number | undefined;
  if (query.roleId) {
    roleId = parseInt(query.roleId, 10);
    if (isNaN(roleId)) {
      roleId = undefined;
    }
  }

  // Validate sortBy
  const validSortOptions = ['newest', 'oldest', 'username-asc', 'username-desc'];
  const sortBy = query.sortBy && validSortOptions.includes(query.sortBy) ? query.sortBy : 'newest';

  // Sanitize search
  const search = query.search ? query.search.trim() : undefined;

  return {
    page,
    limit,
    search,
    status,
    roleId,
    sortBy,
  };
};

export const userController = {
  create: async (req: Request, res: Response) => {
    try {
      const { username, password, roleId } = req.body;
      const user = await userService.create(username, password, roleId);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  getAll: async (req: Request<{}, {}, {}, UserQueryParams>, res: Response) => {
    try {
      // Check if any pagination/filter parameters are provided
      const hasQueryParams = Object.keys(req.query).length > 0;

      if (hasQueryParams) {
        // Use pagination when query parameters are present
        const filters = validateAndParseQueryParams(req.query);
        const result = await userService.getAllWithPagination(filters);
        return res.json(result);
      } else {
        // Maintain backward compatibility - return all users without pagination
        const users = await userService.getAll();
        return res.json(users);
      }
    } catch (error) {
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    const user = await userService.getById(Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  },

  delete: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await userService.delete(id);
    return res.status(200).json({
      message: 'Usuário excluído com sucesso',
      deletedId: id
    });
  },
};
