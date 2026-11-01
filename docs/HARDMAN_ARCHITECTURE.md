# HARDMAN — AI ARCHITECTURE SPECIFICATION
**Especificación Técnica de Arquitectura de Inteligencia Artificial Jurídica**  
**Versión:** 2.0.0-PROD  
**Fecha:** 01 de Noviembre de 2026  
**Módulo:** `backend/src/ai`

---

## 1. Visión y Principios Rectores

La arquitectura de IA de Hardman se rige por tres principios innegociables:
1. **Verificabilidad Jurídica:** Ninguna cita de jurisprudencia o artículo normativo se entrega al usuario con indicación de certeza si no cuenta con respaldo documental en el compendio oficial verificado.
2. **Transparencia Total de Inferencia:** El sistema siempre reporta de manera explícita qué proveedor (`openrouter`, `groq`, `gemini`, etc.) y qué modelo (`gemini-2.5-flash`, `llama-3.3-70b`, etc.) procesó la consulta, registrando cualquier fallback con su causa raíz.
3. **Desacoplamiento y Modularidad:** La lógica jurídica, el enrutamiento de modelos, la memoria del caso y la validación de citas operan como módulos independientes y testeables sin acoplamiento monolítico.

---

## 2. Flujo Arquitectónico Unificado

```text
USUARIO (Frontend)
   │
   ▼
[1] AUTENTICACIÓN & CONTROL DE CUOTAS (AuthMiddleware + SubscriptionEngine)
   │
   ▼
[2] CLASIFICACIÓN DE TAREA & IDENTIFICACIÓN DE AGENTE (AgentRegistry)
   │
   ▼
[3] RECUPERACIÓN DE MEMORIA DEL EXPEDIENTE (CaseMemoryManager)
   │
   ▼
[4] RECUPERACIÓN DOCUMENTAL HÍBRIDA (RetrievalManager - RAG + SPIJ)
   │
   ▼
[5] ENSAMBLAJE DINÁMICO DE CONTEXTO (PromptManager)
   │
   ▼
[6] ENRUTAMIENTO DE MODELO Y PROVEEDOR (ModelRouter)
   │
   ▼
[7] ADAPTADOR DE PROVEEDOR & INFERENCIA (ProviderAdapter)
   │
   ▼
[8] VALIDADOR JURÍDICO DE CITAS Y VIGENCIA (LegalCitationValidator)
   │
   ▼
[9] CONTROLADOR DE CALIDAD ESTRUCTURAL (ResponseQualityController)
   │
   ▼
[10] RESPUESTA SUPERVISADA + TELEMETRÍA (AuditLogger + Stream / JSON)
```

---

## 3. Componentes Centrales

### 3.1 AI Orchestrator (`src/ai/aiOrchestrator.ts`)
Punto de entrada único para el procesamiento de consultas jurídicas y generación documental. Coordina secuencialmente la memoria, la búsqueda documental, el enrutamiento a proveedores, la validación posterior a la inferencia y el registro de telemetría.

### 3.2 Model Router (`src/ai/modelRouter.ts`)
Selecciona el modelo óptimo según el tipo de tarea:
- **`LEGAL_CONSULTATION`:** `deepseek/deepseek-chat` (Alta fidelidad dogmática en castellano, bajo costo).
- **`EXPEDIENTE_ANALYSIS`:** `google/gemini-2.5-flash` (Ventana de 1M tokens para expedientes judiciales de cientos de fojas).
- **`DOCUMENT_DRAFTING`:** `google/gemini-2.5-flash` / `anthropic/claude-3.5-sonnet` (Densidad y formato procesal formal).
- **`QUICK_ANSWER`:** `llama-3.3-70b-versatile` en Groq (Latencia ultrabaja < 300ms).

Gestiona la cascada de fallbacks de forma transparente registrando:
- `requestedModel` vs `actualModel`
- `fallbackTriggered: boolean`
- `fallbackReason: 'TIMEOUT' | 'RATE_LIMIT' | 'CREDITS_EXHAUSTED' | 'SERVER_ERROR'`

### 3.3 Provider Adapter (`src/ai/providerAdapter.ts`)
Capa de abstracción agnóstica a proveedores:
- Soporta OpenRouter, Groq, Google Gemini Direct, OpenAI Direct, DeepSeek Direct y Anthropic Direct.
- Normaliza parámetros (`temperature: 0.1 - 0.2`, `max_tokens`, `top_p`).
- Control de streaming mediante generadores asíncronos y SSE.
- Detección precisa de errores HTTP (`401`, `402`, `429`, `503`) evitando reintentos infinitos y facturación duplicada.

### 3.4 Prompt Manager (`src/ai/promptManager.ts`)
Construye contextos ordenados por capas jerárquicas:
1. **Capa 0:** Directiva Suprema Anti-Alucinación y Anclaje Temporal a Octubre 2026.
2. **Capa 1:** Prompt Especializado del Agente Titular (Civil, Penal, Familia, etc.).
3. **Capa 2:** Memoria Estructurada del Caso y Directivas Procesales del Abogado.
4. **Capa 3:** Membrete y Datos de Colegiatura CAL / Casilla SINOE.
5. **Capa 4:** Corpus Verificado del RAG (Fragmentos de Ley y Jurisprudencia).

### 3.5 Retrieval Manager (`src/ai/retrievalManager.ts`)
Ejecuta la recuperación híbrida:
- Búsqueda semántica vectorial con embeddings de 768 dimensiones.
- Búsqueda léxica estructurada por número de artículo y código normativo.
- Búsqueda en el compendio jurisprudencial oficial (`spijLegalEngine`).
- Filtro de relevancia y descarte de fragmentos de materias incompatibles.

### 3.6 Legal Citation Validator (`src/ai/legalCitationValidator.ts`)
El corazón de la fiabilidad jurídica de Hardman:
- Analiza sintácticamente y semánticamente el texto producido antes de la entrega final.
- Extrae todas las menciones de casaciones (`Casación N° ...`), acuerdos plenarios y artículos.
- Clasifica cada referencia en uno de 5 estados:
  1. `VERIFIED`: Coincide exactamente con la jurisprudencia o norma oficial en base de datos.
  2. `EXISTENCE_VERIFIED_CONTENT_UNVERIFIED`: El número de expediente existe, pero la doctrina o fundamento atribuido no ha sido corroborado textualmente.
  3. `UNVERIFIED_CLAIM`: La cita no figura en el compendio oficial. Se re-etiqueta obligatoriamente como *«Criterio interpretativo de la defensa»* o se retira.
  4. `CONTRADICTED`: La afirmación contradice el precedente vinculante.
  5. `REPEALED_NORM`: La norma citada fue derogada (ej. Ley 30225, D.S. 004-2019-JUS).
- Bloquea la emisión de badges de verificación para citas de tipo 3, 4 y 5.

### 3.7 Response Quality Controller (`src/ai/responseQualityController.ts`)
Supervisa el cumplimiento de directivas procesales:
- Si el usuario solicitó *Contestación y Reconvención*, verifica que ambos extremos figuren en el documento.
- Si el usuario subió una resolución de inadmisibilidad por el Art. 131 CPC (firma de parte), verifica que el escrito no culpe falsamente al abogado de omitir la firma.
- Impide que una plantilla de error o respuesta mock sea guardada como respuesta exitosa.

---

## 4. Estructura de Datos de Metadatos Transparentes

Cada respuesta emitida por la API de Hardman al cliente contiene obligatoriamente:

```json
{
  "message": "...",
  "conversationId": "uuid-v4",
  "meta": {
    "provider": "openrouter",
    "model": "google/gemini-2.5-flash",
    "executionTimeMs": 1420,
    "fallbackOccurred": false,
    "fallbackReason": null,
    "verificationSummary": {
      "totalCitations": 4,
      "verifiedCitations": 3,
      "unverifiedCitations": 1,
      "repealedWarnings": 0
    },
    "citations": [
      {
        "raw": "Casación N° 4618-2007/Lima",
        "normOrPrecedent": "Tercer Pleno Casatorio Civil",
        "status": "VERIFIED",
        "source": "Corte Suprema de Justicia del Perú - SPIJ"
      }
    ]
  }
}
```
