# HARDMAN — LEGAL CITATION VALIDATION SPECIFICATION
**Especificación del Sistema de Verificación e Integridad Jurisprudencial**  
**Versión:** 2.0.0-PROD  
**Fecha:** 01 de Noviembre de 2026  
**Módulo:** `backend/src/ai/legalCitationValidator.ts`

---

## 1. Misión del Validador Jurídico

El **Legal Citation Validator** es un motor determinista, no estocástico, que opera de forma autónoma a los LLMs para auditar todas las citas jurisprudenciales y normativas generadas antes de su entrega al usuario.

---

## 2. Tipos de Referencias Auditadas

1. **Casaciones de la Corte Suprema:** Patrón `Casación N° [0-9]+-[0-9]{4}/[Distrito]`.
2. **Acuerdos Plenarios Supremos:** Patrón `Acuerdo Plenario N° [0-9]+-[0-9]{4}/CIJ-116`.
3. **Plenos Casatorios Civiles:** `I` al `X Pleno Casatorio Civil`.
4. **Artículos Normativos:** `Art. [0-9]+ del Código Civil / CPC / NCPP / Código Tributario`.
5. **Normas Derogadas:** Detección de normas extintas (`Ley 30225`, `D.S. 004-2019-JUS`, `Ley 28677`).

---

## 3. Estados de Clasificación de Citas

| Estado | Significado Técnico | Acción en el Sistema |
| :--- | :--- | :--- |
| **`VERIFIED`** | La cita existe de forma fehaciente en el compendio oficial verificado de la Corte Suprema, con órgano emisor y fundamentos coincidentes. | Se permite la emisión del badge `⚖️ Verificado SPIJ 2026`. |
| **`EXISTENCE_VERIFIED_CONTENT_UNVERIFIED`** | El número de expediente existe, pero la doctrina o ratio decidendi atribuida no ha sido validada textualmente. | Se presenta sin badge de verificación y con nota de consulta obligatoria. |
| **`UNVERIFIED_CLAIM`** | La casación o expediente no figura en el registro oficial supremo de precedentes vinculantes (alucinación probable). | Se desclasifica a *«Criterio interpretativo de parte»* y se anexa la **Nota de Rigor Procesal Hardman**. |
| **`CONTRADICTED`** | La afirmación contradice una norma expresa o atribuye incorrectamente un precepto (ej. Art. 62 NCPP a defensa técnica; Art. 480 CPC a causales de divorcio). | Se bloquea o se inyecta la **Rectificación Dogmática de Precisión**. |
| **`REPEALED_NORM`** | La norma citada se encuentra formalmente derogada al 2026. | Se inyecta la **Alerta de Vigencia Normativa (SPIJ 2026)** con la norma vigente sustituta. |

---

## 4. Registro de Precedentes Verificados

El catálogo `VERIFIED_JURISPRUDENCE_REGISTRY` contiene las casaciones y acuerdos plenarios de obligatoriedad judicial en el Perú, incluyendo:
- **Tercer Pleno Casatorio Civil (Casación 4618-2007/Lima):** Cónyuge más perjudicado e indemnización obligatoria en separación de hecho.
- **Casación N° 2402-2012/Lima:** Daño moral in re ipsa derivado de denuncias calumniosas conyugales.
- **Acuerdo Plenario N° 01-2019/CIJ-116:** Prisión preventiva y sospecha grave.
- **Acuerdo Plenario N° 06-2009/CJ-116:** Control formal y sustancial de acusación intermedia.
- **Acuerdo Plenario N° 05-2023/CIJ-112:** Inaplicabilidad de Ley Soto sobre prescripción.
- **IV Pleno Casatorio Civil (Casación 2195-2011/Ucayali):** Desalojo por ocupación precaria.
- **STC Exp. N° 03525-2021-PA/TC:** Inconstitucionalidad de intereses moratorios SUNAT.
