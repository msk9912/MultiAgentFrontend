const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_TIMEOUT = 30000 // 30초
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

  // 메시지 전송
  async sendMessage(conversationId, content) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content })
    })
    return handleResponse(res)
  }
}
