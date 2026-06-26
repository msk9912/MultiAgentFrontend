<script setup>
import { ref } from 'vue'

const isOpen = ref(false)

const guideCards = [
  {
    icon: '📄',
    title: '문서 뒤져줘',
    desc: '인덱싱된 문서에서 필요한 내용을 찾아 답변해요.',
    examples: [
      '인덱싱된 문서에서 RAG 파이프라인 구조를 찾아줘',
      '문서에서 멀티 에이전트 구조 설명 찾아줘'
    ]
  },
  {
    icon: '🌐',
    title: '웹에서 찾아와',
    desc: '최신 정보나 자료를 웹에서 조사해요.',
    examples: [
      '최신 생성형 AI 트렌드를 조사해줘',
      'AI 에이전트 관련 최신 사례 찾아줘'
    ]
  },
  {
    icon: '📁',
    title: '파일 좀 찾아줘',
    desc: 'Google Drive 파일 목록을 확인하거나 파일을 찾아요.',
    examples: [
      '구글 드라이브에서 프로젝트 문서 목록 보여줘',
      '드라이브에서 AI 관련 파일 찾아줘'
    ]
  },
  {
    icon: '📅',
    title: '일정 좀 봐줘',
    desc: 'Google Calendar 일정을 조회, 등록, 수정, 삭제해요.',
    examples: [
      '이번 주 일정 알려줘',
      '2026-06-27 17:00부터 18:00까지 회의 일정 등록해줘'
    ]
  }
]

function openGuide() {
  isOpen.value = true
}

function closeGuide() {
  isOpen.value = false
}

function selectPrompt(prompt) {
  window.dispatchEvent(
    new CustomEvent('guide-prompt-selected', {
      detail: {
        prompt
      }
    })
  )

  closeGuide()
}
</script>

<template>
  <div class="guide-menu">
    <button class="guide-menu-button" type="button" @click="openGuide">
      <span class="guide-menu-icon">💡</span>
      <span class="guide-menu-text">뭐 시킬 수 있나요?</span>
    </button>

    <Teleport to="body">
      <div v-if="isOpen" class="guide-overlay" @click.self="closeGuide">
        <aside class="guide-drawer">
          <div class="guide-drawer-header">
            <div>
              <div class="guide-drawer-title">뭐 시킬 수 있나요?</div>
              <div class="guide-drawer-subtitle">
                예시를 누르면 입력창에 자동으로 들어가요.
              </div>
            </div>

            <button class="guide-close" type="button" @click="closeGuide">
              ×
            </button>
          </div>

          <div class="guide-list">
            <section
              v-for="card in guideCards"
              :key="card.title"
              class="guide-card"
            >
              <div class="guide-card-top">
                <div class="guide-card-icon">{{ card.icon }}</div>
                <div>
                  <div class="guide-card-title">{{ card.title }}</div>
                  <div class="guide-card-desc">{{ card.desc }}</div>
                </div>
              </div>

              <div class="guide-examples">
                <button
                  v-for="example in card.examples"
                  :key="example"
                  type="button"
                  class="guide-example"
                  @click="selectPrompt(example)"
                >
                  “{{ example }}”
                </button>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.guide-menu {
  width: 100%;
}

.guide-menu-button {
  width: 100%;
  border: 1px solid #E4E4E8;
  background: #FFFFFF;
  color: #3F3F46;
  border-radius: 12px;
  padding: 11px 12px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  transition: background .15s, border-color .15s, transform .15s;
}

.guide-menu-button:hover {
  background: #F7F9FF;
  border-color: #BFD0FF;
  transform: translateY(-1px);
}

.guide-menu-icon {
  font-size: 16px;
}

.guide-menu-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, .28);
  display: flex;
  justify-content: flex-end;
}

.guide-drawer {
  width: 390px;
  max-width: calc(100vw - 32px);
  height: 100%;
  background: #FFFFFF;
  box-shadow: -16px 0 40px rgba(15, 23, 42, .14);
  padding: 22px;
  box-sizing: border-box;
  overflow-y: auto;
  animation: drawerIn .18s ease-out;
}

.guide-drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.guide-drawer-title {
  font-size: 20px;
  font-weight: 800;
  color: #18181B;
  letter-spacing: -.02em;
}

.guide-drawer-subtitle {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.5;
  color: #71717A;
}

.guide-close {
  width: 32px;
  height: 32px;
  border: 1px solid #E4E4E8;
  background: #FFFFFF;
  color: #71717A;
  border-radius: 9px;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.guide-close:hover {
  background: #F4F4F5;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.guide-card {
  border: 1px solid #E4E4E8;
  border-radius: 16px;
  padding: 16px;
  background: #FAFAFB;
}

.guide-card-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 13px;
}

.guide-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(20, 30, 60, .05);
}

.guide-card-title {
  font-size: 15px;
  font-weight: 800;
  color: #18181B;
  margin-bottom: 4px;
}

.guide-card-desc {
  font-size: 12.5px;
  color: #71717A;
  line-height: 1.5;
}

.guide-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guide-example {
  width: 100%;
  text-align: left;
  border: 1px solid #DDE7FF;
  background: #F2F6FF;
  color: #2857D8;
  border-radius: 11px;
  padding: 10px 11px;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.45;
  cursor: pointer;
}

.guide-example:hover {
  background: #E8EFFF;
  border-color: #BFD0FF;
}

@keyframes drawerIn {
  from {
    transform: translateX(24px);
    opacity: .5;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>