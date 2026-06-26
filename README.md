# 해줘 AI — 멀티 에이전트 파일 관리 (Vue 3)

ChatGPT · Notion · LangSmith · Perplexity · Linear 감성의 화이트 SaaS 대시보드를
**Vue 3 + Vite** 로 구현한 버전입니다. 전체 UI는 한국어로 구성되어 있습니다.

> 백엔드와 연동되어 멀티 에이전트 시스템으로 문서 검색, 웹 자료 조사, 파일 관리를 일괄 처리할 수 있습니다.

## 실행 방법

```bash
cd vue-export
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 구조

```
vue-export/
├─ index.html              # 폰트(Pretendard / JetBrains Mono) 로드 + 마운트 지점
├─ package.json
├─ vite.config.js
└─ src/
   ├─ main.js              # 앱 부트스트랩
   ├─ style.css            # 전역 리셋·스크롤바·keyframes
   ├─ App.vue              # 레이아웃 셸 (Sidebar + ChatArea)
   └─ components/
      ├─ Sidebar.vue       # 브랜드 · 새 채팅 · 채팅 목록 · 사용자
      └─ ChatArea.vue      # 헤더 · 대화(결과 카드) · 입력창
```

## 특징

- `<script setup>` + Composition API
- 채팅 목록 / 문서·웹·파일 결과는 모두 **데이터 배열 + `v-for`** 로 렌더링 → 데이터만 바꾸면 UI 갱신
- 채팅 항목 클릭 시 선택 상태 전환(`activeIndex`)
- hover·전환 효과는 scoped CSS
- 폰트: Pretendard(본문) / JetBrains Mono(수치·코드)

## 커스터마이즈

- 채팅 목록: `src/components/Sidebar.vue` 의 `chats` 배열
- 검색/파일 결과 카드: `src/components/ChatArea.vue` 의 `docResults` · `webResults` · `fileResults` 배열
- 색상 토큰은 각 컴포넌트 scoped `<style>` 에 인라인되어 있습니다.
