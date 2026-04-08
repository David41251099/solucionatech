# Matriz de Trazabilidad

## Proposito

Relacionar los objetivos del sistema con la implementacion efectiva del repositorio para fines academicos, de auditoria tecnica o presentacion.

| Requisito | Estado | Evidencia |
|---|---|---|
| Plataforma web de soporte tecnico | Implementado | `frontend/src/app/routes.tsx`, `backend/src/app.js` |
| Roles diferenciados para clientes y tecnicos | Implementado | `frontend/src/components/auth/ProtectedRoute.tsx`, `backend/src/middleware/auth.js` |
| Gestion de tickets | Implementado | `backend/src/routes/ticket.routes.js`, `frontend/src/services/ticket.service.ts` |
| Chat en tiempo real por ticket | Implementado | `backend/src/socket/index.js`, `frontend/src/context/ChatContext.tsx` |
| Autenticacion con JWT | Implementado | `backend/src/controllers/auth.controller.js`, `frontend/src/services/auth.service.ts` |
| Uploads seguros | Implementado | `backend/src/config/multer.js`, `backend/src/middleware/uploadSecurity.js` |
| Guias de auto-diagnostico | Implementado | `frontend/src/pages/Guides.tsx`, `frontend/src/data/guides.ts` |
| Pruebas automatizadas | Implementado | `backend/tests`, `frontend/src/components/chat/__tests__`, `frontend/src/pages/__tests__` |
| Integracion continua | Implementado | `.github/workflows/backend.yml`, `.github/workflows/frontend.yml` |
| Validacion con usuarios finales | Pendiente de ejecucion documentada | `docs/METODOLOGIA_VALIDACION.md`, `docs/RESULTADOS_ENCUESTA_Y_USABILIDAD_TEMPLATE.md` |

## Flujo funcional trazable

1. El usuario consulta guias.
2. Si requiere asistencia, crea un ticket.
3. Un tecnico toma el ticket y lo mueve a `assigned`.
4. Cliente y tecnico se comunican por chat.
5. El tecnico avanza el caso a `in_progress` y luego a `resolved`.
6. El sistema preserva trazabilidad de mensajes y archivos adjuntos.
