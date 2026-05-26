import request from "supertest";
import jwt from "jsonwebtoken";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/database.js", () => ({
  query: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

let app;
let query;
let bcrypt;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";
  process.env.NODE_ENV = "test";

  ({ default: app } = await import("../src/app.js"));
  ({ query } = await import("../src/config/database.js"));
  ({ default: bcrypt } = await import("bcrypt"));
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("returns 200 for valid credentials", async () => {
    query.mockResolvedValueOnce({
      rows: [
        {
          id: "user-1",
          name: "Demo User",
          email: "demo@test.com",
          password: "hashed-password",
          role: "client",
          created_at: "2026-03-01T00:00:00.000Z",
        },
      ],
    });
    bcrypt.compare.mockResolvedValueOnce(true);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "demo@test.com", password: "123456" });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe("demo@test.com");
    expect(response.body.data.token).toBeTypeOf("string");
  });

  it("returns 401 for invalid credentials", async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "invalid@test.com", password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });
});

describe("POST /api/tickets", () => {
  it("creates ticket for authenticated client", async () => {
    const token = jwt.sign({ userId: "client-1", role: "client" }, process.env.JWT_SECRET);

    query
      .mockResolvedValueOnce({
        rows: [{ city: "Bucaramanga" }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "ticket-1",
            title: "No enciende",
            description: "Mi PC no enciende",
            status: "pending",
            client_id: "client-1",
            city: "Bucaramanga",
          },
        ],
      });

    const response = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "No enciende",
        description: "Mi PC no enciende",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.ticket.title).toBe("No enciende");
    expect(response.body.data.ticket.city).toBe("Bucaramanga");
  });
});

describe("GET /api/tickets/:id/messages", () => {
  it("returns messages for authorized ticket participant", async () => {
    const token = jwt.sign({ userId: "client-1", role: "client" }, process.env.JWT_SECRET);

    query
      .mockResolvedValueOnce({
        rows: [{ client_id: "client-1", technician_id: "tech-1" }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "msg-1",
            ticket_id: "ticket-1",
            sender_id: "client-1",
            message: "Necesito ayuda",
            created_at: "2026-03-01T00:00:00.000Z",
          },
        ],
      });

    const response = await request(app)
      .get("/api/tickets/ticket-1/messages")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.messages)).toBe(true);
    expect(response.body.data.messages).toHaveLength(1);
  });
});
