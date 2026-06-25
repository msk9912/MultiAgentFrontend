const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const chatApi = {
  // 대화방 목록 조회
  async getConversations() {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations`)
    return res.json()
  },

  // 대화방 생성
  async createConversation(title) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
    return res.json()
  },

  // 대화방 삭제
  async deleteConversation(conversationId) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${conversationId}`, {
      method: 'DELETE'
    })
    return res.json()
  },

  // 대화방 제목 수정
  async updateConversation(conversationId, title) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
    return res.json()
  },

  // 메시지 목록 조회
  async getMessages(conversationId) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${conversationId}/messages`)
    return res.json()
  },

  // 메시지 전송
  async sendMessage(conversationId, content) {
    const res = await fetch(`${API_BASE}/api/v1/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    return res.json()
  }
}
