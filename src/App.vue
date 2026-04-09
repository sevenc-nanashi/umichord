<script setup lang="ts">
import { ref } from "vue";
import Header from "./components/Header.vue";
import Renderer from "./components/Renderer.vue";
import EditorSection from "./components/EditorSection.vue";

const activeTab = ref<"renderer" | "editor">("renderer");
</script>
<template>
  <div class="app">
    <Header class="app-header" />
    <nav class="tab-bar">
      <button
        class="tab-btn"
        :class="{ 'tab-btn-active': activeTab === 'renderer' }"
        @click="activeTab = 'renderer'"
      >
        プレビュー
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn-active': activeTab === 'editor' }"
        @click="activeTab = 'editor'"
      >
        エディタ
      </button>
    </nav>
    <section class="app-renderer" :class="{ inactive: activeTab !== 'renderer' }">
      <Renderer />
    </section>
    <section class="app-editor" :class="{ inactive: activeTab !== 'editor' }">
      <EditorSection />
    </section>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  height: 100dvh;
  grid-template-areas:
    "header header"
    "renderer editor";
  grid-template-columns: auto 1fr;
  grid-template-rows: 4rem 1fr;
}

.app-header {
  grid-area: header;
}

.tab-bar {
  display: none;
}

.app-renderer {
  grid-area: renderer;
  overflow: hidden;
}

.app-editor {
  grid-area: editor;
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: 0.5rem;
  font-size: 0.875rem;
  border-bottom: 2px solid transparent;
  transition:
    color 0.15s,
    border-color 0.15s;
}

.tab-btn-active {
  color: #ea7892;
  border-bottom-color: #ea7892;
  font-weight: 600;
}

@media (max-width: 767px) {
  .app {
    grid-template-areas:
      "header"
      "tabs"
      "content";
    grid-template-columns: 1fr;
    grid-template-rows: 4rem 2.75rem 1fr;
  }

  .tab-bar {
    display: flex;
    grid-area: tabs;
    border-bottom: 1px solid #ea7892;
    background: rgb(234 120 146 / 10%);
  }

  .app-renderer,
  .app-editor {
    grid-area: content;
  }

  .app-renderer.inactive,
  .app-editor.inactive {
    display: none;
  }
}
</style>
