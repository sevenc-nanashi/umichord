<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";

const dismissed = ref(false);
const mobileDialog = useTemplateRef<HTMLDialogElement>("mobileDialog");
onMounted(() => {
  dismissed.value = localStorage.getItem("umichord:mobile-warning-dismissed") !== null;
  if (!dismissed.value && mobileDialog.value) {
    mobileDialog.value.showModal();
  }
});
const dismiss = () => {
  dismissed.value = true;
  localStorage.setItem("umichord:mobile-warning-dismissed", "1");
  mobileDialog.value?.close();
};
</script>
<template>
  <div
    v-if="!dismissed"
    un-fixed
    un-top="0"
    un-left="0"
    un-w="screen"
    un-h="screen"
    un-hidden="md:~"
    un-z="50"
  >
    <dialog
      ref="mobileDialog"
      class="mobile-dialog"
      un-max-w="md"
      un-rounded="xl"
      un-border="none"
      un-p="0"
      un-shadow="xl"
      un-bg="white"
      un-m="auto"
    >
      <article un-p="6" un-grid="~ gap-4">
        <div>
          <h2 un-text="xl primary">警告</h2>
          <p un-mt="2">
            このツールはモバイルデバイスでの使用を想定していません。モバイルデバイスで使用した場合、レイアウトが崩れたり、動作が不安定になる可能性があります。
          </p>
        </div>
        <div un-flex="~ justify-end">
          <button
            un-rounded="full"
            un-bg="primary hover:primary/90"
            un-px="4"
            un-py="2"
            un-text="sm white"
            @click="dismiss"
          >
            無視して続行
          </button>
        </div>
      </article>
    </dialog>
  </div>
</template>

<style scoped>
.mobile-dialog::backdrop {
  background: rgb(30 41 59 / 45%);
  backdrop-filter: blur(2px);
}
</style>
