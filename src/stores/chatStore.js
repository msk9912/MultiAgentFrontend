import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatApi } from '../api/chatApi'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref([])
  const activeConversationId = ref(null)
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)

  const activeConversation = computed(() =>
    conversations.value.find(c => c.id === activeConversationId.value)
  )

  // 대화방 목록 로드
  async function loadConversations() {
    loading.value = true
    error.value = null
    try {
      const data = await chatApi.getConversations()
      conversations.value = (data || []).map(conv => ({
        id: conv.conversation_id,
        ...conv
      }))
      if (conversations.value.length > 0 && !activeConversationId.value) {
        activeConversationId.value = conversations.value[0].id
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to load conversations:', err)
    } finally {
      loading.value = false
    }
  }

  // 대화방 선택 및 메시지 로드
  async function selectConversation(conversationId) {
    activeConversationId.value = conversationId
    messages.value = []
    loading.value = true
    error.value = null
    try {
      const data = await chatApi.getMessages(conversationId)
      messages.value = (data || []).map(msg => ({
        id: msg.message_id,
        ...msg
      }))
    } catch (err) {
      error.value = err.message
      console.error('Failed to load messages:', err)
    } finally {
      loading.value = false
    }
  }

  // 새 대화방 생성
  async function createConversation(title) {
    loading.value = true
    error.value = null
    try {
      const data = await chatApi.createConversation(title)
      if (data && data.conversation_id) {
        const conversation = {
          id: data.conversation_id,
          ...data
        }
        conversations.value.push(conversation)
        activeConversationId.value = data.conversation_id
        messages.value = []
      }
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to create conversation:', err)
    } finally {
      loading.value = false
    }
  }

  // 대화방 삭제
  async function deleteConversation(conversationId) {
    error.value = null
    try {
      await chatApi.deleteConversation(conversationId)
      conversations.value = conversations.value.filter(c => c.id !== conversationId)
      if (activeConversationId.value === conversationId) {
        activeConversationId.value = conversations.value[0]?.id || null
        messages.value = []
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to delete conversation:', err)
    }
  }

  // 대화방 제목 수정
  async function updateConversation(conversationId, title) {
    error.value = null
    try {
      await chatApi.updateConversation(conversationId, title)
      const conv = conversations.value.find(c => c.id === conversationId)
      if (conv) conv.title = title
    } catch (err) {
      error.value = err.message
      console.error('Failed to update conversation:', err)
    }
  }

  // 메시지 전송
  async function sendMessage(content) {
    if (!activeConversationId.value) return

    error.value = null
    loading.value = true
    try {
      const data = await chatApi.sendMessage(activeConversationId.value, content)
      if (data.id) {
        messages.value.push(data)
      }
      return data
    } catch (err) {
      error.value = err.message
      console.error('Failed to send message:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    loading,
    error,
    loadConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    updateConversation,
    sendMessage
  }
})
