export interface User {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
}

export interface Agent {
  id: string
  name: string
  role: string
  specialty: string
  description: string
  initial: string
  color: string
  bgColor: string
  welcomeMessage: string
  image: string
  badge: string
  suggestions: string[]
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  transferTo?: string
  isVoice?: boolean
}

export interface Conversation {
  id: string
  agentId: string
  title: string
  updatedAt: string
  messages?: Message[]
}

export interface Subscription {
  status: string
  plan: string
  currentPeriodEnd: string | null
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface AdminUserItem {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  createdAt: string
  conversationsCount: number
  questionsThisMonth: number
  plan: string
  status: string
  expiresAt: string | null
  daysRemaining: number | null
  subscription: {
    id: string
    status: string
    plan: string
    currentPeriodEnd: string | null
    isExpired: boolean
    daysRemaining: number
  } | null
}

export interface AdminOverview {
  totalUsers: number
  activeSubscriptions: number
  totalConversations: number
  connectedNow: number
}

export interface AdminRegistrationPoint {
  day: string
  total: number
}

export interface AdminAgentPerformance {
  agentId: string
  conversations: number
  messages: number
}

export interface AdminSystemHealth {
  status: string
  dbLatencyMs: number
  uptimeSeconds: number
  memoryUsageMB: number
  nodeVersion: string
}

export interface AdminAiMetrics {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  successRate: number
  avgDurationMs: number
  deepseekCount?: number
  geminiCount: number
  anthropicCount: number
  groqCount?: number
  openaiCount?: number
  openrouterCount?: number
  trialUsers: number
  paidUsers: number
  freeLimit: number
  geminiModel: string
  anthropicModel: string
  hasDeepseekKey?: boolean
  hasGeminiKey: boolean
  hasAnthropicKey: boolean
  hasGroqKey?: boolean
  hasOpenrouterKey?: boolean
  hasElevenLabsKey: boolean
}

export interface AdminErrorLog {
  id: string
  timestamp: string
  route: string
  method: string
  statusCode: number
  message: string
  agentId?: string
  details?: string
}

export interface BalancedScorecard {
  financial: {
    mrr: number
    arr: number
    conversionRate: number
    targetMrr: number
    targetConversion: number
    costPerCaseSol: number
    estimatedMargin: number
  }
  customer: {
    csatScore: number
    activeUsers: number
    retentionRate: number
    avgResolutionTimeMs: number
    targetResolutionTimeMs: number
    npsScore: number
  }
  processes: {
    totalCasesResolved: number
    legalAccuracyRate: number
    uptimePercent: number
    documentsGeneratedCount: number
    directResolutionRate: number
  }
  learning: {
    aiSuccessRate: number
    modelTier: string
    dbLatencyMs: number
    targetLatencyMs: number
    voiceHdAdoption: number
  }
}

export interface AdminStats {
  overview: AdminOverview
  registrations: AdminRegistrationPoint[]
  agentPerformance: AdminAgentPerformance[]
  systemHealth?: AdminSystemHealth
  aiMetrics?: AdminAiMetrics
  scorecard?: BalancedScorecard
  recentErrors?: AdminErrorLog[]
  recentAiCalls?: Array<{
    id: string
    timestamp: string
    agentId: string
    provider: 'gemini' | 'anthropic' | 'groq' | 'openai' | 'deepseek' | 'openrouter'
    model: string
    success: boolean
    durationMs: number
    error?: string
  }>
}
