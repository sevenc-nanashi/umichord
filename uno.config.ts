import { defineConfig, presetAttributify, presetWind4, PresetWind4Theme } from "unocss";
export default defineConfig<PresetWind4Theme>({
  presets: [
    presetAttributify({
      prefixedOnly: true,
    }),
    presetWind4(),
  ],
  rules: [
    [
      /^grid-area-(.+)/,
      ([, d]) => {
        return {
          "grid-area": d.replace(/_/g, " "),
        };
      },
    ],
  ],
  theme: {
    colors: {
      "primary-light": "#f6849e",
      primary: "#ea7892",
      "primary-dark": "#c67285",
      secondary: "#9687b2",
    },
  },
  // content: {
  //   filesystem: ["./**/*.vue"],
  // },
});
