# HARDMAN — RAG ENGINE SPECIFICATION
**Especificación de Ingestión, Chunking Jurídico y Recuperación Híbrida**  
**Versión:** 2.0.0-PROD  
**Fecha:** 01 de Noviembre de 2026  
**Módulo:** `backend/src/lib/ragEngine.ts` y `backend/src/scripts/ingest-legal-docs.ts`

---

## 1. Diagnóstico del RAG Anterior y Correcciones Efectuadas

| Dimensión | RAG Anterior (v1.0) | RAG Reconstruido (v2.0) |
| :--- | :--- | :--- |
| **Estrategia de Chunking** | Corte fijo cada 1,800 caracteres con 200 caracteres de solapamiento arbitrario (`slice(-200)`). Mutilaba palabras a la mitad (`"ges durante un período..."`). | **Chunking Jurídico Estructural:** Segmentación delimitada por fronteras de Artículos (`Artículo 1...`), Plenos Casatorios y Acuerdos Plenarios íntegros. Cero palabras cortadas. |
| **Volumen de Chunks en DB** | 68 chunks en total en Neon PostgreSQL. | **212 chunks jurídicos de alta densidad**. |
| **Especialistas Cubiertos** | 5 especialistas parciales; 3 especialistas en cero absoluto (`fernanda`: 0, `adriana`: 0, `rodrigo`: 0). | **Los 8 especialistas cubiertos al 100%** (`diego`: 57, `camila`: 56, `sebastian`: 32, `valentina`: 16, `marco`: 16, `fernanda`: 16, `adriana`: 12, `rodrigo`: 7). |
| **Indexación de Jurisprudencia** | 0 casaciones o precedentes en base de datos. | Indexación en tabla de los precedentes vinculantes de la Corte Suprema, Tribunal Constitucional y Tribunal Fiscal. |
| **Búsqueda Léxica de Artículos** | Filtraba palabras `< 4` caracteres, descartando artículos como `333`, `131`, `62`, `71`. | Extracción dedicada de números de artículos y expedientes con ponderación de 40 puntos para coincidencia exacta en metadatos. |

---

## 2. Pipeline de Chunking Jurídico Estructural

1. **Detección de Jerarquías:** Identifica `LIBRO`, `TÍTULO`, `CAPÍTULO` y `SECCIÓN` sin convertirlos en fragmentos aislados; se asocian como metadatos de contexto a cada artículo subsiguiente.
2. **Unidad Atómica por Artículo:** Cada artículo legal peruano se preserva completo con su sumilla y sus incisos/numerales.
3. **Control de Artículos Extensos:** Si un artículo supera los 2,800 caracteres, la división se efectúa exclusivamente en el salto de párrafo doble (`\n\n`), encabezando el siguiente fragmento con `[Artículo X - Continuación]`.
4. **Metadatos por Chunk:**
   - `specialist_id`: Identificador del agente (`diego`, `camila`, `sebastian`, etc.)
   - `source_code`: Nombre oficial de la norma (ej. `Código Civil (D.Leg. 295)`, `Código Tributario (D.S. 133-2013-EF)`)
   - `section`: Título o Libro de pertenencia
   - `articles`: Referencia del artículo (ej. `Artículo 333`, `Casación N° 4618-2007/Lima`)
   - `content`: Texto íntegro del precepto normativo
   - `embedding`: Vector de 768 dimensiones (L2 normalizado)

---

## 3. Recuperación Híbrida y Ranking

La función `searchChunksByText` en Neon PostgreSQL ejecuta un ranking compuesto:

```sql
ORDER BY (
  (CASE WHEN specialist_id = :specialistId THEN 20 ELSE 0 END) +
  (CASE WHEN articles ILIKE '%' || :mainArticle || '%' THEN 40 ELSE 0 END) +
  (CASE WHEN articles ILIKE '%' || :secondTerm || '%' THEN 25 ELSE 0 END) +
  (CASE WHEN content ILIKE '%' || :mainArticle || '%' THEN 10 ELSE 0 END) +
  (CASE WHEN content ILIKE '%' || :secondTerm || '%' THEN 5 ELSE 0 END) +
  (CASE WHEN content ILIKE '%' || :thirdTerm || '%' THEN 3 ELSE 0 END)
) DESC
LIMIT 5;
```

Esto garantiza que al consultar por el *"Artículo 333 del Código Civil"*, el artículo 333 obtenga 60 puntos de relevancia, desplazando a cualquier otro fragmento accesorio.

