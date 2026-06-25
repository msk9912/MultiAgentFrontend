<script setup>
import { ref, computed, watch } from 'vue'
import { useChatStore } from '../stores/chatStore'
import { currentUser } from '../constants/user'

const chatStore = useChatStore()
const userMessageInput = ref('')

const chatTitle = computed(() => chatStore.activeConversation?.title || '새 채팅')

watch(
  () => chatStore.activeConversationId,
  () => {
    userMessageInput.value = ''
  }
)

async function handleSendMessage() {
  if (!userMessageInput.value.trim()) return

  const msg = userMessageInput.value
  userMessageInput.value = ''

  // 활성 대화가 없으면 새로 생성
  if (!chatStore.activeConversationId) {
    const title = msg.substring(0, 50) + (msg.length > 50 ? '...' : '')
    await chatStore.createConversation(title)
    // 새 대화가 생성되면 자동으로 메시지 전송
    setTimeout(() => {
      if (chatStore.activeConversationId) {
        chatStore.sendMessage(msg)
      }
    }, 100)
  } else {
    await chatStore.sendMessage(msg)
  }
}
</script>

<template>
  <main class="chat">
    <!-- 헤더 (대화 진행 중일 때만) -->
    <header class="chat-header" v-if="chatStore.activeConversation">
      <div class="chat-title-wrap">
        <span class="chat-title">{{ chatTitle }}</span>
        <span class="chat-status">
          <span class="chat-status-live" v-if="chatStore.loading">
            <span class="live-dot"></span>처리 중...
          </span>
          <span v-else class="chat-status-empty">메시지 {{ chatStore.messages.length }}개</span>
        </span>
      </div>
      <div class="header-actions">
        <button class="btn-ghost">↗ 공유</button>
        <button class="btn-icon">⋯</button>
      </div>
    </header>

    <!-- 대화 진행 중일 때 -->
    <div v-if="chatStore.activeConversation" class="conversation">
      <div class="conversation-inner">
        <div v-if="chatStore.messages.length === 0" class="no-messages">
          <p>메시지 없음</p>
        </div>
        <div v-else>
          <div v-for="msg in chatStore.messages" :key="msg.id" :class="msg.role === 'user' ? 'msg-user' : 'msg-ai'">
            <div v-if="msg.role === 'user'">
              <div class="bubble-user">{{ msg.content }}</div>
            </div>
            <div v-else>
              <div class="avatar-ai"><div class="ai-diamond"></div></div>
              <div class="msg-ai-body">
                <div class="ai-text">{{ msg.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 초기 상태: 큰 입력 영역 -->
    <div v-else class="welcome-area">
      <div class="welcome-content">
        <div class="welcome-title">AI Workspace</div>
        <div class="welcome-subtitle">문서 검색, 파일 관리, 웹 자료 조사를 한 번에</div>
        <div class="welcome-input-wrap">
          <div class="welcome-input-box">
            <input
              v-model="userMessageInput"
              type="text"
              class="welcome-input"
              placeholder="질문을 입력하세요..."
              @keyup.enter="handleSendMessage"
              :disabled="chatStore.loading"
              autofocus
            />
            <button class="welcome-send" @click="handleSendMessage" :disabled="chatStore.loading" title="전송">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 입력 (대화 진행 중일 때만) -->
    <div class="input-wrap" v-if="chatStore.activeConversation">
      <div class="input-inner">
        <div class="input-box">
          <input
            v-model="userMessageInput"
            type="text"
            class="input-field"
            placeholder="문서를 검색하거나 파일을 관리해보세요"
            @keyup.enter="handleSendMessage"
            :disabled="chatStore.loading"
          />
          <button class="input-send" @click="handleSendMessage" :disabled="chatStore.loading" title="전송">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div class="input-hint">Supervisor가 의도를 분석해 하위 에이전트를 자동으로 호출합니다</div>
    </div>
  </main>
</template>

<style scoped>
.chat {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #FFFFFF;
}

/* 헤더 */
.chat-header { display: flex; align-items: center; gap: 12px; padding: 14px 24px; border-bottom: 1px solid #ECECEF; flex-shrink: 0; }
.chat-title-wrap { display: flex; flex-direction: column; line-height: 1.25; }
.chat-title { font-size: 15px; font-weight: 700; letter-spacing: -.01em; }
.chat-status { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #9A9AA2; margin-top: 2px; white-space: nowrap; }
.chat-status-live { display: inline-flex; align-items: center; gap: 4px; color: #3B6EF5; font-weight: 600; white-space: nowrap; }
.chat-status-empty { color: #A1A1AA; }
.live-dot { width: 6px; height: 6px; border-radius: 50%; background: #3B6EF5; animation: livepulse 1.2s ease-in-out infinite; }
.header-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }

.btn-ghost {
  display: flex; align-items: center; gap: 6px; padding: 7px 13px;
  background: #fff; border: 1px solid #E4E4E8; border-radius: 8px;
  font-family: inherit; font-size: 12.5px; font-weight: 600; color: #52525B; cursor: pointer; transition: background .15s;
}
.btn-ghost:hover { background: #F7F7F9; }
.btn-icon { width: 32px; height: 32px; background: #fff; border: 1px solid #E4E4E8; border-radius: 8px; color: #71717A; cursor: pointer; font-size: 16px; transition: background .15s; }
.btn-icon:hover { background: #F7F7F9; }

/* 대화 */
.conversation { flex: 1; overflow-y: auto; padding: 28px 0; }
.conversation-inner { max-width: 720px; margin: 0 auto; padding: 0 32px; display: flex; flex-direction: column; gap: 26px; }

.msg-user { display: flex; gap: 13px; align-items: flex-start; margin-left: auto; max-width: 82%; width: fit-content; }
.bubble-user { background: #EEF3FE; color: #1B3B8A; padding: 12px 16px; border-radius: 16px 16px 4px 16px; font-size: 14px; line-height: 1.6; font-weight: 500; }
.avatar-user {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #FFB07C, #F2709C);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0;
}

.msg-ai { display: flex; gap: 13px; align-items: flex-start; }
.avatar-ai {
  width: 30px; height: 30px; border-radius: 9px;
  background: linear-gradient(140deg, #3B6EF5, #5B4BE0);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: 0 2px 6px rgba(59, 110, 245, .3);
}
.ai-diamond { width: 10px; height: 10px; border: 2.5px solid #fff; border-radius: 3px; transform: rotate(45deg); }
.msg-ai-body { flex: 1; min-width: 0; }
.ai-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.ai-name { font-size: 13px; font-weight: 700; }
.ai-tag { font-size: 10.5px; font-weight: 600; color: #7C5BE0; background: #F0ECFD; padding: 2px 7px; border-radius: 5px; }
.ai-text { font-size: 14px; line-height: 1.7; color: #27272A; }

/* 입력 */
.input-wrap { flex-shrink: 0; padding: 0 0 20px; }
.input-inner { max-width: 720px; margin: 0 auto; padding: 0 32px; }
.input-box { border: 1px solid #E2E2E8; border-radius: 16px; background: #fff; box-shadow: 0 2px 12px rgba(20, 30, 60, .05); padding: 8px; display: flex; align-items: flex-end; gap: 8px; }
.input-attach { width: 36px; height: 36px; flex-shrink: 0; border: none; background: #F4F4F6; border-radius: 10px; color: #71717A; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
.input-attach:hover { background: #ECECEF; }
.input-field {
  flex: 1; padding: 9px 4px; font-size: 14px; border: none; background: transparent;
  color: #27272A; font-family: inherit; outline: none; min-height: 36px;
}
.input-field::placeholder { color: #A8A8B0; }
.input-field:disabled { color: #A8A8B0; }
.input-send { width: 36px; height: 36px; flex-shrink: 0; border: none; background: #18181B; border-radius: 10px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s; }
.input-send:hover { background: #000; }
.input-send:disabled { background: #A1A1AA; cursor: not-allowed; }
.input-hint { text-align: center; font-size: 11px; color: #BCBCC4; margin-top: 9px; }

/* 초기 상태 */
.welcome-area {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #F5F7FB 0%, #FAFAFB 100%);
  padding: 40px 20px;
}
.welcome-content { text-align: center; max-width: 500px; }
.welcome-title {
  font-size: 32px; font-weight: 700; color: #18181B; margin-bottom: 8px;
  letter-spacing: -.02em;
}
.welcome-subtitle {
  font-size: 16px; color: #71717A; margin-bottom: 32px; line-height: 1.6;
}
.welcome-input-wrap { margin-top: 20px; }
.welcome-input-box {
  border: 1px solid #E2E2E8; border-radius: 16px; background: #fff;
  box-shadow: 0 2px 12px rgba(20, 30, 60, .05); padding: 8px;
  display: flex; align-items: flex-end; gap: 8px;
}
.welcome-input {
  flex: 1; padding: 9px 4px; font-size: 14px; border: none; background: transparent;
  color: #27272A; font-family: inherit; outline: none; min-height: 36px;
}
.welcome-input::placeholder { color: #A8A8B0; }
.welcome-input:disabled { color: #A8A8B0; }
.welcome-send {
  width: 36px; height: 36px; flex-shrink: 0; border: none;
  background: #18181B; border-radius: 10px; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.welcome-send:hover { background: #000; }
.welcome-send:disabled { background: #A1A1AA; cursor: not-allowed; }

.no-messages { text-align: center; padding: 40px 20px; color: #A8A8B0; }

@keyframes livepulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
</style>
