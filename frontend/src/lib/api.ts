const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type UserResponse = { id: string; email: string; name: string | null; isAdmin: boolean }

function getToken(): string | null {
  return localStorage.getItem('bufete_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

async function uploadFile<T>(path: string, file: File): Promise<T> {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      request<{ token: string; user: UserResponse }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(data) }
      ),
    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: UserResponse }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(data) }
      ),
  },

  chat: {
    send: (data: {
      agentId: string
      messages: { role: string; content: string; timestamp: string }[]
      conversationId?: string
    }) =>
      request<{ message: string; transferTo?: string; conversationId?: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    tts: async (data: { text: string; agentId: string }): Promise<Blob> => {
      const token = getToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_URL}/chat/tts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error de audio TTS' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      return res.blob()
    },
    stt: async (audioBlob: Blob): Promise<{ text: string }> => {
      const token = getToken()
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')

      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_URL}/chat/stt`, {
        method: 'POST',
        headers,
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error en transcripción de audio' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      return res.json()
    },
  },

  conversations: {
    list: () =>
      request<{ id: string; agentId: string; title: string; updatedAt: string }[]>(
        '/conversations'
      ),
    get: (id: string) =>
      request<{
        id: string
        agentId: string
        title: string
        messages: { role: string; content: string; timestamp: string }[]
        updatedAt: string
      }>(`/conversations/${id}`),
    delete: (id: string) =>
      request<{ success: boolean }>(`/conversations/${id}`, { method: 'DELETE' }),
    share: (id: string) =>
      request<{ token: string }>(`/conversations/${id}/share`, { method: 'POST' }),
    getShared: (token: string) =>
      fetch(`${API_URL}/shared/${token}`).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
        return res.json() as Promise<{ id: string; agentId: string; title: string; messages: { role: string; content: string; timestamp: string }[]; updatedAt: string }>
      }),
  },

  account: {
    get: () =>
      request<{
        user: UserResponse
        subscription: { status: string; plan: string; currentPeriodEnd: string | null } | null
      }>('/account'),
    usage: () =>
      request<{
        plan: string
        questionsUsed: number
        limit: number | null
        isAdmin: boolean
      }>('/account/usage'),
  },

  files: {
    extract: (file: File) =>
      uploadFile<{
        text: string
        fileName: string
        fileType: string
        fileSize: number
        pageCount: number | null
      }>('/files/extract', file),
  },

  admin: {
    stats: () =>
      request<{
        overview: {
          totalUsers: number
          activeSubscriptions: number
          totalConversations: number
          connectedNow: number
        }
        registrations: { day: string; total: number }[]
        agentPerformance: { agentId: string; conversations: number; messages: number }[]
      }>('/admin/stats'),
  },

  saved: {
    list: () =>
      request<{ id: string; agentId: string; agentName: string; content: string; createdAt: string }[]>('/saved'),
    save: (data: { agentId: string; agentName: string; content: string }) =>
      request<{ id: string }>('/saved', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/saved/${id}`, { method: 'DELETE' }),
  },

  memory: {
    get: () =>
      request<{ name?: string; company?: string; role?: string; specialties?: string; notes?: string } | null>('/memory'),
    update: (data: { name?: string; company?: string; role?: string; specialties?: string; notes?: string }) =>
      request<{ id: string }>('/memory', { method: 'PATCH', body: JSON.stringify(data) }),
  },
}
