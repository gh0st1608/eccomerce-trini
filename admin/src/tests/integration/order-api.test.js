import request from 'supertest';
import { createContainer } from '../../container.js';
import { createApp } from '../../app.js';
import { InMemoryOrderRepository } from '../../infrastructure/repositories/InMemoryOrderRepository.js';

describe('Order API', () => {
  const { logger, controllers } = createContainer({
    overrides: { orderRepository: new InMemoryOrderRepository() },
  });
  const app = createApp({ logger, controllers });
  const adminToken = process.env.ADMIN_AUTH_TOKEN ?? 'trini-admin-local-token';
  const serviceToken = process.env.CHECKOUT_SERVICE_TOKEN ?? 'trini-checkout-service-token';
  const orderPayload = {
    checkoutUrl: 'https://wa.me/51999999999?text=pedido',
    sharedCartUrl: 'https://mayocollections.com/cart/shared?token=test',
    customerPhone: '999999999',
    referenceFirstName: 'Ana',
    referenceLastName: 'Perez Gomez',
    itemCount: 2,
    subtotal: 90,
    delivery: { method: 'courier' },
    items: [
      {
        productId: 'product-1',
        productName: 'Conjunto deportivo',
        quantity: 2,
        unitPrice: 45,
      },
    ],
  };

  test('persists and manages an order with the appropriate credentials', async () => {
    const unauthorizedCreate = await request(app).post('/api/v1/admin/orders').send(orderPayload);
    expect(unauthorizedCreate.status).toBe(401);

    const created = await request(app)
      .post('/api/v1/admin/orders')
      .set('Authorization', `Bearer ${serviceToken}`)
      .send(orderPayload);
    expect(created.status).toBe(201);
    expect(created.body.data.order.status).toBe('active');
    expect(created.body.data.order.paymentStatus).toBe('pending');

    const orderId = created.body.data.order.id;
    const listed = await request(app)
      .get('/api/v1/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listed.status).toBe(200);
    expect(listed.body.data.orders).toHaveLength(1);

    const updated = await request(app)
      .put(`/api/v1/admin/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive', paymentStatus: 'paid' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.order).toMatchObject({ status: 'inactive', paymentStatus: 'paid' });

    const deleted = await request(app)
      .delete(`/api/v1/admin/orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(204);
  });
});