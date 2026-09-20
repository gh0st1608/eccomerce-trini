import { successResponse } from '../../shared/utils/response.js';
import { HTTP_STATUS } from '../../shared/constants/http-status.js';

export const createOrderController = ({
  listOrdersUseCase,
  createOrderUseCase,
  updateOrderUseCase,
  deleteOrderUseCase,
}) => ({
  listOrders: async (req, res, next) => {
    try {
      const orders = await listOrdersUseCase.execute();
      res.json(successResponse({
        data: { orders },
        message: 'Orders listed successfully', traceId: req.context.traceId,
      }));
    } catch (error) {
      next(error);
    }
  },
  createOrder: async (req, res, next) => {
    try {
      const order = await createOrderUseCase.execute(req.body);
      res.status(HTTP_STATUS.CREATED).json(successResponse({
        data: { order },
        message: 'Order created successfully',
        traceId: req.context.traceId,
      }));
    } catch (error) {
      next(error);
    }
  },
  updateOrder: async (req, res, next) => {
    try {
      const order = await updateOrderUseCase.execute(req.params.id, req.body);
      res.json(successResponse({
        data: { order },
        message: 'Order updated successfully',
        traceId: req.context.traceId,
      }));
    } catch (error) {
      next(error);
    }
  },
  deleteOrder: async (req, res, next) => {
    try {
      await deleteOrderUseCase.execute(req.params.id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  },
});