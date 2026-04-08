import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/database.js', () => ({
  query: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

let app;
let query;
let bcrypt;
let logger;
let tempDir;

const TICKET_ID = 'ticket-critical-1';

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
  id: 'message-1',
  ticket_id: TICKET_ID,
  sender_id: 'tech-1',
  message: 'Mensaje de prueba',
  attachment_url: null,
  type: 'text',
  system_event: null,
  is_system: false,
  created_at: '2026-04-04T00:00:00.000Z',
  ...overrides,
});

const writeFile = (filename, buffer) => {
  const filePath = path.join(tempDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};

const createValidPng = (filename = 'valid.png') => {
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47,
    0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d,
  ]);

  return writeFile(filename, pngHeader);
};

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';

  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'soluciona-security-critical-'));

  ({ default: app } = await import('../src/app.js'));
  ({ query } = await import('../src/config/database.js'));
  ({ default: bcrypt } = await import('bcrypt'));
  ({ logger } = await import('../src/config/logger.js'));
});

afterAll(() => {
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Security critical audit coverage', () => {
  describe('AUTH', () => {
    it('returns 401 when login user does not exist', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: '123456' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('returns 401 when login password is incorrect', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            id: 'client-1',
            name: 'Client One',
            email: 'client@test.com',
            password: 'hashed-pass',
            role: 'client',
            created_at: '2026-04-04T00:00:00.000Z',
          },
        ],
      });
      bcrypt.compare.mockResolvedValueOnce(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'client@test.com', password: 'wrong-password' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('returns 401 when token is missing in protected endpoint', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token');
    });

    it('returns 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Tickets and chat access control', () => {
    it('returns 403 when client tries to view another client ticket', async () => {
      const token = buildToken('client-1', 'client');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ client_id: 'client-2' })],
      });

      const response = await request(app)
        .get(`/api/tickets/${TICKET_ID}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('returns 403 when non-assigned technician changes status', async () => {
      const token = buildToken('tech-2', 'technician');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ technician_id: 'tech-1', status: 'assigned' })],
      });

      const response = await request(app)
        .patch(`/api/tickets/${TICKET_ID}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('returns 403 when non-assigned technician sends message', async () => {
      const token = buildToken('tech-2', 'technician');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ technician_id: 'tech-1', status: 'assigned' })],
      });

      const response = await request(app)
        .post(`/api/tickets/${TICKET_ID}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'No deberia poder enviar' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('returns 200 when assigned technician changes status assigned -> in_progress', async () => {
      const token = buildToken('tech-1', 'technician');
      query
        .mockResolvedValueOnce({ rows: [buildTicket({ status: 'assigned' })] })
        .mockResolvedValueOnce({
          rows: [buildTicket({ status: 'in_progress' })],
        })
        .mockResolvedValueOnce({
          rows: [
            buildMessage({
              id: 'sys-1',
              sender_id: null,
              type: 'system',
              system_event: 'STATUS_CHANGED',
              is_system: true,
              message: 'El ticket cambió a in_progress',
            }),
          ],
        });

      const response = await request(app)
        .patch(`/api/tickets/${TICKET_ID}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticket.status).toBe('in_progress');
    });

    it('returns 201 when assigned technician sends message', async () => {
      const token = buildToken('tech-1', 'technician');
      query
        .mockResolvedValueOnce({ rows: [buildTicket({ status: 'assigned' })] })
        .mockResolvedValueOnce({
          rows: [
            buildMessage({
              id: 'msg-tech-ok',
              sender_id: 'tech-1',
              message: 'Estoy revisando tu caso',
            }),
          ],
        });

      const response = await request(app)
        .post(`/api/tickets/${TICKET_ID}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Estoy revisando tu caso' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message.sender_id).toBe('tech-1');
    });

    it('returns 201 when client owner writes in assigned ticket', async () => {
      const token = buildToken('client-1', 'client');
      query
        .mockResolvedValueOnce({ rows: [buildTicket({ status: 'assigned' })] })
        .mockResolvedValueOnce({
          rows: [
            buildMessage({
              id: 'msg-client-assigned',
              sender_id: 'client-1',
              message: 'Gracias, pendiente de tu respuesta',
            }),
          ],
        });

      const response = await request(app)
        .post(`/api/tickets/${TICKET_ID}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Gracias, pendiente de tu respuesta' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('returns 201 when client owner writes in in_progress ticket', async () => {
      const token = buildToken('client-1', 'client');
      query
        .mockResolvedValueOnce({ rows: [buildTicket({ status: 'in_progress' })] })
        .mockResolvedValueOnce({
          rows: [
            buildMessage({
              id: 'msg-client-progress',
              sender_id: 'client-1',
              message: 'Quedo atento',
            }),
          ],
        });

      const response = await request(app)
        .post(`/api/tickets/${TICKET_ID}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Quedo atento' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('returns 403 when client owner writes in pending ticket', async () => {
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
    });

    it('returns 403 when previous technician writes after release', async () => {
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
    });

    it('returns 403 with closed message when sending to resolved ticket', async () => {
      const token = buildToken('client-1', 'client');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ status: 'resolved', technician_id: 'tech-1' })],
      });

      const response = await request(app)
        .post(`/api/tickets/${TICKET_ID}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Mensaje fuera de tiempo' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('El ticket está cerrado y no permite nuevos mensajes');
    });

    it('returns 403 with closed message when sending to cancelled ticket', async () => {
      const token = buildToken('client-1', 'client');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ status: 'cancelled', technician_id: null })],
      });

      const response = await request(app)
        .post(`/api/tickets/${TICKET_ID}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Mensaje en ticket cancelado' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('El ticket está cerrado y no permite nuevos mensajes');
    });

    it('logs unauthorized_chat_attempt when user tries unauthorized chat access', async () => {
      const token = buildToken('tech-2', 'technician');
      const warnSpy = vi.spyOn(logger, 'warn');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ status: 'assigned', technician_id: 'tech-1' })],
      });

      const response = await request(app)
        .post(`/api/tickets/${TICKET_ID}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Intento no autorizado' });

      expect(response.status).toBe(403);
      expect(warnSpy).toHaveBeenCalled();

      const calledWithUnauthorizedAction = warnSpy.mock.calls.some(([payload]) =>
        payload && typeof payload === 'object' && payload.action === 'unauthorized_chat_attempt'
      );
      expect(calledWithUnauthorizedAction).toBe(true);

      warnSpy.mockRestore();
    });
  });

  describe('State transition rules', () => {
    it('allows pending -> assigned through assign endpoint', async () => {
      const token = buildToken('tech-1', 'technician');
      query
        .mockResolvedValueOnce({
          rows: [buildTicket({ status: 'pending', technician_id: null })],
        })
        .mockResolvedValueOnce({
          rows: [buildTicket({ status: 'assigned', technician_id: 'tech-1' })],
        })
        .mockResolvedValueOnce({ rows: [{ name: 'Tech Uno' }] })
        .mockResolvedValueOnce({
          rows: [
            buildMessage({
              id: 'sys-assign',
              sender_id: null,
              type: 'system',
              system_event: 'TECHNICIAN_ASSIGNED',
              is_system: true,
              message: 'Técnico Tech Uno ha sido asignado',
            }),
          ],
        });

      const response = await request(app)
        .patch(`/api/tickets/${TICKET_ID}/assign`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticket.status).toBe('assigned');
    });

    it('rejects pending -> in_progress direct status update by non-owner technician', async () => {
      const token = buildToken('tech-1', 'technician');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ status: 'pending', technician_id: null })],
      });

      const response = await request(app)
        .patch(`/api/tickets/${TICKET_ID}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('rejects assigned -> pending transition', async () => {
      const token = buildToken('tech-1', 'technician');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ status: 'assigned', technician_id: 'tech-1' })],
      });

      const response = await request(app)
        .patch(`/api/tickets/${TICKET_ID}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'pending' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('rejects resolved -> in_progress transition', async () => {
      const token = buildToken('tech-1', 'technician');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ status: 'resolved', technician_id: 'tech-1' })],
      });

      const response = await request(app)
        .patch(`/api/tickets/${TICKET_ID}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('allows in_progress -> resolved transition for assigned technician', async () => {
      const token = buildToken('tech-1', 'technician');
      query
        .mockResolvedValueOnce({
          rows: [buildTicket({ status: 'in_progress', technician_id: 'tech-1' })],
        })
        .mockResolvedValueOnce({
          rows: [buildTicket({ status: 'resolved', technician_id: 'tech-1' })],
        })
        .mockResolvedValueOnce({
          rows: [
            buildMessage({
              id: 'sys-resolved',
              sender_id: null,
              type: 'system',
              system_event: 'STATUS_CHANGED',
              is_system: true,
              message: 'El ticket cambió a resolved',
            }),
          ],
        });

      const response = await request(app)
        .patch(`/api/tickets/${TICKET_ID}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'resolved' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticket.status).toBe('resolved');
    });
  });

  describe('Upload security', () => {
    it('returns 400 for disallowed extension (.exe)', async () => {
      const token = buildToken('tech-1', 'technician');
      const invalidFilePath = writeFile('payload.exe', Buffer.from('MZ')); 

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', invalidFilePath);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('returns 400 for double extension payload', async () => {
      const token = buildToken('tech-1', 'technician');
      const payloadPath = writeFile('payload.bin', Buffer.from('not-image'));

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', payloadPath, 'avatar.jpg.exe');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('returns 413 for files larger than 5MB', async () => {
      const token = buildToken('tech-1', 'technician');
      const largePath = writeFile('large.png', Buffer.alloc(6 * 1024 * 1024, 0));

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', largePath);

      expect(response.status).toBe(413);
      expect(response.body.success).toBe(false);
    });

    it('returns 201 for valid png upload', async () => {
      const token = buildToken('tech-1', 'technician');
      const pngPath = createValidPng();

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', pngPath, 'safe-image.png');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toContain('/uploads/');
    });
  });

  describe('Data integrity constraints at controller boundary', () => {
    it('returns 409 when pending ticket already has technician_id', async () => {
      const token = buildToken('tech-1', 'technician');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ status: 'pending', technician_id: 'tech-1' })],
      });

      const response = await request(app)
        .patch(`/api/tickets/${TICKET_ID}/assign`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('returns 409 when assigned ticket has null technician_id', async () => {
      const token = buildToken('tech-1', 'technician');
      query.mockResolvedValueOnce({
        rows: [buildTicket({ status: 'assigned', technician_id: null })],
      });

      const response = await request(app)
        .patch(`/api/tickets/${TICKET_ID}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });
});
