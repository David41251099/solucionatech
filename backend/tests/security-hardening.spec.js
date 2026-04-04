import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/database.js', () => ({
  query: vi.fn(),
}));

let app;
let query;
let tempDir;

const buildToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET);

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';

  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'soluciona-hardening-'));
  ({ default: app } = await import('../src/app.js'));
  ({ query } = await import('../src/config/database.js'));
});

afterAll(() => {
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Security hardening', () => {
  it('returns 403 when client accesses another client ticket', async () => {
    const token = buildToken('client-1', 'client');
    query.mockResolvedValueOnce({
      rows: [
        {
          id: 'ticket-1',
          client_id: 'client-2',
          technician_id: 'tech-1',
          status: 'assigned',
        },
      ],
    });

    const response = await request(app)
      .get('/api/tickets/ticket-1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('returns 403 when non-assigned technician tries to change status', async () => {
    const token = buildToken('tech-2', 'technician');
    query.mockResolvedValueOnce({
      rows: [
        {
          id: 'ticket-1',
          status: 'assigned',
          technician_id: 'tech-1',
        },
      ],
    });

    const response = await request(app)
      .patch('/api/tickets/ticket-1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('returns 403 when client tries to assign ticket', async () => {
    const token = buildToken('client-1', 'client');

    const response = await request(app)
      .patch('/api/tickets/ticket-1/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('returns 200 when technician takes pending ticket', async () => {
    const token = buildToken('tech-1', 'technician');
    query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'ticket-1',
            status: 'pending',
            technician_id: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'ticket-1',
            status: 'assigned',
            technician_id: 'tech-1',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ name: 'Tech Uno' }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'msg-system-1',
            ticket_id: 'ticket-1',
            sender_id: null,
            message: 'Técnico Tech Uno ha sido asignado',
            type: 'system',
            system_event: 'TECHNICIAN_ASSIGNED',
            is_system: true,
            attachment_url: null,
            created_at: '2026-04-04T00:00:00.000Z',
          },
        ],
      });

    const response = await request(app)
      .patch('/api/tickets/ticket-1/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.ticket.technician_id).toBe('tech-1');
    expect(response.body.data.ticket.status).toBe('assigned');
  });

  it('returns 403 when second technician tries to take an already taken ticket', async () => {
    const token = buildToken('tech-2', 'technician');
    query.mockResolvedValueOnce({
      rows: [
        {
          id: 'ticket-1',
          status: 'assigned',
          technician_id: 'tech-1',
        },
      ],
    });

    const response = await request(app)
      .patch('/api/tickets/ticket-1/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('El ticket ya fue tomado por otro técnico');
  });

  it('returns 400 when uploading invalid file type', async () => {
    const token = buildToken('tech-1', 'technician');
    const invalidPath = path.join(tempDir, 'payload.txt');
    fs.writeFileSync(invalidPath, 'not-an-image');

    const response = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', invalidPath);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('returns 200 when assigned technician changes status', async () => {
    const token = buildToken('tech-1', 'technician');
    query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'ticket-1',
            status: 'assigned',
            technician_id: 'tech-1',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'ticket-1',
            status: 'in_progress',
            technician_id: 'tech-1',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'msg-system-2',
            ticket_id: 'ticket-1',
            sender_id: null,
            message: 'El ticket cambió a in_progress',
            type: 'system',
            system_event: 'STATUS_CHANGED',
            is_system: true,
            attachment_url: null,
            created_at: '2026-04-04T00:00:00.000Z',
          },
        ],
      });

    const response = await request(app)
      .patch('/api/tickets/ticket-1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.ticket.status).toBe('in_progress');
  });

  it('returns 413 when uploading file over 5MB', async () => {
    const token = buildToken('tech-1', 'technician');
    const largePath = path.join(tempDir, 'large.png');
    fs.writeFileSync(largePath, Buffer.alloc(6 * 1024 * 1024, 0));

    const response = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', largePath);

    expect(response.status).toBe(413);
    expect(response.body.success).toBe(false);
  });

  it('returns 400 when uploading with double extension', async () => {
    const token = buildToken('tech-1', 'technician');
    const payloadPath = path.join(tempDir, 'payload.bin');
    fs.writeFileSync(payloadPath, Buffer.from('hello', 'utf8'));

    const response = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', payloadPath, 'avatar.jpg.exe');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
