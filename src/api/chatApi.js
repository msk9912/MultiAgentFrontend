const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_TIMEOUT = 30000 // 현재 fetch에는 직접 적용되지 않음
const DEFAULT_USER_ID = 1 // 더미 사용자 ID

const getHeaders = (additional = {}) => ({
  'Content-Type': 'application/json',
  'X-User-Id': String(DEFAULT_USER_ID),
  ...additional
})

const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `API Error: ${res.status}`)
  }
  return res.json()
}

function parseSseEvent(rawEvent) {
  const lines = rawEvent.split('\n')

  let eventName = 'message'
  const dataLines = []

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.replace('event:', '').trim()
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.replace('data:', '').trim())
    }
  }

  if (dataLines.length === 0) {
    return null
  }

  const dataText = dataLines.join('\n')

  try {
    return {
      event: eventName,
      data: JSON.parse(dataText)
    }
  } catch (error) {
    console.error('SSE JSON parse failed:', dataText, error)
    return null
  }
}

export const chatApi = {
  // 대화방 목록 조회
  async getConversations() {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations`, {
      headers: getHeaders()
    })
    return handleResponse(res)
  },

  // 대화방 생성
  async createConversation(title) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title })
    })
    return handleResponse(res)
  },

  // 대화방 삭제
  async deleteConversation(conversationId) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(error.message || `API Error: ${res.status}`)
    }

    return null
  },

  // 대화방 제목 수정
  async updateConversation(conversationId, title) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ title })
    })
    return handleResponse(res)
  },

  // 메시지 목록 조회
  async getMessages(conversationId) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${conversationId}/messages`, {
      headers: getHeaders()
    })
    return handleResponse(res)
  },

  // 기존 메시지 전송: 최종 응답을 한 번에 받는 방식
  async sendMessage(conversationId, content) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    })
    return handleResponse(res)
  },

  // 새 메시지 전송: SSE 스트리밍 방식
  async sendMessageStream(conversationId, content, handlers = {}) {
    const res = await fetch(
      `${API_BASE}/api/v1/chat/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        headers: getHeaders({
          Accept: 'text/event-stream'
        }),
        body: JSON.stringify({ content })
      }
    )

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(error.message || `API Error: ${res.status}`)
    }

    if (!res.body) {
      throw new Error('ReadableStream을 사용할 수 없습니다.')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')

    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const rawEvents = buffer.split('\n\n')
      buffer = rawEvents.pop() || ''

      for (const rawEvent of rawEvents) {
        const parsed = parseSseEvent(rawEvent)

        if (!parsed) continue

        const { event, data } = parsed

        if (event === 'user_message') {
          handlers.onUserMessage?.(data.message)
        }

        if (event === 'status') {
          handlers.onStatus?.(data)
        }

        if (event === 'delta') {
          handlers.onDelta?.(data.content)
        }

        if (event === 'done') {
          handlers.onDone?.(data)
        }

        if (event === 'error') {
          handlers.onError?.(data)
          throw new Error(data.message || '스트리밍 중 오류가 발생했습니다.')
        }
      }
    }
  }
}