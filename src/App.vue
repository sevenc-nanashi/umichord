<script setup lang="ts">
import Header from "./components/Header.vue";
import Renderer from "./components/Renderer.vue";
import Editor from "./components/Editor.vue";
</script>
<template>
  <div class="app">
    <Header un-grid-area="header" />
    <section un-grid-area="renderer"><Renderer /></section>
    <section un-grid-area="editor"><Editor /></section>
  </div>
</template>

<style>
.app {
  display: grid;
  grid-template-areas:
    "header header"
    "renderer editor";
  grid-template-columns: 1fr 1fr;
}
</style>
