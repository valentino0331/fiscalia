/**
 * Tipos y Contratos Centrales del Motor de IA — HARDMAN
 */

export type TaskType = 
  | 'LEGAL_CONSULTATION'
  | 'EXPEDIENTE_ANALYSIS'
  | 'DOCUMENT_DRAFTING'
  | 'QUICK_ANSWER';

export type AiProviderName = 
  | 'openrouter'
  | 'groq'
  | 'gemini'
  | 'openai'
  | 'deepseek'
  | 'anthropic'
  | 'system_unavailable'
  | 'emergency_mock';

export type CitationValidationStatus = 
  | 'VERIFIED'
  | 'EXISTENCE_VERIFIED_CONTENT_UNVERIFIED'
  | 'UNVERIFIED_CLAIM'
  | 'CONTRADICTED'
  | 'REPEALED_NORM'
  | 'VIGENCIA_NO_DETERMINADA';

export interface DetectedCitation {
  raw: string;
  type: 'casacion' | 'pleno' | 'articulo' | 'ley' | 'acuerdo_plenario' | 'resolucion_administrativa' | 'sentencia_tc';
  normalized: string;
  status: CitationValidationStatus;
  officialSource?: string;
  detail?: string;
  remediedText?: string;
  citationType?: 'VERBATIM_QUOTE' | 'RATIO_PARAPHRASE' | 'LEGAL_SUBSUMPTION';
  extractedQuote?: string;
  verbatimVerified?: boolean;
}

export interface VerificationSummary {
  totalCitations: number;
  verifiedCitations: number;
  unverifiedCitations: number;
  repealedWarnings: number;
  citations: DetectedCitation[];
}

export interface ModelCandidate {
  provider: AiProviderName;
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export interface ModelExecutionResult {
  text: string;
  provider: AiProviderName;
  model: string;
  durationMs: number;
  fallbackOccurred: boolean;
  fallbackReason?: string;
  tokensUsed?: number;
}

export interface QualityCheckResult {
  isValid: boolean;
  warnings: string[];
  blockedReason?: string;
  processedText: string;
  /** Nota anexable (append-only) con el control de fuentes normativas; '' si no aplica. */
  auditNote?: string;
  verificationSummary: VerificationSummary;
}

export interface AiOrchestratorMeta {
  correlationId?: string;
  provider: AiProviderName;
  model: string;
  durationMs: number;
  fallbackOccurred: boolean;
  fallbackReason?: string;
  verificationSummary: VerificationSummary;
}

export interface AiOrchestratorResponse {
  message: string;
  meta: AiOrchestratorMeta;
  transferTo?: string;
  conversationId?: string | null;
}

