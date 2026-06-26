<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '../stores/chatStore'
import logo from '../assets/logo.svg'

const chatStore = useChatStore()
const userMessageInput = ref('')
const conversationRef = ref(null)
const welcomeInputRef = ref(null)
const chatInputRef = ref(null)

const chatTitle = computed(() => chatStore.activeConversation?.title || '새 채팅')

const guideCards = [
  {
    icon: '📄',
    title: '문서 뒤져줘',
    desc: '인덱싱된 문서에서 필요한 내용을 찾아요.',
    prompt: '인덱싱된 문서에서 RAG 파이프라인 구조를 찾아줘'
  },
  {
    icon: '🌐',
    title: '웹에서 찾아와',
    desc: '최신 정보나 자료를 웹에서 조사해요.',
    prompt: '최신 생성형 AI 트렌드를 조사해줘'
  },
  {
    icon: '📁',
    title: '파일 좀 찾아줘',
    desc: 'Google Drive 파일 목록을 확인하거나 파일을 찾아요.',
    prompt: '구글 드라이브에서 프로젝트 문서 목록 보여줘'
  },
  {
    icon: '📅',
    title: '일정 좀 봐줘',
    desc: 'Google Calendar 일정을 조회, 등록, 수정, 삭제해요.',
    prompt: '이번 주 일정 알려줘'
  }
]

function scrollToBottom() {
  nextTick(() => {
    requestAnimationFrame(() => {
      const el = conversationRef.value
      if (!el) return

      el.scrollTop = el.scrollHeight
    })
  })
}

function fillGuidePrompt(prompt) {
  if (chatStore.loading) return

  userMessageInput.value = prompt

  nextTick(() => {
    const input = chatStore.activeConversation
      ? chatInputRef.value
      : welcomeInputRef.value

    input?.focus()
  })
}

watch(
  () => chatStore.activeConversationId,
  () => {
    userMessageInput.value = ''
    scrollToBottom()
  }
)

watch(
  () => chatStore.messages,
  () => {
    scrollToBottom()
  },
  {
    deep: true,
    flush: 'post'
  }
)

watch(
  () => chatStore.processingStatus,
  () => {
    scrollToBottom()
  },
  {
    flush: 'post'
  }
)

async function handleSendMessage() {
  if (!userMessageInput.value.trim()) return

  const msg = userMessageInput.value
  userMessageInput.value = ''

  // 활성 대화가 없으면 새로 생성
  if (!chatStore.activeConversationId) {
    const title = msg.substring(0, 50) + (msg.length > 50 ? '...' : '')
    const conversation = await chatStore.createConversation(title)

    if (conversation?.conversation_id) {
      await chatStore.sendMessage(msg)
    }
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
            <span class="live-dot"></span>
            {{ chatStore.processingStatus || '처리 중...' }}
          </span>

          <span v-else class="chat-status-empty">
            메시지 {{ chatStore.messages.length }}개
          </span>
        </span>
      </div>

      <div class="header-actions">
        <button class="btn-ghost">↗ 공유</button>
        <button class="btn-icon">⋯</button>
      </div>
    </header>

    <!-- 대화 진행 중일 때 -->
    <div
      v-if="chatStore.activeConversation"
      ref="conversationRef"
      class="conversation"
    >
      <div class="conversation-inner">
        <div v-if="chatStore.messages.length === 0" class="no-messages">
          <p>메시지 없음</p>
        </div>

        <template v-else>
          <div
            v-for="msg in chatStore.messages"
            :key="msg.id"
            :class="msg.role === 'user' ? 'msg-user' : 'msg-ai'"
          >
            <template v-if="msg.role === 'user'">
              <div class="bubble-user">{{ msg.content }}</div>
            </template>

            <template v-else>
              <div class="avatar-ai">
                <img :src="logo" alt="logo" class="ai-logo" />
              </div>

              <div class="msg-ai-body">
                <div class="ai-text">
                  {{
                    msg.content ||
                    (msg.pending
                      ? chatStore.processingStatus || '답변을 생성하고 있습니다...'
                      : '')
                  }}
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>

    <!-- 초기 상태: 큰 입력 영역 -->
    <div v-else class="welcome-area">
      <div class="welcome-content">
        <div class="welcome-title">해줘 AI</div>
        <div class="welcome-subtitle">
          문서 검색, 파일 관리, 웹 자료 조사, 일정 관리를 한 번에
        </div>

        <div class="guide-section">
          <div class="guide-title">뭘 시킬 수 있나요?</div>

          <div class="guide-grid">
            <button
              v-for="card in guideCards"
              :key="card.title"
              class="guide-card"
              type="button"
              :disabled="chatStore.loading"
              @click="fillGuidePrompt(card.prompt)"
            >
              <div class="guide-icon">{{ card.icon }}</div>
              <div class="guide-text">
                <div class="guide-card-title">{{ card.title }}</div>
                <div class="guide-card-desc">{{ card.desc }}</div>
                <div class="guide-example">“{{ card.prompt }}”</div>
              </div>
            </button>
          </div>
        </div>

        <div class="welcome-input-wrap">
          <div class="welcome-input-box">
            <input
              ref="welcomeInputRef"
              v-model="userMessageInput"
              type="text"
              class="welcome-input"
              placeholder="카드를 누르거나 직접 요청을 입력해보세요"
              @keyup.enter="handleSendMessage"
              :disabled="chatStore.loading"
              autofocus
            />

            <button
              class="welcome-send"
              @click="handleSendMessage"
              :disabled="chatStore.loading"
              title="전송"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
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
            ref="chatInputRef"
            v-model="userMessageInput"
            type="text"
            class="input-field"
            placeholder="문서를 검색하거나 파일을 관리해보세요"
            @keyup.enter="handleSendMessage"
            :disabled="chatStore.loading"
          />

          <button
            class="input-send"
            @click="handleSendMessage"
            :disabled="chatStore.loading"
            title="전송"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
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
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  border-bottom: 1px solid #ECECEF;
  flex-shrink: 0;
}

.chat-title-wrap {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.chat-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -.01em;
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: #9A9AA2;
  margin-top: 2px;
  white-space: nowrap;
}

.chat-status-live {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #3B6EF5;
  font-weight: 600;
  white-space: nowrap;
  max-width: 520px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-status-empty {
  color: #A1A1AA;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3B6EF5;
  animation: livepulse 1.2s ease-in-out infinite;
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  background: #fff;
  border: 1px solid #E4E4E8;
  border-radius: 8px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: #52525B;
  cursor: pointer;
  transition: background .15s;
}

.btn-ghost:hover {
  background: #F7F7F9;
}

.btn-icon {
  width: 32px;
  height: 32px;
  background: #fff;
  border: 1px solid #E4E4E8;
  border-radius: 8px;
  color: #71717A;
  cursor: pointer;
  font-size: 16px;
  transition: background .15s;
}

.btn-icon:hover {
  background: #F7F7F9;
}

/* 대화 */
.conversation {
  flex: 1;
  overflow-y: auto;
  padding: 28px 0;
}

.conversation-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.msg-user {
  display: flex;
  gap: 13px;
  align-items: flex-start;
  margin-left: auto;
  max-width: 82%;
  width: fit-content;
}

.bubble-user {
  background: #EEF3FE;
  color: #1B3B8A;
  padding: 12px 16px;
  border-radius: 16px 16px 4px 16px;
  font-size: 14px;
  line-height: 1.6;
  font-weight: 500;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-ai {
  display: flex;
  gap: 13px;
  align-items: flex-start;
}

.avatar-ai {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.ai-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.msg-ai-body {
  flex: 1;
  min-width: 0;
}

.ai-text {
  font-size: 14px;
  line-height: 1.7;
  color: #27272A;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-ai .ai-text:empty::after {
  content: '답변을 준비하고 있습니다...';
  color: #71717A;
}

/* 초기 상태 */
.welcome-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F5F7FB 0%, #FAFAFB 100%);
  padding: 40px 20px;
}

.welcome-content {
  text-align: center;
  max-width: 820px;
  width: 100%;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: #18181B;
  margin-bottom: 8px;
  letter-spacing: -.02em;
}

.welcome-subtitle {
  font-size: 16px;
  color: #71717A;
  margin-bottom: 28px;
  line-height: 1.6;
}

.guide-section {
  margin: 0 auto 24px;
  max-width: 820px;
}

.guide-title {
  font-size: 13px;
  font-weight: 700;
  color: #52525B;
  margin-bottom: 12px;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.guide-card {
  text-align: left;
  border: 1px solid #E4E4E8;
  background: rgba(255, 255, 255, .9);
  border-radius: 16px;
  padding: 15px 14px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 2px 10px rgba(20, 30, 60, .04);
  transition: transform .15s, box-shadow .15s, border-color .15s, background .15s;
}

.guide-card:hover {
  transform: translateY(-2px);
  border-color: #BFD0FF;
  background: #fff;
  box-shadow: 0 8px 22px rgba(20, 30, 60, .08);
}

.guide-card:disabled {
  cursor: not-allowed;
  opacity: .65;
  transform: none;
}

.guide-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.guide-card-title {
  font-size: 14px;
  font-weight: 800;
  color: #18181B;
  margin-bottom: 5px;
}

.guide-card-desc {
  font-size: 12px;
  color: #71717A;
  line-height: 1.45;
  min-height: 34px;
  margin-bottom: 10px;
}

.guide-example {
  font-size: 11px;
  line-height: 1.45;
  color: #3B6EF5;
  background: #F2F6FF;
  border-radius: 10px;
  padding: 8px;
  word-break: keep-all;
}

.welcome-input-wrap {
  margin-top: 20px;
  width: 100%;
}

.welcome-input-box {
  border: 1px solid #E2E2E8;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(20, 30, 60, .05);
  padding: 8px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

.welcome-input {
  flex: 1;
  padding: 9px 4px;
  font-size: 14px;
  border: none;
  background: transparent;
  color: #27272A;
  font-family: inherit;
  outline: none;
  min-height: 36px;
}

.welcome-input::placeholder {
  color: #A8A8B0;
}

.welcome-input:disabled {
  color: #A8A8B0;
}

.welcome-send {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: none;
  background: #18181B;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s;
}

.welcome-send:hover {
  background: #000;
}

.welcome-send:disabled {
  background: #A1A1AA;
  cursor: not-allowed;
}

/* 입력 */
.input-wrap {
  flex-shrink: 0;
  padding: 0 0 20px;
}

.input-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 32px;
}

.input-box {
  border: 1px solid #E2E2E8;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(20, 30, 60, .05);
  padding: 8px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.input-field {
  flex: 1;
  padding: 9px 4px;
  font-size: 14px;
  border: none;
  background: transparent;
  color: #27272A;
  font-family: inherit;
  outline: none;
  min-height: 36px;
}

.input-field::placeholder {
  color: #A8A8B0;
}

.input-field:disabled {
  color: #A8A8B0;
}

.input-send {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: none;
  background: #18181B;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s;
}

.input-send:hover {
  background: #000;
}

.input-send:disabled {
  background: #A1A1AA;
  cursor: not-allowed;
}

.input-hint {
  text-align: center;
  font-size: 11px;
  color: #BCBCC4;
  margin-top: 9px;
}

.no-messages {
  text-align: center;
  padding: 40px 20px;
  color: #A8A8B0;
}

@media (max-width: 980px) {
  .guide-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .welcome-content {
    max-width: 100%;
  }

  .guide-grid {
    grid-template-columns: 1fr;
  }

  .conversation-inner,
  .input-inner {
    padding: 0 20px;
  }
}

@keyframes livepulse {
  0%, 100% {
    opacity: 1;
  }

  50% {
    opacity: .5;
  }
}
</style>