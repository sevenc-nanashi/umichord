import { defineConfig, presetAttributify, presetWind4 } from "unocss";
export default defineConfig({
  presets: [
    presetAttributify({
      prefixedOnly: true,
    }),
    presetWind4(),
  ],
  // content: {
  //   filesystem: ["./**/*.vue"],
  // },
});
