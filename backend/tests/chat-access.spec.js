import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/database.js', () => ({
  query: vi.fn(),
}));

let app;
let query;

const TICKET_ID = 'ticket-chat-1';

const buildToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET);

const buildTicket = (overrides = {}) => ({
  id: TICKET_ID,
  status: 'assigned',
  client_id: 'client-1',
  technician_id: 'tech-1',
  ...overrides,
});

const buildMessage = (overrides = {}) => ({
  id: 'msg-1',
  ticket_id: TICKET_ID,
  sender_id: 'client-1',
  message: 'Hola soporte',
  attachment_url: null,
  is_system: false,
  created_at: '2026-03-01T00:00:00.000Z',
  ...overrides,
});

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';

  ({ default: app } = await import('../src/app.js'));
  ({ query } = await import('../src/config/database.js'));
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/tickets/:id/messages chat access', () => {
  it('returns 403 when non-assigned technician tries to write', async () => {
    const token = buildToken('tech-2', 'technician');
    query.mockResolvedValueOnce({ rows: [buildTicket()] });

    const response = await request(app)
      .post(`/api/tickets/${TICKET_ID}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Intento no autorizado' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No autorizado para enviar mensajes en este ticket');
  });

  it('returns 403 when client tries to write in pending ticket', async () => {
    const token = buildToken('client-1', 'client');
    query.mockResolvedValueOnce({
      rows: [buildTicket({ status: 'pending', technician_id: null })],
    });

    const response = await request(app)
      .post(`/api/tickets/${TICKET_ID}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'No deberia pasar' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No autorizado para enviar mensajes en este ticket');
  });

  it('returns 201 when assigned technician writes', async () => {
    const token = buildToken('tech-1', 'technician');
    query
      .mockResolvedValueOnce({ rows: [buildTicket()] })
      .mockResolvedValueOnce({
        rows: [buildMessage({ sender_id: 'tech-1', message: 'Atendiendo el caso' })],
      });

    const response = await request(app)
      .post(`/api/tickets/${TICKET_ID}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Atendiendo el caso' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message.sender_id).toBe('tech-1');
  });

  it('returns 201 when ticket owner client writes in assigned ticket', async () => {
    const token = buildToken('client-1', 'client');
    query
      .mockResolvedValueOnce({ rows: [buildTicket()] })
      .mockResolvedValueOnce({
        rows: [buildMessage({ sender_id: 'client-1', message: 'Gracias por tomarlo' })],
      });

    const response = await request(app)
      .post(`/api/tickets/${TICKET_ID}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Gracias por tomarlo' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message.sender_id).toBe('client-1');
  });

  it('returns 403 when previous technician tries to write after release', async () => {
    const token = buildToken('tech-1', 'technician');
    query.mockResolvedValueOnce({
      rows: [buildTicket({ status: 'pending', technician_id: null })],
    });

    const response = await request(app)
      .post(`/api/tickets/${TICKET_ID}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Sigo escribiendo luego de liberar' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No autorizado para enviar mensajes en este ticket');
  });
});
