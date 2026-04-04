# Matriz de Trazabilidad - Propuesta de Grado vs Sistema

## Flujo oficial implementado
Auto-diagnostico con guias -> escalamiento por ticket -> atencion por tecnico en chat.

| Requisito de propuesta | Estado | Evidencia técnica |
|---|---|---|
| Plataforma web de soporte técnico | Implementado | `frontend/src/app/routes.tsx`, `backend/src/app.js` |
| Acceso a información clara para no especializados | Implementado | `frontend/src/pages/Guides.tsx`, `frontend/src/data/guides.ts` |
| Guías prácticas para fallas frecuentes | Implementado | `frontend/src/data/guides.ts` |
| Escalamiento a soporte cuando guía no funciona | Implementado | `frontend/src/pages/Guides.tsx` (CTA por rol/login) |
| Gestión de tickets cliente-tecnico | Implementado | `backend/src/routes/ticket.routes.js`, `frontend/src/services/ticket.service.ts` |
| Chat en tiempo real | Implementado | `backend/src/socket/index.js`, `frontend/src/context/ChatContext.tsx` |
| Validación con usuarios reales | Pendiente de ejecución | `docs/METODOLOGIA_VALIDACION.md` (instrumento y protocolo) |
| Pruebas unitarias/funcionales mínimas | Implementado | `frontend/src/pages/__tests__/Guides.test.tsx`, `backend/tests/api.spec.js` |

