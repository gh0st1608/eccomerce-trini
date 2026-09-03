import { successResponse } from '../../shared/utils/response.js';
import { HTTP_STATUS } from '../../shared/constants/http-status.js';

export const createInternalUserController = ({
  listInternalUsersUseCase,
  createInternalUserUseCase,
}) => ({
  listInternalUsers: async (req, res, next) => {
    try {
      const users = await listInternalUsersUseCase.execute();
      res.json(
        successResponse({
          data: { users },
          message: 'Internal users listed successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  createInternalUser: async (req, res, next) => {
    try {
      const user = await createInternalUserUseCase.execute(req.body);
      res.status(HTTP_STATUS.CREATED).json(
        successResponse({
          data: { user },
          message: 'Internal user created successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
});
