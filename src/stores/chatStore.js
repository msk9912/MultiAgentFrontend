import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatApi } from '../api/chatApi'

function deduplicateRepeatedContent(content) {
  if (!content) return ''

  const text = String(content)
  const stripped = text.trim()

  if (stripped.length < 20) {
    return text
  }

  const center = Math.floor(stripped.length / 2)

  // 공백/개행 차이를 고려해서 가운데 기준 ±5 범위 확인
  for (let offset = -5; offset <= 5; offset += 1) {
    const splitIndex = center + offset

    if (splitIndex <= 0 || splitIndex >= stripped.length) {
      continue
    }

    const first = stripped.slice(0, splitIndex).trim()
    const second = stripped.slice(splitIndex).trim()

    if (first && first === second) {
      return first
    }
  }

  return text
}

function mergeAssistantDelta(currentContent, incomingDelta) {
  const current = currentContent || ''
  const incoming = deduplicateRepeatedContent(incomingDelta || '')

  if (!incoming) {
    return current
  }

  if (!current) {
    return incoming
  }

  // 같은 전체 답변이 다시 들어온 경우
  if (incoming.trim() === current.trim()) {
    return current
  }

  // incoming이 전체 완성본이고, 앞부분이 이미 출력된 경우
  if (incoming.startsWith(current)) {
    const rest = incoming.slice(current.length)

    if (!rest) {
      return current
    }

    return current + rest
  }

  // 긴 문장이 동일하게 다시 들어온 경우 방지
  if (incoming.trim().length >= 20 && current.endsWith(incoming)) {
    return current
  }

  return current + incoming
}

function applyFinalAssistantContent(currentContent, finalContent) {
  const current = currentContent || ''
  const finalText = deduplicateRepeatedContent(finalContent || '')

  if (!finalText) {
    return current
  }

  if (!current) {
    return finalText
  }

  if (finalText.trim() === current.trim()) {
    return current
  }

  if (finalText.startsWith(current)) {
    return finalText
  }

  if (current.startsWith(finalText)) {
    return current
  }

  return finalText
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref([])
  const activeConversationId = ref(null)
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 현재 처리 상태 메시지
  const processingStatus = ref(null)

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
    processingStatus.value = null

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
    processingStatus.value = null

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
    processingStatus.value = null

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

      if (conv) {
        conv.title = title
      }
    } catch (err) {
      error.value = err.message
      console.error('Failed to update conversation:', err)
    }
  }

  // 메시지 전송 - SSE 스트리밍 방식
  async function sendMessage(content) {
    if (!activeConversationId.value) return
    if (!content || !content.trim()) return
    if (loading.value) return

    const conversationId = activeConversationId.value
    const now = new Date().toISOString()

    const tempUserMessageId = `temp-user-${Date.now()}`
    const tempAssistantMessageId = `temp-assistant-${Date.now()}`

    const tempUserMessage = {
      id: tempUserMessageId,
      message_id: tempUserMessageId,
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: now,
      pending: true
    }

    const tempAssistantMessage = {
      id: tempAssistantMessageId,
      message_id: tempAssistantMessageId,
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      created_at: now,
      pending: true
    }

    // 사용자 입력과 assistant 빈 말풍선을 즉시 화면에 추가
    messages.value.push(tempUserMessage)
    messages.value.push(tempAssistantMessage)

    error.value = null
    loading.value = true
    processingStatus.value = '요청을 준비하고 있습니다...'

    try {
      await chatApi.sendMessageStream(conversationId, content, {
        onUserMessage(message) {
          if (!message) return

          const index = messages.value.findIndex(
            msg => msg.id === tempUserMessageId
          )

          const savedUserMessage = {
            id: message.message_id,
            ...message,
            pending: false
          }

          if (index >= 0) {
            messages.value.splice(index, 1, savedUserMessage)
          } else {
            messages.value.push(savedUserMessage)
          }
        },

        onStatus(data) {
          processingStatus.value = data?.content || '처리 중...'
        },

        onDelta(delta) {
          if (!delta) return

          const assistantMessage = messages.value.find(
            msg => msg.id === tempAssistantMessageId
          )

          if (!assistantMessage) return

          assistantMessage.content = mergeAssistantDelta(
            assistantMessage.content,
            delta
          )
        },

        onDone(data) {
          const assistantMessage = messages.value.find(
            msg => msg.id === tempAssistantMessageId
          )

          if (assistantMessage) {
            if (data?.assistant_message) {
              assistantMessage.id = data.assistant_message.message_id
              assistantMessage.message_id = data.assistant_message.message_id
              assistantMessage.conversation_id = data.assistant_message.conversation_id
              assistantMessage.role = data.assistant_message.role
              assistantMessage.created_at = data.assistant_message.created_at

              if (data.assistant_message.content && !assistantMessage.content) {
                assistantMessage.content = data.assistant_message.content
              }
            }

            assistantMessage.pending = false
          }

          processingStatus.value = null

          // 현재 대화방의 updated_at 갱신
          const conv = conversations.value.find(c => c.id === conversationId)

          if (conv) {
            conv.updated_at = new Date().toISOString()
            conv.last_message_at = new Date().toISOString()
          }
        },

        onError(data) {
          throw new Error(data?.message || '스트리밍 중 오류가 발생했습니다.')
        }
      })
    } catch (err) {
      error.value = err.message
      processingStatus.value = null

      const assistantMessage = messages.value.find(
        msg => msg.id === tempAssistantMessageId
      )

      if (assistantMessage) {
        assistantMessage.content = `오류가 발생했습니다: ${err.message}`
        assistantMessage.pending = false
        assistantMessage.error = true
      } else {
        const errorMessageId = `error-${Date.now()}`

        messages.value.push({
          id: errorMessageId,
          message_id: errorMessageId,
          conversation_id: conversationId,
          role: 'assistant',
          content: `오류가 발생했습니다: ${err.message}`,
          created_at: new Date().toISOString(),
          error: true
        })
      }

      console.error('Failed to send message:', err)
    } finally {
      loading.value = false
      processingStatus.value = null
    }
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    loading,
    error,
    processingStatus,
    loadConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    updateConversation,
    sendMessage
  }
})