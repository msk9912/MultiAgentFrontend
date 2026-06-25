<script setup>
import { useChatStore } from '../stores/chatStore'
import { currentUser } from '../constants/user'
import { onMounted, ref } from 'vue'

const chatStore = useChatStore()
const newChatTitle = ref('')
const showNewChatInput = ref(false)
const editingId = ref(null)
const editingTitle = ref('')

onMounted(() => {
  chatStore.loadConversations()
})

function handleNewChat() {
  // 새 채팅 시작: welcome-area 표시
  chatStore.activeConversationId = null
  chatStore.messages = []
  newChatTitle.value = ''
  showNewChatInput.value = false
}

function selectChat(conversationId) {
  chatStore.selectConversation(conversationId)
}

function handleDeleteChat(e, conversationId) {
  e.stopPropagation()
  chatStore.deleteConversation(conversationId)
}

function startEditing(e, conversationId, currentTitle) {
  e.stopPropagation()
  editingId.value = conversationId
  editingTitle.value = currentTitle
}

function cancelEditing() {
  editingId.value = null
  editingTitle.value = ''
}

async function saveTitle(conversationId) {
  if (editingTitle.value.trim() && editingTitle.value !== chatStore.conversations.find(c => c.id === conversationId)?.title) {
    await chatStore.updateConversation(conversationId, editingTitle.value)
  }
  cancelEditing()
}
</script>

<template>
  <aside class="sidebar">
    <!-- 브랜드 -->
    <div class="brand">
      <div class="brand-mark"><div class="brand-diamond"></div></div>
      <div class="brand-text">
        <span class="brand-title">AI Workspace</span>
        <span class="brand-sub">Multi-Agent File Assistant</span>
      </div>
    </div>

    <!-- 새 채팅 -->
    <div class="new-chat-wrap">
      <button class="new-chat-btn" @click="handleNewChat">
        <span class="plus">+</span> 새 채팅
      </button>
    </div>

    <!-- 스크롤 영역 -->
    <div class="scroll">
      <div class="section-label">채팅</div>
      <div class="chat-list">
        <div
          v-for="chat in chatStore.conversations"
          :key="chat.id"
          class="chat-item"
          :class="{ 'is-active': chat.id === chatStore.activeConversationId, 'is-editing': editingId === chat.id }"
          @click="selectChat(chat.id)"
        >
          <!-- 편집 모드 -->
          <div v-if="editingId === chat.id" class="chat-item-edit-row">
            <input
              v-model="editingTitle"
              type="text"
              class="chat-item-edit-input"
              @click.stop
              @keyup.enter="saveTitle(chat.id)"
              @keyup.escape="cancelEditing"
              autofocus
            />
            <div class="chat-item-edit-actions">
              <button class="chat-item-edit-save" @click.stop="saveTitle(chat.id)" title="저장">✓</button>
              <button class="chat-item-edit-cancel" @click.stop="cancelEditing" title="취소">✕</button>
            </div>
          </div>

          <!-- 일반 모드 -->
          <div v-else class="chat-item-row">
            <span class="chat-item-title">{{ chat.title }}</span>
            <div v-if="chat.id === chatStore.activeConversationId" class="chat-item-actions">
              <button
                class="chat-item-edit"
                @click="startEditing($event, chat.id, chat.title)"
                title="수정"
              >
                ✎
              </button>
              <button
                class="chat-item-delete"
                @click="handleDeleteChat($event, chat.id)"
                title="삭제"
              >
                ✕
              </button>
            </div>
            <span v-else class="chat-item-dot"></span>
          </div>
          <div class="chat-item-meta">{{ chat.updated_at || '방금 전' }}</div>
        </div>
      </div>
    </div>

    <!-- 사용자 -->
    <div class="user-footer">
      <div class="avatar">{{ currentUser.avatar }}</div>
      <div class="user-text">
        <span class="user-name">{{ currentUser.name }}</span>
        <span class="user-plan">{{ currentUser.plan }}</span>
      </div>
      <span class="user-gear">⚙</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 21%;
  min-width: 248px;
  max-width: 320px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #FAFAFB;
  border-right: 1px solid #ECECEF;
}

/* 브랜드 */
.brand { display: flex; align-items: center; gap: 10px; padding: 16px 16px 14px; }
.brand-mark {
  width: 30px; height: 30px; border-radius: 8px;
  background: linear-gradient(140deg, #3B6EF5, #5B4BE0);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: 0 2px 6px rgba(59, 110, 245, .32);
}
.brand-diamond { width: 11px; height: 11px; border: 2.5px solid #fff; border-radius: 3px; transform: rotate(45deg); }
.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-title { font-size: 14.5px; font-weight: 700; letter-spacing: -.02em; }
.brand-sub { font-size: 11px; color: #9A9AA2; font-weight: 500; margin-top: 2px; }

/* 새 채팅 */
.new-chat-wrap { padding: 4px 12px 12px; }
.new-chat-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 10px; background: #18181B; color: #fff; border: none; border-radius: 10px;
  font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, .12); transition: background .15s;
}
.new-chat-btn:hover { background: #000; }
.plus { font-size: 16px; line-height: 1; margin-top: -1px; }
.new-chat-input-wrap { display: flex; flex-direction: column; gap: 6px; }
.new-chat-input {
  padding: 8px 10px; border: 1px solid #ECECEF; border-radius: 8px;
  font-family: inherit; font-size: 13px; background: #fff;
}
.new-chat-actions { display: flex; gap: 6px; }
.btn-confirm, .btn-cancel {
  flex: 1; padding: 6px; border: none; border-radius: 6px; cursor: pointer;
  font-family: inherit; font-size: 12px; font-weight: 600; transition: background .15s;
}
.btn-confirm { background: #18181B; color: #fff; }
.btn-confirm:hover { background: #000; }
.btn-cancel { background: #ECECEF; color: #52525B; }
.btn-cancel:hover { background: #E4E4E8; }

/* 스크롤 */
.scroll { flex: 1; overflow-y: auto; padding: 0 8px 16px; }
.section-label { padding: 8px 8px 6px; font-size: 11px; font-weight: 700; color: #A1A1AA; letter-spacing: .02em; }

/* 채팅 목록 */
.chat-list { display: flex; flex-direction: column; gap: 2px; }
.chat-item { padding: 9px 10px; border-radius: 9px; cursor: pointer; transition: background .12s; }
.chat-item:hover { background: #F0F0F3; }
.chat-item.is-active {
  background: #fff; border: 1px solid #E6E9F2;
  box-shadow: 0 1px 2px rgba(20, 30, 60, .04);
}
.chat-item.is-active:hover { background: #fff; }
.chat-item-row { display: flex; align-items: center; justify-content: space-between; }
.chat-item-title { font-size: 13px; font-weight: 500; color: #3F3F46; flex: 1; min-width: 0; }
.chat-item.is-active .chat-item-title { font-weight: 600; color: #18181B; }
.chat-item-dot { width: 6px; height: 6px; border-radius: 50%; background: #3B6EF5; }
.chat-item-actions { display: flex; align-items: center; gap: 4px; margin-left: 6px; }
.chat-item-edit {
  width: 20px; height: 20px; border: none; background: transparent; color: #A1A1AA;
  cursor: pointer; font-size: 13px; transition: color .15s; display: flex; align-items: center; justify-content: center;
}
.chat-item-edit:hover { color: #3B6EF5; }
.chat-item-delete {
  width: 20px; height: 20px; border: none; background: transparent; color: #A1A1AA;
  cursor: pointer; font-size: 14px; transition: color .15s;
}
.chat-item-delete:hover { color: #E24458; }

.chat-item-edit-row { display: flex; align-items: center; gap: 6px; }
.chat-item-edit-input {
  flex: 1; padding: 4px 8px; border: 1px solid #3B6EF5; border-radius: 6px;
  font-family: inherit; font-size: 13px; background: #fff; color: #18181B; outline: none;
}
.chat-item-edit-input:focus { border-color: #3B6EF5; box-shadow: 0 0 0 2px rgba(59, 110, 245, 0.1); }
.chat-item-edit-actions { display: flex; align-items: center; gap: 4px; }
.chat-item-edit-save, .chat-item-edit-cancel {
  width: 20px; height: 20px; border: none; background: transparent; cursor: pointer;
  font-size: 13px; display: flex; align-items: center; justify-content: center; transition: color .15s;
}
.chat-item-edit-save { color: #16A34A; }
.chat-item-edit-save:hover { color: #22C55E; }
.chat-item-edit-cancel { color: #DC2626; }
.chat-item-edit-cancel:hover { color: #EF4444; }
.chat-item-meta { font-size: 11px; color: #A8A8B0; margin-top: 3px; }
.chat-item.is-active .chat-item-meta { color: #9A9AA2; }

/* 사용자 */
.user-footer { display: flex; align-items: center; gap: 9px; padding: 11px 14px; border-top: 1px solid #ECECEF; }
.avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, #FFB07C, #F2709C);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px; font-weight: 700;
}
.user-text { display: flex; flex-direction: column; line-height: 1.2; }
.user-name { font-size: 12.5px; font-weight: 600; }
.user-plan { font-size: 11px; color: #A1A1AA; }
.user-gear { margin-left: auto; color: #C4C4CC; cursor: pointer; font-size: 16px; }
</style>
