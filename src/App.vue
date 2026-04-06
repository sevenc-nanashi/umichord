<script setup lang="ts">
import Header from "./components/Header.vue";
import Renderer from "./components/Renderer.vue";
import Editor from "./components/Editor.vue";
</script>
<template>
  <div class="app">
    <Header un-grid-area="header" un-h="[4rem]" />
    <section un-grid-area="renderer"><Renderer /></section>
    <section un-grid-area="editor"><Editor /></section>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-areas:
    "header header"
    "renderer editor";
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
}
</style>
