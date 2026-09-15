const API_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : 'https://fiscalia-t0bl.onrender.com'
)

type UserResponse = { id: string; email: string; name: string | null; isAdmin: boolean }

function getToken(): string | null {
  return localStorage.getItem('bufete_token')
}

function handleUnauthorized() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bufete:unauthorized'))
  }
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
    if (res.status === 401) {
      handleUnauthorized()
    }
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
    if (res.status === 401) {
      handleUnauthorized()
    }
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
    demoLogin: () =>
      request<{ token: string; user: UserResponse }>(
        '/auth/demo-login',
        { method: 'POST' }
      ),
    me: () =>
      request<{ user: UserResponse; subscription: any }>(
        '/auth/me',
        { method: 'GET' }
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
    sendStream: async (
      data: {
        agentId: string
        messages: { role: string; content: string; timestamp: string }[]
        conversationId?: string
        letterhead?: any
      },
      callbacks: {
        onChunk: (chunk: string) => void
        onDone: (result: { conversationId?: string; transferTo?: string }) => void
        onError: (err: any) => void
      },
      signal?: AbortSignal
    ) => {
      const token = getToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      try {
        let res: Response
        try {
          res = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...data, stream: true }),
            signal,
          })
        } catch (fetchErr: any) {
          if (signal?.aborted) throw fetchErr
          // Si el streaming falla por bloqueo de red/firewall/proxy, fallback inmediato a modo estándar
          console.warn('[API] Streaming fetch interceptado o fallido, intentando fallback no-stream:', fetchErr)
          const fallbackRes = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ ...data, stream: false }),
            signal,
          })
          if (!fallbackRes.ok) {
            if (fallbackRes.status === 401) handleUnauthorized()
            const errData = await fallbackRes.json().catch(() => ({ error: `HTTP ${fallbackRes.status}` }))
            throw new Error(errData.error || `HTTP ${fallbackRes.status}`)
          }
          const standardJson = await fallbackRes.json()
          if (standardJson.message) {
            callbacks.onChunk(standardJson.message)
          }
          callbacks.onDone({
            conversationId: standardJson.conversationId,
            transferTo: standardJson.transferTo,
          })
          return
        }

        if (!res.ok) {
          if (res.status === 401) {
            handleUnauthorized()
          }
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
          throw new Error(errData.error || `HTTP ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) {
          throw new Error('No se pudo establecer el canal de streaming')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          if (signal?.aborted) break
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('data:')) continue
            const payloadStr = trimmed.replace(/^data:\s*/, '')
            try {
              const payload = JSON.parse(payloadStr)
              if (payload.error) {
                throw new Error(payload.error)
              }
              if (payload.chunk) {
                callbacks.onChunk(payload.chunk)
              }
              if (payload.done) {
                callbacks.onDone({
                  conversationId: payload.conversationId,
                  transferTo: payload.transferTo,
                })
                return
              }
            } catch (pErr: any) {
              if (pErr.message && !pErr.message.includes('Unexpected token')) {
                throw pErr
              }
            }
          }
        }
        callbacks.onDone({})
      } catch (err: any) {
        if (err.name === 'AbortError' || signal?.aborted) {
          callbacks.onDone({})
          return
        }
        callbacks.onError(err)
      }

    },
    tts: async (data: { text: string; agentId: string }, signal?: AbortSignal): Promise<Blob> => {
      if (!data?.text || !data.text.trim()) {
        throw new Error('Texto requerido para reproducción de audio')
      }
      const token = getToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_URL}/chat/tts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...data, text: data.text.trim().slice(0, 2500) }),
        signal,
      })
      if (!res.ok) {
        if (res.status === 401) {
          handleUnauthorized()
        }
        const err = await res.json().catch(() => ({ error: 'Error de audio TTS' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      return res.blob()
    },
    stt: async (audioBlob: Blob): Promise<{ text: string }> => {
      const token = getToken()
      const formData = new FormData()
      const type = (audioBlob.type || '').toLowerCase()
      const filename = type.includes('mp4') || type.includes('m4a') || type.includes('aac')
        ? 'audio.m4a'
        : type.includes('wav')
        ? 'audio.wav'
        : type.includes('ogg')
        ? 'audio.ogg'
        : 'audio.webm'
      formData.append('audio', audioBlob, filename)

      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_URL}/chat/stt`, {
        method: 'POST',
        headers,
        body: formData,
      })
      if (!res.ok) {
        return { text: '' }
      }
      return res.json().catch(() => ({ text: '' }))
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
    updateTitle: (id: string, title: string) =>
      request<{ id: string; title: string }>(`/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
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
      request<any>('/admin/stats'),
    users: () =>
      request<{ users: import('@/types').AdminUserItem[] }>('/admin/users'),
    deleteUser: (id: string) =>
      request<{ success: boolean; message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),
    updateUserPlan: (id: string, data: { plan?: string; addDays?: number; status?: string }) =>
      request<{ success: boolean; message: string }>(`/admin/users/${id}/plan`, { method: 'PATCH', body: JSON.stringify(data) }),
    createUser: (data: { email: string; password: string; name?: string; plan?: string; isAdmin?: boolean; durationDays?: number }) =>
      request<{ success: boolean; message: string }>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
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
