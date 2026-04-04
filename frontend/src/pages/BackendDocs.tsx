import { useState } from "react";
import { Header } from "../components/Header";
import {
  FolderOpen,
  Database,
  Lock,
  Globe,
  ShieldCheck,
  ChevronRight,
  Copy,
  Check,
  Server,
  User,
  Wrench,
  ArrowRight,
  AlertCircle,
  Ticket,
  GitBranch,
  AlertTriangle,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Tiny copy-to-clipboard button
───────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors text-slate-300 hover:text-white"
      title="Copiar"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Code block
───────────────────────────────────────────── */
function CodeBlock({ code, lang = "sql" }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg overflow-hidden mt-4">
      <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 border-b border-slate-700">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-2 text-xs text-slate-400 font-mono">{lang}</span>
      </div>
      <div className="relative bg-slate-900 p-4 overflow-x-auto">
        <CopyButton text={code} />
        <pre className="text-sm text-slate-200 font-mono leading-relaxed whitespace-pre">
          {code}
        </pre>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Section title
───────────────────────────────────────────── */
function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800 mb-4">
      <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-blue-700" />
      </span>
      {children}
    </h2>
  );
}

/* ─────────────────────────────────────────────
   Inline badge
───────────────────────────────────────────── */
function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    orange: "bg-orange-100 text-orange-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
    gray: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Info box
───────────────────────────────────────────── */
function InfoBox({ type = "info", children }: { type?: "info" | "warning"; children: React.ReactNode }) {
  const s =
    type === "warning"
      ? "bg-amber-50 border-amber-300 text-amber-800"
      : "bg-blue-50 border-blue-300 text-blue-800";
  return (
    <div className={`flex gap-3 border rounded-lg p-4 mt-4 ${s}`}>
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 1 — Estructura de carpetas
───────────────────────────────────────────── */
const folderCode = `solucionatech-backend/
├── src/
│   ├── config/
│   │   └── db.js          # Pool de conexión PostgreSQL
│   │
│   ├── middleware/
│   │   └── auth.js        # Verificación JWT + adjuntar req.user
│   │
│   ├── routes/
│   │   ├── auth.routes.js    # POST /auth/register, login, GET /me
│   │   └── ticket.routes.js  # CRUD de tickets
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── ticket.controller.js
│   │
│   └── app.js             # Express app + montaje de rutas
│
├── .env                   # Variables de entorno (no subir a git)
├── package.json
└── server.js              # Punto de entrada (app.listen)`;

function TabFolderStructure() {
  return (
    <div className="space-y-6">
      <SectionTitle icon={FolderOpen}>Estructura de carpetas recomendada</SectionTitle>
      <p className="text-slate-600 text-sm leading-relaxed">
        Arquitectura plana MVC simplificada: <strong>config → middleware → routes → controllers</strong>.
        Sin capas de servicios adicionales para mantener el MVP legible.
      </p>
      <CodeBlock code={folderCode} lang="bash" />

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {[
          { file: "config/db.js", desc: "Exporta un pool de pg (node-postgres). Todas las queries pasan por aquí." },
          { file: "middleware/auth.js", desc: "Verifica el token JWT del header Authorization. Rechaza con 401 si es inválido." },
          { file: "routes/*.routes.js", desc: "Solo define paths y aplica middlewares. Delega lógica al controller." },
          { file: "controllers/*.controller.js", desc: "Contiene la lógica de negocio, queries SQL y construcción de respuestas." },
          { file: "app.js", desc: "Configura Express, CORS, JSON body-parser y monta las rutas." },
          { file: ".env", desc: "DATABASE_URL, JWT_SECRET, PORT. Nunca se sube al repositorio." },
        ].map((item) => (
          <div key={item.file} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="font-mono text-sm text-blue-700 font-semibold mb-1">{item.file}</p>
            <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <InfoBox>
        Dependencias necesarias: <strong>express, pg, bcryptjs, jsonwebtoken, dotenv, cors</strong>.
        Opcionalmente <strong>express-validator</strong> para validaciones básicas.
      </InfoBox>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 2 — Esquema SQL
───────────────────────────────────────────── */
const sqlSchema = `-- ─── Extensión para UUID ────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TABLA: users ────────────────────────────────────────
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(120)  NOT NULL,
  email      VARCHAR(255)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,          -- bcrypt hash
  role       VARCHAR(20)   NOT NULL DEFAULT 'client'
                           CHECK (role IN ('client', 'technician')),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── TABLA: tickets ──────────────────────────────────────
CREATE TABLE tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(200)  NOT NULL,
  description   TEXT          NOT NULL,
  status        VARCHAR(30)   NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','assigned','in_progress')),
  priority      VARCHAR(20)   NOT NULL DEFAULT 'medium'
                              CHECK (priority IN ('low','medium','high')),
  client_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Índices básicos ─────────────────────────────────────
CREATE INDEX idx_tickets_client     ON tickets(client_id);
CREATE INDEX idx_tickets_technician ON tickets(technician_id);
CREATE INDEX idx_tickets_status     ON tickets(status);

-- ─── Trigger: actualiza updated_at automáticamente ───────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();`;

function TabSQLSchema() {
  return (
    <div className="space-y-6">
      <SectionTitle icon={Database}>Esquema SQL — PostgreSQL</SectionTitle>
      <p className="text-slate-600 text-sm leading-relaxed">
        Modelo mínimo con solo <strong>2 tablas</strong>: <code className="bg-slate-100 px-1 rounded">users</code> y <code className="bg-slate-100 px-1 rounded">tickets</code>.
        Relación 1-N entre usuario y tickets creados, y 1-N entre técnico y tickets asignados.
      </p>
      <CodeBlock code={sqlSchema} lang="sql" />

      <div className="mt-6">
        <h3 className="font-semibold text-slate-700 mb-3">Diagrama de relaciones</h3>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* users box */}
          <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50 min-w-[200px]">
            <p className="font-semibold text-blue-800 text-sm mb-2">👤 users</p>
            {["id (PK)", "name", "email", "password", "role", "created_at"].map((f) => (
              <p key={f} className="font-mono text-xs text-slate-600">{f}</p>
            ))}
          </div>
          <div className="flex flex-col gap-2 text-xs text-slate-500 text-center">
            <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> client_id (1-N)</span>
            <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> technician_id (1-N nullable)</span>
          </div>
          {/* tickets box */}
          <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50 min-w-[220px]">
            <p className="font-semibold text-green-800 text-sm mb-2">🎫 tickets</p>
            {["id (PK)", "title", "description", "status", "priority", "client_id (FK)", "technician_id (FK)", "created_at", "updated_at"].map((f) => (
              <p key={f} className="font-mono text-xs text-slate-600">{f}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-2">
        <div className="bg-slate-50 border rounded-lg p-4">
          <p className="font-semibold text-slate-700 text-sm mb-2">Estados de ticket</p>
          <div className="flex flex-wrap gap-2">
            {[["pending","yellow"],["assigned","orange"],["in_progress","blue"]].map(([s,c]) => (
              <Badge key={s} color={c}>{s}</Badge>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 border rounded-lg p-4">
          <p className="font-semibold text-slate-700 text-sm mb-2">Prioridades</p>
          <div className="flex flex-wrap gap-2">
            {[["low","gray"],["medium","orange"],["high","red"]].map(([p,c]) => (
              <Badge key={p} color={c}>{p}</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 3 — Flujo de autenticación
───────────────────────────────────────────── */
const registerCode = `// POST /auth/register
async function register(req, res) {
  const { name, email, password, role } = req.body;

  // 1. Verificar que el email no exista
  const exists = await db.query(
    'SELECT id FROM users WHERE email = $1', [email]
  );
  if (exists.rows.length) {
    return res.status(409).json({ error: 'Email ya registrado' });
  }

  // 2. Hashear contraseña con bcrypt (cost factor 12)
  const hash = await bcrypt.hash(password, 12);

  // 3. Insertar usuario
  const { rows } = await db.query(
    \`INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4) RETURNING id, name, email, role\`,
    [name, email, hash, role ?? 'client']
  );

  // 4. Firmar JWT (expira en 7 días)
  const token = jwt.sign(
    { userId: rows[0].id, role: rows[0].role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({ token, user: rows[0] });
}`;

const middlewareCode = `// middleware/auth.js
import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  // 1. Leer header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  // 2. Extraer y verificar token
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;   // { userId, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Uso en rutas protegidas:
// router.get('/tickets', authenticate, ticketController.list);`;

function TabAuthFlow() {
  const steps = [
    { n: "1", icon: User, title: "Registro / Login", desc: "El cliente envía email + password. El servidor valida, hashea con bcrypt y devuelve un JWT firmado con userId y role en el payload." },
    { n: "2", icon: Lock, title: "Token almacenado", desc: "El frontend guarda el JWT en memoria o localStorage. Cada request protegido lo envía en el header: Authorization: Bearer <token>" },
    { n: "3", icon: ShieldCheck, title: "Middleware auth.js", desc: "Antes de ejecutar el controller, el middleware extrae y verifica el JWT. Si es válido, adjunta req.user = { userId, role } al request." },
    { n: "4", icon: Server, title: "Controller ejecuta", desc: "El controller usa req.user.userId para saber quién hace la acción y req.user.role para aplicar las reglas de autorización." },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle icon={Lock}>Flujo de autenticación JWT</SectionTitle>
      <p className="text-slate-600 text-sm leading-relaxed">
        Autenticación stateless con <strong>JWT</strong>. No hay sesiones en servidor ni refresh tokens en el MVP.
        El token expira en 7 días y contiene el <code className="bg-slate-100 px-1 rounded">userId</code> y el <code className="bg-slate-100 px-1 rounded">role</code>.
      </p>

      {/* Flow steps */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step.n} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {step.n}
              </div>
              {i < steps.length - 1 && <div className="w-0.5 h-8 bg-blue-200 my-1" />}
            </div>
            <div className="pb-4">
              <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <step.icon className="w-4 h-4 text-blue-600" />
                {step.title}
              </p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle icon={User}>Implementación: registro</SectionTitle>
      <CodeBlock code={registerCode} lang="javascript" />

      <SectionTitle icon={ShieldCheck}>Implementación: middleware</SectionTitle>
      <CodeBlock code={middlewareCode} lang="javascript" />

      <InfoBox>
        El JWT <strong>no debe contener información sensible</strong> (contraseña, datos bancarios, etc.) ya que su payload es decodificable sin clave. Solo incluye <code>userId</code> y <code>role</code>.
      </InfoBox>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 4 — Endpoints
───────────────────────────────────────────── */
const endpoints = [
  {
    method: "POST", path: "/auth/register",
    auth: false, roles: "—",
    desc: "Registra un usuario nuevo. Devuelve JWT + datos del usuario.",
    body: '{ "name": "string", "email": "string", "password": "string", "role": "client|technician" }',
    response: '{ "token": "jwt...", "user": { "id", "name", "email", "role" } }',
  },
  {
    method: "POST", path: "/auth/login",
    auth: false, roles: "—",
    desc: "Autentica credenciales. Devuelve JWT si son correctas.",
    body: '{ "email": "string", "password": "string" }',
    response: '{ "token": "jwt...", "user": { "id", "name", "email", "role" } }',
  },
  {
    method: "GET", path: "/auth/me",
    auth: true, roles: "client | technician",
    desc: "Devuelve los datos del usuario autenticado según el JWT.",
    body: "—",
    response: '{ "id", "name", "email", "role", "created_at" }',
  },
  {
    method: "POST", path: "/tickets",
    auth: true, roles: "client",
    desc: "Crea un ticket. client_id se toma del JWT (req.user.userId).",
    body: '{ "title": "string", "description": "string", "priority": "low|medium|high" }',
    response: '{ "id", "title", "status": "open", "priority", "client_id", "created_at" }',
  },
  {
    method: "GET", path: "/tickets",
    auth: true, roles: "client | technician",
    desc: "Lista tickets. Cliente ve solo los suyos; técnico ve todos.",
    body: "—",
    response: '[{ "id", "title", "status", "priority", "client_id", "technician_id" }]',
  },
  {
    method: "GET", path: "/tickets/:id",
    auth: true, roles: "client | technician",
    desc: "Detalle de un ticket. Cliente solo puede ver los suyos.",
    body: "—",
    response: '{ "id", "title", "description", "status", "priority", "client_id", "technician_id", ... }',
  },
  {
    method: "PATCH", path: "/tickets/:id",
    auth: true, roles: "client | technician",
    desc: "Actualiza ticket. Técnico puede cambiar status y asignarse. Cliente no puede cambiar status.",
    body: '{ "status"?: "...", "priority"?: "...", "technician_id"?: "uuid" }',
    response: '{ ticket actualizado completo }',
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-800",
  POST: "bg-blue-100 text-blue-800",
  PATCH: "bg-orange-100 text-orange-800",
  DELETE: "bg-red-100 text-red-800",
};

function TabEndpoints() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      <SectionTitle icon={Globe}>Endpoints de la API</SectionTitle>
      <p className="text-slate-600 text-sm leading-relaxed">
        Base URL: <code className="bg-slate-100 px-2 py-0.5 rounded">http://localhost:3000</code> — 7 endpoints mínimos para el MVP.
        Haz clic en cada endpoint para ver el detalle.
      </p>

      <div className="space-y-2">
        {endpoints.map((ep, i) => (
          <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
            >
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold font-mono w-14 justify-center ${methodColors[ep.method]}`}>
                {ep.method}
              </span>
              <span className="font-mono text-sm text-slate-700 font-semibold flex-1">{ep.path}</span>
              {ep.auth
                ? <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">🔒 JWT</span>
                : <span className="text-xs bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded">Público</span>
              }
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${open === i ? "rotate-90" : ""}`} />
            </button>
            {open === i && (
              <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-slate-600 text-sm">{ep.desc}</p>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Roles permitidos</p>
                    <Badge color={ep.roles === "—" ? "gray" : "blue"}>{ep.roles}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Body (JSON)</p>
                    <code className="text-xs text-slate-700 bg-white border rounded px-2 py-1 block">{ep.body}</code>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Response (200/201)</p>
                    <code className="text-xs text-slate-700 bg-white border rounded px-2 py-1 block">{ep.response}</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <InfoBox>
        Todos los endpoints protegidos requieren el header: <strong>Authorization: Bearer &lt;token&gt;</strong>
      </InfoBox>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 5 — Autorización
───────────────────────────────────────────── */
const authzCode = `// Ejemplo en ticket.controller.js

// ── GET /tickets ─────────────────────────────
async function list(req, res) {
  const { userId, role } = req.user;

  let query, params;
  if (role === 'client') {
    // Cliente solo ve sus propios tickets
    query = 'SELECT * FROM tickets WHERE client_id = $1 ORDER BY created_at DESC';
    params = [userId];
  } else {
    // Técnico ve todos los tickets
    query = 'SELECT * FROM tickets ORDER BY created_at DESC';
    params = [];
  }

  const { rows } = await db.query(query, params);
  res.json(rows);
}

// ── PATCH /tickets/:id ───────────────────────
async function update(req, res) {
  const { userId, role } = req.user;
  const { id } = req.params;
  const { status, priority, technician_id } = req.body;

  // Obtener ticket para validar propiedad
  const { rows } = await db.query(
    'SELECT * FROM tickets WHERE id = $1', [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Ticket no encontrado' });

  const ticket = rows[0];

  // Regla: cliente solo puede modificar sus tickets
  if (role === 'client' && ticket.client_id !== userId) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  // Regla: cliente NO puede cambiar el status
  if (role === 'client' && status) {
    return res.status(403).json({ error: 'No puedes cambiar el estado del ticket' });
  }

  // Construir SET dinámico solo con campos permitidos
  const updates = [];
  const values  = [];
  let   idx     = 1;

  if (role === 'technician' && status) {
    updates.push(\`status = $\${idx++}\`);
    values.push(status);
  }
  if (priority) {
    updates.push(\`priority = $\${idx++}\`);
    values.push(priority);
  }
  if (role === 'technician' && technician_id) {
    updates.push(\`technician_id = $\${idx++}\`);
    values.push(technician_id);
  }

  if (!updates.length) {
    return res.status(400).json({ error: 'Sin campos para actualizar' });
  }

  values.push(id);
  const result = await db.query(
    \`UPDATE tickets SET \${updates.join(', ')} WHERE id = $\${idx} RETURNING *\`,
    values
  );
  res.json(result.rows[0]);
}`;

const rules = [
  { action: "Registrarse", client: true, tech: true, note: "" },
  { action: "Iniciar sesión", client: true, tech: true, note: "" },
  { action: "Ver perfil propio (/me)", client: true, tech: true, note: "" },
  { action: "Crear ticket", client: true, tech: false, note: "Solo clientes crean tickets" },
  { action: "Ver lista de tickets", client: true, tech: true, note: "Cliente: solo los suyos. Técnico: todos" },
  { action: "Ver detalle de ticket", client: true, tech: true, note: "Cliente: solo si es su ticket" },
  { action: "Cambiar status del ticket", client: false, tech: true, note: "Solo técnicos pueden actualizar status" },
  { action: "Asignarse un ticket", client: false, tech: true, note: "El técnico actualiza technician_id con su propio userId" },
  { action: "Cambiar prioridad", client: false, tech: true, note: "Solo técnicos" },
];

function TabAuthorization() {
  return (
    <div className="space-y-6">
      <SectionTitle icon={ShieldCheck}>Reglas de autorización</SectionTitle>
      <p className="text-slate-600 text-sm leading-relaxed">
        La autorización se implementa directamente en cada controller usando <code className="bg-slate-100 px-1 rounded">req.user.role</code>.
        No hay librerías externas de RBAC — son simples <code className="bg-slate-100 px-1 rounded">if/else</code> por rol.
      </p>

      {/* Roles summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-blue-700" />
            <p className="font-semibold text-blue-800">Rol: client</p>
          </div>
          <ul className="space-y-1 text-sm text-blue-700">
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5" /> Crear sus propios tickets</li>
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5" /> Ver lista de sus tickets</li>
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5" /> Ver detalle de sus tickets</li>
            <li className="flex items-center gap-2 text-red-500"><span className="w-3.5 h-3.5 font-bold">✗</span> Cambiar estado o prioridad</li>
            <li className="flex items-center gap-2 text-red-500"><span className="w-3.5 h-3.5 font-bold">✗</span> Ver tickets de otros clientes</li>
          </ul>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-5 h-5 text-green-700" />
            <p className="font-semibold text-green-800">Rol: technician</p>
          </div>
          <ul className="space-y-1 text-sm text-green-700">
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5" /> Ver TODOS los tickets</li>
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5" /> Cambiar status del ticket</li>
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5" /> Cambiar prioridad</li>
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5" /> Asignarse un ticket (technician_id)</li>
            <li className="flex items-center gap-2 text-red-500"><span className="w-3.5 h-3.5 font-bold">✗</span> Crear tickets (rol de cliente)</li>
          </ul>
        </div>
      </div>

      {/* Permisos tabla */}
      <h3 className="font-semibold text-slate-700 mt-2">Tabla de permisos completa</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-4 py-3 text-slate-600 font-semibold">Acción</th>
              <th className="px-4 py-3 text-slate-600 font-semibold text-center">client</th>
              <th className="px-4 py-3 text-slate-600 font-semibold text-center">technician</th>
              <th className="text-left px-4 py-3 text-slate-600 font-semibold">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((r, i) => (
              <tr key={i} className="bg-white hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-700">{r.action}</td>
                <td className="px-4 py-2.5 text-center">
                  {r.client ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-400">✗</span>}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {r.tech ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-400">✗</span>}
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{r.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle icon={Server}>Implementación en controller</SectionTitle>
      <CodeBlock code={authzCode} lang="javascript" />

      <InfoBox type="warning">
        En el MVP no se implementa refresh token. Si el JWT expira, el usuario debe volver a iniciar sesión. Para producción real, considera agregar un endpoint <code>POST /auth/refresh</code>.
      </InfoBox>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 6 — Módulo Tickets (controller completo)
───────────────────────────────────────────── */

const ticketRoutesCode = `// routes/ticket.routes.js
const router           = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ticket           = require('../controllers/ticket.controller');

// Todas las rutas requieren JWT válido
router.post('/',     authenticate, ticket.create);   // Solo client
router.get('/',      authenticate, ticket.list);     // client→suyos | tech→todos
router.get('/:id',   authenticate, ticket.getById);  // client→solo suyo | tech→cualquiera
router.patch('/:id', authenticate, ticket.update);   // Solo technician

module.exports = router;

// ─── Montaje en app.js ───────────────────────────────────────
// const ticketRoutes = require('./routes/ticket.routes');
// app.use('/tickets', ticketRoutes);`;

const ticketConstantsCode = `// controllers/ticket.controller.js
const db = require('../config/db');

// ══════════════════════════════════════════════════════════════
// CONSTANTES DE DOMINIO
// ══════════════════════════════════════════════════════════════

const VALID_STATUSES   = ['pending', 'in_progress', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// Máquina de estados: define qué transiciones son permitidas.
// Un ticket SOLO puede avanzar — nunca retroceder.
const STATUS_TRANSITIONS = {
  pending:     ['in_progress'],  // técnico toma el ticket
  in_progress: ['resolved'],     // técnico cierra el ticket
  resolved:    [],               // estado FINAL — inmutable
};`;

const ticketCreateCode = `// ══════════════════════════════════════════════════════════════
// POST /tickets
// Restricción: solo role === 'client'
// status inicial = 'pending', technician_id = NULL (servidor)
// ══════════════════════════════════════════════════════════════
async function create(req, res) {
  try {
    const { userId, role } = req.user;

    // REGLA: solo clientes pueden abrir tickets
    if (role !== 'client') {
      return res.status(403).json({
        error: 'Solo los clientes pueden crear tickets',
      });
    }

    const { title, description, priority = 'medium' } = req.body;

    // Validar presencia de campos obligatorios
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        error: 'title y description son obligatorios',
      });
    }

    // Validar que la prioridad sea un valor del dominio
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: \`priority debe ser: \${VALID_PRIORITIES.join(', ')}\`,
      });
    }

    // INSERT — status y technician_id los controla el servidor.
    // El cliente NO puede inyectarlos desde el body.
    const { rows } = await db.query(
      \`INSERT INTO tickets (title, description, priority, status, client_id, technician_id)
       VALUES ($1, $2, $3, 'pending', $4, NULL)
       RETURNING *\`,
      [title.trim(), description.trim(), priority, userId]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[POST /tickets]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}`;

const ticketListCode = `// ══════════════════════════════════════════════════════════════
// GET /tickets
// client     → solo sus tickets  (WHERE client_id = userId)
// technician → todos los tickets (sin filtro)
// ══════════════════════════════════════════════════════════════
async function list(req, res) {
  try {
    const { userId, role } = req.user;
    let query, params;

    if (role === 'client') {
      // Visibilidad RESTRINGIDA: el cliente solo ve los suyos
      query = \`
        SELECT
          t.*,
          u.name AS client_name
        FROM tickets t
        JOIN users u ON u.id = t.client_id
        WHERE t.client_id = $1
        ORDER BY t.created_at DESC
      \`;
      params = [userId];
    } else {
      // Visibilidad TOTAL: el técnico ve todos los tickets
      query = \`
        SELECT
          t.*,
          u.name  AS client_name,
          tu.name AS technician_name
        FROM tickets t
        JOIN      users u  ON u.id  = t.client_id
        LEFT JOIN users tu ON tu.id = t.technician_id
        ORDER BY t.created_at DESC
      \`;
      params = [];
    }

    const { rows } = await db.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error('[GET /tickets]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}`;

const ticketGetByIdCode = `// ══════════════════════════════════════════════════════════════
// GET /tickets/:id
// client     → solo si ticket.client_id === req.user.userId
// technician → cualquier ticket sin restricción
// ══════════════════════════════════════════════════════════════
async function getById(req, res) {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    const { rows } = await db.query(
      \`SELECT
          t.*,
          u.name  AS client_name,
          tu.name AS technician_name
       FROM tickets t
       JOIN      users u  ON u.id  = t.client_id
       LEFT JOIN users tu ON tu.id = t.technician_id
       WHERE t.id = $1\`,
      [id]
    );

    // Ticket inexistente
    if (!rows.length) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const ticket = rows[0];

    // REGLA: el cliente solo puede ver sus propios tickets
    if (role === 'client' && ticket.client_id !== userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    return res.json(ticket);
  } catch (err) {
    console.error('[GET /tickets/:id]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}`;

const ticketUpdateCode = `// ══════════════════════════════════════════════════════════════
// PATCH /tickets/:id
// Solo técnicos. Campos permitidos: status, priority, assign.
//
// REGLAS (en orden de evaluación):
//   1. Cliente → 403 inmediato
//   2. Ticket 'resolved' → 409 (estado final, inmutable)
//   3. status → solo transiciones de STATUS_TRANSITIONS
//   4. priority → debe estar en VALID_PRIORITIES
//   5. assign:true → solo si technician_id IS NULL (self-assign)
// ══════════════════════════════════════════════════════════════
async function update(req, res) {
  try {
    const { userId, role } = req.user;
    const { id } = req.params;

    // REGLA 1: los clientes no pueden modificar tickets
    if (role === 'client') {
      return res.status(403).json({
        error: 'Los clientes no pueden modificar tickets',
      });
    }

    // Obtener ticket actual para validar todas las reglas
    const { rows } = await db.query(
      'SELECT * FROM tickets WHERE id = $1',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const ticket = rows[0];

    // REGLA 2: estado 'resolved' es INMUTABLE
    if (ticket.status === 'resolved') {
      return res.status(409).json({
        error: 'El ticket está resuelto y no puede modificarse',
      });
    }

    const { status, priority, assign } = req.body;

    // ── Construcción dinámica del SET ─────────────────────────
    const updates = [];
    const values  = [];
    let   idx     = 1;

    // ── status ────────────────────────────────────────────────
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: \`status inválido. Opciones: \${VALID_STATUSES.join(', ')}\`,
        });
      }

      // REGLA 3: validar transición de estado (máquina de estados)
      const allowed = STATUS_TRANSITIONS[ticket.status];
      if (!allowed.includes(status)) {
        const hint = allowed.length
          ? \`Siguiente permitido: \${allowed.join(', ')}\`
          : 'El ticket ya está en su estado final';
        return res.status(422).json({
          error: \`Transición inválida: '\${ticket.status}' → '\${status}'. \${hint}\`,
        });
      }

      updates.push(\`status = $\${idx++}\`);
      values.push(status);
    }

    // ── priority ──────────────────────────────────────────────
    if (priority !== undefined) {
      // REGLA 4: prioridad debe pertenecer al dominio
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          error: \`priority inválida. Opciones: \${VALID_PRIORITIES.join(', ')}\`,
        });
      }
      updates.push(\`priority = $\${idx++}\`);
      values.push(priority);
    }

    // ── assign (self-assign) ──────────────────────────────────
    if (assign === true) {
      // REGLA 5: solo asignar si el ticket está libre
      if (ticket.technician_id !== null) {
        return res.status(409).json({
          error: 'El ticket ya tiene un técnico asignado',
        });
      }
      // Se usa userId del JWT — NO se acepta technician_id del body
      // Esto previene que un técnico se asigne tickets a otro
      updates.push(\`technician_id = $\${idx++}\`);
      values.push(userId);
    }

    // Sin campos válidos en el body
    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Sin campos para actualizar. Usa: status, priority, assign',
      });
    }

    values.push(id);
    const result = await db.query(
      \`UPDATE tickets
         SET    \${updates.join(', ')}
         WHERE  id = $\${idx}
         RETURNING *\`,
      values
    );

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[PATCH /tickets/:id]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { create, list, getById, update };`;

// Error codes table data
const errorTable = [
  { code: "400", label: "Bad Request",    when: "Campo obligatorio ausente o valor fuera del dominio",           example: "title vacío, priority='urgent'" },
  { code: "401", label: "Unauthorized",   when: "JWT ausente, malformado o expirado",                            example: "No envías el header Authorization" },
  { code: "403", label: "Forbidden",      when: "El rol no tiene permiso para esa operación",                    example: "client intenta PATCH /tickets/:id" },
  { code: "404", label: "Not Found",      when: "El ticket con el id dado no existe en la base de datos",        example: "GET /tickets/uuid-inexistente" },
  { code: "409", label: "Conflict",       when: "Conflicto de estado: ticket resuelto o técnico ya asignado",    example: "assign:true en ticket ya asignado" },
  { code: "422", label: "Unprocessable",  when: "Transición de estado inválida según la máquina de estados",    example: "'resolved' → 'pending'" },
  { code: "500", label: "Server Error",   when: "Error inesperado de base de datos u otro error no controlado",  example: "Pool de conexiones agotado" },
];

// State machine nodes
const stateNodes = [
  { id: "pending",     label: "pending",     color: "bg-yellow-100 border-yellow-400 text-yellow-800",  desc: "Ticket abierto, sin técnico" },
  { id: "in_progress", label: "in_progress", color: "bg-blue-100 border-blue-400 text-blue-800",        desc: "Técnico asignado, en trabajo" },
  { id: "resolved",    label: "resolved",    color: "bg-green-100 border-green-400 text-green-800",     desc: "Cerrado — estado final" },
];

function TabTicketModule() {
  const [section, setSection] = useState<string>("routes");

  const sections = [
    { id: "routes",   label: "Rutas",          icon: Globe },
    { id: "constants",label: "Constantes",     icon: GitBranch },
    { id: "create",   label: "create()",       icon: Ticket },
    { id: "list",     label: "list()",         icon: Ticket },
    { id: "getById",  label: "getById()",      icon: Ticket },
    { id: "update",   label: "update()",       icon: ShieldCheck },
  ];

  const codeMap: Record<string, { code: string; title: string; desc: string }> = {
    routes:    { code: ticketRoutesCode,    title: "ticket.routes.js",    desc: "Registro de las 4 rutas. Solo aplica authenticate — la autorización por rol va en cada controller." },
    constants: { code: ticketConstantsCode, title: "Constantes de dominio", desc: "Los estados y prioridades válidos se definen como constantes. La máquina de estados (STATUS_TRANSITIONS) es la única fuente de verdad para las transiciones." },
    create:    { code: ticketCreateCode,    title: "POST /tickets — create()", desc: "Solo clientes. status y technician_id los fija el servidor, no el body." },
    list:      { code: ticketListCode,      title: "GET /tickets — list()",    desc: "Query condicional según rol. Cliente: WHERE client_id. Técnico: sin filtro con JOIN a technician." },
    getById:   { code: ticketGetByIdCode,   title: "GET /tickets/:id — getById()", desc: "Una sola query con JOIN. Después del fetch se aplica la regla de propiedad para el cliente." },
    update:    { code: ticketUpdateCode,    title: "PATCH /tickets/:id — update()", desc: "El controller más complejo. 5 reglas en cascada antes de construir el SET dinámico." },
  };

  const active = codeMap[section];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <SectionTitle icon={Ticket}>Módulo de Tickets — Controller completo</SectionTitle>
        <p className="text-slate-600 text-sm leading-relaxed">
          Implementación completa de los 4 endpoints de tickets con autorización por rol,
          validaciones de dominio y máquina de estados. Sin librerías externas de autorización.
        </p>
      </div>

      {/* Máquina de estados visual */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="flex items-center gap-2 font-semibold text-slate-700 mb-5">
          <GitBranch className="w-4 h-4 text-blue-600" />
          Máquina de estados del ticket
        </h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
          {stateNodes.map((node, i) => (
            <div key={node.id} className="flex items-center gap-2">
              <div className={`border-2 rounded-xl px-5 py-3 text-center min-w-[130px] ${node.color}`}>
                <p className="font-mono text-sm font-bold">{node.label}</p>
                <p className="text-xs mt-0.5 opacity-75">{node.desc}</p>
              </div>
              {i < stateNodes.length - 1 && (
                <div className="flex flex-col items-center mx-1 sm:mx-3">
                  <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block" />
                  <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 sm:hidden" />
                  <span className="text-xs text-slate-400 hidden sm:block">técnico</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border rounded px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400" /> pending → in_progress: técnico se asigna y avanza
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border rounded px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-green-400" /> in_progress → resolved: técnico cierra el ticket
          </span>
          <span className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2.5 py-1">
            <AlertTriangle className="w-3 h-3" /> resolved es INMUTABLE — ningún cambio permitido
          </span>
        </div>
      </div>

      {/* Resumen de reglas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { n: "R1", color: "bg-blue-600",  title: "Solo client crea",     desc: "POST /tickets verifica role === 'client' antes de hacer la query" },
          { n: "R2", color: "bg-purple-600",title: "Visibilidad por rol",  desc: "GET /tickets usa query diferente según client o technician" },
          { n: "R3", color: "bg-orange-600",title: "Solo tech modifica",   desc: "PATCH /tickets rechaza clientes con 403 en la primera línea" },
          { n: "R4", color: "bg-green-600", title: "Sin retroceso",        desc: "STATUS_TRANSITIONS define el único camino hacia adelante" },
        ].map((r) => (
          <div key={r.n} className="border border-slate-200 rounded-lg overflow-hidden">
            <div className={`${r.color} text-white px-3 py-2 flex items-center gap-2`}>
              <span className="font-bold text-sm">{r.n}</span>
              <span className="text-sm font-medium">{r.title}</span>
            </div>
            <div className="p-3 bg-white">
              <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Code navigator */}
      <div>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          ticket.controller.js — navegación por sección
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                section === s.id
                  ? "bg-blue-700 text-white border-blue-700"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-1">
          <p className="font-semibold text-blue-800 text-sm">{active.title}</p>
          <p className="text-blue-600 text-xs mt-0.5">{active.desc}</p>
        </div>
        <CodeBlock code={active.code} lang="javascript" />
      </div>

      {/* Error codes */}
      <div>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Tabla de códigos HTTP del módulo
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold w-16">HTTP</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold w-32">Label</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold">¿Cuándo se lanza?</th>
                <th className="text-left px-4 py-3 text-slate-600 font-semibold hidden md:table-cell">Ejemplo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {errorTable.map((row) => {
                const codeColor: Record<string, string> = {
                  "400": "bg-orange-100 text-orange-700",
                  "401": "bg-yellow-100 text-yellow-700",
                  "403": "bg-red-100 text-red-700",
                  "404": "bg-slate-100 text-slate-600",
                  "409": "bg-purple-100 text-purple-700",
                  "422": "bg-pink-100 text-pink-700",
                  "500": "bg-red-200 text-red-800",
                };
                return (
                  <tr key={row.code} className="bg-white hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${codeColor[row.code]}`}>
                        {row.code}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs font-mono">{row.label}</td>
                    <td className="px-4 py-2.5 text-slate-700 text-xs">{row.when}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs hidden md:table-cell">{row.example}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <InfoBox type="warning">
        El campo <strong>technician_id</strong> del body en PATCH es ignorado intencionalmente. El técnico solo puede asignarse a sí mismo usando <code>assign: true</code> — esto previene que un técnico asigne tickets a otro técnico (escalación de privilegios).
      </InfoBox>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const tabs = [
  { id: "folder",  label: "Estructura",     icon: FolderOpen,  Component: TabFolderStructure },
  { id: "sql",     label: "Esquema SQL",     icon: Database,    Component: TabSQLSchema },
  { id: "auth",    label: "Flujo Auth",      icon: Lock,        Component: TabAuthFlow },
  { id: "api",     label: "Endpoints",       icon: Globe,       Component: TabEndpoints },
  { id: "roles",   label: "Autorización",    icon: ShieldCheck, Component: TabAuthorization },
  { id: "tickets", label: "Módulo Tickets",  icon: Ticket,      Component: TabTicketModule },
];

export function BackendDocs() {
  const [activeTab, setActiveTab] = useState("folder");
  const ActiveComp = tabs.find((t) => t.id === activeTab)!.Component;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showAuth />

      {/* Page header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-3">
            <Server className="w-4 h-4" />
            <span>SolucionaTech</span>
            <ChevronRight className="w-3 h-3" />
            <span>Documentación Backend</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Arquitectura Backend — MVP</h1>
          <p className="text-blue-200 text-sm max-w-2xl">
            Diseño simple, limpio y listo para producción académica. Node.js · Express · JWT · PostgreSQL.
            Sin microservicios, sin patrones complejos.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {["Node.js", "Express", "PostgreSQL", "JWT", "bcryptjs", "node-postgres"].map((t) => (
              <span key={t} className="text-xs bg-white/15 border border-white/25 rounded px-2.5 py-1 font-mono">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
          <ActiveComp />
        </div>
      </div>

      <footer className="border-t border-slate-200 py-6 px-4 text-center text-slate-400 text-xs">
        SolucionaTech Backend Docs · MVP Académico · 2026
      </footer>
    </div>
  );
}