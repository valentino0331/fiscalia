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
  geminiCount: number
  anthropicCount: number
  trialUsers: number
  paidUsers: number
  freeLimit: number
  geminiModel: string
  anthropicModel: string
  hasGeminiKey: boolean
  hasAnthropicKey: boolean
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

export interface AdminStats {
  overview: AdminOverview
  registrations: AdminRegistrationPoint[]
  agentPerformance: AdminAgentPerformance[]
  systemHealth?: AdminSystemHealth
  aiMetrics?: AdminAiMetrics
  recentErrors?: AdminErrorLog[]
  recentAiCalls?: Array<{
    id: string
    timestamp: string
    agentId: string
    provider: 'gemini' | 'anthropic'
    model: string
    success: boolean
    durationMs: number
    error?: string
  }>
}
