# INFORME DE SEGURIDAD Y PLAN DE ROTACIÓN DE VARIABLES DE ENTORNO — HARDMAN

**Fecha de Auditoría:** 2 de noviembre de 2026  
**Auditor:** JARVIS AI Engineering Lead & HARDMAN Security Engine  
**Estado:** AUDITORÍA FASE 0 COMPLETADA — SIN FUGAS EN VERSIONAMIENTO

---

## 1. Verificación de Exclusión de Secretos en Git
- **`.gitignore` auditado:** Confirmada la presencia de `.env`, `.env.*`, `*.pem`, `*.key`.
- **Árbol de Git:** Se verificó mediante `git ls-files .env backend/.env frontend/.env` que ningún archivo con credenciales secretas ha sido añadido al control de versiones.
- **Estado de `.env` en disco:** Tanto `backend/.env` como `frontend/.env` permanecen como archivos locales no versionados (Ignored).

---

## 2. Inventario de Variables Críticas a Rotar

| Variable | Servicio / Destino | Nivel de Riesgo | Justificación de Rotación | Procedimiento Seguro |
|---|---|---|---|---|
| `DATABASE_URL` | Neon Serverless PostgreSQL | **ALTO** | Acceso directo a base de datos de expedientes y clientes | 1. Generar nuevo rol/connection string en Neon Console.<br>2. Probar conectividad con script.<br>3. Actualizar en Render Dashboard.<br>4. Revocar rol anterior tras 24h. |
| `ENCRYPTION_SECRET` | Cifrado AES-256 de mensajes en BD | **CRÍTICO** | Cifra títulos y mensajes procesales de litigantes | 1. Ejecutar `npx ts-node src/scripts/security/reencrypt_conversations.ts --dry-run` para validar que el 100% sea descifrable.<br>2. Ejecutar `--execute --new-secret=<NUEVA_CLAVE>`.<br>3. Actualizar variable en Render.<br>4. Purgar clave vieja. |
| `JWT_SECRET` | Firma de sesiones HTTP Bearer | **MEDIO** | Autenticación de sesiones de usuarios y admin | 1. Generar clave criptográfica aleatoria de 64 bytes (`openssl rand -hex 64`).<br>2. Actualizar en Render.<br>3. Causa re-login transparente en usuarios. |
| `RESEND_API_KEY` | Servicio de correos transaccionales | **MEDIO** | Envío de notificaciones y verificación de cuentas | 1. Generar nueva API Key en panel de Resend.<br>2. Actualizar en Render.<br>3. Revocar clave anterior. |
| `OPENROUTER_API_KEY` | Inferencia de IA (DeepSeek / GPT / GLM) | **MEDIO** | Consumo y facturación de inferencia | 1. Generar nueva key con límite mensual en OpenRouter.<br>2. Actualizar en Render.<br>3. Desactivar key anterior. |

---

## 3. Estado del Script de Re-cifrado (`reencrypt_conversations.ts`)
- **Implementación:** Localizado en `backend/src/scripts/security/reencrypt_conversations.ts`.
- **Salvaguarda activa:** Por defecto opera en modo `--dry-run`.
- **Estado en producción:** **NO EJECUTADO EN PRODUCCIÓN**. Requiere aprobación explícita de Valentino antes de la fase de despliegue.
